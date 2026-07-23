/**
 * @fileoverview Fund Broker Modal Component
 * @description Modal for funding virtual broker with 0G tokens via blockchain transaction
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useWallet } from '../../hooks/useWallet';
import { FiX, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';
import AnimatedDots from '../../components/ui/AnimatedDots';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'FundBrokerModal' });

interface FundBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokerRef: any;
  currentBalance: number;
}

export const FundBrokerModal: React.FC<FundBrokerModalProps> = ({
  isOpen,
  onClose,
  brokerRef,
  currentBalance
}) => {
  const { theme } = useTheme();
  const { sendOGToMasterWallet, isSendingTransaction, address, isConnected } = useWallet();
  
  // State
  const [amount, setAmount] = useState('0.01');
  const [status, setStatus] = useState<'idle' | 'sending' | 'confirming' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError(null);
      setTxHash(null);
      setAmount('0.01');
    }
  }, [isOpen]);
  
  // Auto close on success
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);
  
  const handleFund = async () => {
    if (!address || !amount || parseFloat(amount) <= 0) {
      setError('Invalid amount');
      return;
    }
    
    setStatus('sending');
    setError(null);
    log.debug('Starting fund transaction', { amount, address });
    
    try {
      // Send transaction through wagmi
      const txResult = await sendOGToMasterWallet(amount);
      
      if (!txResult.success) {
        throw new Error(txResult.error || 'Transaction failed');
      }
      
      setTxHash(txResult.txHash!);
      setStatus('confirming');
      log.debug('Transaction sent', { txHash: txResult.txHash });
      
      // Notify backend through broker actor
      if (brokerRef && txResult.txHash) {
        // Send fund event to broker with txHash
        brokerRef.send({ 
          type: 'FUND', 
          amount: parseFloat(amount),
          txHash: txResult.txHash
        });
        
        log.debug('Notified broker actor', { amount, txHash: txResult.txHash });
      }
      
      setStatus('success');
      
    } catch (err: any) {
      setError(err.message || 'Failed to send transaction');
      setStatus('error');
      log.debug('Fund transaction error', err);
    }
  };
  
  if (!isOpen) return null;
  
  // Styles
  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    animation: 'fadeIn 0.2s ease'
  };
  
  const isProcessing = status === 'sending' || status === 'confirming';
  
  const modalContentStyle: React.CSSProperties = {
    width: '90%',
    maxWidth: '400px',
    position: 'relative',
    animation: 'slideUp 0.3s ease'
  };
  
  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'transparent',
    border: 'none',
    color: theme.text.secondary,
    cursor: 'pointer',
    padding: '4px',
    transition: 'color 0.2s ease'
  };
  
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.2)',
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    color: theme.text.primary,
    fontSize: '16px',
    fontFamily: 'monospace',
    marginBottom: '16px',
    transition: 'all 0.2s ease'
  };
  
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 24px',
    background: theme.accent.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: status === 'idle' && !isSendingTransaction ? 'pointer' : 'not-allowed',
    opacity: status === 'idle' && !isSendingTransaction ? 1 : 0.6,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };
  
  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .shimmer-border {
          position: relative;
          padding: 2px;
          border-radius: 16px;
          background: linear-gradient(
            90deg,
            transparent 25%,
            ${theme.accent.primary}44 50%,
            transparent 75%
          );
          background-size: 200% 100%;
          animation: ${isProcessing ? 'shimmer 2s infinite' : 'none'};
        }
        
        .shimmer-content {
          background: ${theme.bg.card};
          border-radius: 14px;
          backdrop-filter: blur(10px);
          padding: 24px;
          position: relative;
        }
      `}</style>
      
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div className="shimmer-border">
            <div className="shimmer-content">
              {/* Close button */}
              <button
                style={closeButtonStyle}
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.text.secondary;
                }}
              >
                <FiX size={20} />
              </button>
          
          {/* Title */}
          <h2 style={{
            color: theme.text.primary,
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '8px',
            fontFamily: theme.typography.fontFamilies.primary
          }}>
            Fund Virtual Broker
          </h2>
          
          {/* Current balance */}
          <p style={{
            color: theme.text.secondary,
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            Current balance: <span style={{ color: theme.accent.primary, fontWeight: '600' }}>
              {currentBalance.toFixed(4)} 0G
            </span>
          </p>
          
          {/* Status messages */}
          {status === 'success' && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10B981',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10B981'
            }}>
              <FiCheck size={18} />
              <span>Transaction successful! Broker funded.</span>
            </div>
          )}
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#EF4444'
            }}>
              <FiAlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {(status === 'sending' || status === 'confirming') && (
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: `1px solid ${theme.accent.primary}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: theme.text.secondary,
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {status === 'sending' ? (
                <>
                  Waiting for wallet confirmation
                  <AnimatedDots color={theme.accent.primary} size={4} />
                </>
              ) : (
                <>
                  Transaction submitted
                  {txHash && (
                    <div style={{ 
                      marginTop: '8px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      opacity: 0.8
                    }}>
                      TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Amount input */}
          {status === 'idle' && (
            <>
              <label style={{
                color: theme.text.secondary,
                fontSize: '14px',
                display: 'block',
                marginBottom: '8px'
              }}>
                Amount (0G)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                min="0.001"
                step="0.001"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.accent.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                }}
              />
            </>
          )}
          
          {/* Action button */}
          {status !== 'success' && (
            <button
              onClick={handleFund}
              disabled={status !== 'idle' || isSendingTransaction}
              style={buttonStyle}
              onMouseEnter={(e) => {
                if (status === 'idle' && !isSendingTransaction) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {status === 'sending' || isSendingTransaction ? (
                <>
                  Confirm in wallet
                  <AnimatedDots color={theme.bg.primary} size={5} />
                </>
              ) : status === 'confirming' ? (
                <>
                  Processing transaction
                  <AnimatedDots color={theme.bg.primary} size={5} />
                </>
              ) : (
                <>Send Transaction</>
              )}
            </button>
          )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};