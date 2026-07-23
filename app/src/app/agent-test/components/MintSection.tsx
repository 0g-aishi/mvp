'use client';

import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { getActiveChain } from '../../../config/chains';
import { Brain, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface MintSectionProps {
  // Wallet state
  isConnected: boolean;
  address: string | undefined;
  isCorrectNetwork: boolean;
  connectWallet: () => void;
  switchToOGNetwork: () => void;
  
  // Contract info
  contractAddress: string;
  currentBalance: { formatted: string; symbol: string } | null;
  hasCurrentBalance: boolean;
  
  // Mint state
  isLoading: boolean;
  isWaitingForReceipt: boolean;
  error: string;
  txHash: string;
  tokenId: bigint | null;
  resetMint: () => void;
  getTransactionUrl: (hash: string) => string;
  
  // Actions
  mintAgent: (name: string) => Promise<any>;
}

export default function MintSection({
  isConnected,
  address,
  isCorrectNetwork,
  connectWallet,
  switchToOGNetwork,
  contractAddress,
  currentBalance,
  hasCurrentBalance,
  isLoading,
  isWaitingForReceipt,
  error,
  txHash,
  tokenId,
  resetMint,
  getTransactionUrl,
  mintAgent
}: MintSectionProps) {
  const { theme } = useTheme();
  const [agentName, setAgentName] = useState('');

  const handleMintAgent = async () => {
    if (!agentName.trim()) {
      alert('Please enter an agent name');
      return;
    }
    
    const result = await mintAgent(agentName.trim());
    
    if (result.success && result.txHash) {
      setAgentName('');
    }
  };

  return (
    <>
      {/* Contract Info */}
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
          <Sparkles size={20} />
          Contract Information
        </h3>
        
        <div style={{ color: theme.text.secondary, fontSize: '14px' }}>
          <p><strong>Contract:</strong> {contractAddress}</p>
          <p><strong>Network:</strong> {getActiveChain().name} (Chain ID: {getActiveChain().id})</p>
          <p><strong>Function:</strong> mintAgent(proofs[], descriptions[], agentName, to)</p>
          <p><strong>Minting Fee:</strong> 0.1 OG per agent</p>
        </div>
      </div>

      {/* Wallet Status */}
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
          <Brain size={20} />
          Wallet Status
        </h3>
        
        {!isConnected ? (
          <button
            onClick={connectWallet}
            style={{
              backgroundColor: theme.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Connect Wallet
          </button>
        ) : !isCorrectNetwork ? (
          <button
            onClick={switchToOGNetwork}
            style={{
              backgroundColor: '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Switch to 0G Network
          </button>
        ) : (
          <div style={{ color: theme.text.primary }}>
            ✅ Connected: {address}
            {currentBalance && (
              <div style={{ 
                color: theme.text.secondary, 
                fontSize: '14px', 
                marginTop: '5px' 
              }}>
                Balance: {currentBalance.formatted} {currentBalance.symbol}
                {!hasCurrentBalance && (
                  <span style={{ color: '#ff4444', marginLeft: '8px' }}>
                    (Need 0.1 OG to mint)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mint Agent Section */}
      {isConnected && isCorrectNetwork && (
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
            <Sparkles size={20} />
            Mint Dream Agent (0.1 OG Fee)
          </h3>
          
          <div style={{
            fontSize: '14px',
            color: theme.text.secondary,
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: theme.bg.panel,
            borderRadius: '6px',
            border: `1px solid ${theme.border}`
          }}>
            💡 Minting requires 0.1 OG fee. Agent starts as a "blank slate" with neutral personality traits (all 50).
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div>
              <label style={{
                display: 'block',
                color: theme.text.secondary,
                fontSize: '14px',
                marginBottom: '5px'
              }}>
                Agent Name:
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Enter your agent's name..."
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bg.panel,
                  color: theme.text.primary,
                  fontSize: '14px'
                }}
              />
            </div>
            
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#ff4444',
                fontSize: '14px',
                padding: '10px',
                backgroundColor: theme.bg.panel,
                borderRadius: '6px'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <button
                onClick={handleMintAgent}
                disabled={isLoading || isWaitingForReceipt || !agentName.trim() || !hasCurrentBalance}
                style={{
                  backgroundColor: theme.accent.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: isLoading || isWaitingForReceipt || !agentName.trim() || !hasCurrentBalance ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: isLoading || isWaitingForReceipt || !agentName.trim() || !hasCurrentBalance ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending Transaction...
                  </>
                ) : isWaitingForReceipt ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Waiting for Confirmation...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Mint Agent
                  </>
                )}
              </button>
              
              {(error || txHash) && (
                <button
                  onClick={resetMint}
                  style={{
                    backgroundColor: theme.bg.panel,
                    color: theme.text.primary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {txHash && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '15px',
                backgroundColor: theme.bg.panel,
                borderRadius: '8px',
                border: `1px solid ${tokenId ? '#44ff44' : theme.accent.primary}33`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: tokenId ? '#44ff44' : theme.accent.primary,
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {tokenId ? <CheckCircle size={16} /> : <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {tokenId ? 'Agent Minted Successfully!' : 'Transaction Sent - Waiting for Confirmation...'}
                </div>
                
                {tokenId && (
                  <div style={{
                    fontSize: '12px',
                    color: theme.text.primary,
                    marginTop: '5px'
                  }}>
                    <strong>Token ID:</strong> #{tokenId.toString()}
                  </div>
                )}
                
                <div style={{
                  fontSize: '12px',
                  color: theme.text.secondary,
                  wordBreak: 'break-all'
                }}>
                  <strong>Transaction:</strong> 
                  <a 
                    href={getTransactionUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.accent.primary,
                      textDecoration: 'none',
                      marginLeft: '5px'
                    }}
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 