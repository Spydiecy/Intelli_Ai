'use client'

import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TomoEVMKitProvider } from '@tomo-inc/tomo-evm-kit';
import { getDefaultConfig } from '@tomo-inc/tomo-evm-kit';
import { story, storyAeneid } from 'wagmi/chains';
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@tomo-inc/tomo-evm-kit/wallets';
import '@tomo-inc/tomo-evm-kit/styles.css';

const client_id = process.env.NEXT_PUBLIC_TOMO_CLIENT_ID

const config = getDefaultConfig({
  clientId: client_id, // Replace with your actual clientId from https://dashboard.tomo.inc/
  appName: 'Astra IP',
  projectId: '1f59e0d95ce8e20bc084b9d619e08044',
  chains: [story, storyAeneid],
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

const queryClient = new QueryClient();

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }:any) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TomoEVMKitProvider>
          {children}
        </TomoEVMKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
