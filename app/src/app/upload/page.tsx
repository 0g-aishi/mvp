'use client';

import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useTheme } from '../../contexts/ThemeContext';
import { useStorageUpload, useStorageDownload, useStorageList } from '../../hooks/storage';

export default function UploadDream() {
  const { theme, debugLog } = useTheme();
  
  // Storage hooks
  const upload = useStorageUpload();
  const download = useStorageDownload();
  const list = useStorageList();
  
  // Local state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadHash, setDownloadHash] = useState('');
  
  // Debug log na start
  debugLog('Upload Dream page loaded - Storage Testing');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      upload.calculateFees(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const result = await upload.uploadFile(selectedFile);
    if (result.success) {
      // Add to list
      list.addFile({
        rootHash: result.rootHash!,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        txHash: result.txHash
      });
      setSelectedFile(null);
    }
  };

  const handleDownload = async () => {
    if (!downloadHash) return;
    await download.downloadAndSave(downloadHash);
  };

  return (
    <Layout>
      <div style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          background: theme.gradients.primary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '30px'
        }}>
          0G Storage Test
        </h1>
        
        {/* Wallet Status */}
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <p style={{ color: theme.text.primary }}>
            Wallet: {upload.isWalletConnected ? `Connected (${upload.walletAddress})` : 'Not connected'}
          </p>
          <p style={{ color: theme.text.secondary }}>
            Network: {upload.networkType} - {upload.getCurrentNetwork().name}
          </p>
        </div>

        {/* Upload Section */}
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: theme.text.primary, marginBottom: '15px' }}>Upload File</h2>
          
          <input
            type="file"
            onChange={handleFileSelect}
            style={{
              marginBottom: '10px',
              padding: '8px',
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              backgroundColor: theme.bg.main,
              color: theme.text.primary
            }}
          />
          
          {selectedFile && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ color: theme.text.secondary }}>
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
              </p>
              {upload.feeInfo && (
                <p style={{ color: theme.text.secondary }}>
                  Fee: {upload.feeInfo.formatted.totalFee} OG (${upload.feeInfo.usd.totalFee})
                </p>
              )}
            </div>
          )}
          
          {upload.status && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ color: theme.text.secondary }}>{upload.status}</p>
              {upload.progress > 0 && (
                              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: theme.border,
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${upload.progress}%`,
                  height: '100%',
                  backgroundColor: theme.accent.primary,
                  transition: 'width 0.3s'
                }} />
              </div>
              )}
            </div>
          )}
          
          {upload.error && (
            <p style={{ color: '#ff4444', marginBottom: '10px' }}>{upload.error}</p>
          )}
          
          {upload.rootHash && (
            <p style={{ color: '#44ff44', marginBottom: '10px' }}>
              Success! Root Hash: {upload.rootHash}
            </p>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || upload.isLoading || !upload.isWalletConnected}
            style={{
              padding: '10px 20px',
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !selectedFile || upload.isLoading ? 'not-allowed' : 'pointer',
              opacity: !selectedFile || upload.isLoading ? 0.5 : 1
            }}
          >
            {upload.isLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* Download Section */}
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: theme.text.primary, marginBottom: '15px' }}>Download File</h2>
          
          <input
            type="text"
            value={downloadHash}
            onChange={(e) => setDownloadHash(e.target.value)}
            placeholder="Enter root hash (0x...)"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              border: `1px solid ${theme.border}`,
              borderRadius: '4px',
              backgroundColor: theme.bg.main,
              color: theme.text.primary
            }}
          />
          
          {download.status && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ color: theme.text.secondary }}>{download.status}</p>
              {download.progress > 0 && (
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: theme.border,
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${download.progress}%`,
                    height: '100%',
                    backgroundColor: theme.accent.primary,
                    transition: 'width 0.3s'
                  }} />
                </div>
              )}
            </div>
          )}
          
          {download.error && (
            <p style={{ color: '#ff4444', marginBottom: '10px' }}>{download.error}</p>
          )}
          
          <button
            onClick={handleDownload}
            disabled={!downloadHash || download.isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !downloadHash || download.isLoading ? 'not-allowed' : 'pointer',
              opacity: !downloadHash || download.isLoading ? 0.5 : 1
            }}
          >
            {download.isLoading ? 'Downloading...' : 'Download'}
          </button>
        </div>

        {/* Files List Section */}
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{ color: theme.text.primary, marginBottom: '15px' }}>My Files</h2>
          
          {list.files.length === 0 ? (
            <p style={{ color: theme.text.secondary }}>No files uploaded yet</p>
          ) : (
            <div>
              {list.files.map((file) => (
                <div key={file.rootHash} style={{
                  padding: '10px',
                  marginBottom: '10px',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '4px'
                }}>
                  <p style={{ color: theme.text.primary, fontWeight: 'bold' }}>{file.fileName}</p>
                  <p style={{ color: theme.text.secondary, fontSize: '0.8em' }}>
                    Size: {list.formatFileSize(file.fileSize)} | 
                    Network: {file.networkType} | 
                    Date: {new Date(file.uploadDate).toLocaleDateString()}
                  </p>
                  <p style={{ color: theme.text.secondary, fontSize: '0.7em', wordBreak: 'break-all' }}>
                    Hash: {file.rootHash}
                  </p>
                  <button
                    onClick={() => download.downloadAndSave(file.rootHash, file.fileName)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: theme.accent.secondary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '10px'
                    }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => list.removeFile(file.rootHash)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 