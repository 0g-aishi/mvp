'use client';

import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useTheme } from '../../contexts/ThemeContext';
import { useWallet } from '../../hooks/useWallet';
import { useAgentMint } from '../../hooks/agentHooks';
import { useAgentRead } from '../../hooks/agentHooks';
import { Sparkles, Info, Moon, MessageCircle, Zap, Database, TrendingUp, Gem, TestTube } from 'lucide-react';

// Import nowych komponentów
import MintSection from './components/MintSection';
import AgentInfoSection from './components/AgentInfoSection';
import DreamAnalysisSection from './components/DreamAnalysisSection';
import AgentChatSection from './components/AgentChatSection';
import ConsolidationTestSection from './components/ConsolidationTestSection';
import AgentStatsSection from './components/AgentStatsSection';
import MemoryCoreSection from './components/MemoryCoreSection';
import ConsolidationTestMode from './components/ConsolidationTestMode';

export default function AgentTest() {
  const { theme, debugLog } = useTheme();
  const { 
    isConnected, 
    address, 
    connectWallet, 
    isCorrectNetwork, 
    switchToOGNetwork
  } = useWallet();
  
  // Agent mint hook
  const {
    mintAgent,
    isLoading,
    isWaitingForReceipt,
    error,
    txHash,
    tokenId,
    resetMint,
    getTransactionUrl,
    contractAddress,
    hasCurrentBalance,
    currentBalance
  } = useAgentMint();
  
  // Agent read hook dla nowych funkcji ABI
  const {
    agentData,
    canProcessDreamToday,
    memoryAccess,
    personalityTraits,
    isLoading: isLoadingAgentData,
    isLoadingCanProcess,
    isLoadingMemoryAccess,
    isLoadingPersonalityTraits,
    hasAgent: readHasAgent,
    effectiveTokenId
  } = useAgentRead();
  
  // Mode state - dodano 'memory-core' i 'test-mode'
  const [mode, setMode] = useState<'mint' | 'info' | 'dream' | 'chat' | 'consolidation' | 'stats' | 'memory-core' | 'test-mode'>('mint');
  
  // Debug log on start
  debugLog('Agent Test page loaded');

  // Update lastMintedAgent when tokenId is confirmed
  useEffect(() => {
    if (tokenId && txHash) {
      debugLog('Agent minted and confirmed', { tokenId: tokenId.toString() });
    }
  }, [tokenId, txHash, debugLog]);

  return (
    <Layout>
      <div style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            background: theme.gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px'
          }}>
            🧠 Agent Testing
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: theme.text.secondary,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Test interface for minting Dream Agents and managing iNFT contracts
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          backgroundColor: theme.bg.card,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            color: theme.text.primary,
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Zap size={20} />
            Mode Selection
              </h3>
              
              <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setMode('mint')}
                  style={{
                    backgroundColor: mode === 'mint' ? theme.accent.primary : theme.bg.panel,
                    color: mode === 'mint' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'mint' ? theme.accent.primary : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} />
              Mint Section
                </button>
                
                <button
                  onClick={() => setMode('info')}
                  style={{
                    backgroundColor: mode === 'info' ? theme.accent.primary : theme.bg.panel,
                    color: mode === 'info' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'info' ? theme.accent.primary : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Info size={16} />
                  Agent Info
                </button>
                
                <button
                  onClick={() => setMode('dream')}
                  style={{
                    backgroundColor: mode === 'dream' ? theme.accent.primary : theme.bg.panel,
                    color: mode === 'dream' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'dream' ? theme.accent.primary : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Moon size={16} />
                  Dream Analysis
                </button>
                
                <button
                  onClick={() => setMode('chat')}
                  style={{
                    backgroundColor: mode === 'chat' ? theme.accent.primary : theme.bg.panel,
                    color: mode === 'chat' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'chat' ? theme.accent.primary : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <MessageCircle size={16} />
                  Agent Chat
                </button>
                
                <button
                  onClick={() => setMode('consolidation')}
                  style={{
                    backgroundColor: mode === 'consolidation' ? theme.accent.primary : theme.bg.panel,
                    color: mode === 'consolidation' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'consolidation' ? theme.accent.primary : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Database size={16} />
                  Consolidation
                </button>
                
                <button
                  onClick={() => setMode('memory-core')}
                  style={{
                    backgroundColor: mode === 'memory-core' ? '#8B5CF6' : theme.bg.panel,
                    color: mode === 'memory-core' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'memory-core' ? '#8B5CF6' : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Gem size={16} />
                  Memory Core
                </button>
                
                <button
                  onClick={() => setMode('stats')}
                  style={{
                    backgroundColor: mode === 'stats' ? theme.accent.primary : theme.bg.panel,
                    color: mode === 'stats' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'stats' ? theme.accent.primary : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={16} />
                  Statistics
                </button>
                
                <button
                  onClick={() => setMode('test-mode')}
                  style={{
                    backgroundColor: mode === 'test-mode' ? '#FF6B6B' : theme.bg.panel,
                    color: mode === 'test-mode' ? 'white' : theme.text.primary,
                    border: `1px solid ${mode === 'test-mode' ? '#FF6B6B' : theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <TestTube size={16} />
                  Test Mode
                </button>
              </div>
            </div>

            {/* Conditional Content Based on Mode */}
            {mode === 'mint' && (
          <MintSection
            isConnected={isConnected}
            address={address}
            isCorrectNetwork={isCorrectNetwork}
            connectWallet={connectWallet}
            switchToOGNetwork={switchToOGNetwork}
            contractAddress={contractAddress}
            currentBalance={currentBalance}
            hasCurrentBalance={hasCurrentBalance}
            isLoading={isLoading}
            isWaitingForReceipt={isWaitingForReceipt}
            error={error}
            txHash={txHash}
            tokenId={tokenId}
            resetMint={resetMint}
            getTransactionUrl={getTransactionUrl}
            mintAgent={mintAgent}
          />
        )}

            {mode === 'info' && (
          <AgentInfoSection
            agentData={agentData}
            personalityTraits={personalityTraits}
            memoryAccess={memoryAccess}
            canProcessDreamToday={canProcessDreamToday}
            isLoading={isLoadingAgentData}
            isLoadingPersonalityTraits={isLoadingPersonalityTraits}
            isLoadingMemoryAccess={isLoadingMemoryAccess}
            isLoadingCanProcess={isLoadingCanProcess}
            hasAgent={readHasAgent}
            effectiveTokenId={effectiveTokenId}
          />
        )}

            {mode === 'dream' && (
          <DreamAnalysisSection
            hasAgent={readHasAgent}
            effectiveTokenId={effectiveTokenId}
          />
                  )}

            {mode === 'chat' && (
          <AgentChatSection
            hasAgent={readHasAgent}
            effectiveTokenId={effectiveTokenId}
            agentData={agentData}
          />
        )}

            {mode === 'consolidation' && (
          <ConsolidationTestSection
            hasAgent={readHasAgent}
            effectiveTokenId={effectiveTokenId}
          />
        )}

            {mode === 'memory-core' && (
          <MemoryCoreSection
            hasAgent={readHasAgent}
            effectiveTokenId={effectiveTokenId}
          />
        )}

            {mode === 'stats' && (
          <AgentStatsSection
            tokenId={effectiveTokenId}
          />
        )}

            {mode === 'test-mode' && (
          <ConsolidationTestMode
            hasAgent={readHasAgent}
            effectiveTokenId={effectiveTokenId}
          />
        )}
      </div>
    </Layout>
  );
} 