import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { tokensList } from '../data';

export default function MarketTicker() {
  const items = tokensList.slice(0, 8);

  const doubled = [...items, ...items];

  return (
    <div className="relative z-40 glass-ticker overflow-hidden">
      <div className="flex animate-[ticker_30s_linear_infinite] hover:[animation-play-state:paused] w-max">
        {doubled.map((token, i) => {
          const isUp = token.change24h >= 0;
          return (
            <div key={`${token.symbol}-${i}`} className="ticker-item px-6 py-2.5 border-r border-slate-800/30">
              <span className="font-display font-semibold text-slate-300">{token.symbol}</span>
              <span className="text-slate-400">
                ${token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`flex items-center gap-0.5 text-[11px] font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isUp ? '+' : ''}{token.change24h.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
