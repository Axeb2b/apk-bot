import React, { useState } from 'react';
import { useConnect, type Connector } from 'wagmi';
import { X, ChevronRight, Info, Loader2 } from 'lucide-react';
import { hasWalletConnect } from '../web3/config';

interface WalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  match: (connector: Connector) => boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    match: (c) => c.id === 'metaMask' || c.name.toLowerCase().includes('metamask'),
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
    match: (c) => c.id.includes('trust') || c.name.toLowerCase().includes('trust'),
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: 'https://avatars.githubusercontent.com/u/18060234?s=200&v=4',
    match: (c) => c.id === 'coinbaseWalletSDK' || c.name.toLowerCase().includes('coinbase'),
  },
  {
    id: 'walletconnect',
    name: 'Other Wallets',
    icon: 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
    match: (c) => c.id === 'walletConnect' || c.type === 'walletConnect',
  },
];

function findConnector(connectors: readonly Connector[], option: WalletOption): Connector | undefined {
  return connectors.find(option.match);
}

const WalletConnectModal = ({ isOpen, onClose }: WalletConnectProps) => {
  const { connect, connectors, isPending, error } = useConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (option: WalletOption) => {
    const connector = findConnector(connectors, option);

    if (!connector) {
      window.open(
        option.id === 'metamask'
          ? 'https://metamask.io/download/'
          : option.id === 'trust'
            ? 'https://trustwallet.com/download'
            : option.id === 'coinbase'
              ? 'https://www.coinbase.com/wallet/downloads'
              : 'https://trustwallet.com/download',
        '_blank'
      );
      return;
    }

    setConnectingId(option.id);
    try {
      connect({ connector });
      onClose();
    } catch {
      // wagmi surfaces errors via `error`
    } finally {
      setConnectingId(null);
    }
  };

  const visibleOptions = WALLET_OPTIONS.filter((opt) => {
    if (opt.id === 'walletconnect') return hasWalletConnect;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full sm:max-w-[400px] glass-card sm:rounded-2xl rounded-t-2xl shimmer-border shadow-2xl animate-scale-up overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-700/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-display font-bold text-white">Connect your wallet</h2>
              <p className="text-[13px] text-slate-400 mt-1.5 leading-snug">
                Select an option below to connect wallet. We never ask for your private key.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="mx-5 mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-300/80 leading-relaxed">
            Our dapp uses a non-custodial wallet and requires connection with your wallet extension or mobile app.
          </p>
        </div>

        {/* Wallet list */}
        <div className="mt-2 divide-y divide-slate-700/30">
          {visibleOptions.map((option) => {
            const isConnecting = connectingId === option.id && isPending;

            return (
              <button
                key={option.id}
                onClick={() => handleConnect(option)}
                disabled={isConnecting}
                className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-800 flex items-center justify-center">
                  <img
                    src={option.icon}
                    alt={option.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <p className="text-[15px] font-semibold text-white">{option.name}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">Connect with your wallet</p>
                </div>

                {isConnecting ? (
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mx-5 mt-3 text-xs text-rose-400 text-center">{error.message}</p>
        )}

        {/* Disclaimer */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-[11px] text-rose-400/90 text-center leading-relaxed font-medium">
            ONLY CONNECT WALLET THATS 18+ &amp; HAVE MIN ASSET VALUE 1+ OF ETH
          </p>
        </div>

        {/* Footer help */}
        <div className="px-5 pb-6 pt-2 text-center">
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Don&apos;t see a wallet on the list?{' '}
            <span className="text-slate-400">If you&apos;re on a phone, use your app&apos;s browser.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;
