'use client';

import { getDefaultConfig, WalletList } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { getSupportedChains } from './chains';

const wallets: WalletList = [
  {
    groupName: 'Recommended',
    wallets: [injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
  },
];

export const wagmiConfig = getDefaultConfig({
  appName: 'Aishi – Your inner AI companion',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '34121ad34d9bc22e1afc6f45f72b3fdd',
  chains: getSupportedChains() as any,
  wallets,
  ssr: false,
});

export default wagmiConfig;
