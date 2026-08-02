import React, { useState } from 'react';
import { useConnect } from 'wagmi';
import { X, Wallet, ShieldCheck, Cpu, ChevronRight, Info, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectMock: (address: string) => void;
}

const WalletConnect = ({ isOpen, onClose, onConnectMock }: WalletConnectProps) => {
  const { connect, connectors, error: wagmiError } = useConnect();
  const [activeTab, setActiveTab] = useState<'web3' | 'sandbox'>('web3');
  const [customAddress, setCustomAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectMockAddress = (addr: string) => {
    if (!addr.startsWith('0x') && addr.length < 32) {
      setValidationError("Please enter a valid EVM address (starting with 0x) or Solana public key.");
      return;
    }
    setValidationError(null);
    onConnectMock(addr);
    onClose();
  };

  const presetAddresses = [
    { name: "Alpha Whale", addr: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", desc: "Heavy DeFi & Staking exposure" },
    { name: "Beta Arbitrageur", addr: "0x2810595461626464616568656165626264626162", desc: "High frequency swap ledger history" },
    { name: "Solana Node", addr: "8x5V69bFmQ9vN5Ym7v1n9M6c6bVbVbVbVbVbVbVb", desc: "Cross-chain liquidity bridge tester" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop overlay */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Connection Card dialog */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 overflow-hidden z-10 animate-scale-up">
        {/* Sleek aesthetic top banner accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-600 to-cyan-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/40 text-cyan-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">Connect Web3 Credentials</h3>
              <p className="text-[10px] text-slate-500 font-mono">zPredict Zero-Trust Ledger Link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800/45 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('web3'); setValidationError(null); }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'web3'
                ? "bg-slate-900 text-cyan-400 border border-slate-800/50 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Web3 Extensions
          </button>
          <button
            onClick={() => { setActiveTab('sandbox'); setValidationError(null); }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sandbox'
                ? "bg-slate-900 text-cyan-400 border border-slate-800/50 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Sandbox Simulator
          </button>
        </div>

        {/* Modal body based on selected tab */}
        <div className="space-y-4">
          {activeTab === 'web3' ? (
            <div className="space-y-3">
              <div className="p-3 bg-cyan-950/15 border border-cyan-900/30 rounded-xl flex gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Connect using standard decentralized provider extensions. Credentials remain 100% self-custodial on your browser.
                </p>
              </div>

              {/* List of real Wagmi connectors */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {connectors && connectors.length > 0 ? (
                  connectors.map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => {
                        connect({ connector });
                        onClose();
                      }}
                      className="w-full p-3 bg-slate-950/45 hover:bg-slate-950 border border-slate-800/60 hover:border-cyan-500/40 rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono uppercase">
                          {connector.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors font-sans">{connector.name}</span>
                          <span className="block text-[8px] font-mono text-slate-500 capitalize">{connector.type} Connection Mode</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))
                ) : (
                  <div className="py-4 text-center text-slate-500 text-xs font-sans space-y-2">
                    <p>No browser wallet extensions detected.</p>
                    <button
                      onClick={() => setActiveTab('sandbox')}
                      className="text-cyan-400 hover:underline font-mono text-[10px] block mx-auto cursor-pointer"
                    >
                      Use Sandbox simulator instead →
                    </button>
                  </div>
                )}
              </div>

              {wagmiError && (
                <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-xl flex gap-1.5 items-center">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-450 shrink-0" />
                  <span className="text-[9px] font-mono text-rose-400">{wagmiError.message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-1.5">
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Sandbox Environment</span>
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                  Simulate a high-value Web3 whale wallet instantly to unlock real-time allocation graphs, balance tables, alerts, and staking nodes.
                </p>
              </div>

              {/* Custom address input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Or enter any EVM address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => { setCustomAddress(e.target.value); setValidationError(null); }}
                    placeholder="0x71C7656EC7ab8...f6D8"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 rounded-xl text-xs font-mono outline-hidden"
                  />
                  <button
                    onClick={() => handleConnectMockAddress(customAddress)}
                    className="px-4 py-2 bg-cyan-950/50 hover:bg-cyan-900 text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    Simulate
                  </button>
                </div>
                {validationError && (
                  <p className="text-[9px] font-mono text-rose-400">{validationError}</p>
                )}
              </div>

              {/* Preset buttons */}
              <div className="space-y-2 pt-1">
                <span className="block text-[10px] font-mono text-slate-500 uppercase">Interactive presets</span>
                <div className="grid grid-cols-1 gap-2">
                  {presetAddresses.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => handleConnectMockAddress(p.addr)}
                      className="p-2.5 bg-slate-950/45 hover:bg-slate-950 border border-slate-850 hover:border-cyan-500/30 rounded-xl text-left flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="block text-xs font-bold text-white group-hover:text-cyan-400 transition-colors font-sans">{p.name}</span>
                          <span className="text-[8px] font-mono bg-slate-900 text-slate-500 px-1 py-0.5 rounded-sm">Active</span>
                        </div>
                        <span className="block text-[9px] text-slate-500 font-mono truncate max-w-[280px] mt-0.5">{p.addr}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info text */}
        <div className="border-t border-slate-800/40 pt-3 text-center">
          <p className="text-[9px] font-mono text-slate-500 flex items-center justify-center gap-1 select-none">
            🔒 Secured with AES-256 standard protocols
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnect;
