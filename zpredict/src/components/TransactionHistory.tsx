import React, { useEffect, useState } from "react";
import { 
  query, 
  collection, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from "../firebase";
import { CryptoTransaction, TransactionType, TransactionStatus } from "../types";
import { 
  Shuffle, 
  ArrowLeftRight, 
  CreditCard, 
  ArrowUpRight, 
  ExternalLink, 
  Search,
  Activity,
  History,
  AlertTriangle,
  Download
} from "lucide-react";

interface TransactionHistoryProps {
  user: any;
  triggerRefresh: number;
}

export default function TransactionHistory({ user, triggerRefresh }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [errorPayload, setErrorPayload] = useState<string | null>(null);

  const handleDownloadCSV = () => {
    // CSV headers matching transactional fields
    const headers = ["Transaction ID", "Type", "From Token", "From Amount", "To Token", "To Amount", "Network", "Status", "Transaction Hash", "Created At"];
    
    const rows = filteredTransactions.map((tx) => [
      tx.transactionId,
      tx.type,
      tx.fromToken,
      tx.fromAmount,
      tx.toToken,
      tx.toAmount,
      tx.network,
      tx.status,
      tx.txHash,
      tx.createdAt?.seconds 
        ? new Date(tx.createdAt.seconds * 1000).toISOString() 
        : "Just now"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `zPredict_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorPayload(null);

    if (user?.isMock) {
      // Local Sandbox Storage Fallback
      const sandboxTxKey = "zpredict_transactions_sandbox";
      const stored = localStorage.getItem(sandboxTxKey);
      let items: CryptoTransaction[] = [];
      if (stored) {
        try {
          items = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse sandbox transactions:", e);
        }
      }
      
      // Sort client-side in memory
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; // descending order
      });

      setTransactions(items);
      setLoading(false);
      return () => {};
    }

    const txCollectionPath = "transactions";

    // Build securing query filtering strictly by current user uid
    const secureQuery = query(
      collection(db, txCollectionPath), 
      where("userId", "==", user.uid)
    );

    // Attach real-time standard snapshot listener with error parameters
    const unsubscribe = onSnapshot(secureQuery, (snapshot) => {
      const items: CryptoTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          transactionId: data.transactionId || doc.id,
          userId: data.userId,
          type: data.type as TransactionType,
          fromToken: data.fromToken,
          fromAmount: data.fromAmount,
          toToken: data.toToken,
          toAmount: data.toAmount,
          network: data.network,
          status: data.status as TransactionStatus,
          txHash: data.txHash || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });

      // Sort client-side in memory to prevent missing Firestore index query crashes completely!
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA; // descending order
      });

      setTransactions(items);
      setLoading(false);
    }, (error) => {
      // Mandated trigger callback
      handleFirestoreError(error, OperationType.GET, txCollectionPath);
      setErrorPayload("Failed to fetch secure transaction ledger. Check security database rules.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, triggerRefresh]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.fromToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.toToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.network.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "all" || tx.type === filterType;

    return matchesSearch && matchesFilter;
  });

  if (!user) {
    return null; // hide completely if not authenticated
  }

  return (
    <section className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6" id="transaction-history-ledger">
      
      {/* Title control header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-2.5 text-cyan-400">
          <History className="w-5 h-5" />
          <div>
            <h3 className="text-lg font-bold text-white font-sans">Simulated Transaction History</h3>
            <p className="text-xs text-slate-500">Real-time ledger synchronized via Google Cloud Firestore</p>
          </div>
        </div>

        {/* Filter Selection boxes */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <input
              id="history-search-input"
              type="text"
              placeholder="Search assets, hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 pl-8 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-cyan-500 font-sans"
            />
            <Search className="absolute top-1/2 left-2.5 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>

          {/* Types Selector */}
          <select
            id="history-type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Operations</option>
            <option value="swap">Swaps</option>
            <option value="bridge">Bridges</option>
            <option value="buy">Direct Buys</option>
            <option value="sell">Direct Sells</option>
          </select>

          {/* Download CSV button */}
          <button
            id="download-csv-btn"
            onClick={handleDownloadCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500 rounded-lg text-xs font-semibold text-slate-300 hover:text-cyan-400 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            title="Download currently filtered transactions in CSV format"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download CSV</span>
          </button>
        </div>
      </div>

      {errorPayload && (
        <div className="p-4 bg-rose-950/20 border border-rose-900 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4" /> {errorPayload}
        </div>
      )}

      {/* Dynamic Load state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">Syncing with Cloud Firestore...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-2 border border-dashed border-slate-900 rounded-2xl">
          <span className="block text-xs font-mono">No Transaction Logs Found</span>
          <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
            Once you execute a swap, cross-network bridge, or credit card buying action, details will automatically lock and register here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" id="history-transactions-table">
            <thead>
              <tr className="text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-slate-900/50 pb-2">
                <th className="pb-3 pl-3">Instruction Action</th>
                <th className="pb-3 text-right">Value Offer</th>
                <th className="pb-3 text-right">Value Receipt</th>
                <th className="pb-3">Network Tunnel</th>
                <th className="pb-3">Processing State</th>
                <th className="pb-3 pr-3 text-right">Verification hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40">
              {filteredTransactions.map((tx) => {
                const isCompleted = tx.status === TransactionStatus.COMPLETED;
                const isSwap = tx.type === TransactionType.SWAP;
                const isBridge = tx.type === TransactionType.BRIDGE;
                const isBuy = tx.type === TransactionType.BUY;
                
                return (
                  <tr key={tx.transactionId} className="hover:bg-slate-900/20 transition-colors text-slate-300">
                    <td className="py-3.5 pl-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg border ${
                          isSwap 
                            ? "bg-cyan-950/20 text-cyan-400 border-cyan-900/40" 
                            : isBridge 
                            ? "bg-indigo-950/20 text-indigo-400 border-indigo-900/40" 
                            : "bg-emerald-950/20 text-emerald-400 border-emerald-900/40"
                        }`}>
                          {isSwap ? <Shuffle className="w-4 h-4" /> : isBridge ? <ArrowLeftRight className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="block font-sans font-bold text-xs text-white uppercase">{tx.type}</span>
                          <span className="block text-[10px] font-mono text-slate-500">
                            {tx.createdAt?.seconds 
                              ? new Date(tx.createdAt.seconds * 1000).toLocaleString() 
                              : "Just now"
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-right font-mono text-xs font-semibold text-slate-350">
                      {tx.fromAmount} {tx.fromToken}
                    </td>
                    <td className="py-3.5 text-right font-mono text-xs font-semibold text-cyan-400">
                      {tx.toAmount} {tx.toToken}
                    </td>
                    <td className="py-3.5 font-sans text-xs text-slate-400">{tx.network}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border capitalize ${
                        isCompleted 
                          ? "bg-emerald-950/35 text-emerald-400 border-emerald-900/40" 
                          : "bg-amber-955/20 text-amber-500 border-amber-900/40 animate-pulse"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-amber-400"}`} />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-right">
                      <a
                        href={`https://etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Open on block explorer"
                      >
                        {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </section>
  );
}
