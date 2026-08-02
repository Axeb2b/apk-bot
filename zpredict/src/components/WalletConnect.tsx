import React, { useState } from 'react';
import { useConnect, type Connector } from 'wagmi';
import { X, Wallet, ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { hasWalletConnect } from '../web3/config';

interface WalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMock?: (address: string) => void;
}

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  badge?: string;
  match: (connector: Connector) => boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Browser extension wallet',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    iconBg: '#f6851b20',
    match: (c) => c.id === 'metaMask' || c.name.toLowerCase().includes('metamask'),
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    description: 'Mobile & extension wallet',
    icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
    iconBg: '#ffffff15',
    match: (c) => c.id.includes('trust') || c.name.toLowerCase().includes('trust'),
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Secure exchange wallet',
    icon: 'https://avatars.githubusercontent.com/u/18060234?s=200&v=4',
    iconBg: '#0052ff20',
    match: (c) => c.id === 'coinbaseWalletSDK' || c.name.toLowerCase().includes('coinbase'),
  },
  {
    id: 'walletconnect',
    name: 'Other Wallets',
    description: 'Scan QR to connect',
    icon: 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
    iconBg: '#22d3ee15',
    badge: '350+',
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
      if (option.id === 'walletconnect') {
        return;
      }
      window.open(
        option.id === 'metamask'
          ? 'https://metamask.io/download/'
          : option.id === 'trust'
            ? 'https://trustwallet.com/download'
            : 'https://www.coinbase.com/wallet/downloads',
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="glass-card rounded-3xl max-w-md w-full relative z-10 shimmer-border animate-scale-up overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-cyan-400" />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Connect your wallet</h2>
              <p className="text-sm text-slate-400 mt-1">
                Select a wallet below to connect securely. We never ask for your seed phrase.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your keys stay in your wallet. zPredict only requests connection permission — never your recovery phrase.
            </p>
          </div>

          {/* Wallet options */}
          <div className="space-y-2.5">
            {visibleOptions.map((option) => {
              const connector = findConnector(connectors, option);
              const isConnecting = connectingId === option.id && isPending;
              const isUnavailable = option.id === 'walletconnect' && !connector;

              return (
                <button
                  key={option.id}
                  onClick={() => handleConnect(option)}
                  disabled={isConnecting || isUnavailable}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/60 hover:border-cyan-500/30 hover:bg-slate-900/80 transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-700/40"
                    style={{ background: option.iconBg }}
                  >
                    <img
                      src={option.icon}
                      alt={option.name}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {option.name}
                      </span>
                      {option.badge && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300 border border-slate-600/40">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">{option.description}</span>
                  </div>

                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <Wallet className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {!hasWalletConnect && (
            <p className="text-[10px] text-amber-400/80 font-mono text-center px-2">
              Add VITE_WALLETCONNECT_PROJECT_ID to enable 350+ mobile wallets via QR scan.
            </p>
          )}

          {error && (
            <p className="text-xs text-rose-400 font-mono text-center bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
              {error.message}
            </p>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-slate-800/50 text-center space-y-2">
            <a
              href="https://trustwallet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Haven&apos;t got a wallet? Get started
              <ExternalLink className="w-3 h-3" />
            </a>
            <p className="text-[9px] font-mono text-slate-600 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secured via WalletConnect &amp; Wagmi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;
