import React from 'react';
import {
  ArrowRight, Shuffle, ArrowLeftRight, Percent, CreditCard,
  TrendingUp, TrendingDown, Wallet, Zap, BarChart3
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { tokensList } from '../data';

interface HomeDashboardProps {
  setActiveTab: (tab: string) => void;
  connectedWallet: string | null;
  onConnectWallet: () => void;
}

const chartData = [
  { v: 28400 }, { v: 29100 }, { v: 28700 }, { v: 30200 },
  { v: 29800 }, { v: 31500 }, { v: 32100 }, { v: 31800 },
  { v: 33400 }, { v: 34200 },
];

const actions = [
  { id: 'swap', label: 'Swap', desc: 'Best rates, instant', icon: Shuffle, cls: 'bento-swap', tab: 'swap' },
  { id: 'bridge', label: 'Bridge', desc: 'Cross-chain transfer', icon: ArrowLeftRight, cls: 'bento-bridge', tab: 'bridge' },
  { id: 'staking', label: 'Stake', desc: 'Earn ZPRED rewards', icon: Percent, cls: 'bento-stake', tab: 'staking' },
  { id: 'buysell', label: 'Buy / Sell', desc: 'Fiat on-ramp', icon: CreditCard, cls: 'bento-buy', tab: 'buysell' },
];

export default function HomeDashboard({ setActiveTab, connectedWallet, onConnectWallet }: HomeDashboardProps) {
  const topTokens = tokensList.slice(0, 8);

  return (
    <div className="space-y-8 fade-in" id="home-dashboard">

      {/* HERO */}
      <section className="relative rounded-3xl overflow-hidden shimmer-border">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-600/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />

        <div className="relative glass-card rounded-3xl p-8 sm:p-12 border-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-5 max-w-xl">
              <div className="stat-badge">
                <span className="pulse-dot" />
                Live · 12 Chains
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.05] tracking-tight">
                <span className="text-gradient-hero">Trade Smarter</span>
                <br />
                <span className="text-zinc-300 text-3xl sm:text-4xl font-bold">on Every Chain</span>
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed">
                Swap, bridge, stake and track — one terminal for all your crypto.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setActiveTab('swap')} className="btn-primary">
                  Start Trading <ArrowRight className="w-4 h-4" />
                </button>
                {!connectedWallet ? (
                  <button onClick={onConnectWallet} className="btn-secondary">
                    <Wallet className="w-4 h-4" /> Connect Wallet
                  </button>
                ) : (
                  <button onClick={() => setActiveTab('profile')} className="btn-secondary">
                    <Wallet className="w-4 h-4" /> {connectedWallet.slice(0,6)}…{connectedWallet.slice(-4)}
                  </button>
                )}
              </div>
            </div>

            {/* Mini chart card */}
            <div className="glass-inner rounded-2xl p-5 w-full lg:w-80 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Portfolio</span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12.4%
                </span>
              </div>
              <p className="text-3xl font-display font-bold text-white mb-1">$34,218</p>
              <p className="text-xs text-zinc-500 mb-4">Est. total value</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#00f0ff" strokeWidth={2} fill="url(#heroGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENTO ACTIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map(({ id, label, desc, icon: Icon, cls, tab }) => (
          <button
            key={id}
            onClick={() => setActiveTab(tab)}
            className={`bento-card ${cls} text-left`}
          >
            <div className="w-10 h-10 rounded-xl glass-inner flex items-center justify-center mb-4"
              style={{ color: 'var(--accent)' }}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-display font-bold text-white text-lg">{label}</p>
            <p className="text-xs text-zinc-500 mt-1">{desc}</p>
            <ArrowRight className="w-4 h-4 mt-3 text-zinc-600" />
          </button>
        ))}
      </div>

      {/* MARKET TABLE */}
      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display font-bold text-white">Markets</h2>
          </div>
          <button onClick={() => setActiveTab('swap')} className="text-xs text-cyan-400 hover:text-cyan-300 font-mono">
            Trade →
          </button>
        </div>

        <div className="px-4 py-2">
          <div className="token-row text-[10px] font-mono text-zinc-600 uppercase tracking-wider px-1">
            <span>Asset</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h</span>
            <span className="text-right hide-mobile">Action</span>
          </div>

          {topTokens.map((token) => {
            const up = token.change24h >= 0;
            return (
              <div
                key={token.symbol}
                className="token-row"
                onClick={() => setActiveTab('swap')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full glass-inner flex items-center justify-center text-xs font-bold font-mono text-cyan-400">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{token.symbol}</p>
                    <p className="text-[11px] text-zinc-500">{token.name}</p>
                  </div>
                </div>
                <span className="text-right font-mono text-sm text-zinc-200">
                  ${token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: token.priceUsd < 1 ? 4 : 2 })}
                </span>
                <span className={`text-right font-mono text-sm flex items-center justify-end gap-0.5 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {up ? '+' : ''}{token.change24h.toFixed(2)}%
                </span>
                <span className="text-right hide-mobile">
                  <span className="text-xs text-cyan-400 font-mono hover:underline">Swap</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '24h Volume', value: '$2.4B', icon: Zap },
          { label: 'Total Users', value: '148K+', icon: Wallet },
          { label: 'Chains', value: '12', icon: ArrowLeftRight },
          { label: 'Avg Swap', value: '< 3s', icon: Shuffle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-card rounded-2xl p-5 text-center glass-card-hover">
            <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-2 opacity-70" />
            <p className="text-2xl font-display font-bold text-white">{value}</p>
            <p className="text-[11px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
