import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  HelpCircle, 
  RefreshCw, 
  ShieldCheck, 
  Loader2, 
  Network
} from "lucide-react";
import { TokenInfo, TransactionType, TransactionStatus } from "../types";
import { tokensList, networksList } from "../data";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import SwapPortalInfo from "./SwapPortalInfo";

interface BridgeCardProps {
  user: any;
  connectedWallet: string | null;
  onConnectWallet: () => void;
  onTransactionInitiated: () => void;
  initialParams?: {
    fromChain?: string;
    toChain?: string;
    token?: string;
    amount?: string;
  } | null;
}

export default function BridgeCard({
  user,
  connectedWallet,
  onConnectWallet,
  onTransactionInitiated,
  initialParams
}: BridgeCardProps) {
  const [fromChain, setFromChain] = useState(networksList[0]); // Ethereum Mainnet
  const [toChain, setToChain] = useState(networksList[2]); // Polygon PoS
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(tokensList[1]); // ETH
  const [bridgeAmount, setBridgeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [bridgeResult, setBridgeResult] = useState<string | null>(null);
  const [stepMessage, setStepMessage] = useState<string>("");

  useEffect(() => {
    if (initialParams) {
      if (initialParams.fromChain) {
        const foundFrom = networksList.find(n => n.id === initialParams.fromChain || n.name.toLowerCase().includes(initialParams.fromChain!.toLowerCase()));
        if (foundFrom) setFromChain(foundFrom);
      }
      if (initialParams.toChain) {
        const foundTo = networksList.find(n => n.id === initialParams.toChain || n.name.toLowerCase().includes(initialParams.toChain!.toLowerCase()));
        if (foundTo) setToChain(foundTo);
      }
      if (initialParams.token) {
        const foundToken = tokensList.find(t => t.symbol.toLowerCase() === initialParams.token!.toLowerCase());
        if (foundToken) setSelectedToken(foundToken);
      }
      if (initialParams.amount) {
        setBridgeAmount(initialParams.amount);
      }
    }
  }, [initialParams]);

  const handleSwapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
    setBridgeAmount("");
    setBridgeResult(null);
  };

  const executeBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onConnectWallet();
      return;
    }

    const numericAmount = parseFloat(bridgeAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) return;

    setLoading(true);
    setBridgeResult(null);

    // Initial log of bridge path in Firestore as PENDING
    const randomHex = Array.from({ length: 42 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const generatedTxHash = `0x${randomHex}`;
    const generatedTxId = `tx-${Date.now()}`;
    const docPath = `transactions/${generatedTxId}`;

    const transactionPayload = {
      transactionId: generatedTxId,
      userId: user?.uid || "guest-user",
      type: TransactionType.BRIDGE,
      fromToken: selectedToken.symbol,
      fromAmount: numericAmount,
      toToken: selectedToken.symbol,
      toAmount: numericAmount * 0.998, // deduct minor bridge lock fees
      network: `${fromChain.name} → ${toChain.name}`,
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

      setStepMessage(`Step 1/3: Depositing and Locking ${numericAmount} ${selectedToken.symbol} on ${fromChain.name}...`);
      
      setTimeout(() => {
        setStepMessage("Step 2/3: Validating bridge signatures across decentralized oracles...");
        
        setTimeout(() => {
          setStepMessage(`Step 3/3: Minting/releasing bridged assets to wallet on ${toChain.name}...`);
          
          setTimeout(() => {
            saveToLocal(TransactionStatus.COMPLETED);
            setBridgeResult(`Bridging successful! Transferred ${numericAmount} ${selectedToken.symbol} from ${fromChain.name} to ${toChain.name} securely. Recieved ${(numericAmount * 0.998).toFixed(5)} ${selectedToken.symbol} in destination address.`);
            setBridgeAmount("");
            onTransactionInitiated();
            setLoading(false);
            setStepMessage("");
          }, 1500);

        }, 1500);

      }, 1500);
      return;
    }

    try {
      await setDoc(doc(db, "transactions", generatedTxId), transactionPayload);

      // Simulate a real multi-step Web3 smart contract bridge process
      setStepMessage(`Step 1/3: Depositing and Locking ${numericAmount} ${selectedToken.symbol} on ${fromChain.name}...`);
      
      setTimeout(() => {
        setStepMessage("Step 2/3: Validating bridge signatures across decentralized oracles...");
        
        setTimeout(() => {
          setStepMessage(`Step 3/3: Minting/releasing bridged assets to wallet on ${toChain.name}...`);
          
          setTimeout(async () => {
            try {
              // Update status to COMPLETED under the Firestore authorization guidelines
              await setDoc(doc(db, "transactions", generatedTxId), {
                ...transactionPayload,
                status: TransactionStatus.COMPLETED,
                updatedAt: serverTimestamp(),
              }, { merge: true });

              setBridgeResult(`Bridging successful! Transferred ${numericAmount} ${selectedToken.symbol} from ${fromChain.name} to ${toChain.name} securely. Recieved ${(numericAmount * 0.998).toFixed(5)} ${selectedToken.symbol} in destination address.`);
              setBridgeAmount("");
              onTransactionInitiated();
            } catch (dbErr) {
              handleFirestoreError(dbErr, OperationType.UPDATE, docPath);
            } finally {
              setLoading(false);
              setStepMessage("");
            }
          }, 1500);

        }, 1500);

      }, 1500);

    } catch (dbErr) {
      handleFirestoreError(dbErr, OperationType.CREATE, docPath);
      setLoading(false);
      setStepMessage("");
    }
  };

  return (
    <div className="space-y-8" id="bridge-interface">
      <div className="max-w-md mx-auto">
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-2xl relative">
          
          {/* Header Title */}
          <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-sans font-bold text-white">Cross-Chain Bridge</h2>
            <p className="text-xs text-slate-500">Route assets across isolated networks</p>
          </div>
          <button
            id="bridge-refresh"
            onClick={() => {
              setBridgeAmount("");
              setBridgeResult(null);
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={executeBridge} className="space-y-4">
          
          {/* Chains Selection Grid */}
          <div className="grid grid-cols-2 gap-2 relative bg-slate-900 p-1 border border-slate-800 rounded-2xl">
            {/* Origin chain */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="block text-[10px] font-mono tracking-wider font-semibold text-slate-500 uppercase">From Chain</span>
              <select
                id="bridge-chain-from"
                value={fromChain.id}
                onChange={(e) => {
                  const item = networksList.find(n => n.id === e.target.value);
                  if (item) {
                    setFromChain(item);
                    if (item.id === toChain.id) {
                      setToChain(networksList.find(n => n.id !== item.id) || networksList[2]);
                    }
                  }
                }}
                className="w-full bg-transparent text-xs text-white font-bold py-1 focus:outline-hidden"
              >
                {networksList.map(net => (
                  <option key={net.id} value={net.id}>{net.name}</option>
                ))}
              </select>
            </div>

            {/* Interchange toggle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                id="bridge-chains-swap"
                type="button"
                onClick={handleSwapChains}
                className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-400 rounded-full cursor-pointer transition-transform"
                title="Swap Networks"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Target chain */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-right">
              <span className="block text-[10px] font-mono tracking-wider font-semibold text-slate-500 uppercase">To Chain</span>
              <select
                id="bridge-chain-to"
                value={toChain.id}
                onChange={(e) => {
                  const item = networksList.find(n => n.id === e.target.value);
                  if (item) {
                    setToChain(item);
                    if (item.id === fromChain.id) {
                      setFromChain(networksList.find(n => n.id !== item.id) || networksList[0]);
                    }
                  }
                }}
                className="w-full bg-transparent text-xs text-white font-bold py-1 text-right focus:outline-hidden"
              >
                {networksList.map(net => (
                  <option key={net.id} value={net.id}>{net.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount and select asset */}
          <div className="bg-slate-900 p-4 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Transfer amount</span>
              <span className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer">Max Available</span>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <input
                id="bridge-amount-input"
                type="number"
                step="any"
                placeholder="0.00"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                className="w-full bg-transparent border-transparent text-white placeholder-slate-500 font-extrabold text-2xl focus:outline-hidden font-mono"
                required
                disabled={loading}
              />
              <select
                id="bridge-token-select"
                value={selectedToken.symbol}
                onChange={(e) => {
                  const item = tokensList.find(t => t.symbol === e.target.value);
                  if (item) setSelectedToken(item);
                }}
                className="bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm px-3 py-1.5 rounded-xl focus:outline-hidden"
              >
                {tokensList.slice(1).map(token => (
                  <option key={token.symbol} value={token.symbol}>{token.symbol}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bridge Details specs */}
          <div className="bg-slate-950 p-3.5 border border-slate-900 rounded-xl space-y-2 text-xs font-mono text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">Gas Index estimate <HelpCircle className="w-3.5 h-3.5 text-slate-600" /></span>
              <span className="text-slate-300">~{fromChain.gasPriceGwei} Gwei (~$1.80)</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Bridge Pipeline Toll</span>
              <span className="text-slate-300">0.2% fee (~${(parseFloat(bridgeAmount) ? parseFloat(bridgeAmount) * selectedToken.priceUsd * 0.002 : 0).toFixed(2)})</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Routing Pipeline Delay</span>
              <span className="text-slate-300 flex items-center gap-1.5 leading-none">
                <Network className="w-4 h-4 text-cyan-400" />
                ~4-7 min (3 confirmations)
              </span>
            </div>
          </div>

          {/* Load sequences */}
          {loading && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              <p className="text-xs font-mono text-slate-300">{stepMessage}</p>
            </div>
          )}

          {/* Status confirmations */}
          {bridgeResult && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-xl space-y-2">
              <span className="text-xs uppercase font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Cross-Chain Pipeline Success
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {bridgeResult}
              </p>
            </div>
          )}

          {/* Submit Action triggers */}
          {!connectedWallet ? (
            <button
              id="bridge-wallet-trigger"
              type="button"
              onClick={onConnectWallet}
              className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-sm font-semibold rounded-xl text-slate-950 cursor-pointer transition-all shadow-lg shadow-cyan-500/10"
            >
              Synchronize Web3 Wallet
            </button>
          ) : (
            <button
              id="bridge-submit"
              type="submit"
              disabled={loading || !bridgeAmount}
              className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-900 disabled:text-slate-650 disabled:border-slate-800 text-sm font-semibold rounded-xl text-slate-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "Approving smart bridge locked states..." : `Bridge ${selectedToken.symbol} Assets`}
            </button>
          )}

        </form>

      </div>
    </div>
    
    <SwapPortalInfo context="bridge" />
  </div>
  );
}
