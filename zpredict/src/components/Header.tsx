import React, { useState } from "react";
import {
  Zap, Menu, X, Wallet, BookOpen, Terminal, LogOut,
  Activity, ArrowLeftRight, Shuffle, CreditCard, Sparkles, Percent
} from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  connectedWallet: string | null;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  user: any;
  userProfile: any;
  onLogout: () => void;
}

const NAV = [
  { id: "dashboard", label: "Home", icon: Activity },
  { id: "swap", label: "Swap", icon: Shuffle },
  { id: "bridge", label: "Bridge", icon: ArrowLeftRight },
  { id: "buysell", label: "Buy", icon: CreditCard },
  { id: "staking", label: "Stake", icon: Percent },
  { id: "chat", label: "AI", icon: Sparkles },
  { id: "blogs", label: "News", icon: BookOpen },
  { id: "api", label: "API", icon: Terminal },
];

export default function Header({
  activeTab, setActiveTab, connectedWallet,
  onConnectWallet, onDisconnectWallet, user, userProfile, onLogout
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
            id="brand-logo"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <Zap className="w-4 h-4 text-black fill-black" />
            </div>
            <span className="font-display font-extrabold text-lg text-gradient-brand hidden sm:block">zPredict</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 glass-tabs">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`nav-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-display transition-all cursor-pointer ${
                  activeTab === id ? "glass-tab-active" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="wallet-connect-btn"
              onClick={() => connectedWallet ? setWalletOpen(true) : onConnectWallet()}
              className={connectedWallet
                ? "flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-xl glass-inner text-emerald-400 cursor-pointer"
                : "btn-primary !py-2 !px-4 !text-xs"
              }
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {connectedWallet ? `${connectedWallet.slice(0,6)}…${connectedWallet.slice(-4)}` : "Connect"}
              </span>
            </button>

            {user && (
              <button
                id="navbar-logout-btn"
                onClick={onLogout}
                className="p-2 text-zinc-600 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 cursor-pointer hidden sm:block"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            <button
              id="mobile-nav-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 glass-inner rounded-xl text-zinc-400 cursor-pointer"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 grid grid-cols-4 gap-1.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setMenuOpen(false); }}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold cursor-pointer ${
                activeTab === id ? "glass-tab-active" : "text-zinc-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Wallet modal */}
      {walletOpen && connectedWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm shimmer-border animate-scale-up">
            <h4 className="font-display font-bold text-white mb-1">Connected</h4>
            <p className="text-xs font-mono text-zinc-400 break-all glass-inner p-3 rounded-xl mb-4">{connectedWallet}</p>
            <div className="flex gap-2">
              <button onClick={() => { onDisconnectWallet(); setWalletOpen(false); }}
                className="flex-1 py-2.5 text-xs text-rose-400 glass-inner rounded-xl cursor-pointer hover:bg-rose-500/10">
                Disconnect
              </button>
              <button onClick={() => setWalletOpen(false)}
                className="flex-1 py-2.5 text-xs btn-secondary !py-2.5 !justify-center">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
