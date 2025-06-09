'use client'

import { getDefaultConfig } from '@tomo-inc/tomo-evm-kit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@tomo-inc/tomo-evm-kit/wallets';

const config = getDefaultConfig({
  clientId: 'your-client-id-here', // Replace with your actual clientId from https://dashboard.tomo.inc/
  appName: 'Astra IP',
  projectId: 'your-project-id-here', // Replace with your WalletConnect project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
});

export default config;
