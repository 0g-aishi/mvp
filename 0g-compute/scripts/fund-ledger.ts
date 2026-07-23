#!/usr/bin/env ts-node

/**
 * @fileoverview Manual Ledger Funding Script for Master Wallet
 * @description Allows manual deposit to Master Wallet ledger with any amount
 * @usage npm run fund-ledger:wsl
 */

const ethers = require('ethers');
const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker');
require('../src/config/envLoader');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function main() {
  console.log('\n🔑 Master Wallet Ledger Funding Tool (SDK 0.4.4)');
  console.log('=================================================\n');

  // Load from env
  const privateKey = process.env.MASTER_WALLET_KEY;
  const rpcUrl = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';

  if (!privateKey) {
    console.error('❌ MASTER_WALLET_KEY not found in .env');
    console.error('   Make sure ENV_FILE_PATH is set correctly');
    process.exit(1);
  }

  // Initialize wallet and broker
  console.log('🔄 Connecting to 0G Network...');
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`\nMaster Wallet Address: ${wallet.address}`);

  // Get current balances
  const ethBalance = await provider.getBalance(wallet.address);
  const ethBalanceOG = parseFloat(ethers.formatEther(ethBalance));

  console.log(`\n💰 Current Balances:`);
  console.log(`   ETH Balance: ${ethBalanceOG.toFixed(8)} OG`);

  // Initialize broker
  console.log('\n🔄 Initializing 0G Compute broker...');
  const broker = await createZGComputeNetworkBroker(wallet);

  // Get ledger balance
  let ledgerBalance = 0;
  let ledgerExists = true;

  try {
    const ledgerInfo = await broker.ledger.getLedger();
    ledgerBalance = parseFloat(ethers.formatEther(ledgerInfo.totalBalance));
    console.log(`   Ledger Balance: ${ledgerBalance.toFixed(8)} OG`);
  } catch (error: any) {
    if (error.message.includes('Account does not exist') || error.message.includes('LedgerNotExists')) {
      console.log('   Ledger Balance: Not created yet');
      ledgerExists = false;
    } else {
      throw error;
    }
  }

  // Show recommendations
  console.log(`\n📋 SDK 0.4.4 Balance Recommendations:`);
  console.log(`   Testing (1 provider): 1.5-2 OG`);
  console.log(`   Development (2-4 providers): 5-10 OG`);
  console.log(`   Production (all providers): 15-20 OG`);

  if (!ledgerExists) {
    console.log(`\n⚠️  Ledger doesn't exist yet - it will be created on first deposit`);
  }

  // Ask for amount
  const amountStr = await question('\n💵 Enter amount to deposit (OG): ');
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    console.error('❌ Invalid amount');
    rl.close();
    process.exit(1);
  }

  if (amount > ethBalanceOG) {
    console.error(`\n❌ Insufficient ETH balance!`);
    console.error(`   You have: ${ethBalanceOG.toFixed(8)} OG`);
    console.error(`   You need: ${amount} OG`);
    console.error(`   Send OG to Master Wallet first: ${wallet.address}`);
    rl.close();
    process.exit(1);
  }

  // Confirm
  const newLedgerBalance = ledgerBalance + amount;
  console.log(`\n📊 Transaction Preview:`);
  console.log(`   From: ETH Balance (${ethBalanceOG.toFixed(8)} OG)`);
  console.log(`   To: Ledger Balance (${ledgerBalance.toFixed(8)} → ${newLedgerBalance.toFixed(8)} OG)`);
  console.log(`   Amount: ${amount} OG`);
  console.log(`   Gas: ~0.001 OG (estimated)`);

  const confirm = await question(`\n⚠️  Confirm deposit? (yes/no): `);

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    process.exit(0);
  }

  // Execute deposit
  console.log(`\n🔄 Depositing ${amount} OG to ledger...`);
  console.log('   (This sends a blockchain transaction, please wait...)\n');

  try {
    if (!ledgerExists) {
      // First time - create ledger with initial deposit
      console.log('🆕 Creating ledger with initial deposit...');
      await broker.ledger.addLedger(amount);
      console.log('✅ Ledger created!');
    } else {
      // Existing ledger - just deposit
      await broker.ledger.depositFund(amount);
      console.log('✅ Deposit confirmed!');
    }

    // Get new balance
    const newLedgerInfo = await broker.ledger.getLedger();
    const finalBalance = parseFloat(ethers.formatEther(newLedgerInfo.totalBalance));

    console.log(`\n📊 Updated Balances:`);
    console.log(`   Ledger Balance: ${finalBalance.toFixed(8)} OG`);
    console.log(`   Deposited: +${amount} OG`);

    if (finalBalance >= 1.0 && finalBalance < 5.0) {
      console.log(`\n✅ Sufficient for testing 1 provider (phala/gpt-oss-120b)`);
    } else if (finalBalance >= 5.0) {
      console.log(`\n✅ Sufficient for multiple providers!`);
    } else {
      console.log(`\n⚠️  Still below minimum (1.0 OG) for cheapest provider`);
    }

  } catch (error: any) {
    console.error('\n❌ Deposit failed:', error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
  console.log('\n✅ Done!\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  if (process.env.TEST_ENV === 'true') {
    console.error(error.stack);
  }
  process.exit(1);
});
