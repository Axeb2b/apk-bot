import React, { useState } from "react";
import { 
  CreditCard, 
  ArrowLeftRight, 
  DollarSign, 
  ShieldCheck, 
  Loader2, 
  Briefcase 
} from "lucide-react";
import { TokenInfo, TransactionType, TransactionStatus } from "../types";
import { tokensList } from "../data";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import SwapPortalInfo from "./SwapPortalInfo";

interface BuySellCardProps {
  user: any;
  connectedWallet: string | null;
  onConnectWallet: () => void;
  onTransactionInitiated: () => void;
}

export default function BuySellCard({
  user,
  connectedWallet,
  onConnectWallet,
  onTransactionInitiated
}: BuySellCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<"buy" | "sell">("buy");
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(tokensList[0]); // ZPRED default
  const [fiatAmount, setFiatAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFiatChange = (val: string) => {
    setFiatAmount(val);
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) {
      setCryptoAmount("");
      return;
    }
    // calculate crypto bought/sold
    const calculated = amount / selectedToken.priceUsd;
    setCryptoAmount(calculated.toFixed(6));
  };

  const handleCryptoChange = (val: string) => {
    setCryptoAmount(val);
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) {
      setFiatAmount("");
      return;
    }
    const calculated = amount * selectedToken.priceUsd;
    setFiatAmount(calculated.toFixed(2));
  };

  const executeBuySell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onConnectWallet();
      return;
    }

    const fiat = parseFloat(fiatAmount);
    const crypto = parseFloat(cryptoAmount);
    if (isNaN(fiat) || fiat <= 0) return;

    setLoading(true);
    setSuccessMsg(null);

    const generatedTxId = `tx-${Date.now()}`;
    const randomHex = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const generatedTxHash = `0x${randomHex}`;
    const docPath = `transactions/${generatedTxId}`;

    const isBuy = activeSubTab === "buy";

    const transactionPayload = {
      transactionId: generatedTxId,
      userId: user?.uid || "guest-user",
      type: isBuy ? TransactionType.BUY : TransactionType.SELL,
      fromToken: isBuy ? "USD" : selectedToken.symbol,
      fromAmount: isBuy ? fiat : crypto,
      toToken: isBuy ? selectedToken.symbol : "USD",
      toAmount: isBuy ? crypto : fiat,
      network: isBuy ? "Card Gateway" : "Bank Express ACH",
      status: TransactionStatus.PENDING,
      txHash: generatedTxHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Write to local or firebase
    if ((user as any)?.isMock) {
      const saveToLocal = (status: TransactionStatus) => {
        const stored = localStorage.getItem("zpredict_transactions_sandbox");
        const txs = stored ? JSON.parse(stored) : [];
        const index = txs.findIndex((t: any) => t.transactionId === generatedTxId);
        
        const currentPayload = {
          ...transactionPayload,
          status,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
          updatedAt: { seconds: Math.floor(Date.now() / 1000) }
        };

        if (index > -1) {
          txs[index] = currentPayload;
        } else {
          txs.unshift(currentPayload);
        }
        localStorage.setItem("zpredict_transactions_sandbox", JSON.stringify(txs));
      };

      saveToLocal(TransactionStatus.PENDING);
      onTransactionInitiated();

      setTimeout(() => {
        saveToLocal(TransactionStatus.COMPLETED);
        if (isBuy) {
          setSuccessMsg(`Fiduciary deposit complete! Charged $${fiat} USD via secure checkout to deliver ${crypto.toFixed(4)} ${selectedToken.symbol} into wallet ${connectedWallet.slice(0, 7)}...`);
        } else {
          setSuccessMsg(`DeFi disbursement complete! Exchanged ${crypto} ${selectedToken.symbol} to wire $${fiat} USD ACH to account ${bankRouting ? `ending in *${bankRouting.slice(-4)}` : "routing channels"}.`);
        }

        setFiatAmount("");
        setCryptoAmount("");
        setCardNumber("");
        setBankRouting("");
        onTransactionInitiated();
        setLoading(false);
      }, 3000);
      return;
    }

    try {
      await setDoc(doc(db, "transactions", generatedTxId), transactionPayload);

      // Simulate banking clearing time frames
      setTimeout(async () => {
        try {
          // Mutate status to COMPLETED under security guidelines
          await setDoc(doc(db, "transactions", generatedTxId), {
            ...transactionPayload,
            status: TransactionStatus.COMPLETED,
            updatedAt: serverTimestamp(),
          }, { merge: true });

          if (isBuy) {
            setSuccessMsg(`Fiduciary deposit complete! Charged $${fiat} USD via secure checkout to deliver ${crypto.toFixed(4)} ${selectedToken.symbol} into wallet ${connectedWallet.slice(0, 7)}...`);
          } else {
            setSuccessMsg(`DeFi disbursement complete! Exchanged ${crypto} ${selectedToken.symbol} to wire $${fiat} USD ACH to account ${bankRouting ? `ending in *${bankRouting.slice(-4)}` : "routing channels"}.`);
          }

          setFiatAmount("");
          setCryptoAmount("");
          setCardNumber("");
          setBankRouting("");
          onTransactionInitiated();
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.UPDATE, docPath);
        } finally {
          setLoading(false);
        }
      }, 3000);

    } catch (dbErr) {
      handleFirestoreError(dbErr, OperationType.CREATE, docPath);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="buysell-interface">
      <div className="max-w-md mx-auto">
        <div className="glass-card rounded-3xl p-6 relative shimmer-border">
        
        {/* Tab Controls */}
        <div className="flex glass-tabs p-1 rounded-2xl mb-6">
          <button
            id="tab-toggle-buy"
            type="button"
            onClick={() => {
              setActiveSubTab("buy");
              setFiatAmount("");
              setCryptoAmount("");
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-center text-sm font-semibold font-display transition-all cursor-pointer ${
              activeSubTab === "buy" 
                ? "glass-tab-active" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Buy Crypto
          </button>
          
          <button
            id="tab-toggle-sell"
            type="button"
            onClick={() => {
              setActiveSubTab("sell");
              setFiatAmount("");
              setCryptoAmount("");
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-center text-sm font-semibold font-display transition-all cursor-pointer ${
              activeSubTab === "sell" 
                ? "glass-tab-active" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sell Crypto
          </button>
        </div>

        {/* Form elements */}
        <form onSubmit={executeBuySell} className="space-y-4">
          
          <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl">
            <span className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 mb-2">
              Select Token Asset
            </span>
            <select
              id="buysell-token"
              value={selectedToken.symbol}
              onChange={(e) => {
                const item = tokensList.find(t => t.symbol === e.target.value);
                if (item) {
                  setSelectedToken(item);
                  setFiatAmount("");
                  setCryptoAmount("");
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl focus:outline-hidden"
            >
              {tokensList.map(token => (
                <option key={token.symbol} value={token.symbol}>{token.name} ({token.symbol})</option>
              ))}
            </select>
          </div>

          {/* Amount conversions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 p-3 border border-slate-800 rounded-2xl relative">
              <span className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Pay / Receive (USD)</span>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-slate-500 mr-1" />
                <input
                  id="buysell-amt-fiat"
                  type="number"
                  placeholder="0.00"
                  value={fiatAmount}
                  onChange={(e) => handleFiatChange(e.target.value)}
                  className="w-full bg-transparent border-transparent text-white placeholder-slate-550 font-bold text-lg focus:outline-hidden font-mono"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="bg-slate-900 p-3 border border-slate-800 rounded-2xl">
              <span className="block text-[10px] uppercase font-mono text-slate-500 mb-1">Crypto Quantity</span>
              <div className="flex items-center">
                <input
                  id="buysell-amt-crypto"
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={cryptoAmount}
                  onChange={(e) => handleCryptoChange(e.target.value)}
                  className="w-full bg-transparent border-transparent text-cyan-400 placeholder-slate-550 font-bold text-lg focus:outline-hidden font-mono"
                  required
                  disabled={loading}
                />
                <span className="text-xs font-bold text-slate-400 ml-1 font-mono">{selectedToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Checkout specifics */}
          {activeSubTab === "buy" ? (
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl space-y-3">
              <span className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
                Payment Card Verification
              </span>
              <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <CreditCard className="w-5 h-5 text-slate-500" />
                <input
                  id="buysell-card-no"
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-transparent text-white text-xs font-mono tracking-widest focus:outline-hidden"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl space-y-3">
              <span className="block text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
                Bank ACH Settlement Address
              </span>
              <div className="flex items-center gap-2.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Briefcase className="w-5 h-5 text-slate-500" />
                <input
                  id="buysell-bank-routing"
                  type="text"
                  placeholder="ACH Checking Routing / Account No"
                  value={bankRouting}
                  onChange={(e) => setBankRouting(e.target.value)}
                  className="w-full bg-transparent text-white text-xs font-mono focus:outline-hidden"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Price conversion note */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 text-[11px] font-mono text-slate-500 text-center">
            Rate: 1 {selectedToken.symbol} = ${selectedToken.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD
          </div>

          {/* Clearing processing warning */}
          {loading && (
            <div className="p-3 glass-inner rounded-xl flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-xs font-mono text-slate-400">Communicating bank transaction records...</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-xl space-y-2">
              <span className="text-xs uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Settlement Process Complete
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {successMsg}
              </p>
            </div>
          )}

          {/* Action triggers */}
          {!connectedWallet ? (
            <button
              id="buysell-wallet-trigger"
              type="button"
              onClick={onConnectWallet}
              className="w-full btn-primary !justify-center text-sm font-semibold rounded-xl text-slate-900 cursor-pointer transition-all shadow-lg"
            >
              Connect Web3 Receiving Wallet
            </button>
          ) : (
            <button
              id="buysell-submit"
              type="submit"
              disabled={loading || !fiatAmount}
              className="w-full btn-primary !justify-center disabled:bg-slate-900 disabled:text-slate-650 disabled:border-slate-800 text-sm font-semibold rounded-xl text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading 
                ? "Clearing bank settlement accounts..." 
                : (activeSubTab === "buy" ? `Buy ${selectedToken.symbol} with Credit` : `Sell ${selectedToken.symbol} to USD Bank`)
              }
            </button>
          )}

        </form>

      </div>
    </div>
    
    <SwapPortalInfo context="buysell" />
  </div>
  );
}
