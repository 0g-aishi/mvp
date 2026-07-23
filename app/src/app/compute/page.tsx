'use client';

import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useTheme } from '../../contexts/ThemeContext';
import { useWallet } from '../../hooks/useWallet';
import { useModelDiscovery } from '../../hooks/useModelDiscovery';
import ModelSelector from '../../components/ModelSelector';
import { getActiveChain } from '../../config/chains';
import { Brain, DollarSign, Zap, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';

export default function ComputeTest() {
  const { theme, debugLog } = useTheme();
  const { 
    isConnected, 
    address, 
    connectWallet, 
    isCorrectNetwork, 
    switchToOGNetwork,
    sendOGToMasterWallet,
    isSendingTransaction 
  } = useWallet();
  
  const {
    models,
    selectedModel,
    setSelectedModel,
    isLoading: modelsLoading,
    error: modelsError
  } = useModelDiscovery();
  
  // State for backend testing
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [dreamQuery, setDreamQuery] = useState('');
  const [brokerInfo, setBrokerInfo] = useState<any>(null);
  
  // State for funding
  const [fundAmount, setFundAmount] = useState('0.1');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  // Debug log on start
  debugLog('Compute Test page loaded');

  // Backend API URL from doors.md
  const API_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';

  // Helper for API calls
  const apiCall = async (endpoint: string, options: any = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return await response.json();
  };

  // Fund Master Wallet - sends transaction through wagmi
  const fundMasterWallet = async () => {
    if (!address || !fundAmount) return;
    
    setError(null);
    
    try {
      debugLog('Starting fund transaction', { amount: fundAmount, address });
      
      // Send transaction through wagmi
      const txResult = await sendOGToMasterWallet(fundAmount);
      
      if (!txResult.success) {
        setError(txResult.error || 'Transaction failed');
        return;
      }
      
      setLastTxHash(txResult.txHash!);
      debugLog('Transaction sent', { txHash: txResult.txHash });
      
      // Send hash to backend to verify and fund broker
      await notifyBackendOfFunding(txResult.txHash!, parseFloat(fundAmount));
      
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
      debugLog('Fund transaction error', err);
    }
  };

  // Notify backend of funding transaction
  const notifyBackendOfFunding = async (txHash: string, amount: number) => {
    try {
      debugLog('Notifying backend of funding', { txHash, amount, address });
      
      const data = await apiCall('/fund', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: address,
          amount: amount,
          txHash: txHash
        })
      });
      
      if (data.success) {
        setBrokerInfo(data.data);
        debugLog('Backend notified successfully', data.data);
        
        // Auto-refresh balance after funding
        setTimeout(() => checkBalance(), 2000);
      } else {
        setError(`Backend notification failed: ${data.error}`);
      }
    } catch (err: any) {
      setError(`Failed to notify backend: ${err.message}`);
      debugLog('Backend notification error', err);
    }
  };

  // Create broker
  const createBroker = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('/create-broker', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: address })
      });
      
      if (data.success) {
        setBrokerInfo(data.data);
        debugLog('Broker created', data.data);
      } else {
        setError(data.error || 'Failed to create broker');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Check balance
  const checkBalance = async () => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiCall(`/balance/${address}`);
      
      if (data.success) {
        setBrokerInfo(data.data);
        debugLog('Balance checked', data.data);
      } else {
        setError(data.error || 'Failed to check balance');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Process AI query with appropriate endpoint routing
  const analyzeDream = async () => {
    if (!address || !dreamQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Route request based on model type
      const isGeminiModel = selectedModel.startsWith('gemini-');
      const endpoint = isGeminiModel ? '/gemini' : '/0g-compute';
      
      // Prepare request payload based on model type
      const requestBody = isGeminiModel ? {
        prompt: dreamQuery,
        modelId: selectedModel
      } : {
        walletAddress: address,
        query: dreamQuery,
        modelId: selectedModel
      };
      
      const data = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (data.success) {
        // Normalize response structure between different endpoints
        const normalizedResult = isGeminiModel ? {
          response: data.data,
          model: data.metadata?.model || selectedModel,
          cost: 0,
          responseTime: data.metadata?.responseTime,
          isValid: true,
          chatId: data.metadata?.requestId
        } : data.data;
        
        setResult(normalizedResult);
        debugLog('Dream analyzed', normalizedResult);
        
        // Auto-refresh balance after AI query (only for 0G models)
        if (!isGeminiModel) {
          setTimeout(() => checkBalance(), 1000);
        }
      } else {
        setError(data.error || 'Failed to analyze dream');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Get Master Wallet address
  const getMasterWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiCall('/master-wallet-address');
      
      if (data.success) {
        alert(`Master Wallet Address: ${data.data.address}\n\nOr use the Fund Master Wallet button below!`);
        debugLog('Master wallet address', data.data);
      } else {
        setError(data.error || 'Failed to get master wallet address');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

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
            Compute Testing
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: theme.text.secondary,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Test interface for 0G Compute backend - create brokers, fund wallets, and query AI models
          </p>
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
            </div>
          )}
        </div>

        {isConnected && isCorrectNetwork && (
          <>
            {/* Fund Master Wallet */}
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
                <Send size={20} />
                Fund Master Wallet
              </h3>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'end',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: theme.text.secondary,
                      fontSize: '14px',
                      marginBottom: '5px'
                    }}>
                      Amount (0G):
                    </label>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      min="0.01"
                      step="0.01"
                      placeholder="0.1"
                      style={{
                        width: '120px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.bg.panel,
                        color: theme.text.primary,
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <button
                    onClick={fundMasterWallet}
                    disabled={isSendingTransaction || !fundAmount || parseFloat(fundAmount) <= 0}
                    style={{
                      backgroundColor: theme.accent.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: isSendingTransaction ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      opacity: isSendingTransaction ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isSendingTransaction ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send {fundAmount} 0G
                      </>
                    )}
                  </button>
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: theme.text.secondary,
                  lineHeight: '1.4'
                }}>
                  Send 0G to Master Wallet to fund your Virtual Broker. Transaction will be automatically detected and balance will increase.
                </div>
                
                {lastTxHash && (
                  <div style={{
                    backgroundColor: theme.bg.panel,
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '12px',
                    color: theme.text.secondary
                  }}>
                    <strong>Last Transaction:</strong>
                    <a
                      href={`${getActiveChain().blockExplorers?.default?.url}/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: theme.accent.primary,
                        textDecoration: 'none',
                        marginLeft: '5px'
                      }}
                    >
                      {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Broker Management */}
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
                <DollarSign size={20} />
                Virtual Broker
              </h3>
              
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '15px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={createBroker}
                  disabled={isLoading}
                  style={{
                    backgroundColor: theme.accent.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  Create Broker
                </button>
                
                <button
                  onClick={checkBalance}
                  disabled={isLoading}
                  style={{
                    backgroundColor: theme.bg.panel,
                    color: theme.text.primary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  Check Balance
                </button>
                
                <button
                  onClick={getMasterWallet}
                  disabled={isLoading}
                  style={{
                    backgroundColor: theme.bg.panel,
                    color: theme.text.primary,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    padding: '8px 16px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  Get Master Wallet
                </button>
              </div>
              
              {brokerInfo && (
                <div style={{
                  backgroundColor: theme.bg.panel,
                  borderRadius: '8px',
                  padding: '15px',
                  color: theme.text.secondary,
                  fontSize: '14px'
                }}>
                  <div><strong>Address:</strong> {brokerInfo.walletAddress}</div>
                  <div><strong>Balance:</strong> {brokerInfo.balance} 0G</div>
                  <div><strong>Master Wallet:</strong> {brokerInfo.masterWalletAddress}</div>
                  {brokerInfo.transactions && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Recent Transactions:</strong> {brokerInfo.transactions.length}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Testing */}
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
                AI Dream Analysis
              </h3>
              
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
                    Model:
                  </label>
                  <ModelSelector
                    models={models}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    isLoading={modelsLoading}
                  />
                  {modelsError && (
                    <div style={{
                      fontSize: '12px',
                      color: theme.accent.error || '#ff4444',
                      marginTop: '4px'
                    }}>
                      {modelsError}
                    </div>
                  )}
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    color: theme.text.secondary,
                    fontSize: '14px',
                    marginBottom: '5px'
                  }}>
                    Dream Query:
                  </label>
                  <textarea
                    value={dreamQuery}
                    onChange={(e) => setDreamQuery(e.target.value)}
                    placeholder="Describe your dream or ask a question about dreams..."
                    style={{
                      width: '100%',
                      height: '100px',
                      padding: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.bg.panel,
                      color: theme.text.primary,
                      resize: 'vertical',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <button
                  onClick={analyzeDream}
                  disabled={isLoading || !dreamQuery.trim()}
                  style={{
                    backgroundColor: theme.accent.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    cursor: isLoading || !dreamQuery.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: isLoading || !dreamQuery.trim() ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                    alignSelf: 'flex-start'
                  }}
                >
                  {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={16} />}
                  {isLoading ? 'Analyzing...' : 'Analyze Dream'}
                </button>
              </div>
            </div>

            {/* Results */}
            {error && (
              <div style={{
                backgroundColor: '#ff444430',
                border: '1px solid #ff4444',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#ff4444'
              }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div style={{
                backgroundColor: theme.bg.card,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{
                  color: theme.text.primary,
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle size={20} style={{ color: '#44ff44' }} />
                  AI Analysis Result
                </h3>
                
                <div style={{
                  backgroundColor: theme.bg.panel,
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    color: theme.text.secondary,
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}>
                    <strong>Model:</strong> {result.model} | 
                    <strong> Cost:</strong> {result.cost} 0G | 
                    <strong> Time:</strong> {result.responseTime}ms |
                    <strong> Valid:</strong> {result.isValid ? '✅' : '❌'}
                  </div>
                  
                  <div style={{
                    color: theme.text.primary,
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {result.response}
                  </div>
                </div>
                
                {result.chatId && (
                  <div style={{
                    color: theme.text.secondary,
                    fontSize: '12px'
                  }}>
                    Chat ID: {result.chatId}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 