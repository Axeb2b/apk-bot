import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { tokensList } from '../data';

export default function MarketTicker() {
  const items = [...tokensList.slice(0, 10), ...tokensList.slice(0, 10)];

  return (
    <div className="relative z-40 glass-ticker overflow-hidden py-2">
      <div className="flex animate-[ticker_25s_linear_infinite] hover:[animation-play-state:paused] w-max gap-0">
        {items.map((token, i) => {
          const up = token.change24h >= 0;
          return (
            <div key={`${token.symbol}-${i}`} className="flex items-center gap-2 px-6 border-r border-white/5">
              <span className="font-display font-bold text-zinc-300 text-xs">{token.symbol}</span>
              <span className="font-mono text-xs text-zinc-400">
                ${token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className={`flex items-center gap-0.5 text-[11px] font-mono ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {up ? '+' : ''}{token.change24h.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
    </div>
  );
}
