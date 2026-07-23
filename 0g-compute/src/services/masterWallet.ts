const ethers = require('ethers');
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
require('../config/envLoader');
const { createLogger } = require('../lib/logger');

const log = createLogger('MasterWallet');

class MasterWalletService {
  private provider: any = null;
  private wallet: any = null;
  private broker: any = null;
  private isInitialized = false;
  private isRefilling = false;

  constructor() {
    const privateKey = process.env.MASTER_WALLET_KEY;
    const rpcUrl = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

    if (!privateKey || privateKey.length !== 64) {
      log.info('MASTER_WALLET_KEY not set — 0G compute payments off. Frontend still runs.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    if (process.env.TEST_ENV === 'true') {
      log.debug('Master Wallet initialized', { address: this.wallet.address });
    }
  }

  isConfigured(): boolean {
    return this.wallet !== null && this.provider !== null;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.wallet) {
      throw new Error('MASTER_WALLET_KEY is not configured');
    }

    try {
      if (process.env.TEST_ENV === 'true') {
        log.debug('Initializing Master Wallet broker');
      }

      // Create 0G Compute broker
      this.broker = await createZGComputeNetworkBroker(this.wallet);

      // Ensure ledger exists
      await this.ensureLedgerExists();

      // Log complete wallet info after ledger check
      const [ethBalance, ledgerBalance] = await Promise.all([
        this.getWalletBalance(),
        this.getLedgerBalance()
      ]);

      log.info('Master Wallet Info', {
        address: this.wallet.address,
        ethBalance: `${ethBalance.toFixed(8)} OG`,
        ledgerBalance: `${ledgerBalance.toFixed(8)} OG`
      });

      // SDK 0.4.4 balance warnings
      if (ledgerBalance < 1.0) {
        log.warn('LEDGER BALANCE TOO LOW FOR 0G PROVIDERS', {
          currentLedger: `${ledgerBalance.toFixed(4)} OG`,
          minimum: '1.1 OG',
          cheapestProvider: '~1.0 OG (phala/gpt-oss-120b)'
        });

        if (ethBalance >= 1.5) {
          log.warn('ETH balance sufficient - run funding script', {
            ethBalance: `${ethBalance.toFixed(4)} OG`,
            solution: 'npm run fund-ledger:wsl',
            amount: '1.5'
          });
        } else {
          log.warn('ETH balance too low - send OG to Master Wallet', {
            ethBalance: `${ethBalance.toFixed(4)} OG`,
            to: this.wallet.address,
            recommendedAmount: '2 OG',
            thenRun: 'npm run fund-ledger:wsl'
          });
        }
      } else if (ledgerBalance >= 1.0 && ledgerBalance < 5.0) {
        log.info('Ledger sufficient for testing (1 provider)');
      } else {
        log.info('Ledger sufficient for multiple providers');
      }

      // Check and refill if needed
      await this.checkAndRefill();

      this.isInitialized = true;

      if (process.env.TEST_ENV === 'true') {
        log.info('Master Wallet broker initialized successfully');
      }
    } catch (error: any) {
      log.error('Failed to initialize Master Wallet', { error: error.message });
      throw error;
    }
  }

  private async ensureLedgerExists(): Promise<void> {
    if (!this.broker) {
      throw new Error('Broker not initialized');
    }

    try {
      const ledgerInfo = await this.broker.ledger.getLedger();
      const balance = parseFloat(ethers.formatEther(ledgerInfo.totalBalance));

      if (process.env.TEST_ENV === 'true') {
        log.debug('Master Wallet ledger balance', { balance: `${balance.toFixed(8)} OG` });
      }
    } catch (error: any) {
      if (error.message.includes('Account does not exist')) {
        // NOWA WERSJA 0.3.1: Account nie istnieje
        if (process.env.TEST_ENV === 'true') {
          log.debug('Creating Master Wallet account (v0.3.1)');
        }

        const initialAmount = parseFloat(process.env.MASTER_WALLET_INITIAL_DEPOSIT || '0.15');
        await this.broker.ledger.addLedger(initialAmount);

        if (process.env.TEST_ENV === 'true') {
          log.info('Master Wallet account created', { amount: `${initialAmount} OG` });
        }
      } else if (error.message.includes('LedgerNotExists')) {
        // STARA WERSJA: Backward compatibility
        if (process.env.TEST_ENV === 'true') {
          log.debug('Creating Master Wallet ledger (v0.2.x)');
        }

        const initialAmount = parseFloat(process.env.MASTER_WALLET_INITIAL_DEPOSIT || '0.15');
        await this.broker.ledger.addLedger(initialAmount);

        if (process.env.TEST_ENV === 'true') {
          log.info('Master Wallet ledger created', { amount: `${initialAmount} OG` });
        }
      } else {
        throw error;
      }
    }
  }

  async checkAndRefill(): Promise<void> {
    if (!this.broker || this.isRefilling) {
      return;
    }

    try {
      const ledgerInfo = await this.broker.ledger.getLedger();
      const balance = parseFloat(ethers.formatEther(ledgerInfo.totalBalance));
      const threshold = parseFloat(process.env.AUTO_REFILL_THRESHOLD || '0.05');
      const refillAmount = parseFloat(process.env.AUTO_REFILL_AMOUNT || '0.1');

      if (balance < threshold) {
        if (process.env.TEST_ENV === 'true') {
          log.warn('Master Wallet balance low', {
            balance: `${balance.toFixed(8)} OG`,
            threshold: `${threshold.toFixed(8)} OG`,
            refillAmount: `${refillAmount.toFixed(8)} OG`
          });
        }

        this.isRefilling = true;

        try {
          await this.broker.ledger.depositFund(refillAmount);

          const newLedgerInfo = await this.broker.ledger.getLedger();
          const newBalance = parseFloat(ethers.formatEther(newLedgerInfo.totalBalance));

          if (process.env.TEST_ENV === 'true') {
            log.info('Master Wallet refilled', { newBalance: `${newBalance.toFixed(8)} OG` });
          }
        } finally {
          this.isRefilling = false;
        }
      }
    } catch (error: any) {
      log.error('Failed to check/refill Master Wallet', { error: error.message });
      this.isRefilling = false;
    }
  }

  async getWalletBalance(): Promise<number> {
    if (!this.provider || !this.wallet) {
      return 0;
    }
    const balance = await this.provider.getBalance(this.wallet.address);
    return parseFloat(ethers.formatEther(balance));
  }

  async getLedgerBalance(): Promise<number> {
    if (!this.broker) {
      throw new Error('Broker not initialized');
    }

    const ledgerInfo = await this.broker.ledger.getLedger();
    return parseFloat(ethers.formatEther(ledgerInfo.totalBalance));
  }

  getBroker(): any {
    if (!this.broker) {
      throw new Error('Broker not initialized. Call initialize() first.');
    }
    return this.broker;
  }

  getWalletAddress(): string {
    return this.wallet?.address ?? '0x0000000000000000000000000000000000000000';
  }

  async getWalletInfo(): Promise<{
    address: string;
    ethBalance: number;
    ledgerBalance: number;
  }> {
    if (!this.wallet) {
      return {
        address: this.getWalletAddress(),
        ethBalance: 0,
        ledgerBalance: 0
      };
    }

    const [ethBalance, ledgerBalance] = await Promise.all([
      this.getWalletBalance(),
      this.broker ? this.getLedgerBalance() : Promise.resolve(0)
    ]);

    return {
      address: this.wallet.address,
      ethBalance,
      ledgerBalance
    };
  }

  // Monitor incoming transactions to Master Wallet
  async startTransactionMonitor(onTransaction: (from: string, amount: number, txHash: string) => void): Promise<void> {
    if (!this.provider || !this.wallet) {
      log.warn('Transaction monitor skipped (master wallet not configured)');
      return;
    }

    const provider = this.provider;
    const walletAddress = this.wallet.address;

    if (process.env.TEST_ENV === 'true') {
      log.debug('Starting transaction monitor for Master Wallet');
    }

    provider.on('block', async (blockNumber: any) => {
      try {
        const block = await provider.getBlock(blockNumber, true);
        if (!block || !block.transactions) return;

        for (const tx of block.transactions) {
          if (typeof tx === 'string') continue;
          
          // Type guard for transaction object
          const transaction = tx as any;
          
          if (transaction.to?.toLowerCase() === walletAddress.toLowerCase() && transaction.value && transaction.value > 0) {
            const amount = parseFloat(ethers.formatEther(transaction.value));
            const from = transaction.from;
            const txHash = transaction.hash;

            if (process.env.TEST_ENV === 'true') {
              log.info('Incoming transaction detected', {
                amount: `${amount.toFixed(8)} OG`,
                from
              });
            }

            onTransaction(from, amount, txHash);
          }
        }
      } catch (error: any) {
        log.error('Error monitoring transactions', { error: error.message });
      }
    });
  }

  async stopTransactionMonitor(): Promise<void> {
    this.provider?.removeAllListeners('block');

    if (process.env.TEST_ENV === 'true') {
      log.debug('Transaction monitor stopped');
    }
  }

  async cleanup(): Promise<void> {
    await this.stopTransactionMonitor();
    this.isInitialized = false;
    this.broker = null;
  }
}

module.exports = new MasterWalletService(); 