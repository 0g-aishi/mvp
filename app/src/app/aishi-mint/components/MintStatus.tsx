'use client';

import WalletConnection from './WalletConnection';
import TransactionStatus from './TransactionStatus';
import MintForm from './MintForm';

interface MintStatusProps {
  // Wallet & Connection
  isConnected: boolean;
  hasExistingAgent: boolean;
  existingTokenId: any;
  hasInsufficientBalance: boolean;
  balance: any;
  
  // Form State
  agentName: string;
  setAgentName: (name: string) => void;
  nameError: string;
  isCheckingName: boolean;
  canMint: boolean;
  
  // Transaction
  isProcessing: boolean;
  isWritePending: boolean;
  writeError: any;
  txError: any;
  txHash: any;
  showSuccess: boolean;
  mintedTokenId: number | null;
  
  // Actions
  handleMint: () => void;
  shareOnX: () => void;
  reset: () => void;
  
  // Constants
  currentMintPrice: bigint;
  maxNameLength: number;
  isSoldOut: boolean;
  remainingSupply: number;
  maxSupply: number;
}

export default function MintStatus(props: MintStatusProps) {
  const {
    isConnected,
    hasExistingAgent,
    existingTokenId,
    hasInsufficientBalance,
    balance,
    showSuccess,
    mintedTokenId,
    agentName,
    isProcessing,
    isWritePending,
    writeError,
    txError,
    txHash,
    shareOnX,
    reset,
    currentMintPrice,
    isSoldOut,
    remainingSupply,
    maxSupply,
  } = props;

  if (isSoldOut) {
    const mintedCount = Math.max(maxSupply - remainingSupply, 0);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          padding: '2.5rem 2rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 8, 8, 0.45)',
          textAlign: 'center',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.85rem',
              marginBottom: '0.5rem',
              fontWeight: 700,
            }}
          >
            Mint Closed
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.72)',
              margin: 0,
            }}
          >
            All {maxSupply.toLocaleString()} agents have been born.
          </p>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '0.75rem',
            }}
          >
            Connect to your terminal to continue evolving yours.
          </p>
        </div>

        <button
          onClick={() => (window.location.href = '/aishiOS')}
          style={{
            padding: '0.85rem 1.9rem',
            borderRadius: '999px',
            border: 'none',
            background: '#ffffff',
            color: '#050505',
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: '48px',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Open Terminal
        </button>

        <div
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.45)',
          }}
        >
          Minted agents: {mintedCount.toLocaleString()} / {maxSupply.toLocaleString()}
        </div>
      </div>
    );
  }

  // Show success state
  if (showSuccess) {
    return (
      <TransactionStatus
        showSuccess={showSuccess}
        mintedTokenId={mintedTokenId}
        agentName={agentName}
        isProcessing={false}
        isWritePending={false}
        writeError={null}
        txError={null}
        txHash={txHash}
        onShare={shareOnX}
        onReset={reset}
      />
    );
  }

  // Show wallet connection or existing agent
  if (!isConnected || hasExistingAgent) {
    return (
      <WalletConnection
        isConnected={isConnected}
        hasExistingAgent={hasExistingAgent}
        existingTokenId={existingTokenId}
        hasInsufficientBalance={hasInsufficientBalance}
        balance={balance}
        currentMintPrice={currentMintPrice}
        isSoldOut={isSoldOut}
        remainingSupply={remainingSupply}
        maxSupply={maxSupply}
      />
    );
  }

  // Show processing state
  if (isProcessing) {
    return (
      <TransactionStatus
        showSuccess={false}
        mintedTokenId={null}
        agentName={agentName}
        isProcessing={isProcessing}
        isWritePending={isWritePending}
        writeError={writeError}
        txError={txError}
        txHash={txHash}
        onShare={shareOnX}
        onReset={reset}
      />
    );
  }

  // Show error state
  if (writeError || txError) {
    return (
      <>
        <TransactionStatus
          showSuccess={false}
          mintedTokenId={null}
          agentName={agentName}
          isProcessing={false}
          isWritePending={false}
          writeError={writeError}
          txError={txError}
          txHash={txHash}
          onShare={shareOnX}
          onReset={reset}
        />
        <MintForm
          agentName={props.agentName}
          setAgentName={props.setAgentName}
          nameError={props.nameError}
          isCheckingName={props.isCheckingName}
          canMint={props.canMint}
          isProcessing={props.isProcessing}
          isConnected={isConnected}
          maxNameLength={props.maxNameLength}
          currentMintPrice={props.currentMintPrice}
          onMint={props.handleMint}
          remainingSupply={remainingSupply}
          maxSupply={maxSupply}
          isSoldOut={isSoldOut}
        />
      </>
    );
  }

  // Show mint form with balance warning if needed
  return (
    <>
      {hasInsufficientBalance && (
        <WalletConnection
          isConnected={isConnected}
          hasExistingAgent={false}
          existingTokenId={null}
          hasInsufficientBalance={hasInsufficientBalance}
          balance={balance}
          currentMintPrice={currentMintPrice}
        isSoldOut={isSoldOut}
        remainingSupply={remainingSupply}
        maxSupply={maxSupply}
        />
      )}
      <MintForm
        agentName={props.agentName}
        setAgentName={props.setAgentName}
        nameError={props.nameError}
        isCheckingName={props.isCheckingName}
        canMint={props.canMint}
        isProcessing={props.isProcessing}
        isConnected={isConnected}
        maxNameLength={props.maxNameLength}
        currentMintPrice={props.currentMintPrice}
        onMint={props.handleMint}
        remainingSupply={remainingSupply}
        maxSupply={maxSupply}
        isSoldOut={isSoldOut}
      />
    </>
  );
}