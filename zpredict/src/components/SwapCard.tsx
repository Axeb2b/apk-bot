import React, { useState, useEffect } from "react";
import { 
  ArrowDown, 
  Settings, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  Loader2
} from "lucide-react";
import { TokenInfo, TransactionType, TransactionStatus } from "../types";
import { tokensList, networksList } from "../data";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import SwapPortalInfo from "./SwapPortalInfo";

interface SwapCardProps {
  user: any;
  connectedWallet: string | null;
  onConnectWallet: () => void;
  selectedFromSymbol: string;
  setSelectedFromSymbol: (symbol: string) => void;
  onTransactionInitiated: () => void;
}

export default function SwapCard({
  user,
  connectedWallet,
  onConnectWallet,
  selectedFromSymbol,
  setSelectedFromSymbol,
  onTransactionInitiated
}: SwapCardProps) {
  const [fromToken, setFromToken] = useState<TokenInfo>(tokensList[1]); // ETH default
  const [toToken, setToToken] = useState<TokenInfo>(tokensList[0]); // ZPRED default
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.5); // Slippage tolerance index
  const [selectedNetwork, setSelectedNetwork] = useState(networksList[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

  // Sync token from dashboard click
  useEffect(() => {
    const item = tokensList.find((t) => t.symbol === selectedFromSymbol);
    if (item) {
      setFromToken(item);
      // If from and to match, switch to token
      if (item.symbol === toToken.symbol) {
        const alt = tokensList.find((t) => t.symbol !== item.symbol) || tokensList[0];
        setToToken(alt);
      }
    }
  }, [selectedFromSymbol]);

  // Recalculate exchange outputs
  useEffect(() => {
    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) {
      setToAmount("");
      return;
    }

    const valueUsd = amount * fromToken.priceUsd;
    const estimatedReturnedAmount = valueUsd / toToken.priceUsd;
    
    // Deduct slippage / fee approximation
    const netReturned = estimatedReturnedAmount * (1 - (slippage / 100));
    setToAmount(netReturned.toFixed(6));
  }, [fromAmount, fromToken, toToken, slippage]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount("");
    setToAmount("");
  };

  const executeSwapTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onConnectWallet();
      return;
    }

    const numericFrom = parseFloat(fromAmount);
    const numericTo = parseFloat(toAmount);
    if (isNaN(numericFrom) || numericFrom <= 0) return;

    setLoading(true);
    setTradeSuccess(null);

    // Dynamic Tx Hash Generator
    const randomHex = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const generatedTxHash = `0x${randomHex}`;
    const generatedTxId = `tx-${Date.now()}`;

    // Write object structure strictly validated by DRAFT_firestore.rules / firebase-blueprint.json
    const transactionPayload = {
      transactionId: generatedTxId,
      userId: user?.uid || "guest-user",
      type: TransactionType.SWAP,
      fromToken: fromToken.symbol,
      fromAmount: numericFrom,
      toToken: toToken.symbol,
      toAmount: numericTo,
      network: selectedNetwork.name,
      status: TransactionStatus.PENDING,
      txHash: generatedTxHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docPath = `transactions/${generatedTxId}`;

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
        setTradeSuccess(`Exchange complete! Swapped ${numericFrom} ${fromToken.symbol} into ${numericTo.toFixed(4)} ${toToken.symbol} on ${selectedNetwork.name}. Transaction hash saved.`);
        setFromAmount("");
        setToAmount("");
        onTransactionInitiated();
        setLoading(false);
      }, 2500);
      return;
    }

    // Write to firebase
    try {
      await setDoc(doc(db, "transactions", generatedTxId), transactionPayload);

      // Simulate network confirmation duration
      setTimeout(async () => {
        try {
          // Update transaction doc status securely using rules affectedKeys gate
          await setDoc(doc(db, "transactions", generatedTxId), {
            ...transactionPayload,
            status: TransactionStatus.COMPLETED,
            updatedAt: serverTimestamp(),
          }, { merge: true });

          setTradeSuccess(`Exchange complete! Swapped ${numericFrom} ${fromToken.symbol} into ${numericTo.toFixed(4)} ${toToken.symbol} on ${selectedNetwork.name}. Transaction hash saved.`);
          setFromAmount("");
          setToAmount("");
          onTransactionInitiated();
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.UPDATE, docPath);
        } finally {
          setLoading(false);
        }
      }, 2500);

    } catch (dbErr) {
      handleFirestoreError(dbErr, OperationType.CREATE, docPath);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="swap-interface">
      <div className="max-w-md mx-auto">
        <div className="glass-card rounded-3xl p-6 relative shimmer-border">
          
          {/* Header toolbar */}
          <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-bold text-white">Swap Assets</h2>
            <p className="text-xs text-slate-500 mt-0.5">Best rate across all pools</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="swap-refresh"
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh Rate Pools"
              onClick={() => {
                setFromAmount("");
                setToAmount("");
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="swap-settings-toggle"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic settings panel */}
        {showSettings && (
          <div className="p-4 glass-inner rounded-2xl mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Slippage Tolerance</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{slippage}%</span>
            </div>
            
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0, 3.0].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSlippage(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold text-center border cursor-pointer ${
                    slippage === val 
                      ? "bg-cyan-500/10 text-cyan-400 border-cyan-800" 
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">Active Routing Network</label>
              <select
                id="swap-network-select"
                value={selectedNetwork.id}
                onChange={(e) => {
                  const net = networksList.find((n) => n.id === e.target.value);
                  if (net) setSelectedNetwork(net);
                }}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs"
              >
                {networksList.map((net) => (
                  <option key={net.id} value={net.id}>{net.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Main form */}
        <form onSubmit={executeSwapTrade} className="space-y-4">
          
          {/* Sending Card */}
          <div className="input-glass p-4 relative">
            <span className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-2">You Pay</span>
            <div className="flex items-center justify-between gap-4">
              <input
                id="swap-amount-from"
                type="number"
                step="any"
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full bg-transparent border-transparent text-white placeholder-slate-500 font-extrabold text-2xl focus:outline-hidden focus:ring-0 font-mono"
                required
                disabled={loading}
              />
              <select
                id="swap-token-from"
                value={fromToken.symbol}
                onChange={(e) => {
                  const item = tokensList.find((t) => t.symbol === e.target.value);
                  if (item) {
                    setFromToken(item);
                    if (item.symbol === toToken.symbol) {
                      const alt = tokensList.find((t) => t.symbol !== item.symbol) || tokensList[0];
                      setToToken(alt);
                    }
                  }
                }}
                className="bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm px-3 py-1.5 rounded-xl"
              >
                {tokensList.map((token) => (
                  <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500">
              <span>Estimated Value</span>
              <span>
                {fromAmount && !isNaN(parseFloat(fromAmount)) 
                  ? `$${(parseFloat(fromAmount) * fromToken.priceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}` 
                  : "$0.00"
                }
              </span>
            </div>
          </div>

          {/* Interactive swap separator */}
          <div className="relative h-2 flex items-center justify-center">
            <button
              id="swap-switch-btn"
              type="button"
              onClick={handleSwapTokens}
              disabled={loading}
              className="absolute z-10 p-2.5 glass-card hover:border-cyan-400/40 text-slate-400 hover:text-cyan-400 rounded-full transition-all hover:scale-110 cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>

          {/* Acquiring Card */}
          <div className="input-glass p-4">
            <span className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-2">You Receive</span>
            <div className="flex items-center justify-between gap-4">
              <input
                id="swap-amount-to"
                type="text"
                placeholder="0.00"
                value={toAmount}
                readOnly
                className="w-full bg-transparent border-transparent text-cyan-400 placeholder-slate-500 font-extrabold text-2xl focus:outline-hidden font-mono cursor-not-allowed"
              />
              <select
                id="swap-token-to"
                value={toToken.symbol}
                onChange={(e) => {
                  const item = tokensList.find((t) => t.symbol === e.target.value);
                  if (item) {
                    setToToken(item);
                    if (item.symbol === fromToken.symbol) {
                      const alt = tokensList.find((t) => t.symbol !== item.symbol) || tokensList[0];
                      setFromToken(alt);
                    }
                  }
                }}
                className="bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm px-3 py-1.5 rounded-xl"
              >
                {tokensList.map((token) => (
                  <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-500">
              <span>Estimated Value</span>
              <span>
                {toAmount && !isNaN(parseFloat(toAmount)) 
                  ? `$${(parseFloat(toAmount) * toToken.priceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}` 
                  : "$0.00"
                }
              </span>
            </div>
          </div>

          {/* Pricing detail notes */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1.5 text-xs text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Price Conversion</span>
              <span className="text-slate-300">
                1 {fromToken.symbol} = {(fromToken.priceUsd / toToken.priceUsd).toFixed(5)} {toToken.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Liquidity Pools Fee</span>
              <span className="text-slate-300">0.15% (~$0.40)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Optimal Pathway</span>
              <span className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1">
                zPredict Pool routing <Info className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {tradeSuccess && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-xl space-y-2">
              <span className="text-xs uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Swap Success Confirmation
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {tradeSuccess}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!connectedWallet ? (
            <button
              id="swap-wallet-trigger"
              type="button"
              onClick={onConnectWallet}
              className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-sm font-semibold rounded-xl text-slate-950 hover:shadow-lg transition-all cursor-pointer"
            >
              Connect Web3 Wallet to Swap
            </button>
          ) : (
            <button
              id="swap-submit"
              type="submit"
              disabled={loading || !fromAmount}
              className="w-full btn-primary !justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Broadcasting Swap Path...
                </>
              ) : (
                "Execute Swap Trade"
              )}
            </button>
          )}

        </form>

      </div>
    </div>
    
    <SwapPortalInfo context="swap" />
  </div>
  );
}
