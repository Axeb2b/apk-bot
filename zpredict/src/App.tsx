import React, { useState, useEffect } from "react";
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";

// Core components
import Header from "./components/Header";
import HomeDashboard from "./components/HomeDashboard";
import SwapCard from "./components/SwapCard";
import BridgeCard from "./components/BridgeCard";
import BuySellCard from "./components/BuySellCard";
import BlogsList from "./components/BlogsList";
import ApiDocs from "./components/ApiDocs";
import LegalViews from "./components/LegalViews";
import ProfileView from "./components/ProfileView";
import TransactionHistory from "./components/TransactionHistory";
import StakingDashboard from "./components/StakingDashboard";
import WalletConnect from "./components/WalletConnect";
import MarketTicker from "./components/MarketTicker";

import { Loader2, Twitter, Send, Github, Zap } from "lucide-react";

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
      <div className="app-bg" aria-hidden="true">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>

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

      <MarketTicker />

      {/* Main app container routing */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        
        {authLoading ? (
          <div className="py-24 text-center space-y-4">
            <div className="glass-card rounded-2xl p-8 max-w-xs mx-auto shimmer-border">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
              <p className="text-sm font-display font-semibold text-white mt-4">Loading zPredict</p>
              <p className="text-xs font-mono text-slate-500 mt-1">Initializing secure session...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10 page-section fade-in">
            
            
            {/* View content injection */}
            {activeTab === "dashboard" && (
              <HomeDashboard
                setActiveTab={setActiveTab}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4 text-center max-w-xs shimmer-border animate-scale-up">
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

      <footer className="relative z-10 glass-nav mt-auto border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black fill-black" />
            </div>
            <span className="font-display font-bold text-white">zPredict</span>
            <span className="text-zinc-600 text-xs">© 2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {["swap","bridge","api","legal"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="hover:text-cyan-400 transition-colors cursor-pointer capitalize">{tab}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {[Twitter, Send, Github].map((Icon, i) => (
              <a key={i} href="#" onClick={e => e.preventDefault()}
                className="p-2 glass-inner rounded-lg text-zinc-500 hover:text-cyan-400 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
