import React, { useState } from "react";
import { User, Mail, Calendar, ShieldCheck, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface ProfileViewProps {
  user: any;
  userProfile: any;
  onProfileUpdated: () => void;
  connectedWallet: string | null;
  onConnectWallet: () => void;
}

export default function ProfileView({
  user,
  userProfile,
  onProfileUpdated,
  connectedWallet,
  onConnectWallet
}: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.email?.split("@")[0] || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4" id="profile-unauth-fallback">
        <div className="p-3 glass-inner rounded-full w-fit mx-auto text-slate-500">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-sans text-white">Authentication Required</h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          Log in with your zPredict credentials to view personal trading dashboards, write details, and connect your public address records to Firebase secure blocks.
        </p>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorCode(null);

    const docPath = `users/${user.uid}`;

    try {
      // Set update payload in Firestore explicitly verified by rules affectedKeys gate
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: user.email || userProfile?.email || `${user.uid}@zpredict.sandbox`,
        displayName: displayName.trim(),
        walletAddress: connectedWallet, // Synchronize wallet details if any
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSuccess(true);
      onProfileUpdated();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
      setErrorCode(err.message || "Failed to edit user profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWallet = async () => {
    if (!connectedWallet) {
      onConnectWallet();
      return;
    }
    
    setLoading(true);
    setSuccess(false);
    const docPath = `users/${user.uid}`;

    try {
      await setDoc(doc(db, "users", user.uid), {
        userId: user.uid,
        email: user.email || userProfile?.email || `${user.uid}@zpredict.sandbox`,
        displayName: displayName.trim(),
        walletAddress: connectedWallet,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setSuccess(true);
      onProfileUpdated();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6" id="profile-container">
      
      {/* Profile summary header */}
      <div className="p-6 glass-card rounded-3xl flex flex-col sm:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-slate-950 flex items-center justify-center font-bold text-2xl uppercase">
          {displayName ? displayName.charAt(0) : user.email?.charAt(0) || "U"}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-bold text-white font-sans">
            {displayName || "Anonymous User"}
          </h3>
          <p className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/30 w-fit mx-auto sm:mx-0">
            zPredict Verified ID
          </p>
        </div>
      </div>

      {/* Profile Details edit form */}
      <div className="glass-card rounded-3xl p-6">
        <h4 className="text-base font-bold text-white mb-4">Account Settings</h4>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-medium tracking-wider text-slate-500 uppercase">
              Registered Email (Immutable)
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 glass-inner rounded-xl text-slate-500 text-xs sm:text-sm font-mono cursor-not-allowed">
              <Mail className="w-4 h-4 text-slate-600" />
              {user.email}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-medium tracking-wider text-slate-500 uppercase">
              Display Name
            </label>
            <div className="relative">
              <input
                id="profile-display-name-input"
                type="text"
                placeholder="Your username"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 pl-10 text-white placeholder-slate-500 glass-inner rounded-lg focus:outline-hidden focus:border-cyan-500 text-xs sm:text-sm font-sans"
                required
                disabled={loading}
              />
              <User className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Sync connected wallet metadata */}
          <div className="p-4 glass-inner rounded-2xl space-y-3.5">
            <span className="block text-xs font-mono text-slate-500 uppercase font-semibold">Web3 Wallet Credentials</span>
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-500" />
                <span className="font-mono text-xs text-slate-300 truncate max-w-[200px]">
                  {userProfile?.walletAddress || connectedWallet || "No wallet synchronized"}
                </span>
              </div>
              
              <button
                id="profile-wallet-sync-btn"
                type="button"
                onClick={handleSyncWallet}
                disabled={loading}
                className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-slate-300 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
              >
                {!connectedWallet ? "Connect Wallet" : (userProfile?.walletAddress === connectedWallet ? "Synchronized" : "Sync Connected Wallet")}
              </button>
            </div>
          </div>

          {success && (
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-950 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Settings updated and securely validated on Firestore database.
            </div>
          )}

          {errorCode && (
            <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-300 text-xs rounded-xl">
              {errorCode}
            </div>
          )}

          <div className="pt-4">
            <button
              id="profile-save-btn"
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Profile Database Rules
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
