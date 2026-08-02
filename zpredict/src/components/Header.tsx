import React, { useState } from "react";
import { 
  Zap, 
  Menu, 
  X, 
  Wallet, 
  User, 
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
    { id: "swap", label: "Swap Pools", icon: Shuffle },
    { id: "bridge", label: "Cross-Bridge", icon: ArrowLeftRight },
    { id: "buysell", label: "Buy & Sell", icon: CreditCard },
    { id: "blogs", label: "Market Insights", icon: BookOpen },
    { id: "chat", label: "AI Copilot", icon: Sparkles },
    { id: "api", label: "DeFi APIs", icon: Terminal },
    { id: "legal", label: "Rules & Policies", icon: FileText },
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
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab("dashboard")}
            id="brand-logo"
          >
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="font-sans font-bold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                zPredict
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                web3 engine
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 border border-slate-800 text-cyan-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action Zone */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Wallet Connect Button */}
            <button
              id="wallet-connect-btn"
              onClick={toggleWallet}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold rounded-lg border transition-all cursor-pointer ${
                connectedWallet
                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/30"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-transparent shadow-lg shadow-cyan-500/10"
              }`}
            >
              <Wallet className="w-4 h-4" />
              {connectedWallet 
                ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}` 
                : "Connect Wallet"
              }
            </button>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-900">
                <button
                  id="tab-profile-trigger"
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "text-cyan-400 border-slate-800 bg-slate-900"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-slate-900/50"
                  }`}
                  title="My Profile"
                >
                  <div className="w-7 h-7 rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 flex items-center justify-center font-bold text-xs uppercase font-sans">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : user.email?.charAt(0) || "U"}
                  </div>
                  <span className="text-xs font-medium max-w-[100px] truncate">
                    {userProfile?.displayName || user.email?.split("@")[0]}
                  </span>
                </button>

                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded-lg border border-transparent hover:border-rose-950 hover:bg-rose-950/10"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile responsive toggle */}
          <div className="flex items-center lg:hidden gap-3">
            {/* Wallet on mobile */}
            <button
              id="wallet-connect-btn-mobile"
              onClick={toggleWallet}
              className={`p-2 rounded-lg border cursor-pointer ${
                connectedWallet
                  ? "bg-emerald-950/30 text-emerald-400 border-emerald-900"
                  : "bg-cyan-500 text-slate-950 border-transparent"
              }`}
            >
              <Wallet className="w-5 h-5" />
            </button>

            <button
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900 border border-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-900 bg-slate-950 py-4 px-4 space-y-3 shadow-2xl transition-all">
          <div className="space-y-1">
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
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-cyan-400 border-l-2 border-cyan-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/40"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-900 space-y-3">
            {user ? (
              <div className="flex items-center justify-between px-3">
                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2.5 text-left text-sm text-slate-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 flex items-center justify-center font-bold">
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
                  className="flex items-center gap-2 text-xs text-rose-400 hover:text-rose-300 transition-colors p-2 rounded-md bg-rose-950/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Connected Wallet Control Modal */}
      {walletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-white mb-2">Synchronized Wallet</h4>
            <p className="text-xs text-slate-400 font-mono break-all mb-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
              {connectedWallet}
            </p>
            <div className="space-y-3">
              <button
                id="wallet-disconnect-act"
                onClick={handleDisconnect}
                className="w-full py-2 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-900/60 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer"
              >
                Disconnect Connection
              </button>
              <button
                id="wallet-disconnect-close"
                onClick={() => setWalletModalOpen(false)}
                className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold font-mono cursor-pointer"
              >
                Keep Connection Active
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
