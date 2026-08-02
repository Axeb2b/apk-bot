import React, { useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Globe, 
  Briefcase, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Sparkles,
  ArrowRight,
  Calculator,
  Percent,
  Flame,
  Activity,
  ChevronDown,
  ChevronUp,
  Lock,
  Terminal,
  Clock,
  Coins,
  ShieldAlert,
  Wallet,
  Bell,
  Trash2,
  Plus,
  X,
  Edit2,
  Play,
  Pause,
  Download,
  RefreshCw,
  BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TokenInfo, PriceAlert } from "../types";
import { tokensList, networksList } from "../data";
import { 
  setDoc, 
  doc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  updateDoc 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import SwapPortalInfo from "./SwapPortalInfo";
import FaqSection from "./FaqSection";
import FeeTable from "./FeeTable";

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedSwapFrom: (token: string) => void;
  user: any;
  userProfile: any;
  connectedWallet: string | null;
  onConnectWallet: () => void;
}

// Simulated dynamic series data
const chartDataOptions: Record<string, { time: string; price: number }[]> = {
  "24H": [
    { time: "09:00", price: 3340 },
    { time: "11:00", price: 3360 },
    { time: "13:00", price: 3410 },
    { time: "15:00", price: 3390 },
    { time: "17:00", price: 3432 },
    { time: "19:00", price: 3415 },
    { time: "21:00", price: 3425 },
    { time: "23:00", price: 3420 }
  ],
  "7D": [
    { time: "Mon", price: 3120 },
    { time: "Tue", price: 3254 },
    { time: "Wed", price: 3210 },
    { time: "Thu", price: 3320 },
    { time: "Fri", price: 3450 },
    { time: "Sat", price: 3390 },
    { time: "Sun", price: 3420 }
  ],
  "30D": [
    { time: "Week 1", price: 2980 },
    { time: "Week 2", price: 3150 },
    { time: "Week 3", price: 3280 },
    { time: "Week 4", price: 3420 }
  ]
};

// Security Architecture Items for accordion block
const securityArchitectures = [
  {
    id: "sec-1",
    title: "How is my user profile data protected in Google Cloud Firestore?",
    summary: "Our systems configure bulletproof isolation, restricting blanket read queries. Only the authentic, authenticated user ID matching 'request.auth.uid' is granted read/write permissions directly on their profile document.",
    icon: Lock
  },
  {
    id: "sec-2",
    title: "How are currency swaps and cross-chain bridge logs validated?",
    summary: "Each transaction writes to a permanent Firestore event ledger. Firestore security rules execute deterministic validation on state variables, ensuring that a pending transaction status can only be set or transitioned securely without any third-party intercept.",
    icon: ShieldCheck
  },
  {
    id: "sec-3",
    title: "Why is self-custody critical to physical asset withdrawals?",
    summary: "zPredict operates on mathematical zero-trust pipelines. We do not store, inspect, or manage private seed phrases. External browser wallets sign transfers, ensuring you carry ultimate control over asset balances.",
    icon: Key => <ShieldAlert className="w-5 h-5 text-indigo-400" />
  }
];

// Helper to generate sparkline data relative to prices
const getSparklineData = (tokenSymbol: string, currentPrice: number) => {
  const token = tokensList.find(t => t.symbol === tokenSymbol);
  const changePct = token ? token.change24h : 0;
  // Fallback to average 0% shift if changePct is null/undefined
  const actChange = changePct || 0;
  const startPrice = currentPrice / (1 + actChange / 100);
  const points: number[] = [];
  const seed = tokenSymbol.charCodeAt(0) + (tokenSymbol.charCodeAt(1) || 0);
  for (let i = 0; i < 6; i++) {
    const ratio = i / 5;
    const wave = Math.sin(ratio * Math.PI * 1.5 + seed) * (Math.abs(actChange) / 100) * 0.2;
    const interpolated = startPrice + (currentPrice - startPrice) * ratio;
    points.push(interpolated + interpolated * wave);
  }
  points[5] = currentPrice;
  return points;
};

const formatRelativeTime = (createdAt: any) => {
  if (!createdAt) return "Just now";
  
  let date: Date;
  if (createdAt.seconds !== undefined) {
    date = new Date(createdAt.seconds * 1000);
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else if (typeof createdAt === "string" || typeof createdAt === "number") {
    date = new Date(createdAt);
  } else {
    return "Just now";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return "1 hour ago";
  if (diffHr < 24) return `${diffHr} hours ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

export default function Dashboard({
  setActiveTab,
  setSelectedSwapFrom,
  user,
  userProfile,
  connectedWallet,
  onConnectWallet
}: DashboardProps) {
  const [activeRange, setActiveRange] = useState<"24H" | "7D" | "30D">("24H");
  
  // Real-time dynamic market tokens state
  const [tokens, setTokens] = useState<TokenInfo[]>(tokensList);
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(tokensList[1]); // Ethereum default
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New Price Alert State variables
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertToken, setAlertToken] = useState<string>("ETH");
  const [alertPrice, setAlertPrice] = useState<string>("");
  const [alertCondition, setAlertCondition] = useState<"above" | "below">("above");
  const [modalError, setModalError] = useState<string | null>(null);
  const [savingAlert, setSavingAlert] = useState(false);
  const [filterAlertStatus, setFilterAlertStatus] = useState<"all" | "active" | "triggered" | "paused">("all");
  const [sortAlertsBy, setSortAlertsBy] = useState<"createdAt" | "targetPrice">("createdAt");
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Simulated push subscription states
  const [pushSubscribed, setPushSubscribed] = useState(true);
  const [simulatedPushToasts, setSimulatedPushToasts] = useState<{
    id: string;
    tokenSymbol: string;
    condition: "above" | "below";
    targetPrice: number;
    currentPrice: number;
    timestamp: Date;
  }[]>([]);

  // Portfolio allocation target weights (defaulting to clean visual percentages totalling 100%)
  const [targetWeights, setTargetWeights] = useState<Record<string, number>>({
    BTC: 30,
    ETH: 30,
    SOL: 20,
    ZPRED: 15,
    USDC: 5,
  });

  // Automatically update selected token reference when live prices fluctuation triggers
  useEffect(() => {
    const updated = tokens.find(t => t.symbol === selectedToken.symbol);
    if (updated && (updated.priceUsd !== selectedToken.priceUsd || updated.change24h !== selectedToken.change24h)) {
      setSelectedToken(updated);
    }
  }, [tokens]);

  // Market price fluctuation ticker simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map(t => {
        if (t.symbol === "USDC") return t;
        // Moderate random volatility between -0.4% and +0.4%
        const changePercent = (Math.random() - 0.5) * 0.008;
        const newPrice = t.priceUsd * (1 + changePercent);
        const newChange24h = t.change24h + (changePercent * 100);
        return {
          ...t,
          priceUsd: parseFloat(newPrice.toFixed(t.symbol === "BTC" ? 2 : t.symbol === "ZPRED" ? 4 : 2)),
          change24h: parseFloat(newChange24h.toFixed(2))
        };
      }));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      return;
    }

    setAlertsLoading(true);
    setAlertsError(null);

    if (user?.isMock) {
      // Local Sandbox Storage Fallback
      const stored = localStorage.getItem("zpredict_alerts_sandbox");
      let items: PriceAlert[] = [];
      if (stored) {
        try {
          items = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse sandbox alerts:", e);
        }
      }
      
      // Sort client-side
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setAlerts(items);
      setAlertsLoading(false);
      return () => {};
    }

    const alertsPath = "alerts";

    const secureQuery = query(
      collection(db, alertsPath),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(secureQuery, (snapshot) => {
      const items: PriceAlert[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          alertId: doc.id,
          userId: data.userId,
          tokenSymbol: data.tokenSymbol,
          tokenName: data.tokenName,
          targetPrice: data.targetPrice,
          condition: data.condition as "above" | "below",
          status: data.status as "active" | "triggered" | "paused",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      // Sort client-side
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setAlerts(items);
      setAlertsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, alertsPath);
      setAlertsError("Security access error checking alerts rules.");
      setAlertsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenAlertModal = () => {
    setEditingAlertId(null);
    setAlertToken(selectedToken.symbol);
    setAlertPrice(selectedToken.priceUsd.toString());
    setAlertCondition("above");
    setModalError(null);
    setIsAlertModalOpen(true);
  };

  const handleEditAlert = (alert: PriceAlert) => {
    setEditingAlertId(alert.alertId);
    setAlertToken(alert.tokenSymbol);
    setAlertPrice(alert.targetPrice.toString());
    setAlertCondition(alert.condition);
    setModalError(null);
    setIsAlertModalOpen(true);
  };

  const handleSaveAlert = async () => {
    if (!user) {
      setModalError("You must sign in to save on-cloud Firestore alerts.");
      return;
    }
    const val = parseFloat(alertPrice);
    if (!alertPrice || isNaN(val) || val <= 0) {
      setModalError("Please specify a valid positive threshold price.");
      return;
    }

    setSavingAlert(true);
    setModalError(null);
    
    const isEditing = !!editingAlertId;
    const alertId = isEditing ? editingAlertId : `alert-${Date.now()}`;

    if (user?.isMock) {
      const originalAlert = isEditing ? alerts.find(a => a.alertId === alertId) : null;
      const createdAtValue = originalAlert ? originalAlert.createdAt : { seconds: Math.floor(Date.now() / 1000) };
      const newAlert: PriceAlert = {
        alertId,
        userId: user.uid,
        tokenSymbol: alertToken,
        tokenName: tokens.find(t => t.symbol === alertToken)?.name || alertToken,
        targetPrice: val,
        condition: alertCondition,
        status: "active",
        createdAt: createdAtValue,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) }
      };

      let currentAlerts = [...alerts];
      if (isEditing) {
        currentAlerts = currentAlerts.map(a => a.alertId === alertId ? newAlert : a);
      } else {
        currentAlerts.unshift(newAlert);
      }

      localStorage.setItem("zpredict_alerts_sandbox", JSON.stringify(currentAlerts));
      setAlerts(currentAlerts);
      setIsAlertModalOpen(false);
      setAlertPrice("");
      setEditingAlertId(null);
      setSavingAlert(false);
      return;
    }

    const docRef = doc(db, "alerts", alertId);
    const originalAlert = isEditing ? alerts.find(a => a.alertId === alertId) : null;
    const createdAtValue = originalAlert ? originalAlert.createdAt : serverTimestamp();

    try {
      await setDoc(docRef, {
        alertId,
        userId: user.uid,
        tokenSymbol: alertToken,
        tokenName: tokens.find(t => t.symbol === alertToken)?.name || alertToken,
        targetPrice: val,
        condition: alertCondition,
        status: "active",
        createdAt: createdAtValue,
        updatedAt: serverTimestamp()
      });
      setIsAlertModalOpen(false);
      setAlertPrice("");
      setEditingAlertId(null);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `alerts/${alertId}`);
      setModalError("Security rules violation or Firebase error encountered saving alert.");
    } finally {
      setSavingAlert(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (user?.isMock) {
      const currentAlerts = alerts.filter(a => a.alertId !== alertId);
      localStorage.setItem("zpredict_alerts_sandbox", JSON.stringify(currentAlerts));
      setAlerts(currentAlerts);
      return;
    }

    const docPath = `alerts/${alertId}`;
    try {
      await deleteDoc(doc(db, "alerts", alertId));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  const handleDeleteAllTriggeredAlerts = async () => {
    const triggeredAlerts = alerts.filter(alert => alert.status === "triggered" || checkAlertTriggered(alert));
    if (triggeredAlerts.length === 0) return;
    
    if (user?.isMock) {
      const remainingAlerts = alerts.filter(alert => alert.status !== "triggered" && !checkAlertTriggered(alert));
      localStorage.setItem("zpredict_alerts_sandbox", JSON.stringify(remainingAlerts));
      setAlerts(remainingAlerts);
      return;
    }

    try {
      await Promise.all(
        triggeredAlerts.map(alert => deleteDoc(doc(db, "alerts", alert.alertId)))
      );
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, "alerts/batch");
    }
  };

  const checkAlertTriggered = (alert: PriceAlert) => {
    if (alert.status === "paused") return false;
    if (alert.status === "triggered") return true;

    const token = tokens.find(t => t.symbol === alert.tokenSymbol);
    if (!token) return false;
    if (alert.condition === "above") {
      return token.priceUsd >= alert.targetPrice;
    } else {
      return token.priceUsd <= alert.targetPrice;
    }
  };

  // Request Desktop Notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(err => console.warn("Notification request failed:", err));
    }
  }, []);

  // Monitor alerts for real-time status transitions and fire browser notifications
  useEffect(() => {
    if (!user || alerts.length === 0) return;

    alerts.forEach((alert) => {
      if (alert.status === "active") {
        const token = tokens.find(t => t.symbol === alert.tokenSymbol);
        if (!token) return;

        let isTriggeredNow = false;
        if (alert.condition === "above") {
          isTriggeredNow = token.priceUsd >= alert.targetPrice;
        } else {
          isTriggeredNow = token.priceUsd <= alert.targetPrice;
        }

        if (isTriggeredNow) {
          // 1. Dispatch custom browser notification if user selected desktop subscribe
          if (pushSubscribed && "Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(`zPredict Threshold Alert!`, {
                body: `${alert.tokenSymbol} matched your target at $${alert.targetPrice.toLocaleString()} (Current: $${token.priceUsd.toLocaleString()})`,
              });
            } catch (err) {
              console.error("Browser notification failed to fire:", err);
            }
          }

          // 2. Dispatch simulated custom on-screen push toast
          if (pushSubscribed) {
            const newToastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            setSimulatedPushToasts(prev => [
              {
                id: newToastId,
                tokenSymbol: alert.tokenSymbol,
                condition: alert.condition,
                targetPrice: alert.targetPrice,
                currentPrice: token.priceUsd,
                timestamp: new Date()
              },
              ...prev
            ]);
          }

          if (user?.isMock) {
            const updatedAlerts = alerts.map(a => a.alertId === alert.alertId ? { ...a, status: "triggered", updatedAt: { seconds: Math.floor(Date.now() / 1000) } } as PriceAlert : a);
            localStorage.setItem("zpredict_alerts_sandbox", JSON.stringify(updatedAlerts));
            setAlerts(updatedAlerts);
          } else {
            // 3. Lock status shift to Firestore
            const docPath = `alerts/${alert.alertId}`;
            updateDoc(doc(db, "alerts", alert.alertId), {
              status: "triggered",
              updatedAt: serverTimestamp()
            }).catch((err) => {
              console.error("Firestore error transitioning status to triggered:", err);
            });
          }
        }
      }
    });
  }, [alerts, user, tokens, pushSubscribed]);

  const handleTogglePauseAlert = async (alert: PriceAlert) => {
    const nextStatus = alert.status === "paused" ? "active" : "paused";
    if (user?.isMock) {
      const updatedAlerts = alerts.map(a => a.alertId === alert.alertId ? { ...a, status: nextStatus, updatedAt: { seconds: Math.floor(Date.now() / 1000) } } as PriceAlert : a);
      localStorage.setItem("zpredict_alerts_sandbox", JSON.stringify(updatedAlerts));
      setAlerts(updatedAlerts);
      return;
    }

    const docPath = `alerts/${alert.alertId}`;
    try {
      await updateDoc(doc(db, "alerts", alert.alertId), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  const handleExportAlerts = () => {
    if (alerts.length === 0) return;
    const cleanAlerts = alerts.map(({ alertId, symbol, targetPrice, currentPriceAtCreation, condition, status, createdAt }) => ({
      alertId,
      symbol,
      targetPrice,
      currentPriceAtCreation,
      condition,
      status,
      createdAt: createdAt ? new Date((createdAt as any).seconds * 1000).toISOString() : new Date().toISOString()
    }));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanAlerts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zpredict_alerts_offline_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Wallet Portfolio State and Calculations
  const [walletAssetsState, setWalletAssetsState] = useState([
    { symbol: "BTC", amount: 0.15, color: "#f59e0b" },
    { symbol: "ETH", amount: 1.8, color: "#6366f1" },
    { symbol: "SOL", amount: 12.5, color: "#10b981" },
    { symbol: "ZPRED", amount: 5000, color: "#06b6d4" },
    { symbol: "USDC", amount: 750, color: "#3b82f6" }
  ]);

  const handleReindexPortfolio = () => {
    setWalletAssetsState(prev => prev.map(asset => {
      // Simulate on-chain flux by recalculating around ±15% of asset amounts
      const changePercent = 0.85 + Math.random() * 0.3;
      const rawVal = asset.amount * changePercent;
      let amount = parseFloat(rawVal.toFixed(2));
      if (asset.symbol === "BTC") {
        amount = parseFloat(rawVal.toFixed(4));
      } else if (asset.symbol === "ZPRED") {
        amount = Math.round(rawVal);
      }
      return { ...asset, amount: Math.max(0.001, amount) };
    }));
  };

  const handleExecuteTargetRebalance = () => {
    const totalWeightsSum = (Object.values(targetWeights) as number[]).reduce((a, b) => a + b, 0);
    const scaleFactor = totalWeightsSum > 0 ? 100 / totalWeightsSum : 1;
    
    setWalletAssetsState(prev => prev.map(asset => {
      const rawTargetWt = targetWeights[asset.symbol] || 0;
      const normalizedWeightFraction = (rawTargetWt * scaleFactor) / 100;
      const targetValUsd = normalizedWeightFraction * totalPortfolioValue;
      
      const tokenInfo = tokens.find(t => t.symbol === asset.symbol);
      const price = tokenInfo ? tokenInfo.priceUsd : 1.0;
      let newAmount = price > 0 ? targetValUsd / price : 0;
      
      let finalAmount = parseFloat(newAmount.toFixed(2));
      if (asset.symbol === "BTC") {
        finalAmount = parseFloat(newAmount.toFixed(4));
      } else if (asset.symbol === "ZPRED") {
        finalAmount = Math.round(newAmount);
      }
      return { ...asset, amount: Math.max(0.001, finalAmount) };
    }));
  };

  const processedAssets = walletAssetsState.map(asset => {
    const tokenInfo = tokens.find(t => t.symbol === asset.symbol);
    const price = tokenInfo ? tokenInfo.priceUsd : 0;
    const valueUsd = asset.amount * price;
    return {
      ...asset,
      price,
      valueUsd
    };
  });

  const totalPortfolioValue = processedAssets.reduce((sum, asset) => sum + asset.valueUsd, 0);

  const pieChartData = processedAssets.map(asset => ({
    name: asset.symbol,
    value: asset.valueUsd,
    color: asset.color,
    amount: asset.amount,
    percentage: totalPortfolioValue > 0 ? (asset.valueUsd / totalPortfolioValue) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // Total Portfolio Value history tracking states & computations
  const [portfolioTimeframe, setPortfolioTimeframe] = useState<"24H" | "7D" | "30D" | "90D" | "1Y">("7D");
  const portfolioHistoryData = React.useMemo(() => {
    const baseValue = totalPortfolioValue > 0 ? totalPortfolioValue : 23450;
    const seed = connectedWallet ? connectedWallet.charCodeAt(connectedWallet.length - 1) : 42;
    
    const generateCurve = (pointsCount: number, variance: number, trend: number) => {
      const data = [];
      for (let i = 0; i < pointsCount; i++) {
        const progress = i / (pointsCount - 1 || 1);
        const wave = Math.sin(progress * Math.PI * 1.8) * variance * baseValue;
        const noise = (Math.cos(progress * 5 + seed) * 0.3) * variance * baseValue;
        const trendEffect = progress * trend * baseValue;
        
        let val = baseValue * (1 - trend) + trendEffect + wave + noise;
        if (i === pointsCount - 1) {
          val = baseValue;
        }
        val = Math.max(100, val);
        data.push(val);
      }
      return data;
    };

    if (portfolioTimeframe === "24H") {
      const vals = generateCurve(8, 0.02, 0.015);
      const times = ["09:00", "12:00", "15:00", "18:00", "21:00", "00:00", "03:00", "06:00"];
      return vals.map((v, idx) => ({
        label: times[idx],
        value: Math.round(v),
        tooltipLabel: `Today, ${times[idx]}`
      }));
    } else if (portfolioTimeframe === "7D") {
      const vals = generateCurve(7, 0.05, 0.04);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const reorderedDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        reorderedDays.push(dayNames[d.getDay()]);
      }
      return vals.map((v, idx) => ({
        label: reorderedDays[idx],
        value: Math.round(v),
        tooltipLabel: reorderedDays[idx]
      }));
    } else if (portfolioTimeframe === "30D") {
      const vals = generateCurve(15, 0.08, 0.09);
      return vals.map((v, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (14 - idx) * 2);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          label: dateStr,
          value: Math.round(v),
          tooltipLabel: dateStr
        };
      });
    } else if (portfolioTimeframe === "90D") {
      const vals = generateCurve(12, 0.12, 0.15);
      return vals.map((v, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - (11 - idx) * 8);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return {
          label: dateStr,
          value: Math.round(v),
          tooltipLabel: dateStr
        };
      });
    } else {
      const vals = generateCurve(12, 0.18, 0.25);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      const reorderedMonths = [];
      for (let i = 11; i >= 0; i--) {
        const mIdx = (currentMonth - i + 12) % 12;
        reorderedMonths.push(months[mIdx]);
      }
      return vals.map((v, idx) => ({
        label: reorderedMonths[idx],
        value: Math.round(v),
        tooltipLabel: `Month: ${reorderedMonths[idx]}`
      }));
    }
  }, [portfolioTimeframe, totalPortfolioValue, connectedWallet]);

  const portfolioStats = React.useMemo(() => {
    if (portfolioHistoryData.length === 0) return { min: 0, max: 0, change: 0, changePercent: 0 };
    const values = portfolioHistoryData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const start = values[0];
    const end = values[values.length - 1];
    const change = end - start;
    const changePercent = start > 0 ? (change / start) * 100 : 0;
    return { min, max, change, changePercent };
  }, [portfolioHistoryData]);

  // New Gas Calculator State
  const [calcNetwork, setCalcNetwork] = useState("eth");
  const [calcContractType, setCalcContractType] = useState<"swap" | "bridge" | "multi">("swap");
  const [calcSpeed, setCalcSpeed] = useState<"eco" | "std" | "instant">("std");

  // New Staking Simulator State
  const [stakeAsset, setStakeAsset] = useState<"ZPRED" | "ETH" | "SOL" | "BTC">("ZPRED");
  const [stakeAmount, setStakeAmount] = useState<string>("1000");
  const [stakeDays, setStakeDays] = useState<number>(365);

  // Security inspect state
  const [openSecId, setOpenSecId] = useState<string | null>("sec-1");

  const fetchAiPrediction = () => {
    setAiLoading(true);
    setAiAnalysisResult(null);

    // Simulated logical prediction calculation
    setTimeout(() => {
      const bullishIndex = Math.floor(Math.random() * 30) + 65; // 65% to 95%
      const volatility = (Math.random() * 4 + 1.2).toFixed(2);
      
      setAiAnalysisResult(
        `Analysis Engine results on ${selectedToken.name} suggest a ${bullishIndex}% Bullish Confidence Index. Volatility projection is locked at ${volatility}% over the next 48 hours. Support base has consolidated at $${(selectedToken.priceUsd * 0.97).toFixed(2)}, indicating highly favorable swap terms.`
      );
      setAiLoading(false);
    }, 1200);
  };

  const handleQuickSwap = (symbol: string) => {
    setSelectedSwapFrom(symbol);
    setActiveTab("swap");
  };

  // Gas Calculator computations
  const currentNetworkObject = networksList.find(n => n.id === calcNetwork) || networksList[0];
  const netGasLimit = calcContractType === "swap" ? 65000 : calcContractType === "bridge" ? 120000 : 250000;
  const speedMultiplier = calcSpeed === "eco" ? 0.85 : calcSpeed === "std" ? 1.0 : 1.35;
  const rawGwei = currentNetworkObject.gasPriceGwei * speedMultiplier;
  
  // Calculate raw cost in native currency (Gwei to Native coin)
  // For Ethereum: cost = limit * gwei * 10^-9
  // For simulation we use an adjusted multiplier for non-eth chains to keep them realistic yet intuitive
  const baseCostCrypto = (netGasLimit * rawGwei * 1e-9);
  
  // USD costs based on underlying coin prices
  const nativeRates: Record<string, number> = {
    eth: 3420.50,
    sol: 148.20,
    pol: 0.445,
    arb: 3420.50 // Arbitrum transactions inherit Ethereum values for execution estimates
  };
  const usdGasCost = baseCostCrypto * (nativeRates[calcNetwork] || 3000);

  const getGasDataForType = (type: "swap" | "bridge" | "multi") => {
    const limit = type === "swap" ? 65000 : type === "bridge" ? 120000 : 250000;
    const cryptoCost = limit * rawGwei * 1e-9;
    const usdCost = cryptoCost * (nativeRates[calcNetwork] || 3000);
    const ethCost = usdCost / 3420.50; // Eth rate
    return { limit, cryptoCost, usdCost, ethCost };
  };

  // Staking Simulator APY and Reward calculations
  const stakingAssetData = tokens.find(t => t.symbol === stakeAsset) || tokens[0];
  const getApyForSelection = () => {
    let base = stakeAsset === "ZPRED" ? 18.5 : stakeAsset === "ETH" ? 4.8 : stakeAsset === "SOL" ? 6.2 : 3.1;
    // Longer stake = better yield
    if (stakeDays >= 365) base += 2.5;
    if (stakeDays >= 1095) base += 5.0; // 3 years bonus
    return base;
  };
  const currentApy = getApyForSelection();
  const numericStakeAmt = parseFloat(stakeAmount) || 0;
  const rewardTokens = numericStakeAmt * (currentApy / 100) * (stakeDays / 365);
  const rewardUsdValue = rewardTokens * stakingAssetData.priceUsd;

  return (
    <div className="space-y-12" id="dashboard-container">
      
      {/* Hero Welcome Unit */}
      <section className="relative overflow-hidden glass-card rounded-3xl p-6 sm:p-10 shimmer-border">
        {/* Decorative orbs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-[0.04] select-none pointer-events-none hidden lg:block">
          <Zap className="w-72 h-72 text-cyan-400 fill-current" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="stat-badge">
            <span className="pulse-dot" />
            Live Multi-Chain Network
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.1]">
            <span className="text-gradient-hero">Trade, Bridge & Predict</span>
            <br />
            <span className="text-slate-300 text-2xl sm:text-4xl lg:text-5xl font-bold">Across Every Chain</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
            Swap tokens instantly, bridge across L1 & L2 networks, stake for rewards, and track your portfolio — all in one premium Web3 terminal.
          </p>

          {/* Live stats strip */}
          <div className="flex flex-wrap gap-4 sm:gap-6 pt-1">
            {[
              { label: "24h Volume", value: "$2.4B+" },
              { label: "Active Chains", value: "12" },
              { label: "Avg. Swap Time", value: "< 3s" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{stat.label}</span>
                <span className="text-lg font-display font-bold text-white">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
               id="dashboard-swap-cta"
               onClick={() => setActiveTab("swap")}
               className="btn-primary"
            >
              Start Trading
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
               id="dashboard-bridge-cta"
               onClick={() => setActiveTab("bridge")}
               className="btn-secondary"
            >
              Cross-Chain Bridge
            </button>
          </div>
        </div>
      </section>

      {/* Total Portfolio Value Historical Chart */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden glass-card-hover" id="portfolio-history-chart-card">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none select-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none select-none" />
        
        <div className="relative z-10 flex flex-col space-y-6">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Live Portfolio History Analytics
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
                Total Portfolio Valuation History
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                Track simulated wallet net asset coordinates across networks. Calculations aggregate dynamic coin valuations and real-time ledger records.
              </p>
            </div>
            
            {/* Timeframe selector */}
            <div className="flex items-center self-start md:self-auto bg-slate-900/50 p-1 rounded-xl border border-slate-800/80">
              {(["24H", "7D", "30D", "90D", "1Y"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setPortfolioTimeframe(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    portfolioTimeframe === range
                      ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900/20 p-4 rounded-2xl border border-slate-900/70">
            <div>
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Net Wallet Valuation</span>
              <span className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5 block">
                ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </span>
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">{portfolioTimeframe} Performance</span>
              <span className={`text-sm sm:text-base font-bold font-mono mt-1 flex items-center gap-1 ${
                portfolioStats.change >= 0 ? "text-emerald-400" : "text-rose-450"
              }`}>
                {portfolioStats.change >= 0 ? (
                  <TrendingUp className="w-4 h-4 shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 shrink-0" />
                )}
                {portfolioStats.change >= 0 ? "+" : ""}
                ${Math.abs(portfolioStats.change).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-xs font-normal">
                  ({portfolioStats.changePercent >= 0 ? "+" : ""}
                  {portfolioStats.changePercent.toFixed(2)}%)
                </span>
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Period High</span>
              <span className="text-sm sm:text-base font-bold text-slate-200 font-mono mt-1 block">
                ${portfolioStats.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Period Low</span>
               <span className="text-sm sm:text-base font-bold text-slate-200 font-mono mt-1 block">
                ${portfolioStats.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Area Chart visualization using Recharts */}
          <div className="h-72 w-full bg-slate-950/40 p-4 border border-slate-900/60 rounded-2xl relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                <XAxis 
                   dataKey="label" 
                   stroke="#64748b" 
                   fontSize={10} 
                   tickLine={false} 
                   axisLine={false} 
                   dy={10}
                />
                <YAxis 
                   stroke="#64748b" 
                   fontSize={10} 
                   tickLine={false} 
                   axisLine={false} 
                   domain={["auto", "auto"]}
                   tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                   dx={-10}
                />
                <Tooltip 
                   contentStyle={{
                     backgroundColor: "#020617",
                     borderColor: "#334155",
                     borderRadius: "12px",
                     boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                     fontFamily: "JetBrains Mono, monospace",
                     fontSize: "11px"
                   }}
                   itemStyle={{ color: "#22d3ee" }}
                   labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: "4px" }}
                   formatter={(value: any) => [`$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Portfolio Value"]}
                   labelFormatter={(label, items) => {
                     if (items && items[0]) {
                       return items[0].payload.tooltipLabel;
                     }
                     return label;
                   }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#colorPortfolioGradient)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPortfolio)" 
                  activeDot={{ r: 6, stroke: "#06b6d4", strokeWidth: 1, fill: "#ffffff" }}
                />
                {/* SVG gradient definition fallback */}
                <defs>
                  <linearGradient id="colorPortfolioGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick link action strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-900/60 pt-4">
             <span className="flex items-center gap-1.5 font-sans">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Disclaimer: Historical values are simulated based on index ratios. Connect self-custodial wallet coordinates anytime to adjust.
             </span>
             <div className="flex items-center gap-3">
               <button 
                 onClick={handleReindexPortfolio}
                 className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
               >
                 <RefreshCw className="w-3 h-3 animate-spin" />
                 Re-index Assets
               </button>
               <button 
                 onClick={() => {
                   const element = document.getElementById("portfolio-alerts-row");
                   if (element) element.scrollIntoView({ behavior: "smooth" });
                 }}
                 className="text-cyan-400 hover:underline font-bold font-sans"
               >
                 Manage Holdings
               </button>
             </div>
          </div>
        </div>
      </section>

      {/* Broad Ecosystem Directory - All Information About Our Website Services */}
      <section className="space-y-6" id="website-services-blueprints">
        <div className="space-y-1">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">Comprehensive System Blueprint</span>
          <h2 className="text-2xl font-bold text-white font-sans">Explore website modules & services</h2>
          <p className="text-xs sm:text-sm text-slate-400">Everything you can achieve with the peerless zPredict network, fully documented and connected.</p>
        </div>

        {/* Roadmap section */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Project Roadmap</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {['Q3 2025: Multi-chain swap live + Firestore isolation', 'Q4 2025: zPredict staking mainnet, loyalty points', 'Q1 2026: Cross-chain prediction markets, MEV protection', 'Q2 2026: Developer API v2 + mobile SDK'].map((item, i) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">{item}</div>
            ))}
          </div>
        </div>

        {/* Audit Report */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-300">Audited by <strong className="text-white">SecureAuditFirm</strong> – No critical issues found. <a href="#" className="text-cyan-400">View Report (PDF)</a></p>
            <button className="px-4 py-2 bg-indigo-900 text-white rounded-lg text-xs font-bold">Bug Bounty Program</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Swap */}
          <div className="group bg-slate-950 border border-slate-900 rounded-2xl p-5 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/30 flex items-center justify-center text-cyan-400 border border-cyan-900/40">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">Multi-Chain Token Swapper</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exchange between core native coins (ETH, BTC, SOL, ZPRED, USDC) instantly using smart router chains. Evaluates pool dynamic rates on-demand with realistic settlement responses.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("swap")}
              className="text-xs font-mono font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              Open Swap Interface <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 2: Bridge */}
          <div className="group bg-slate-950 border border-slate-900 rounded-2xl p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/30 flex items-center justify-center text-indigo-400 border border-indigo-900/40">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">L1 / L2 Collateral Bridging</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interoperability system backing digital assets across Ethereum, Solana, Polygon, and Arbitrum. Choose transaction routes, preview rates, and witness final checks.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("bridge")}
              className="text-xs font-mono font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              Open Cross-chain Bridge <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 3: Buy/Sell */}
          <div className="group bg-slate-950 border border-slate-900 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/30 flex items-center justify-center text-emerald-400 border border-emerald-900/40">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">Direct Checkout Gateway</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect traditional credit card details or ACH checking directions to execute bank purchases/disbursements. Mapped straight to on-chain wallet credentials.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("buysell")}
              className="text-xs font-mono font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              Launch Fiat Gateway <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 4: Dev API */}
          <div className="group bg-slate-950 border border-slate-900 rounded-2xl p-5 hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-violet-950/30 flex items-center justify-center text-violet-400 border border-violet-900/40">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">Developer Webhook Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate authenticated developer credentials to execute node simulations and fetch high-speed quote vectors from interactive API sandbox consoles.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("api")}
              className="text-xs font-mono font-bold text-violet-400 group-hover:text-violet-300 flex items-center gap-1 cursor-pointer"
            >
              Inspect Developer Portal <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 5: Insights Blog */}
          <div className="group bg-slate-950 border border-slate-900 rounded-2xl p-5 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-950/30 flex items-center justify-center text-amber-400 border border-amber-900/40">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">Market Publications & Blogs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Expert market reports, risk assessments, and blockchain security articles authored by zPredict quantitative developers and researchers.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("blogs")}
              className="text-xs font-mono font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              Read Researcher Insights <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Card 6: Firebase Transaction Logs */}
          <div className="group bg-slate-950 border border-slate-900 rounded-2xl p-5 hover:border-rose-500/40 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-rose-950/30 flex items-center justify-center text-rose-400 border border-rose-900/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-bold text-base text-white">Secure Ledger Database</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We synchronize authentic swap events into Google Cloud Firestore. Your profile credentials and historical ledger operations remain isolated in user blocks.
              </p>
            </div>
            <button
              onClick={user ? () => setActiveTab("profile") : () => {}}
              className="text-xs font-mono font-bold text-rose-400 group-hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              {user ? "View Isolated Profile" : "Profile Unregistered"} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>

      {/* Core Platform Index Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-cyan-950/40 border border-cyan-900/50 rounded-lg text-cyan-400 animate-pulse">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-mono text-slate-500 uppercase tracking-wider">DeFi Total Value Locked</span>
            <span className="text-2xl font-bold text-white font-sans mt-0.5 block">$1,442,890,150</span>
          </div>
        </div>

        <div className="p-6 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-950/40 border border-indigo-900/50 rounded-lg text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-mono text-slate-500 uppercase tracking-wider">zPredict 24h Trading Volume</span>
            <span className="text-2xl font-bold text-white font-sans mt-0.5 block">$342,880,410</span>
          </div>
        </div>

        <div className="p-6 bg-slate-950 border border-slate-900 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-mono text-slate-500 uppercase tracking-wider">Synchronized Pools</span>
            <span className="text-2xl font-bold text-white font-sans mt-0.5 block">4,812 Pools Active</span>
          </div>
        </div>
      </div>

      {/* Portfolis & Alert Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="portfolio-alerts-row">
        
        {/* Wallet Portfolio Section */}
        <section className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between" id="wallet-portfolio-card">
          <div className="space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Wallet className="w-5 h-5" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-sans">Simulated Wallet Portfolio</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-sans">Live share-ratio of on-chain assets distributed by market valuation pricing</p>
                </div>
              </div>
              
              {connectedWallet && (
                <button
                  id="reindex-portfolio-btn"
                  onClick={handleReindexPortfolio}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-900/50 text-[10px] sm:text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto hover:shadow-md hover:shadow-cyan-400/5"
                  title="Force re-indexing asset positions and trigger smooth percentage animations"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-index Assets
                </button>
              )}
            </div>

            {connectedWallet ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                
                {/* Donut Chart Container */}
                <div className="sm:col-span-5 h-56 flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          borderColor: "#1e293b",
                          borderRadius: "8px",
                          fontSize: "11px",
                          color: "#f8fafc"
                        }}
                        formatter={(value: any) => [`$${parseFloat(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, "Asset USD"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Absolute Centered Total USD Valuation */}
                  <div className="absolute text-center select-none pointer-events-none">
                    <span className="block text-[9px] font-mono uppercase text-slate-500">Valuation</span>
                    <span className="text-sm font-extrabold text-white font-mono">
                      ${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="block text-[8px] text-emerald-400 font-mono">USD Net</span>
                  </div>
                </div>

                {/* Legend list details */}
                <div className="sm:col-span-7 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {pieChartData.map((asset) => (
                    <div key={asset.name} className="flex flex-col p-2.5 bg-slate-900/40 rounded-xl border border-slate-900/60 hover:bg-slate-900/80 transition-all relative overflow-hidden group">
                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: asset.color }} />
                          <div>
                            <span className="font-bold text-xs text-white block uppercase">{asset.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {asset.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {asset.name}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-white block">
                            ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="font-mono text-[9px] text-slate-400 block">
                            {asset.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Smooth progress bar at bottom of card for smooth percentage transition */}
                      <div className="w-full bg-slate-950/60 h-1 mt-2 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full"
                          style={{ backgroundColor: asset.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${asset.percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 border border-dashed border-slate-900 rounded-2xl h-56 bg-slate-950/20">
                <div className="w-12 h-12 bg-cyan-950/20 text-cyan-400 border border-cyan-900/40 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-sm text-white">Visual Web3 Wallet Distribution</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto font-sans leading-relaxed">
                    Connect your EVM or Solana wallet to analyze mock digital assets and pricing distribution on real-time donut indices.
                  </p>
                </div>
                <button
                  id="connect-wallet-portfolio-btn"
                  onClick={onConnectWallet}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:opacity-90 text-slate-950 hover:text-slate-950 font-sans font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer animate-pulse"
                >
                  Link Wallet Coordinates
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Price Alerts Monitor Section */}
        <section className="lg:col-span-1 bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between" id="price-alerts-monitor-card">
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Bell className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">Threshold Alerts</h3>
                  <p className="text-[10px] text-slate-500 font-sans">Track target token swings in real-time</p>
                </div>
              </div>
            </div>

            {/* Simulated Push Subscription Control Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${pushSubscribed ? "bg-cyan-950/40 text-cyan-400" : "bg-slate-950 text-slate-600"}`}>
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-sans font-bold text-white truncate">Push Notifications</span>
                  <span className="block text-[8px] font-mono text-slate-500 truncate">{pushSubscribed ? "Mock Push System Running" : "Notifications Disabled"}</span>
                </div>
              </div>
              <button
                onClick={() => setPushSubscribed(!pushSubscribed)}
                className={`p-1 px-2 rounded-lg shrink-0 text-[9px] font-mono font-bold transition-all cursor-pointer uppercase ${
                  pushSubscribed 
                    ? "bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/20" 
                    : "bg-slate-950 hover:bg-slate-900 text-slate-500 border border-slate-800/60"
                }`}
              >
                {pushSubscribed ? "Subscribed" : "Paused"}
              </button>
            </div>

            {/* Simulated Live Price Volatility Sandbox Trigger */}
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-450 animate-pulse" /> Sandbox Controller
                </span>
                <span className="text-[8px] text-slate-500 font-sans">Trigger alerts instantly</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTokens(prev => prev.map(t => t.symbol === "BTC" ? { ...t, priceUsd: t.priceUsd * 1.015 } : t));
                  }}
                  className="py-1 px-2 bg-slate-950 hover:bg-slate-900 hover:text-cyan-400 border border-slate-800 hover:border-slate-700 rounded-lg text-[9px] font-mono flex justify-between items-center transition-all cursor-pointer text-slate-400"
                  title="Pump BTC price +1.5%"
                >
                  <span>BTC (+1.5%)</span>
                  <TrendingUp className="w-3 h-3 text-emerald-450" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTokens(prev => prev.map(t => t.symbol === "BTC" ? { ...t, priceUsd: t.priceUsd * 0.985 } : t));
                  }}
                  className="py-1 px-2 bg-slate-950 hover:bg-slate-900 hover:text-rose-450 border border-slate-800 hover:border-slate-700 rounded-lg text-[9px] font-mono flex justify-between items-center transition-all cursor-pointer text-slate-400"
                  title="Dump BTC price -1.5%"
                >
                  <span>BTC (-1.5%)</span>
                  <TrendingDown className="w-3 h-3 text-rose-450" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTokens(prev => prev.map(t => t.symbol === "ETH" ? { ...t, priceUsd: t.priceUsd * 1.02 } : t));
                  }}
                  className="py-1 px-2 bg-slate-950 hover:bg-slate-900 hover:text-cyan-400 border border-slate-800 hover:border-slate-700 rounded-lg text-[9px] font-mono flex justify-between items-center transition-all cursor-pointer text-slate-400"
                  title="Pump ETH price +2.0%"
                >
                  <span>ETH (+2.0%)</span>
                  <TrendingUp className="w-3 h-3 text-emerald-450" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTokens(prev => prev.map(t => t.symbol === "ETH" ? { ...t, priceUsd: t.priceUsd * 0.98 } : t));
                  }}
                  className="py-1 px-2 bg-slate-950 hover:bg-slate-900 hover:text-rose-450 border border-slate-800 hover:border-slate-700 rounded-lg text-[9px] font-mono flex justify-between items-center transition-all cursor-pointer text-slate-400"
                  title="Dump ETH price -2.0%"
                >
                  <span>ETH (-2.0%)</span>
                  <TrendingDown className="w-3 h-3 text-rose-450" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Alert Feeds list</span>
              
              {user && (
                <div className="flex items-center gap-1.5">
                  {alerts.some(alert => alert.status === "triggered" || checkAlertTriggered(alert)) && (
                    <button
                      id="delete-all-triggered-alerts-btn"
                      onClick={handleDeleteAllTriggeredAlerts}
                      className="p-1 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/55 border border-rose-900/50 text-[10px] font-bold text-rose-450 hover:text-rose-400 flex items-center gap-1 transition-all cursor-pointer"
                      title="Delete all triggered alerts"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete All Triggered
                    </button>
                  )}

                  <select
                    id="alert-status-filter"
                    value={filterAlertStatus}
                    onChange={(e) => setFilterAlertStatus(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-lg focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                    title="Filter Alerts"
                  >
                    <option value="all">All Alerts</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="triggered">Triggered</option>
                  </select>

                  <select
                    id="alert-sort-selector"
                    value={sortAlertsBy}
                    onChange={(e) => setSortAlertsBy(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-lg focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                    title="Sort Alerts"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="targetPrice">Target Price</option>
                  </select>

                  {alerts.length > 0 && (
                    <button
                      id="export-price-alerts-btn"
                      onClick={handleExportAlerts}
                      className="p-1 px-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-900/50 text-[10px] font-bold text-indigo-400 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Export active alerts to JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Alerts
                    </button>
                  )}

                  <button
                    id="set-price-alert-quick-trigger"
                    onClick={handleOpenAlertModal}
                    className="p-1 px-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-900/50 text-[10px] font-bold text-cyan-400 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              )}
            </div>

            {!user ? (
              <div className="py-12 text-center space-y-3 bg-slate-900/25 rounded-2xl border border-dashed border-slate-900">
                <span className="block text-xs font-mono text-slate-500">Auth Sync Required</span>
                <p className="text-[10px] text-slate-650 max-w-xs mx-auto leading-relaxed px-4 font-sans">
                  Please register or log in with your credentials to store price threshold notifications in Firebase Firestore.
                </p>
                <button
                  onClick={() => {}}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer"
                >
                  Auth Unavailable
                </button>
              </div>
            ) : alertsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-slate-400">Checking alert registries...</span>
              </div>
            ) : alertsError ? (
              <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-350 rounded-xl text-[10px] font-mono">
                {alertsError}
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-900 rounded-2xl">
                <span className="block text-[10px] font-mono">No Active Alerts</span>
                <p className="text-[10px] text-slate-600 leading-relaxed px-4 font-sans max-w-xs mx-auto">
                  Create trigger alerts for assets like BTC, ETH, swap pairs, etc. to get synchronized alerts on target price levels.
                </p>
                <button
                  onClick={handleOpenAlertModal}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg text-[10px] text-slate-350 border border-slate-850 cursor-pointer font-bold inline-flex items-center gap-1 mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Create First Alert
                </button>
              </div>
             ) : (() => {
              const filteredAlerts = alerts.filter((alert) => {
                const isTriggered = checkAlertTriggered(alert);
                if (filterAlertStatus === "active") {
                  return alert.status === "active" && !isTriggered;
                }
                if (filterAlertStatus === "triggered") {
                  return alert.status === "triggered" || isTriggered;
                }
                if (filterAlertStatus === "paused") {
                  return alert.status === "paused";
                }
                return true;
              });

              // Apply sorting client-side
              const sortedAlerts = [...filteredAlerts].sort((a, b) => {
                if (sortAlertsBy === "targetPrice") {
                  return b.targetPrice - a.targetPrice;
                }
                const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt / 1000 : 0);
                const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt / 1000 : 0);
                return timeB - timeA;
              });

              if (sortedAlerts.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-500 space-y-2 border border-dashed border-slate-900 rounded-2xl">
                    <span className="block text-[10px] font-mono">No Matching Alerts</span>
                    <p className="text-[10px] text-slate-600 leading-relaxed px-4 font-sans max-w-xs mx-auto">
                      No alerts match selected filter combination of <strong className="text-cyan-400 capitalize">{filterAlertStatus}</strong>.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {sortedAlerts.map((alert) => {
                    const isTriggered = checkAlertTriggered(alert);
                    const isPaused = alert.status === "paused";
                    const currentPrice = tokens.find(t => t.symbol === alert.tokenSymbol)?.priceUsd || alert.targetPrice;
                    const pts = getSparklineData(alert.tokenSymbol, currentPrice);

                    const minVal = Math.min(...pts, alert.targetPrice);
                    const maxVal = Math.max(...pts, alert.targetPrice);
                    const paddingVal = (maxVal - minVal) * 0.1 || 1;
                    const minBound = minVal - paddingVal;
                    const maxBound = maxVal + paddingVal;
                    const rangeVal = maxBound - minBound;

                    const width = 60;
                    const height = 24;
                    const pointsString = pts.map((p, index) => {
                      const x = (index / 5) * width;
                      const y = height - ((p - minBound) / rangeVal) * height;
                      return `${x},${y}`;
                    }).join(" ");

                    const thresholdY = height - ((alert.targetPrice - minBound) / rangeVal) * height;
                    
                    return (
                      <motion.div 
                        key={alert.alertId} 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={isTriggered ? {
                          opacity: 1,
                          y: 0,
                          scale: [1, 1.012, 1],
                          borderColor: ["rgba(244, 63, 94, 0.25)", "rgba(244, 63, 94, 0.65)", "rgba(244, 63, 94, 0.25)"],
                          boxShadow: ["0 0 0 rgba(244, 63, 94, 0)", "0 0 10px rgba(244, 63, 94, 0.25)", "0 0 0 rgba(244, 63, 94, 0)"],
                          backgroundColor: ["rgba(244, 63, 94, 0.05)", "rgba(244, 63, 94, 0.16)", "rgba(244, 63, 94, 0.05)"]
                        } : isPaused ? {
                          opacity: 0.65,
                          y: 0,
                          scale: 1,
                          borderColor: "rgba(30, 41, 59, 0.4)",
                          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
                          backgroundColor: "rgba(15, 23, 42, 0.25)"
                        } : {
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          borderColor: "rgba(30, 41, 59, 1)",
                          boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
                          backgroundColor: "rgba(15, 23, 42, 0.5)"
                        }}
                        transition={isTriggered ? {
                          opacity: { duration: 0.3 },
                          y: { duration: 0.3 },
                          scale: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                          borderColor: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                          boxShadow: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                          backgroundColor: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                        } : {
                          duration: 0.3
                        }}
                        className="flex flex-col p-2.5 rounded-xl border transition-all"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-white uppercase">{alert.tokenSymbol}</span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.25 rounded-md ${
                                alert.condition === "above" 
                                  ? "bg-cyan-950/40 text-cyan-400 border border-cyan-900/30" 
                                  : "bg-amber-955/30 text-amber-500 border border-amber-900/30"
                              }`}>
                                {alert.condition.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate flex flex-wrap items-center gap-1.5">
                              <span>Target: <strong className="text-slate-200">${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong></span>
                              <span className="text-slate-650">•</span>
                              <span className="text-indigo-400 text-[9px]" title="Crossings in last 7 days">
                                {(() => {
                                    let crossings = 0;
                                    for (let i = 1; i < pts.length; i++) {
                                      if ((pts[i-1] <= alert.targetPrice && pts[i] > alert.targetPrice) ||
                                          (pts[i-1] >= alert.targetPrice && pts[i] < alert.targetPrice)) {
                                        crossings++;
                                      }
                                    }
                                    return crossings;
                                })()} Crossings
                              </span>
                              <span className="text-slate-650">•</span>
                              <span className="text-slate-550 text-[9px]" title={`Created at ${alert.createdAt ? new Date(alert.createdAt.seconds * 1000).toLocaleString() : 'just now'}`}>
                                {formatRelativeTime(alert.createdAt)}
                              </span>
                            </p>
                          </div>

                          {/* Sparkline trend indicator */}
                          <div className="flex flex-col items-center justify-center px-1.5 shrink-0 select-none" title="Sparkline relative to threshold line">
                            <svg width={width} height={height} className="overflow-visible">
                              {/* Dashed line representing trigger price */}
                              <line 
                                x1={0} 
                                y1={thresholdY} 
                                x2={width} 
                                y2={thresholdY} 
                                stroke={isPaused ? "#475569" : alert.condition === "above" ? "#06b6d4" : "#f59e0b"} 
                                strokeWidth={1} 
                                strokeDasharray="2,2" 
                                strokeOpacity={0.6}
                              />
                              {/* Sparkline curve */}
                              <polyline 
                                fill="none" 
                                stroke={isTriggered ? "#f43f5e" : isPaused ? "#475569" : "#cbd5e1"} 
                                strokeWidth={1.5} 
                                points={pointsString} 
                              />
                              {/* Small dots present current price */}
                              <circle 
                                cx={width} 
                                cy={height - ((currentPrice - minBound) / rangeVal) * height} 
                                r={2} 
                                fill={isTriggered ? "#f43f5e" : isPaused ? "#475569" : "#06b6d4"} 
                              />
                            </svg>
                            <span className="text-[7px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">7D Trend</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold border capitalize ${
                              isTriggered 
                                ? "bg-rose-950/30 text-rose-400 border-rose-900/40" 
                                : isPaused 
                                  ? "bg-slate-900/40 text-slate-500 border-slate-800"
                                  : "bg-cyan-950/20 text-cyan-400 border-cyan-950/40"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isTriggered 
                                  ? "bg-rose-400" 
                                  : isPaused 
                                    ? "bg-slate-600" 
                                    : "bg-cyan-400"
                              }`} />
                              <span className="hidden sm:inline">
                                {isTriggered ? "Triggered" : isPaused ? "Paused" : "Active"}
                              </span>
                            </span>

                            <button
                              onClick={() => setExpandedAlertId(prev => prev === alert.alertId ? null : alert.alertId)}
                              className={`p-1 hover:bg-slate-900 ${expandedAlertId === alert.alertId ? "text-cyan-400" : "text-slate-500"} rounded-lg transition-colors cursor-pointer`}
                              title="Toggle price history chart"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleTogglePauseAlert(alert)}
                              className="p-1 hover:bg-slate-900 hover:text-cyan-400 rounded-lg text-slate-500 transition-colors cursor-pointer"
                              title={isPaused ? "Resume threshold monitoring" : "Pause threshold monitoring"}
                            >
                              {isPaused ? (
                                <Play className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Pause className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleEditAlert(alert)}
                              className="p-1 hover:bg-slate-900 hover:text-cyan-400 rounded-lg text-slate-500 transition-colors cursor-pointer"
                              title="Edit Alert"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteAlert(alert.alertId)}
                              className="p-1 hover:bg-slate-900 hover:text-rose-400 rounded-lg text-slate-500 transition-colors cursor-pointer"
                              title="Remove alert"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {expandedAlertId === alert.alertId && (
                          <div className="mt-4 h-32 w-full bg-slate-900/40 rounded-lg p-2 border border-slate-800">
                             <h5 className="text-[9px] font-mono text-slate-400 mb-2 uppercase">24h Price History</h5>
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartDataOptions["24H"]}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                  <XAxis dataKey="time" hide />
                                  <YAxis hide domain={['auto', 'auto']} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                  />
                                  <Area type="monotone" dataKey="price" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} />
                                </AreaChart>
                             </ResponsiveContainer>
                          </div>
                        ) }
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      </div>

      {/* NEW INTERACTIVE FEATURE: ON-CHAIN WALLET ASSET ALLOCATION BREAKDOWN */}
      <section className="bg-slate-950 border border-slate-900 rounded-3xl p-6 md:p-8 space-y-6" id="wallet-allocation-breakdown-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-cyan-950/40 text-cyan-400">
                <Briefcase className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-white font-sans">Asset Allocation Analytics</h3>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Visualize, simulate, and rebalance asset allocation ratios inside your connected wallet ledger using real-time math models.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border capitalize ${
              connectedWallet 
                ? "bg-cyan-950/30 text-cyan-400 border-cyan-900/40" 
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}>
              <span className={`w-2 h-2 rounded-full ${connectedWallet ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`} />
              {connectedWallet ? "Active On-Chain Sync" : "On-Chain Offline"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Solid Pie Chart Visualization */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-900 p-5 rounded-2xl flex flex-col justify-between min-h-[360px] relative overflow-hidden">
            {!connectedWallet ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto py-10">
                <div className="w-12 h-12 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h4 className="text-sm font-bold text-white font-sans">Allocation Pipeline Offline</h4>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    Connect an EVM or Solana address coordinates to dynamically visualize portfolio asset weights using a solid pie chart.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onConnectWallet}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-cyan-950/55 uppercase tracking-wider"
                >
                  Sync Wallet coordinates
                </button>
              </div>
            ) : (
              <div className="space-y-4 w-full flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block mb-1">Live Portfolio Weights</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white font-sans">${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-slate-500 font-mono">Current Valuation</span>
                  </div>
                </div>

                {/* Solid Pie Chart render segment */}
                <div className="h-56 w-full flex items-center justify-center relative select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={0} // Solid block Pie Chart
                        paddingAngle={1.5}
                        stroke="#090d16"
                        strokeWidth={2}
                      >
                        {pieChartData.map((asset, index) => (
                          <Cell key={`cell-${index}`} fill={asset.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "8px", fontSize: "11px", color: "#f8fafc" }}
                        formatter={(value: any, name: any) => {
                          const assetObj = processedAssets.find(a => a.symbol === name);
                          const formattedValue = `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          const pct = totalPortfolioValue > 0 ? ((Number(value) / totalPortfolioValue) * 100).toFixed(1) : "0.0";
                          return [`${formattedValue} (${pct}%)`, name];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Elegant Custom Grid Legend */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-900/60 text-[10px] font-mono">
                  {pieChartData.map((asset) => (
                    <div key={asset.name} className="flex flex-col p-1.5 rounded-lg bg-slate-900/25 border border-slate-900/40">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                        <span className="font-bold text-white uppercase">{asset.name}</span>
                      </div>
                      <span className="text-slate-450 block mt-0.5">{asset.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Weighting Presets and Slider controls */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 font-bold uppercase block">Target Allocation Blueprints</span>
                <span className="text-[8px] font-sans text-slate-500">Normalizes to 100% automatically</span>
              </div>

              {/* Strategy Presets */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    name: "Safe Cushion",
                    desc: "60% Stablecoin",
                    weights: { BTC: 10, ETH: 10, SOL: 10, ZPRED: 10, USDC: 60 }
                  },
                  {
                    name: "Ultra Web3 Alpha",
                    desc: "Focus on ZPRED & SOL",
                    weights: { BTC: 10, ETH: 20, SOL: 30, ZPRED: 40, USDC: 0 }
                  },
                  {
                    name: "Macro Balance",
                    desc: "Equally distributed",
                    weights: { BTC: 25, ETH: 25, SOL: 25, ZPRED: 15, USDC: 10 }
                  }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setTargetWeights(preset.weights)}
                    className="p-2 sm:p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
                  >
                    <span className="block font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">{preset.name}</span>
                    <span className="block text-[8px] text-slate-500 font-sans mt-0.5 leading-tight">{preset.desc}</span>
                  </button>
                ))}
              </div>

              {/* Slider list */}
              <div className="space-y-3 pt-2">
                {["BTC", "ETH", "SOL"].map((sym) => {
                  const val = targetWeights[sym] || 0;
                  const color = sym === "BTC" ? "#f59e0b" : sym === "ETH" ? "#6366f1" : "#10b981";
                  const currentAsset = processedAssets.find(a => a.symbol === sym);
                  const currentWeight = currentAsset && totalPortfolioValue > 0 ? (currentAsset.valueUsd / totalPortfolioValue) * 100 : 0;

                  return (
                    <div key={sym} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-md" style={{ backgroundColor: color }} />
                          <span className="font-bold text-white uppercase">{sym} Allocation Target</span>
                          <span className="text-[9px] text-slate-500">Current: {currentWeight.toFixed(1)}%</span>
                        </div>
                        <span className="font-extrabold text-cyan-400 font-mono">{val}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="80"
                          step="5"
                          value={val}
                          onChange={(e) => {
                            const newPct = parseInt(e.target.value);
                            setTargetWeights(prev => {
                              const nextWeights = { ...prev, [sym]: newPct };
                              // Allocate the remainder to USDC and ZPRED
                              const fixedSum = nextWeights.BTC + nextWeights.ETH + nextWeights.SOL;
                              const remainder = Math.max(0, 100 - fixedSum);
                              // Split remainder between ZPRED (75%) and USDC (25%)
                              return {
                                ...nextWeights,
                                ZPRED: Math.round(remainder * 0.75),
                                USDC: Math.round(remainder * 0.25)
                              };
                            });
                          }}
                          className="flex-1 accent-cyan-400 bg-slate-950 rounded-lg cursor-pointer h-1.5"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Rebalancing Advisory Display */}
              {connectedWallet && (
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-450 uppercase tracking-wide">
                    <Activity className="w-3.5 h-3.5" /> Rebalancing Engine Recommendation
                  </div>
                  
                  <div className="space-y-1 text-[10.5px] font-mono leading-relaxed text-slate-400">
                    {(() => {
                      const totalWeights = (Object.values(targetWeights) as number[]).reduce((a, b) => a + b, 0);
                      const scaleFactor = totalWeights > 0 ? 100 / totalWeights : 1;
                      
                      const suggestions = processedAssets.map(asset => {
                        const targetWt = (targetWeights[asset.symbol] || 0) * scaleFactor;
                        const currentWt = totalPortfolioValue > 0 ? (asset.valueUsd / totalPortfolioValue) * 100 : 0;
                        const deviation = targetWt - currentWt;
                        
                        if (Math.abs(deviation) < 1.5) return null;
                        
                        const targetVal = (targetWt / 100) * totalPortfolioValue;
                        const deltaUsd = targetVal - asset.valueUsd;
                        
                        if (deltaUsd > 0) {
                          return {
                            symbol: asset.symbol,
                            type: "buy" as const,
                            amount: deltaUsd / asset.price,
                            usd: deltaUsd
                          };
                        } else {
                          return {
                            symbol: asset.symbol,
                            type: "sell" as const,
                            amount: Math.abs(deltaUsd) / asset.price,
                            usd: Math.abs(deltaUsd)
                          };
                        }
                      }).filter(Boolean);

                      if (suggestions.length === 0) {
                        return (
                          <p className="text-emerald-400 text-xs py-1 font-bold">
                            ✔ Current allocation perfectly aligns with your target blueprint! No swaps required.
                          </p>
                        );
                      }

                      return (
                        <ul className="space-y-1 divide-y divide-slate-950/40">
                          {suggestions.map((s, idx) => s && (
                            <li key={idx} className="pt-1 first:pt-0 flex flex-wrap justify-between items-center gap-2">
                              <span className="flex items-center gap-1">
                                <span className={`font-bold uppercase ${s.type === "buy" ? "text-cyan-400" : "text-amber-500"}`}>{s.type.toUpperCase()}</span>
                                <span className="font-extrabold text-white">{s.amount.toFixed(s.symbol === "BTC" ? 4 : s.symbol === "ZPRED" ? 0 : 2)} {s.symbol}</span>
                              </span>
                              <span className="text-slate-500">
                                Target deviation equivalent to: <strong className="text-slate-350">${s.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</strong>
                              </span>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {connectedWallet && (
              <button
                type="button"
                onClick={handleExecuteTargetRebalance}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold text-white rounded-xl tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all outline-hidden cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                <RefreshCw className="w-4 h-4 text-cyan-200 animate-spin-slow" />
                Execute Automated Rebalance Mock Simulation
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Dynamic Selection Chart Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dynamic Chart Panel */}
        <section className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            {/* Chart Control Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase font-mono tracking-wider">Asset Performance Index</span>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-xl font-bold text-white font-sans">
                    {selectedToken.name} ({selectedToken.symbol}/USD)
                  </h3>
                  <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                    selectedToken.change24h >= 0 
                      ? "text-emerald-400 bg-emerald-950/20 border border-emerald-900/40" 
                      : "text-rose-400 bg-rose-950/20 border border-rose-900/40"
                  }`}>
                    {selectedToken.change24h >= 0 ? "+" : ""}{selectedToken.change24h}%
                  </span>
                </div>
              </div>

              {/* Range Filters */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 border border-slate-800 rounded-lg">
                {(["24H", "7D", "30D"] as const).map((r) => (
                  <button
                    key={r}
                    id={`range-toggle-${r}`}
                    onClick={() => setActiveRange(r)}
                    className={`font-mono text-xs font-semibold px-2.5 py-1.5 rounded-md cursor-pointer transition-all ${
                      activeRange === r 
                        ? "bg-slate-950 border border-slate-800 text-cyan-400 shadow-xs" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Value */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight font-sans">
                  ${selectedToken.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className="text-xs font-mono text-slate-500 block mt-0.5">
                  Calculated on live web3 validators • Feed latency: 12ms UTC
                </span>
              </div>
              <button
                id="set-price-alert-trigger"
                onClick={handleOpenAlertModal}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4 text-cyan-400" />
                Set Price Alert
              </button>
            </div>
          </div>

          {/* Recharts Render Zone */}
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataOptions[activeRange]}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={['dataMin - 100', 'dataMax + 100']} 
                  stroke="#475569" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", color: "#f8fafc" }} 
                  formatter={(value: any) => [`$${value}`, "Index Value"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Prediction AI Model Widget */}
        <section className="bg-slate-950 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-sans font-bold text-base text-white">zPredict Trend Analysis</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Our automated forecasting engine evaluates slippage, native token volume metrics, network fees, and transaction liquidity to build an intuitive trend.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase">Cryptofeed Asset Target</label>
              <select
                id="metric-token-select"
                value={selectedToken.symbol}
                onChange={(e) => {
                  const item = tokens.find(t => t.symbol === e.target.value);
                  if (item) {
                     setSelectedToken(item);
                     setAiAnalysisResult(null);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-cyan-500"
              >
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol}>{token.name} ({token.symbol})</option>
                ))}
              </select>
            </div>

            {/* Display result */}
            {aiAnalysisResult ? (
              <div className="p-3 bg-cyan-950/30 border border-cyan-900/60 rounded-xl space-y-2 animate-scale-up">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Simulation Result Loaded
                </span>
                <p className="text-xs text-slate-350 leading-relaxed font-mono">
                  {aiAnalysisResult}
                </p>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <span className="block text-xs font-mono">Awaiting Forecast Trigger</span>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              id="forecast-calculate-btn"
              onClick={fetchAiPrediction}
              disabled={aiLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? "Reading Liquidity Swings..." : `Simulate Forecast parameters for ${selectedToken.symbol}`}
            </button>
          </div>
        </section>

      </div>

      {/* NEW INTERACTIVE FEATURE 1: MULTI-CHAIN GAS COST ESTIMATOR */}
      <section className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-6" id="gas-estimator-card">
        <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-900 pb-4">
          <Calculator className="w-5 h-5" />
          <div>
            <h3 className="text-lg font-bold text-white font-sans">Multi-Chain Gas Cost Estimator</h3>
            <p className="text-xs text-slate-500">Calculate live gas overhead before scheduling swaps or bridges on main contract addresses.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {/* Input 1: Network Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono tracking-wider text-slate-500 uppercase">Target Network Platform</label>
              <select
                value={calcNetwork}
                onChange={(e) => setCalcNetwork(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden"
              >
                {networksList.map((net) => (
                  <option key={net.id} value={net.id}>{net.name} (Base Gas: {net.gasPriceGwei} Gwei)</option>
                ))}
              </select>
            </div>

            {/* Input 2: Gas Limit Complexity */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono tracking-wider text-slate-500 uppercase">Transaction contract type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["swap", "bridge", "multi"] as const).map((type) => {
                  const limit = type === "swap" ? "65K gas" : type === "bridge" ? "120K gas" : "250K gas";
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCalcContractType(type)}
                      className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer text-xs border ${
                        calcContractType === type 
                          ? "bg-slate-900 border-cyan-400/60 text-white" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block capitalize font-bold">{type}</span>
                      <span className="text-[9px] font-mono text-slate-500">{limit}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input 3: Network Priority speed */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono tracking-wider text-slate-500 uppercase">Estimated speed target</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "eco", label: "Economy", desc: "~2.5 min" },
                  { id: "std", label: "Standard", desc: "~40 sec" },
                  { id: "instant", label: "Supercharger", desc: "~4 sec" }
                ].map((speed) => (
                  <button
                    key={speed.id}
                    type="button"
                    onClick={() => setCalcSpeed(speed.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer text-xs border ${
                      calcSpeed === speed.id 
                        ? "bg-slate-900 border-indigo-400/60 text-white" 
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="block font-bold">{speed.label}</span>
                    <span className="text-[9px] font-mono text-slate-500">{speed.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Widget */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Live cost projection</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl">
                  <span className="block text-[9px] font-mono text-slate-500">Estimated Gas Price</span>
                  <span className="text-lg font-bold text-white font-sans block mt-1">{rawGwei.toFixed(2)} Gwei</span>
                </div>

                <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl">
                  <span className="block text-[9px] font-mono text-slate-500">Estimated Crypto Cost</span>
                  <span className="text-lg font-bold text-cyan-400 font-mono block mt-1 truncate">
                    {baseCostCrypto.toFixed(6)} {calcNetwork === "sol" ? "SOL" : "ETH"}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl col-span-2 sm:col-span-1">
                  <span className="block text-[9px] font-mono text-slate-500">Fiat Equivalent</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono block mt-1">
                    ${usdGasCost.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Graphical Meter representing relative congestion index */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Network Congestion Level:</span>
                  <span className={`font-bold ${usdGasCost < 1 ? "text-emerald-400" : usdGasCost < 8 ? "text-amber-400" : "text-rose-400"}`}>
                    {usdGasCost < 1 ? "Optimal (Very Low Fees)" : usdGasCost < 8 ? "Moderate" : "Heavy (Arbitrum Rollup advised)"}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${usdGasCost < 1 ? "bg-emerald-500" : usdGasCost < 8 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${Math.min(100, Math.max(10, (usdGasCost / 15) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-850">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Simulated estimates represent calculations backed by global validator pools. Gas fluctuations change in real-time.</span>
            </div>
          </div>
        </div>

        {/* Real-time Comparison Table */}
        <div className="mt-6 border border-slate-905 bg-slate-950/60 rounded-xl overflow-hidden font-sans">
          <div className="p-4 bg-slate-900/40 border-b border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Real-Time Gas Comparison Index</h4>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Live cost matrix for {currentNetworkObject.name} comparing transaction complexity formats.</p>
            </div>
            <span className="text-[9px] font-mono bg-cyan-950/40 border border-cyan-900/30 text-cyan-400 px-2.5 py-1 rounded-md uppercase shrink-0">
              Multiplier: {speedMultiplier.toFixed(2)}x
            </span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] uppercase font-mono text-slate-500 bg-slate-950/60">
                  <th className="p-3 pl-4">Transaction Format</th>
                  <th className="p-3">Gas Limit</th>
                  <th className="p-3">Required Gwei</th>
                  <th className="p-3">Cost in {calcNetwork.toUpperCase()}</th>
                  <th className="p-3 text-cyan-400 font-bold">Cost in USD ($)</th>
                  <th className="p-3 pr-4 text-indigo-400 font-bold">Equivalent in ETH</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { id: "swap", label: "Swap Contract Interaction", desc: "Native AMM automated routing" },
                  { id: "bridge", label: "Cross-Chain Bridge Tunnel", desc: "Liquidity lock-box state transfer" },
                  { id: "multi", label: "Multi-Chain Hub Swap", desc: "Complex multi-stage automated routing" }
                ] as const).map((row) => {
                  const stats = getGasDataForType(row.id);
                  return (
                    <tr key={row.id} className="border-b border-slate-900/40 hover:bg-slate-900/25 transition-colors text-xs font-mono text-slate-300">
                      <td className="p-3 pl-4">
                        <span className="block font-bold text-white text-[11px] font-sans">{row.label}</span>
                        <span className="block text-[9px] text-slate-500 font-sans mt-0.5">{row.desc}</span>
                      </td>
                      <td className="p-3 text-slate-400">{stats.limit.toLocaleString()}</td>
                      <td className="p-3 text-slate-400">{rawGwei.toFixed(2)}</td>
                      <td className="p-3 text-slate-400 font-bold">
                        {stats.cryptoCost.toFixed(6)} {calcNetwork.toUpperCase()}
                      </td>
                      <td className="p-3 text-emerald-400 font-extrabold">
                        ${stats.usdCost.toFixed(3)}
                      </td>
                      <td className="p-3 pr-4 text-indigo-400 font-semibold font-mono">
                        {stats.ethCost.toFixed(6)} ETH
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Structure Table */}
        <FeeTable />
      </section>

      {/* NEW INTERACTIVE FEATURE 2: STAKING YIELD (ROI) GENERATOR */}
      <section className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-6" id="staking-simulator-card">
        <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-900 pb-4">
          <Percent className="w-5 h-5" />
          <div>
            <h3 className="text-lg font-bold text-white font-sans">zPredict Staking Yield (ROI) Simulator</h3>
            <p className="text-xs text-slate-500">Stake your digital assets directly into dynamic security pools to generate optimized annual yields.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls - Left */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Input 1: Staking Asset Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono tracking-wider text-slate-500 uppercase">Staking Asset Node</label>
              <div className="grid grid-cols-4 gap-2">
                {(["ZPRED", "ETH", "SOL", "BTC"] as const).map((sym) => {
                  const label = sym === "ZPRED" ? "18.5% APY" : sym === "ETH" ? "4.8% APY" : sym === "SOL" ? "6.2% APY" : "3.1% APY";
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setStakeAsset(sym)}
                      className={`p-2 rounded-xl text-center transition-all cursor-pointer border ${
                        stakeAsset === sym 
                          ? "bg-cyan-950/40 border-cyan-400 text-white shadow-md shadow-cyan-950" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block font-bold text-xs font-mono">{sym}</span>
                      <span className="text-[8px] font-mono text-cyan-400 block mt-0.5">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input 2: Stake Amount Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono tracking-wider text-slate-500 uppercase">Input Principal Deposit</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="1000"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl font-mono text-sm focus:outline-hidden focus:border-cyan-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 uppercase font-mono">
                  {stakeAsset}
                </span>
              </div>
            </div>

            {/* Input 3: Duration Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 uppercase">
                <span>Staking Period Constraint</span>
                <span className="font-bold text-cyan-400">{stakeDays} Days (~{(stakeDays / 365).toFixed(1)} years)</span>
              </div>
              <input
                type="range"
                min="30"
                max="1095"
                step="30"
                value={stakeDays}
                onChange={(e) => setStakeDays(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-600">
                <span>30 Days (Min)</span>
                <span>365 Days (1 Yr)</span>
                <span>1095 Days (3 Yrs)</span>
              </div>
            </div>

          </div>

          {/* ROI Visualization - Right */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Dynamic Rewards Output</span>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-center">
                  <span className="block text-[9px] font-mono text-slate-500">Staking Base APY</span>
                  <span className="text-lg font-bold text-white block mt-1 font-mono">{currentApy.toFixed(1)}%</span>
                </div>

                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-center">
                  <span className="block text-[9px] font-mono text-slate-500">Principal Amount</span>
                  <span className="text-lg font-bold text-slate-300 block mt-1 font-mono">{numericStakeAmt.toLocaleString()}</span>
                </div>

                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-center">
                  <span className="block text-[9px] font-mono text-slate-500">Apy Earned Rewards</span>
                  <span className="text-lg font-bold text-cyan-400 block mt-1 font-mono truncate">+{rewardTokens.toFixed(3)}</span>
                </div>

                <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl text-center">
                  <span className="block text-[9px] font-mono text-slate-500">Rewards USD Value</span>
                  <span className="text-lg font-bold text-emerald-400 block mt-1 font-mono">${rewardUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Visual simulation gauge */}
              <div className="relative p-4 bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">Calculated Total Valuation:</span>
                  <span className="text-sm font-mono text-slate-400 block">
                    {numericStakeAmt.toLocaleString()} {stakeAsset} + <strong className="text-emerald-400">+{rewardTokens.toFixed(3)}</strong> = {(numericStakeAmt + rewardTokens).toLocaleString(undefined, { maximumFractionDigits: 4 })} {stakeAsset}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Equivalent to ${( (numericStakeAmt + rewardTokens) * stakingAssetData.priceUsd ).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                  </span>
                </div>

                {/* Simulated circle APY indicator */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                    <circle cx="32" cy="32" r="28" stroke="#22d3ee" strokeWidth="4" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 * (1 - (currentApy / 28))} />
                  </svg>
                  <span className="absolute text-[10px] font-bold font-mono text-cyan-400">{currentApy.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab("swap");
                setSelectedSwapFrom(stakeAsset);
              }}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-[11px] font-bold text-slate-300 rounded-xl tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors border border-slate-850 cursor-pointer"
            >
              Get {stakeAsset} on swapper <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* NEW INTERACTIVE FEATURE 3: SECURE FIRESTORE FIREWALL RULES INSIDER */}
      <section className="bg-slate-950 border border-slate-900 rounded-3xl p-6" id="zero-trust-inspect">
        <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-900 pb-4">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-lg font-bold text-white font-sans">Zero-Trust Security & Firestore Inspector</h3>
            <p className="text-xs text-slate-500">Inspect the backend architecture designed to isolate transaction records under standard security models.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Security FAQ Blueprint</span>
            
            {/* Accordion controllers */}
            <div className="space-y-2">
              {securityArchitectures.map((item) => {
                const isOpen = openSecId === item.id;
                const Icon = item.icon;
                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-xl transition-all ${
                      isOpen ? "bg-slate-900 border-indigo-500/30" : "bg-slate-950/40 border-slate-900 hover:border-slate-850"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenSecId(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs sm:text-sm font-semibold text-slate-200 focus:outline-hidden"
                    >
                      <span className="flex items-center gap-2 text-slate-100">
                        <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                        {item.title}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="p-3.5 pt-0 text-xs text-slate-400 border-t border-slate-900 font-sans leading-relaxed animate-scale-up">
                        {item.summary}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secure Rules Code Inspector Panel */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 uppercase">
                <span>Active Database Securing Schema</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Rules Active</span>
              </div>

              {/* Code simulation block */}
              <pre className="p-4 bg-slate-950 border border-slate-850 text-[11px] text-slate-300 font-mono rounded-xl leading-relaxed overflow-x-auto space-y-1 whitespace-pre">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow get: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }
    match /transactions/{txId} {
      allow read, create, update: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}`}
              </pre>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              The firestore security directives outlined above are compiled on Google Cloud servers to block arbitrary leaks. This isolates multi-token client histories securely inside your specific authenticated paths.
            </p>
          </div>
        </div>
      </section>

      {/* Asset Trading Ledger Listings */}
      <section className="bg-slate-950 border border-slate-900 rounded-3xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 font-sans border-b border-slate-900 pb-3">Active Cryptocoin Markets</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left" id="assets-table">
            <thead>
              <tr className="border-b border-slate-900 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="pb-3 pl-3">Coin Asset</th>
                <th className="pb-3 text-right">Price Index</th>
                <th className="pb-3 text-right">24h Fluctuation</th>
                <th className="pb-3 text-right">24h Volume</th>
                <th className="pb-3 text-right">Market Cap</th>
                <th className="pb-3 pr-3 text-right">Trading Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/50">
              {tokens.map((token) => (
                <tr 
                  key={token.symbol} 
                  className="group hover:bg-slate-900/30 transition-colors text-slate-300"
                >
                  <td className="py-4 pl-3">
                    <div 
                      onClick={() => {
                        setSelectedToken(token);
                        setAiAnalysisResult(null);
                      }}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500 transition-colors shrink-0">
                        <span className="font-bold text-xs font-mono">{token.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">{token.name}</span>
                        <span className="block text-[10px] font-mono text-slate-500">{token.symbol}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono text-sm text-white font-semibold">
                    ${token.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>
                  <td className="py-4 text-right">
                    <span className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
                      token.change24h >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {token.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {token.change24h >= 0 ? "+" : ""}{token.change24h}%
                    </span>
                  </td>
                  <td className="py-4 text-right font-mono text-xs text-slate-400">{token.volume24h}</td>
                  <td className="py-4 text-right font-mono text-xs text-slate-400">{token.marketCap}</td>
                  <td className="py-4 pr-3 text-right">
                    <button
                      id={`market-swap-action-${token.symbol}`}
                      onClick={() => handleQuickSwap(token.symbol)}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-cyan-400 hover:text-slate-950 text-xs font-semibold text-slate-300 rounded-md border border-slate-800 hover:border-transparent transition-all cursor-pointer"
                    >
                      Swap Pool
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Set Price Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-900 rounded-2xl p-6 shadow-2xl relative animate-scale-up">
            
            {/* Close Button */}
            <button
              onClick={() => setIsAlertModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 text-cyan-400 mb-5 pb-3 border-b border-slate-900">
              <Bell className="w-5 h-5" />
              <div>
                <h4 className="font-sans font-bold text-white text-sm">
                  {editingAlertId ? "Edit Price Threshold Alert" : "Set Price Threshold Alert"}
                </h4>
                <p className="text-[10px] text-slate-500 font-sans">Locks alert to Cloud Firestore storage</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              
              {/* Asset Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase">Target Digital Coin</label>
                <select
                  value={alertToken}
                  onChange={(e) => {
                    setAlertToken(e.target.value);
                    const sel = tokens.find(t => t.symbol === e.target.value);
                    if (sel) {
                      setAlertPrice(sel.priceUsd.toString());
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-cyan-500"
                >
                  {tokens.map((token) => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.name} ({token.symbol}) — ${token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition Setting */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase">Trigger Threshold Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertCondition("above")}
                    className={`py-2 rounded-xl text-center font-sans font-bold text-xs border cursor-pointer transition-all ${
                      alertCondition === "above"
                        ? "bg-cyan-950/40 border-cyan-400 text-cyan-400"
                        : "bg-slate-900 border-slate-850 text-slate-450 hover:text-white"
                    }`}
                  >
                    At or Above (↗)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertCondition("below")}
                    className={`py-2 rounded-xl text-center font-sans font-bold text-xs border cursor-pointer transition-all ${
                      alertCondition === "below"
                        ? "bg-amber-955/20 border-amber-500 text-amber-500"
                        : "bg-slate-900 border-slate-850 text-slate-450 hover:text-white"
                    }`}
                  >
                    At or Below (↘)
                  </button>
                </div>
              </div>

              {/* Price threshold value */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono tracking-wider text-slate-500 uppercase">Threshold Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-550 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-12 py-2 bg-slate-900 border border-slate-850 text-white font-mono text-xs rounded-xl focus:outline-hidden focus:border-cyan-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono uppercase font-bold">
                    USD
                  </span>
                </div>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-950/20 border border-rose-900 text-rose-350 text-[10px] font-mono rounded-xl">
                  {modalError}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="flex-1 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="save-price-alert-btn"
                onClick={handleSaveAlert}
                disabled={savingAlert}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-90 text-slate-950 hover:text-slate-950 text-xs font-sans font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {savingAlert ? "Saving Alert..." : editingAlertId ? "Update Alert" : "Lock Alert"}
              </button>
            </div>

          </div>
        </div>
      )}

      <FaqSection />

      <SwapPortalInfo context="dashboard" onNavigateToSwap={() => setActiveTab("swap")} />

      {/* FLOATING SIMULATED PUSH NOTIFICATIONS ON-SCREEN TOAST LIST */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {simulatedPushToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: 50, transition: { duration: 0.2 } }}
              className="bg-slate-950/95 border-2 border-cyan-500/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl pointer-events-auto flex gap-3 relative overflow-hidden"
            >
              {/* Sleek top micro matching banner */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-500" />
              
              <div className="p-2 bg-cyan-950/60 text-cyan-400 rounded-xl max-h-11 shrink-0 flex items-center justify-center">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>

              <div className="flex-1 space-y-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-cyan-400">Push Alert matched</span>
                  <span className="text-[8px] font-mono text-slate-500">{toast.timestamp.toLocaleTimeString()}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white font-sans flex items-center gap-1">
                    {toast.tokenSymbol} matched threshold!
                  </h4>
                  <p className="text-[10.5px] text-slate-400 font-sans leading-relaxed mt-0.5">
                    Target {toast.condition === "above" ? "above" : "below"} <strong className="text-white">${toast.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong> triggered at <span className="text-slate-200 font-mono font-bold">${toast.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSimulatedPushToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="absolute top-2 right-2 p-1 hover:bg-slate-900 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
