import { createConfig, http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, bsc } from 'wagmi/chains';
import { injected, metaMask, coinbaseWallet, walletConnect } from 'wagmi/connectors';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const connectors = [
  metaMask({
    dappMetadata: {
      name: 'zPredict',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://zpredict.io',
    },
  }),
  injected({ target: 'trustWallet' }),
  coinbaseWallet({
    appName: 'zPredict',
    appLogoUrl: 'https://avatars.githubusercontent.com/u/37784886',
  }),
];

if (walletConnectProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
      metadata: {
        name: 'zPredict',
        description: 'Professional Multi-Chain Web3 Engine',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://zpredict.io',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
      },
    })
  );
}

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, bsc],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
  },
});

export const hasWalletConnect = Boolean(walletConnectProjectId);
