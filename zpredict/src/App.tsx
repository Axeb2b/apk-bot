import React, { useState, useEffect } from "react";
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";

// Core components
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import SwapCard from "./components/SwapCard";
import BridgeCard from "./components/BridgeCard";
import BuySellCard from "./components/BuySellCard";
import BlogsList from "./components/BlogsList";
import ApiDocs from "./components/ApiDocs";
import LegalViews from "./components/LegalViews";
import ProfileView from "./components/ProfileView";
import TransactionHistory from "./components/TransactionHistory";
import EcosystemInfoHub from "./components/EcosystemInfoHub";
import StakingDashboard from "./components/StakingDashboard";
import WalletConnect from "./components/WalletConnect";
import GeminiChatbot from "./components/GeminiChatbot";

// Lucide icon helper
import { 
  LucideIcon, 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  Wallet,
  Shield,
  Activity,
  CheckCircle2,
  ExternalLink,
  Github,
  Twitter,
  MessageSquare,
  Send,
  Lock
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Wallet connect animation modes
  const [connectingWalletAnim, setConnectingWalletAnim] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [syncTrigger, setSyncTrigger] = useState<number>(0);
  const [selectedSwapFrom, setSelectedSwapFrom] = useState<string>("ETH");
  const [initialBridgeParams, setInitialBridgeParams] = useState<{
    fromChain?: string;
    toChain?: string;
    token?: string;
    amount?: string;
  } | null>(null);

  // Parse deep link parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab");
    const fromChain = searchParams.get("fromChain");
    const toChain = searchParams.get("toChain");
    const token = searchParams.get("token");
    const amount = searchParams.get("amount");

    if (tab) {
      setActiveTab(tab);
    }
    if (fromChain || toChain || token || amount) {
      setInitialBridgeParams({
        fromChain: fromChain || undefined,
        toChain: toChain || undefined,
        token: token || undefined,
        amount: amount || undefined,
      });
    }
  }, []);

  // Track Firebase Authentication session state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true);
      if (currentUser) {
        setUser(currentUser);
        await fetchUserProfile(currentUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
        try {
          await signInAnonymously(auth);
        } catch (signInErr) {
          console.error("Auto anonymous sign-in failed:", signInErr);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [connectedWallet]);

  const fetchUserProfile = async (uid: string) => {
    const docPath = `users/${uid}`;
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);
        if (data.walletAddress) {
          setConnectedWallet(data.walletAddress);
        }
      } else {
        // Automatically create a default profile for the user to comply with firestore.rules
        const defaultProfile = {
          userId: uid,
          email: `${uid}@zpredict.sandbox`,
          displayName: `Guest_${uid.slice(0, 6)}`,
          walletAddress: connectedWallet || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, "users", uid), defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setConnectedWallet(null);
      setUser(null);
      setUserProfile(null);
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Sign out session malfunctioned:", err);
    }
  };

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      setConnectedWallet(address);
      localStorage.removeItem("zpredict_sandbox_wallet");
    } else {
      const savedMock = localStorage.getItem("zpredict_sandbox_wallet");
      if (savedMock) {
        setConnectedWallet(savedMock);
      } else {
        setConnectedWallet(null);
      }
    }
  }, [isConnected, address]);

  // Expose global connect function for any button: onclick="connectWallet()"
  useEffect(() => {
    (window as any).connectWallet = () => setShowConnectModal(true);
    return () => {
      delete (window as any).connectWallet;
    };
  }, []);

  const handleWalletConnect = () => {
    setShowConnectModal(true);
  };

  const handleDisconnectWallet = () => {
    disconnect();
    setConnectedWallet(null);
  };

  const handleTransactionCompleted = () => {
    // Increment local synchronization value to trigger FirestoreSnapshot observer refreshes
    setSyncTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300 relative">
      
      {/* Ambient background */}
      <div className="app-bg" aria-hidden="true" />

      {/* Top sticky navbar navigation */}
      <div className="relative z-50">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectedWallet={connectedWallet}
        onConnectWallet={handleWalletConnect}
        onDisconnectWallet={handleDisconnectWallet}
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      </div>

      {/* Main app container routing */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {authLoading ? (
          <div className="py-24 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-sm font-mono text-slate-500">Decrypting user credentials...</p>
          </div>
        ) : (
          <div className="space-y-10 animated fade-in">
            
            {/* Interactive Portal Directory explaining all website pages */}
            <EcosystemInfoHub activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* View content injection */}
            {activeTab === "dashboard" && (
              <Dashboard
                setActiveTab={setActiveTab}
                setSelectedSwapFrom={setSelectedSwapFrom}
                user={user}
                userProfile={userProfile}
                connectedWallet={connectedWallet}
                onConnectWallet={handleWalletConnect}
              />
            )}

            {activeTab === "swap" && (
              <SwapCard
                user={user}
                connectedWallet={connectedWallet}
                onConnectWallet={handleWalletConnect}
                selectedFromSymbol={selectedSwapFrom}
                setSelectedFromSymbol={setSelectedSwapFrom}
                onTransactionInitiated={handleTransactionCompleted}
              />
            )}

            {activeTab === "staking" && (
              <StakingDashboard />
            )}

            {activeTab === "bridge" && (
              <BridgeCard
                user={user}
                connectedWallet={connectedWallet}
                onConnectWallet={handleWalletConnect}
                onTransactionInitiated={handleTransactionCompleted}
                initialParams={initialBridgeParams}
              />
            )}

            {activeTab === "buysell" && (
              <BuySellCard
                user={user}
                connectedWallet={connectedWallet}
                onConnectWallet={handleWalletConnect}
                onTransactionInitiated={handleTransactionCompleted}
              />
            )}

            {activeTab === "blogs" && (
              <BlogsList onNavigateToSwap={() => setActiveTab("swap")} />
            )}

            {activeTab === "chat" && (
              <GeminiChatbot />
            )}

            {activeTab === "api" && (
              <ApiDocs onNavigateToSwap={() => setActiveTab("swap")} />
            )}

            {activeTab === "legal" && (
              <LegalViews onNavigateToSwap={() => setActiveTab("swap")} />
            )}

            {activeTab === "profile" && (
              <ProfileView
                user={user}
                userProfile={userProfile}
                onProfileUpdated={() => fetchUserProfile(user.uid)}
                connectedWallet={connectedWallet}
                onConnectWallet={handleWalletConnect}
              />
            )}

            {/* Historic ledger (Unified layout placement: renders whenever user is authenticated to keep records handy) */}
            {user && (activeTab === "dashboard" || activeTab === "swap" || activeTab === "bridge" || activeTab === "buysell" || activeTab === "profile" || activeTab === "staking") && (
              <TransactionHistory 
                user={user}
                triggerRefresh={syncTrigger}
              />
            )}

          </div>
        )}

      </main>

      {/* Wallet Connect Component */}
      <WalletConnect 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      {/* Simulated Connect wallet modal feedback hook */}
      {connectingWalletAnim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center gap-4 text-center max-w-xs shadow-2xl animate-scale-up">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <div>
              <h4 className="font-sans font-bold text-white text-sm">Awaiting Wallet Signature</h4>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                Establish handshake tunnel on external Web3 provider browser extension popup...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Premium Multi-Column Web3 Trust Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 glass-nav font-sans text-xs text-slate-400 mt-auto overflow-hidden" id="trusted-web3-footer">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand Intro */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold text-sm tracking-tighter">
                  zP
                </div>
                <span className="font-extrabold text-base text-white tracking-wider uppercase font-sans">zPredict <span className="text-cyan-400 text-xs font-medium lowercase">protocols</span></span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-medium">
                The premier multi-chain decentralized predicting node, high-speed swap gateway, and secure cross-chain bridging hub. Driven by automated AI telemetry and backed by zero-trust cryptographic validations.
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400/80 bg-cyan-950/15 border border-cyan-900/30 w-fit px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Zero-Trust Shield Active
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-4">
              <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">Protocol Ecosystem</h4>
              <ul className="space-y-2.5 text-[11px] font-mono">
                {[
                  { name: "Analytical Dashboard", tab: "dashboard" },
                  { name: "AI Swap Engine", tab: "swap" },
                  { name: "Multi-Chain Bridge", tab: "bridge" },
                  { name: "Developer APIs Docs", tab: "api" },
                  { name: "Ecosystem Blogs", tab: "blogs" }
                ].map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        setActiveTab(item.tab);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="hover:text-cyan-400 text-slate-400 transition-colors flex items-center gap-1 cursor-pointer text-left font-sans"
                    >
                      <span className="text-cyan-500/50 font-mono">›</span> {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Trust Integrations & Wallets */}
            <div className="space-y-4" id="wallet-integrations-footer">
              <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">Secure Gateways</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Connect and trade directly from top-tier institutional wallet systems without third-party escrow.
              </p>
              
              <div className="space-y-2">
                {/* Trust Wallet Interactive status bar */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/30 border border-slate-900/40 hover:border-slate-850 transition-all select-none col-span-1">
                  <div className="flex items-center gap-2">
                    {/* Trust Wallet Brand Icon */}
                    <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 2.21c2.28 1.13 5.37 2.44 6.79 3.02C18.25 10.95 16 14.54 12 18.21c-4-3.67-6.25-7.26-6.79-10.98 1.42-.58 4.51-1.89 6.79-3.02z" />
                    </svg>
                    <div>
                      <span className="block font-sans font-bold text-[10px] text-white">Trust Wallet Secure</span>
                      <span className="text-[8px] font-mono text-slate-500 block leading-tight">Live Vault System v4.2</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute" />
                    <span className="text-[9px] font-mono text-emerald-400 font-bold ml-1.5">ONLINE</span>
                  </div>
                </div>

                {/* Coinbase Wallet Interactive status bar */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/30 border border-slate-900/40 hover:border-slate-850 transition-all select-none col-span-1">
                  <div className="flex items-center gap-2">
                    {/* Coinbase Wallet Icon representing brand */}
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[9px] text-white select-none shrink-0 font-mono">
                      C
                    </div>
                    <div>
                      <span className="block font-sans font-bold text-[10px] text-white">Coinbase Wallet</span>
                      <span className="text-[8px] font-mono text-slate-500 block leading-tight">Secured API Gateway</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute" />
                    <span className="text-[9px] font-mono text-emerald-400 font-bold ml-1.5">VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: Compliance & Legal Links */}
            <div className="space-y-4">
              <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">Security & Legal</h4>
              <ul className="space-y-2.5 text-[11px] font-sans">
                <li><button onClick={() => setActiveTab("legal")} className="hover:text-cyan-400 text-slate-400">🔐 Privacy Policy</button></li>
                <li><button onClick={() => setActiveTab("legal")} className="hover:text-cyan-400 text-slate-400">📄 Terms & Conditions</button></li>
                <li><a href="#" className="hover:text-cyan-400 text-slate-400">⚖️ Risk Disclaimer</a></li>
                <li><a href="#" className="hover:text-cyan-400 text-slate-400">❓ FAQ</a></li>
              </ul>
              
              {/* Compliance Badging / Trusted status */}
              <div className="pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-900 font-mono text-[9px] text-slate-500 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>EVM Compliance:</span>
                    <span className="text-emerald-400 font-bold">100% SECURE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Relay Hash Code:</span>
                    <span className="text-slate-400">ZP-B984F</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 w-11/12 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Profiles bar and general copyright */}
          <div className="mt-12 pt-8 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="font-mono text-[10px] text-slate-500 text-center sm:text-left leading-relaxed">
              © 2026 <span className="text-white font-sans font-semibold">zPredict protocols Inc.</span> • Deep Cryptographic forecasting algorithms and peer-to-peer liquidity nodes. Securing Web3 credentials.
            </p>

            {/* Social channels profile links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, url: "https://twitter.com/zPredict", title: "Join zPredict Twitter" },
                { icon: Send, url: "https://t.me/zpredictt", title: "Join zPredict Telegram" },
                { icon: MessageSquare, url: "https://discord.gg/zPredict", title: "Join zPredict Discord" },
                { icon: Github, url: "https://github.com/zpredict", title: "Explore zPredict Code" }
              ].map((soc, idx) => {
                const IconComponent = soc.icon;
                return (
                  <a
                    key={idx}
                    href={soc.url}
                    onClick={(e) => e.preventDefault()}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 hover:text-cyan-400 text-slate-400 rounded-xl transition-all shadow-xs"
                    title={soc.title}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
