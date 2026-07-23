#!/usr/bin/env node

/**
 * @fileoverview Settings Configuration Module
 * @description Configure environment and preferences
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  green: '\x1b[32m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`)
};

console.log('\n' + '='.repeat(50));
console.log(`${colors.bright}    SETTINGS MODULE${colors.reset}`);
console.log('='.repeat(50));

console.log('\nEnvironment Configuration:');
console.log('-'.repeat(50));

// Check environment variables
const envVars = {
  'ENV_FILE_PATH': process.env.ENV_FILE_PATH || 'Not set',
  'WALLET_PRIVATE_KEY': process.env.WALLET_PRIVATE_KEY ? '[HIDDEN]' : 'Not set',
  'TREASURY_ADDRESS': process.env.TREASURY_ADDRESS || 'Not set',
  'MAINNET_RPC_URL': process.env.MAINNET_RPC_URL || 'Not set',
  'MAINNET_CHAIN_ID': process.env.MAINNET_CHAIN_ID || 'Not set'
};

Object.entries(envVars).forEach(([key, value]) => {
  const status = value === 'Not set' ? colors.yellow : colors.green;
  console.log(`  ${key}: ${status}${value}${colors.reset}`);
});

console.log('\nConfiguration Files:');
console.log('-'.repeat(50));

const configFiles = [
  'hardhat.config.js',
  'deployment-addresses.json',
  'mainnet-deployments.json',
  'compilation-report.json'
];

const projectRoot = path.resolve(__dirname, '../..');

configFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? `${colors.green}[EXISTS]${colors.reset}` : `${colors.yellow}[MISSING]${colors.reset}`;
  console.log(`  ${file}: ${status}`);
});

console.log('\nExternal Environment Path:');
console.log(`  ${colors.cyan}/mnt/c/Users/kubas/Desktop/env/contracts/.env${colors.reset}`);

console.log('\nPress Enter to return to main menu...');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', () => {
  rl.close();
  process.exit(0);
});