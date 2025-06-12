'use client'

import { getDefaultConfig } from '@tomo-inc/tomo-evm-kit';
import { storyAeneid } from 'wagmi/chains';
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@tomo-inc/tomo-evm-kit/wallets';

const client_id = process.env.NEXT_PUBLIC_TOMO_CLIENT_ID

const config = getDefaultConfig({
  clientId: client_id,
  appName: 'Astra IP',
  projectId: '1f59e0d95ce8e20bc084b9d619e08044',
  chains: [storyAeneid],
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
