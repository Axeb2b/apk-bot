import React, { useState } from "react";
import { 
  Zap, 
  Menu, 
  X, 
  Wallet, 
  BookOpen, 
  Terminal, 
  FileText, 
  LogOut, 
  Activity, 
  ArrowLeftRight, 
  Shuffle, 
  CreditCard,
  Sparkles
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

export default function Header({
  activeTab,
  setActiveTab,
  connectedWallet,
  onConnectWallet,
  onDisconnectWallet,
  user,
  userProfile,
  onLogout
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "swap", label: "Swap", icon: Shuffle },
    { id: "bridge", label: "Bridge", icon: ArrowLeftRight },
    { id: "buysell", label: "Buy/Sell", icon: CreditCard },
    { id: "blogs", label: "Insights", icon: BookOpen },
    { id: "chat", label: "AI", icon: Sparkles },
    { id: "api", label: "API", icon: Terminal },
    { id: "legal", label: "Legal", icon: FileText },
  ];

  const toggleWallet = () => {
    if (connectedWallet) {
      setWalletModalOpen(true);
    } else {
      onConnectWallet();
    }
  };

  const handleDisconnect = () => {
    onDisconnectWallet();
    setWalletModalOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab("dashboard")}
            id="brand-logo"
          >
            <div className="relative p-2.5 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 opacity-90" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <Zap className="relative w-5 h-5 text-slate-950 fill-current" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight text-gradient-brand">
                zPredict
              </span>
              <span className="block text-[9px] font-mono tracking-[0.2em] text-slate-500 uppercase">
                web3 engine
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-2xl glass-card/50">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer font-display ${
                    isActive
                      ? "nav-pill-active"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Zone */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              id="wallet-connect-btn"
              onClick={toggleWallet}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${
                connectedWallet
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/15"
                  : "btn-primary !py-2.5 !px-4 !text-xs"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              {connectedWallet 
                ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}` 
                : "Connect Wallet"
              }
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-800/60">
                <button
                  id="tab-profile-trigger"
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "nav-pill-active"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50"
                  }`}
                  title="My Profile"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 flex items-center justify-center font-bold text-xs uppercase font-display">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : user.email?.charAt(0) || "U"}
                  </div>
                  <span className="text-xs font-medium max-w-[90px] truncate">
                    {userProfile?.displayName || user.email?.split("@")[0]}
                  </span>
                </button>

                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded-xl hover:bg-rose-500/10"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile responsive toggle */}
          <div className="flex items-center lg:hidden gap-2">
            <button
              id="wallet-connect-btn-mobile"
              onClick={toggleWallet}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                connectedWallet
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                  : "btn-primary !p-2.5"
              }`}
            >
              <Wallet className="w-4 h-4" />
            </button>

            <button
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900/60 border border-slate-800/60 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl py-4 px-4 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-mobile-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer font-display ${
                    isActive
                      ? "nav-pill-active"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {user ? (
            <div className="pt-3 border-t border-slate-800/50 flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 text-left text-sm text-slate-300"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 flex items-center justify-center font-bold font-display">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0) : user.email?.charAt(0) || "U"}
                </div>
                <div className="leading-tight">
                  <p className="font-semibold text-xs text-white max-w-[120px] truncate">
                    {userProfile?.displayName || user.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</p>
                </div>
              </button>

              <button
                id="navbar-logout-btn-mobile"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-xs text-rose-400 p-2 rounded-xl bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Connected Wallet Control Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden glass-card rounded-2xl p-6 shimmer-border">
            <h4 className="text-lg font-display font-bold text-white mb-2">Connected Wallet</h4>
            <p className="text-xs text-slate-400 font-mono break-all mb-5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/50">
              {connectedWallet}
            </p>
            <div className="space-y-2.5">
              <button
                id="wallet-disconnect-act"
                onClick={handleDisconnect}
                className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-xl text-xs font-semibold font-mono transition-colors cursor-pointer"
              >
                Disconnect
              </button>
              <button
                id="wallet-disconnect-close"
                onClick={() => setWalletModalOpen(false)}
                className="w-full py-2.5 px-4 btn-secondary !justify-center !text-xs"
              >
                Keep Connected
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
