import { NextRequest, NextResponse } from 'next/server';
import { downloadByRootHashAPI } from '../../../../lib/0g/downloader';
import { createPublicClient, http } from 'viem';
import { getActiveChain } from '../../../../config/chains';
import { getContractConfig, STORAGE_CONFIG } from '../../config/contractConfig';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'APIDreamsDownload' });

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenId = searchParams.get('tokenId');

    if (!tokenId || isNaN(Number(tokenId))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid tokenId parameter is required' 
      }, { status: 400 });
    }

    const tokenIdBigInt = BigInt(tokenId);
    
    // Get contract configuration
    const contractConfig = getContractConfig();

    // Create public client to read from contract
    const publicClient = createPublicClient({
      chain: getActiveChain(),
      transport: http(STORAGE_CONFIG.l1Rpc)
    });

    // Get agent memory to fetch currentDreamDailyHash
    const agentMemory = await publicClient.readContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'getAgentMemory',
      args: [tokenIdBigInt]
    }) as any;

    if (!agentMemory) {
      return NextResponse.json({ 
        success: false, 
        error: 'Agent memory not found' 
      }, { status: 404 });
    }

    const currentDreamDailyHash = agentMemory[1]; // currentDreamDailyHash is at index 1

    // Check if hash exists and is not empty
    if (!currentDreamDailyHash || 
        currentDreamDailyHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return NextResponse.json({ 
        success: false, 
        error: 'No dreams file found for this agent yet' 
      }, { status: 404 });
    }

    log.debug('Downloading dreams file', { tokenId, hash: currentDreamDailyHash });

    // Download file from 0G Storage
    const [fileData, downloadError] = await downloadByRootHashAPI(
      currentDreamDailyHash,
      STORAGE_CONFIG.storageRpc
    );

    if (downloadError) {
      log.error('Download error', { error: downloadError });
      return NextResponse.json({ 
        success: false, 
        error: `Failed to download dreams file: ${downloadError.message}` 
      }, { status: 500 });
    }

    if (!fileData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Downloaded file is empty' 
      }, { status: 500 });
    }

    // Parse JSON content
    let content;
    try {
      const jsonString = new TextDecoder().decode(fileData);
      content = JSON.parse(jsonString);
    } catch (parseError) {
      log.error('JSON parse error', { error: parseError });
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to parse dreams file content' 
      }, { status: 500 });
    }

    log.debug('Successfully downloaded dreams file', { size: fileData.byteLength });

    return NextResponse.json({
      success: true,
      content,
      size: fileData.byteLength,
      rootHash: currentDreamDailyHash,
      tokenId: tokenId
    });

  } catch (error) {
    log.error('Dreams download error', { error });
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
} 