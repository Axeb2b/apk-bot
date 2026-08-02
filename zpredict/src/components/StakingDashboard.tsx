import React, { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend, ReferenceLine, LineChart, Line } from 'recharts';
import { Download, Bell, RefreshCw, TrendingUp, Info } from 'lucide-react';

interface StakingEvent {
  id: string;
  type: 'stake' | 'unstake';
  amount: number;
  timestamp: any;
  duration?: number;
  unstaked?: boolean;
}

interface RewardSnapshot {
  time: string;
  baseYield: number;
  bonusYield: number;
}

export default function StakingDashboard() {
  const { address } = useAccount();
  const [stakeAmount, setStakeAmount] = useState('');
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(4));
  const [stakingHistory, setStakingHistory] = useState<StakingEvent[]>([]);
  const [rewardHistory, setRewardHistory] = useState<RewardSnapshot[]>([]);
  const [viewType, setViewType] = useState<'cumulative' | 'daily'>('cumulative');
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [calcStakedAmount, setCalcStakedAmount] = useState<number>(0);
  const [calcDuration, setCalcDuration] = useState<number>(30); // days
  const [customApy, setCustomApy] = useState<number | ''>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFlexibleWithdrawal, setIsFlexibleWithdrawal] = useState(false);
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('simple');
  const [autoRestake, setAutoRestake] = useState(false);
  const effectiveInterestType = autoRestake ? 'compound' : interestType;
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [showBatchUnstakeModal, setShowBatchUnstakeModal] = useState(false);
  const [chartFilter, setChartFilter] = useState<'all' | 30 | 90 | 365>('all');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [compareDuration, setCompareDuration] = useState<number>(90);
  const [stakingNetworkFee, setStakingNetworkFee] = useState<number>(0);
  const [isVolatilityEnabled, setIsVolatilityEnabled] = useState(false);
  const { writeContract } = useWriteContract();

  useEffect(() => {
    const endDate = Date.now() + calcDuration * 24 * 60 * 60 * 1000;
    const timer = setInterval(() => {
      setTimeRemaining(Math.max(0, endDate - Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [calcDuration]);


  const chartData = React.useMemo(() => {
    if (viewType === 'daily') return rewardHistory;
    let cumulativeBase = 0;
    let cumulativeBonus = 0;
    return rewardHistory.map(h => {
      cumulativeBase += h.baseYield;
      cumulativeBonus += h.bonusYield;
      return { ...h, baseYield: cumulativeBase, bonusYield: cumulativeBonus };
    });
  }, [rewardHistory, viewType]);

  useEffect(() => {
    if (!address) return;
    
    // Reward animation simulator
    const interval = setInterval(() => {
      animate(count, count.get() + 0.0001, { duration: 0.5 });
    }, 1000);

    const isFirebaseAuthenticated = !!auth.currentUser;

    if (!isFirebaseAuthenticated) {
      // Local Sandbox Storage Fallback
      const keyEvents = `zpredict_staking_events_${address}`;
      const storedEvents = localStorage.getItem(keyEvents);
      if (storedEvents) {
        setStakingHistory(JSON.parse(storedEvents).map((e: any) => ({
          ...e,
          timestamp: { toDate: () => new Date(e.timestamp) }
        })));
      } else {
        setStakingHistory([]);
      }

      const keyRewards = `zpredict_reward_history_${address}`;
      const storedRewards = localStorage.getItem(keyRewards);
      if (storedRewards) {
        setRewardHistory(JSON.parse(storedRewards));
      } else {
        const defaultRewards = [
          { time: "09:00 AM", baseYield: 1.2, bonusYield: 0.3 },
          { time: "11:00 AM", baseYield: 2.5, bonusYield: 0.8 },
          { time: "01:00 PM", baseYield: 3.8, bonusYield: 1.4 },
          { time: "03:00 PM", baseYield: 5.4, bonusYield: 2.1 },
          { time: "05:00 PM", baseYield: 7.1, bonusYield: 3.0 }
        ];
        setRewardHistory(defaultRewards);
      }

      return () => {
        clearInterval(interval);
      };
    }

    // Fetch history from real Firebase
    const q = query(
      collection(db, 'stakingEvents'),
      where('user', '==', address),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStakingHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StakingEvent)));
    }, (err) => {
      console.warn("Firestore stakingEvents restricted. Falling back to local events.");
    });

    const rewardQuery = query(
      collection(db, 'rewardSnapshots'),
      where('user', '==', address),
      orderBy('timestamp', 'asc')
    );
    const unsubscribeRewards = onSnapshot(rewardQuery, (snapshot) => {
      setRewardHistory(snapshot.docs.map(doc => ({
        time: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        baseYield: doc.data().baseYield || 0,
        bonusYield: doc.data().bonusYield || 0
      })));
    }, (err) => {
      console.warn("Firestore rewardSnapshots restricted. Falling back to local rewards.");
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      unsubscribeRewards();
    };
  }, [address]);

  const exportCSV = () => {
    const headers = ['Type,Amount,Date'];
    const rows = stakingHistory.map(h => `${h.type},${h.amount},${h.timestamp?.toDate().toLocaleDateString()}`);
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'staking_history.csv';
    link.click();
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') setNotificationsEnabled(true);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || !address) return;

    if (!auth.currentUser) {
      // Local storage sandbox write
      const key = `zpredict_staking_events_${address}`;
      const stored = localStorage.getItem(key);
      const events = stored ? JSON.parse(stored) : [];
      const newEvent = {
        id: `staking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user: address,
        type: 'stake',
        amount: Number(stakeAmount),
        duration: calcDuration,
        timestamp: new Date().toISOString(),
        unstaked: false
      };
      events.unshift(newEvent);
      localStorage.setItem(key, JSON.stringify(events));
      setStakingHistory(events.map((e: any) => ({
        ...e,
        timestamp: { toDate: () => new Date(e.timestamp) }
      })));
      setStakeAmount('');
      return;
    }

    try {
      await addDoc(collection(db, 'stakingEvents'), {
        user: address,
        type: 'stake',
        amount: Number(stakeAmount),
        duration: calcDuration,
        timestamp: new Date(),
        unstaked: false
      });
      setStakeAmount('');
    } catch (e) {
      console.error('Error writing stake to db:', e);
    }
  };

  const seedDemoStakes = async () => {
    if (!address) return;

    if (!auth.currentUser) {
      // Local storage sandbox seeding
      const key = `zpredict_staking_events_${address}`;
      const stored = localStorage.getItem(key);
      const events = stored ? JSON.parse(stored) : [];
      const demoPositions = [
        { amount: 500, duration: 30 },
        { amount: 1500, duration: 90 },
        { amount: 3500, duration: 365 }
      ];
      for (const p of demoPositions) {
        events.unshift({
          id: `staking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user: address,
          type: 'stake',
          amount: p.amount,
          duration: p.duration,
          timestamp: new Date().toISOString(),
          unstaked: false
        });
      }
      localStorage.setItem(key, JSON.stringify(events));
      setStakingHistory(events.map((e: any) => ({
        ...e,
        timestamp: { toDate: () => new Date(e.timestamp) }
      })));
      return;
    }

    try {
      const demoPositions = [
        { amount: 500, duration: 30 },
        { amount: 1500, duration: 90 },
        { amount: 3500, duration: 365 }
      ];
      for (const p of demoPositions) {
        await addDoc(collection(db, 'stakingEvents'), {
          user: address,
          type: 'stake',
          amount: p.amount,
          duration: p.duration,
          timestamp: new Date(),
          unstaked: false
        });
      }
    } catch (e) {
      console.error('Error seeding positions:', e);
    }
  };

  const handleBatchUnstake = async () => {
    if (!address || selectedPositionIds.length === 0) return;

    if (!auth.currentUser) {
      // Local storage sandbox batch unstake
      const key = `zpredict_staking_events_${address}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        let events = JSON.parse(stored);
        const selectedStakes = events.filter((h: any) => selectedPositionIds.includes(h.id));
        events = events.map((e: any) => selectedPositionIds.includes(e.id) ? { ...e, unstaked: true } : e);
        
        for (const pos of selectedStakes) {
          events.unshift({
            id: `staking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            user: address,
            type: 'unstake',
            amount: pos.amount,
            timestamp: new Date().toISOString(),
            duration: pos.duration || 30
          });
        }
        localStorage.setItem(key, JSON.stringify(events));
        setStakingHistory(events.map((e: any) => ({
          ...e,
          timestamp: { toDate: () => new Date(e.timestamp) }
        })));
      }
      setSelectedPositionIds([]);
      setShowBatchUnstakeModal(false);
      return;
    }

    try {
      const selectedStakes = stakingHistory.filter(h => selectedPositionIds.includes(h.id));
      for (const pos of selectedStakes) {
        await updateDoc(doc(db, 'stakingEvents', pos.id), {
          unstaked: true
        });
        await addDoc(collection(db, 'stakingEvents'), {
          user: address,
          type: 'unstake',
          amount: pos.amount,
          timestamp: new Date(),
          duration: pos.duration || 30
        });
      }
      setSelectedPositionIds([]);
      setShowBatchUnstakeModal(false);
    } catch (e) {
      console.error('Error batch unstaking:', e);
    }
  };

  const handleIndividualUnstake = async () => {
    if (!address) return;
    if (!auth.currentUser) {
      const key = `zpredict_staking_events_${address}`;
      const stored = localStorage.getItem(key);
      const events = stored ? JSON.parse(stored) : [];
      events.unshift({
        id: `staking-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        user: address,
        type: 'unstake',
        amount: calcStakedAmount || 100,
        timestamp: new Date().toISOString(),
        duration: calcDuration
      });
      localStorage.setItem(key, JSON.stringify(events));
      setStakingHistory(events.map((e: any) => ({
        ...e,
        timestamp: { toDate: () => new Date(e.timestamp) }
      })));
    } else {
      try {
        await addDoc(collection(db, 'stakingEvents'), {
          user: address,
          type: 'unstake',
          amount: calcStakedAmount || 100,
          timestamp: new Date(),
          duration: calcDuration
        });
      } catch (e) {
        console.error(e);
      }
    }
    setShowUnstakeModal(false);
  };

  const APY_MAP: Record<number, number> = { 30: 5, 90: 8, 365: 15 };
  const apy = APY_MAP[calcDuration];
  const penaltyPercent = calcDuration > 90 ? 15 : calcDuration > 30 ? 10 : 5;

  const getPenaltyRateForDay = (day: number, maturity: number) => {
    if (day >= maturity) return 0;
    if (day <= 30) return 0.05;
    if (day <= 90) return 0.10;
    return 0.15;
  };

  const userActiveStakes = React.useMemo(() => {
    return stakingHistory.filter(h => h.type === 'stake' && !h.unstaked);
  }, [stakingHistory]);

  const growthData = React.useMemo(() => {
    const data = [];
    const rate = ((customApy !== '' ? Number(customApy) : apy) / 100);
    const dailyRate = rate / 365;

    const compApy = APY_MAP[compareDuration];
    const compRate = compApy / 100;
    const compDailyRate = compRate / 365;

    const maxDays = isComparisonMode ? Math.max(calcDuration, compareDuration) : calcDuration;

    for (let i = 0; i <= maxDays; i++) {
        const simpleValue = calcStakedAmount * dailyRate * i;
        const compoundValue = calcStakedAmount * (Math.pow(1 + dailyRate, i) - 1);
        const reward = effectiveInterestType === 'compound' ? compoundValue : simpleValue;

        const rewardMin = reward * 0.95;
        const rewardMax = reward * 1.05;
        const netProfitMin = rewardMin - stakingNetworkFee;
        const netProfitMax = rewardMax - stakingNetworkFee;

        const compSimpleValue = calcStakedAmount * compDailyRate * i;
        const compCompoundValue = calcStakedAmount * (Math.pow(1 + compDailyRate, i) - 1);
        const compareReward = effectiveInterestType === 'compound' ? compCompoundValue : compSimpleValue;

        data.push({ 
            day: i, 
            reward: i <= calcDuration ? reward : null,
            rewardMin: i <= calcDuration ? rewardMin : null,
            rewardMax: i <= calcDuration ? rewardMax : null,
            netProfit: i <= calcDuration ? (reward - stakingNetworkFee) : null,
            netProfitMin: i <= calcDuration ? netProfitMin : null,
            netProfitMax: i <= calcDuration ? netProfitMax : null,
            netProfitRange: i <= calcDuration ? [netProfitMin, netProfitMax] : null,
            compareReward: (isComparisonMode && i <= compareDuration) ? compareReward : null,
            compareNetProfit: (isComparisonMode && i <= compareDuration) ? (compareReward - stakingNetworkFee) : null,
            apyTrajectory: effectiveInterestType === 'compound' ? simpleValue : compoundValue
        });
    }
    return data;
  }, [calcStakedAmount, calcDuration, apy, customApy, effectiveInterestType, isComparisonMode, compareDuration, stakingNetworkFee, isVolatilityEnabled]);

  const filteredGrowthData = React.useMemo(() => {
    if (chartFilter === 'all') return growthData;
    return growthData.filter(d => d.day <= (chartFilter as number));
  }, [growthData, chartFilter]);

  const breakEvenDay = React.useMemo(() => {
    if (calcStakedAmount <= 0) return null;
    for (const point of growthData) {
      if (point.reward === null || point.day > calcDuration) continue;
      const penaltyRate = getPenaltyRateForDay(point.day, calcDuration);
      const penaltyVal = calcStakedAmount * penaltyRate;
      if (point.reward >= penaltyVal + stakingNetworkFee) {
        return point.day;
      }
    }
    return null;
  }, [growthData, calcStakedAmount, calcDuration, stakingNetworkFee]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">ZPRED Staking</h3>
          {!address ? (
            <p className="text-slate-400">Please connect wallet to stake.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-sm">Earned Rewards</span>
                <motion.span className="text-2xl font-mono text-cyan-400 font-bold">
                  {rounded} ZPRED
                </motion.span>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Amount to stake"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
                <button 
                  onClick={handleStake}
                  className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500"
                >
                  Stake ZPRED
                </button>
                <button 
                  onClick={() => setShowUnstakeModal(true)}
                  className="w-full py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-500"
                >
                  Unstake ZPRED
                </button>
              </div>
            </div>
          )}
        </div>

        {/* APY Radial Gauge */}
        <div className="glass-card rounded-2xl p-6 flex items-center justify-center">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" r="70" className="stroke-slate-800" strokeWidth="12" fill="none" />
                    <motion.circle 
                        cx="80" cy="80" r="70" className="stroke-cyan-500" strokeWidth="12" fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: apy / 50 }}
                        strokeDasharray="440"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{apy}%</span>
                    <span className="text-slate-400 text-xs">APY</span>
                </div>
            </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Staking Simulator/Calculator */}
        <motion.div 
            id="staking-simulator-card" 
            className="bg-slate-900/40 border rounded-2xl p-6"
            animate={{
              borderColor: calcDuration >= 90 ? ['#1e293b', '#06b6d4', '#1e293b'] : '#1e293b',
              boxShadow: calcDuration >= 90 ? ['0 0 0px rgba(6, 182, 212, 0)', '0 0 15px rgba(6, 182, 212, 0.3)', '0 0 0px rgba(6, 182, 212, 0)'] : 'none'
            }}
            transition={{
              repeat: calcDuration >= 90 ? Infinity : 0,
              duration: 2
            }}
        >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Rewards Projection</span>
                {autoRestake && (
                  <span className="inline-flex items-center gap-1 text-cyan-400 text-xs bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20 font-medium animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Auto-Restake
                  </span>
                )}
              </h3>
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                calcDuration > 100 ? 'bg-emerald-900 text-emerald-300' : 
                calcDuration > 30 ? 'bg-amber-900 text-amber-300' : 'bg-rose-900 text-rose-300'
              }`}>
                {calcDuration > 100 ? 'MATURED' : calcDuration > 30 ? 'EXPIRING' : 'ACTIVE'}
              </span>
            </div>
            <div className="space-y-4">
                 <div className="flex flex-col gap-2">
                     <label className="text-slate-400 text-sm">Stake Amount (ZPRED)</label>
                     <input type="number" onChange={(e) => setCalcStakedAmount(Number(e.target.value))} placeholder="0.00" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white" />
                 </div>
                 <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                         <label className="text-slate-400 text-sm font-semibold">Lock-up Period</label>
                         <span className="text-xs text-rose-400 font-mono">Select Duration</span>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                         {[30, 90, 365].map((d) => (
                             <button
                                 key={d}
                                 type="button"
                                 onClick={() => setCalcDuration(d)}
                                 className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                                     calcDuration === d
                                         ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                                         : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                 }`}
                             >
                                  <div className="flex items-center justify-between w-full">
                                      <span>{d === 365 ? '365d (1 Yr)' : `${d}d`}</span>
                                      <div className="relative group/tooltip inline-flex items-center">
                                          <Info className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 transition-colors cursor-help" />
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-950 border border-slate-800 text-[11px] font-sans text-slate-300 rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 text-left normal-case whitespace-normal leading-normal font-normal">
                                              <div className="font-bold text-white mb-1">{d === 365 ? '365-Day Lock' : `${d}-Day Lock`}</div>
                                              <div className="space-y-1 text-slate-400">
                                                  <div className="flex justify-between border-b border-slate-900 pb-1">
                                                      <span>APY Rate:</span>
                                                      <span className="text-cyan-400 font-mono font-bold">{d === 30 ? '5%' : d === 90 ? '8%' : '15%'}</span>
                                                  </div>
                                                  <div className="flex justify-between border-b border-slate-900 pb-1">
                                                      <span>Early Penalty:</span>
                                                      <span className="text-rose-400 font-mono font-bold">{d === 30 ? '5%' : d === 90 ? '10%' : '15%'}</span>
                                                  </div>
                                                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                                      {d === 30 && "Early withdrawal before 30-day maturity threshold results in a flat 5% deduction."}
                                                      {d === 90 && "Early unstaking before 90-day maturity threshold incurs a 10% penalty."}
                                                      {d === 365 && "Early unstaking before 365-day maturity threshold incurs a 15% penalty."}
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                             </button>
                         ))}
                     </div>
                     <select 
                         value={calcDuration}
                         onChange={(e) => setCalcDuration(Number(e.target.value))} 
                         className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                     >
                         <option value={30}>30 Days</option>
                         <option value={90}>90 Days</option>
                         <option value={365}>1 Year</option>
                     </select>
                 </div>
                 <div className="flex flex-col gap-2">
                     <label className="text-slate-400 text-sm">APY (%)</label>
                     <input type="number" value={customApy} onChange={(e) => setCustomApy(e.target.value === '' ? '' : Number(e.target.value))} placeholder={apy?.toString()} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono" />
                  </div>
                  <div className="flex flex-col gap-2">
                      <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Interest Trajectory Mode</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 border border-slate-800 rounded-lg">
                          <button
                              type="button"
                              onClick={() => !autoRestake && setInterestType('simple')}
                              disabled={autoRestake}
                              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                                  effectiveInterestType === 'simple'
                                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                      : 'text-slate-400 hover:text-slate-200'
                              } ${autoRestake ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                              Simple Interest
                          </button>
                          <button
                              type="button"
                              onClick={() => !autoRestake && setInterestType('compound')}
                              disabled={autoRestake}
                              className={`py-1.5 text-xs font-bold rounded-md transition-all ${
                                  effectiveInterestType === 'compound'
                                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                      : 'text-slate-400 hover:text-slate-200'
                              } ${autoRestake ? 'opacity-75 cursor-not-allowed' : ''}`}
                          >
                              Compound (Daily)
                          </button>
                      </div>
                 </div>

                  <div className="p-3 bg-slate-950/45 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex flex-col">
                          <span className="text-slate-200 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${autoRestake ? 'animate-spin' : ''}`} />
                              <span>Auto-Restake Rewards</span>
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">Automatically compounds interest (forces compound model)</span>
                      </div>
                      <button 
                          type="button"
                          onClick={() => setAutoRestake(!autoRestake)}
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${autoRestake ? 'bg-cyan-500' : 'bg-slate-800'}`}
                      >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${autoRestake ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                  </div>
                 <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 text-sm">Flexible Withdrawal</span>
                  </div>

                 <div className="p-3 bg-slate-950/45 border border-slate-800 rounded-lg flex items-center justify-between">
                     <div className="flex flex-col">
                         <span className="text-slate-200 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                             <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                             <span>Volatility Sensitivity</span>
                         </span>
                         <span className="text-[10px] text-slate-500 mt-0.5">Enables ±5% reward variance projection area</span>
                     </div>
                     <button 
                         type="button"
                         onClick={() => setIsVolatilityEnabled(!isVolatilityEnabled)}
                         className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${isVolatilityEnabled ? 'bg-amber-500' : 'bg-slate-800'}`}
                     >
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isVolatilityEnabled ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                     </button>
                 </div>

                  <div className="flex flex-col gap-2 mt-4">
                      <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Staking Network Fee (ZPRED)</label>
                      <input 
                          type="number" 
                          value={stakingNetworkFee === 0 ? '' : stakingNetworkFee} 
                          onChange={(e) => setStakingNetworkFee(e.target.value === '' ? 0 : Number(e.target.value))} 
                          placeholder="0.00" 
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500" 
                      />
                  </div>

                  <div className="p-3 bg-slate-950/45 border border-slate-800/80 rounded-lg space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                         <span className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                             <span>Comparison Mode</span>
                             <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/20 uppercase font-mono tracking-wider font-bold">New</span>
                         </span>
                         <button 
                             type="button"
                             onClick={() => setIsComparisonMode(!isComparisonMode)}
                             className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isComparisonMode ? 'bg-purple-600' : 'bg-slate-800'}`}
                         >
                             <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isComparisonMode ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                      </div>
                      {isComparisonMode && (
                         <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
                             <span className="text-slate-400 text-[11px]">Compare with:</span>
                             <div className="flex gap-1.5">
                                 {[30, 90, 365].map((d) => (
                                     <button
                                         key={d}
                                         type="button"
                                         onClick={() => setCompareDuration(d)}
                                         disabled={d === calcDuration}
                                         className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all border ${
                                             compareDuration === d
                                                 ? 'bg-purple-600/25 border-purple-500 text-purple-300'
                                                 : d === calcDuration
                                                     ? 'opacity-40 cursor-not-allowed border-transparent text-slate-600'
                                                     : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                         }`}
                                     >
                                         {d}d
                                     </button>
                                 ))}
                             </div>
                         </div>
                      )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950/45 border border-slate-800 rounded-lg mt-4" style={{ display: 'none' }}>
                     <span className="text-slate-500 text-xs font-semibold">Early Unstake Flexible Override</span>
                    <button 
                        onClick={() => setIsFlexibleWithdrawal(!isFlexibleWithdrawal)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${isFlexibleWithdrawal ? 'bg-cyan-600' : 'bg-slate-800'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isFlexibleWithdrawal ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>
                 
                 {isFlexibleWithdrawal && (
                     <div className="space-y-2 mt-2">
                        <h4 className="text-sm text-slate-400">Potential Penalty Fees</h4>
                        <div className="text-xs text-slate-500 border border-slate-800 rounded-lg overflow-hidden">
                             <div className="flex justify-between p-2 border-b border-slate-800"><span>1-30 days</span><span>5%</span></div>
                             <div className="flex justify-between p-2 border-b border-slate-800"><span>31-90 days</span><span>10%</span></div>
                             <div className="flex justify-between p-2"><span>91+ days</span><span>15%</span></div>
                        </div>
                     </div>
                 )}

                 <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                     <div className="flex items-center justify-between">
                        <span className="text-slate-400">Projected Rewards (Gross):</span>
                        <span className="text-cyan-300 font-bold">{(effectiveInterestType === 'compound' 
                                 ? calcStakedAmount * (Math.pow(1 + ((customApy !== '' ? Number(customApy) : apy) / 100) / 365, calcDuration) - 1)
                                 : calcStakedAmount * ((customApy !== '' ? Number(customApy) : apy) / 100) * (calcDuration / 365)
                             ).toFixed(4)} ZPRED</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">Estimated Network Fee:</span>
                         <span className="text-rose-400 font-sans font-semibold">-{stakingNetworkFee.toFixed(4)} ZPRED</span>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-1.5 border-t border-slate-900">
                         <span className="text-slate-300 font-bold">Net Profit After Fees:</span>
                         <span className={`font-bold font-sans ${
                           ((effectiveInterestType === 'compound' 
                             ? calcStakedAmount * (Math.pow(1 + ((customApy !== '' ? Number(customApy) : apy) / 100) / 365, calcDuration) - 1)
                             : calcStakedAmount * ((customApy !== '' ? Number(customApy) : apy) / 100) * (calcDuration / 365)
                           ) - stakingNetworkFee) >= 0 ? "text-emerald-400" : "text-rose-400"
                         }`}>
                           {((effectiveInterestType === 'compound' 
                               ? calcStakedAmount * (Math.pow(1 + ((customApy !== '' ? Number(customApy) : apy) / 100) / 365, calcDuration) - 1)
                               : calcStakedAmount * ((customApy !== '' ? Number(customApy) : apy) / 100) * (calcDuration / 365)
                           ) - stakingNetworkFee).toFixed(4)} ZPRED
                         </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-900/40 pt-1.5">
                         <span className="text-slate-500">Time Remaining:</span>
                        <span className="text-slate-300 font-mono">{Math.floor(timeRemaining / 86400000)}d {Math.floor((timeRemaining % 86400000) / 3600000)}h</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Early Unstake Penalty ({penaltyPercent}%):</span>
                      </div>
                      {isComparisonMode && (
                         <div className="mt-2.5 pt-2 border-t border-slate-900/40 flex justify-between items-center text-xs">
                             <span className="text-purple-400 font-semibold flex items-center gap-1">
                                 <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse inline-block"></span>
                                 Comparison Yield Delta ({compareDuration}d vs {calcDuration}d):
                             </span>
                             <span className="font-bold text-purple-300 font-mono">
                                 {(() => {
                                     const grossMain = (effectiveInterestType === 'compound' 
                                         ? calcStakedAmount * (Math.pow(1 + ((customApy !== '' ? Number(customApy) : apy) / 100) / 365, calcDuration) - 1)
                                         : calcStakedAmount * ((customApy !== '' ? Number(customApy) : apy) / 100) * (calcDuration / 365)
                                     );
                                     const compApyVal = APY_MAP[compareDuration];
                                     const grossComp = (effectiveInterestType === 'compound'
                                         ? calcStakedAmount * (Math.pow(1 + (compApyVal / 100) / 365, compareDuration) - 1)
                                         : calcStakedAmount * (compApyVal / 100) * (compareDuration / 365)
                                     );
                                     const deltaVal = grossMain - grossComp;
                                     return `${deltaVal >= 0 ? '+' : ''}${deltaVal.toFixed(4)} ZPRED`;
                                 })()}
                             </span>
                         </div>
                      )}
                      <div className="flex items-center justify-between text-sm" style={{ display: 'none' }}>
                         <span className="text-slate-500">Placeholder Penalty</span>
                        <span className="text-rose-400 font-mono">
                          {timeRemaining > 0 
                            ? (calcStakedAmount * (penaltyPercent / 100)).toFixed(4) 
                            : "0.00"} ZPRED
                        </span>
                     </div>
                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-slate-800">
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                         <div>
                             <span className="text-sm font-semibold text-slate-300 block">Historical Rewards Growth Chart</span>
                             {breakEvenDay !== null && breakEvenDay <= calcDuration ? (
                                 <span className="text-[11px] text-emerald-400 font-mono block mt-0.5 animate-pulse">
                                     ✨ Breaks even on <strong className="font-bold underline text-emerald-300">Day {breakEvenDay}</strong>
                                 </span>
                             ) : (
                                 <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                                     No break-even point found inside current selection
                                 </span>
                             )}
                         </div>
                         
                         <div className="flex items-center gap-2">
                             <label htmlFor="chart-range-filter" className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Show Range:</label>
                             <select 
                                 id="chart-range-filter"
                                 value={chartFilter}
                                 onChange={(e) => setChartFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as any)}
                                 className="p-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                             >
                                 <option value="all">Full Period ({calcDuration}d)</option>
                                 <option value={30}>30 Days View</option>
                                 <option value={90}>90 Days View</option>
                                 <option value={365}>365 Days View</option>
                             </select>
                         </div>
                     </div>
                     <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredGrowthData}>
                                <defs>
                                  <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                                  </linearGradient>
                                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                                  </linearGradient>
                                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05}/>
                                  </linearGradient>
                                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <Tooltip 
                                content={({ active, payload }) => {
                                     if (active && payload && payload.length) {
                                         const data = payload[0].payload;
                                         const day = data.day;
                                         const rewardVal = data.reward;
                                         const netProfitVal = data.netProfit;
                                         const netProfitMinVal = data.netProfitMin;
                                         const netProfitMaxVal = data.netProfitMax;
                                         const compareRewardVal = data.compareReward;
                                         const compareNetProfitVal = data.compareNetProfit;
                                         const penaltyRate = getPenaltyRateForDay(day, calcDuration);
                                         const penaltyVal = calcStakedAmount * penaltyRate;
                                         const payoutVal = Math.max(0, calcStakedAmount + (rewardVal ?? 0) - penaltyVal);
                                         
                                         return (
                                             <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-xl shadow-2xl space-y-1.5 min-w-[240px] text-xs text-left">
                                                 <div className="text-slate-400 font-bold border-b border-slate-800/85 pb-1 flex justify-between">
                                                     <span>Day {day}</span>
                                                     {breakEvenDay !== null && day >= breakEvenDay ? (
                                                         <span className="text-emerald-400 text-[10px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md font-semibold font-mono">Profit Zone</span>
                                                     ) : (
                                                         <span className="text-rose-450 text-[10px] px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md font-semibold font-mono">Penalty Zone</span>
                                                     )}
                                                 </div>
                                                 <div className="flex justify-between gap-4">
                                                     <span className="text-slate-500 font-mono">Staked Principal:</span>
                                                     <span className="text-slate-300 font-mono">{calcStakedAmount.toFixed(2)} ZPRED</span>
                                                 </div>
                                                 {rewardVal !== null && (
                                                     <>
                                                         <div className="flex justify-between gap-4">
                                                             <span className="text-slate-400 font-medium">Gross Reward ({calcDuration}d):</span>
                                                             <span className="text-cyan-300 font-bold font-mono">+{rewardVal.toFixed(4)} ZPRED</span>
                                                         </div>
                                                         <div className="flex justify-between gap-4">
                                                             <span className="text-emerald-400 font-medium font-semibold">Net Profit After Fees:</span>
                                                             <span className={`font-mono font-bold ${netProfitVal >= 0 ? 'text-emerald-405' : 'text-rose-450'}`}>
                                                                 {(netProfitVal ?? 0).toFixed(4)} ZPRED
                                                             </span>
                                                         </div>
                                                     </>
                                                 )}
                                                 {isVolatilityEnabled && rewardVal !== null && netProfitMinVal !== null && netProfitMaxVal !== null && (
                                                     <div className="border-t border-slate-800/60 pt-1.5 mt-1.5 space-y-1">
                                                         <div className="flex justify-between gap-4 text-amber-400">
                                                             <span className="font-semibold text-amber-500 flex items-center gap-1">
                                                                 <TrendingUp className="w-3.5 h-3.5" />
                                                                 <span>±5% Volatility Range:</span>
                                                              </span>
                                                              <span className="font-mono font-bold text-amber-300">
                                                                  {netProfitMinVal.toFixed(4)} ... {netProfitMaxVal.toFixed(4)} ZPRED
                                                              </span>
                                                         </div>
                                                     </div>
                                                 )}
                                                 {isComparisonMode && compareRewardVal !== null && (
                                                     <div className="border-t border-slate-800/60 pt-1.5 mt-1.5 space-y-1">
                                                         <div className="flex justify-between gap-4 text-purple-300">
                                                             <span className="font-semibold text-purple-400">Comp. Gross ({compareDuration}d):</span>
                                                             <span className="font-mono font-bold">+{compareRewardVal.toFixed(4)} ZPRED</span>
                                                         </div>
                                                         <div className="flex justify-between gap-4 text-purple-300">
                                                             <span className="font-semibold text-purple-400 whitespace-nowrap">Comp. Net Profit:</span>
                                                             <span className="font-mono font-semibold text-violet-300">
                                                                 {compareNetProfitVal !== null ? `${compareNetProfitVal >= 0 ? '+' : ''}${compareNetProfitVal.toFixed(4)}` : '0.0000'} ZPRED
                                                             </span>
                                                         </div>
                                                     </div>
                                                 )}
                                                 {rewardVal !== null && (
                                                     <div className="border-t border-slate-800/60 pt-1.5 mt-1">
                                                         <div className="flex justify-between gap-4">
                                                             <span className="text-rose-400">Exit Penalty ({ (penaltyRate * 100).toFixed(0) }%):</span>
                                                             <span className="text-rose-400 font-mono">-{penaltyVal.toFixed(4)} ZPRED</span>
                                                         </div>
                                                         <div className="mt-1 flex justify-between gap-4 font-semibold font-sans">
                                                             <span className="text-slate-200">Penalty-Adjusted Payout:</span>
                                                             <span className={`font-bold font-mono ${payoutVal >= calcStakedAmount ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                                 {payoutVal.toFixed(4)} ZPRED
                                                             </span>
                                                         </div>
                                                     </div>
                                                 )}
                                             </div>
                                         );
                                     }
                                     return null;
                                  }}
                                />
                                <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px' }} />
                                {breakEvenDay !== null && breakEvenDay <= calcDuration && (
                                  <ReferenceLine 
                                    x={breakEvenDay} 
                                    stroke="#10b981" 
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4" 
                                    label={{ 
                                      value: `Break-even: Day ${breakEvenDay}`, 
                                      fill: '#10b981', 
                                      fontSize: 10, 
                                      position: 'insideBottomLeft',
                                      fontWeight: '600'
                                    }} 
                                  />
                                )}
                                {isVolatilityEnabled && (
                                  <Area 
                                    type="monotone" 
                                    dataKey="netProfitRange" 
                                    name="Volatility Band (±5% Price)" 
                                    stroke="none" 
                                    fill="url(#colorVol)" 
                                    fillOpacity={1}
                                  />
                                )}
                                <Area type="monotone" dataKey="reward" name={effectiveInterestType === 'compound' ? 'Gross Compounded' : 'Gross Simple'} stroke="#22d3ee" fill="url(#colorSim)" strokeWidth={1} strokeDasharray="3 3" />
                                <Area type="monotone" dataKey="netProfit" name="Net Profit After Fees" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2.5} />
                                {isComparisonMode && (
                                  <Area type="monotone" dataKey="compareNetProfit" name={`Comparison Net Profit (${compareDuration}d)`} stroke="#a855f7" fill="url(#colorComp)" strokeWidth={2} />
                                )}
                                <Area type="monotone" dataKey="apyTrajectory" name="Projected APY Trajectory" stroke="#f43f5e" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Active Positions & Batch Unstaking Section */}
                 <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                     <div className="flex justify-between items-center">
                         <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                             Active Staking Positions ({userActiveStakes.length})
                         </span>
                         {selectedPositionIds.length > 0 && (
                             <button
                                 type="button"
                                 onClick={() => setShowBatchUnstakeModal(true)}
                                 className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold rounded-md shadow-lg transition-all flex items-center gap-1 animate-pulse"
                             >
                                 Batch Unstake ({selectedPositionIds.length})
                             </button>
                         )}
                     </div>

                     {userActiveStakes.length === 0 ? (
                         <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl text-center">
                             <p className="text-xs text-slate-500">No active staked positions from database found.</p>
                             <p className="text-[10px] text-slate-600 mt-1 font-mono">Staking ZPRED above writes persistent records to the database!</p>
                             <button
                                 type="button"
                                 onClick={seedDemoStakes}
                                 className="mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 underline block mx-auto font-semibold"
                             >
                                 + Seed 3 Active Stakes to DB
                             </button>
                         </div>
                     ) : (
                         <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                             {userActiveStakes.map((pos) => {
                                 const isSelected = selectedPositionIds.includes(pos.id);
                                 const posDuration = pos.duration || 30;
                                 const posPenaltyRate = posDuration > 90 ? 15 : posDuration > 30 ? 10 : 5;
                                 const penaltyFee = pos.amount * (posPenaltyRate / 100);
                                 return (
                                     <div 
                                         key={pos.id} 
                                         className={`p-3 bg-slate-950/80 border rounded-xl flex items-center justify-between gap-3 text-xs transition-all ${
                                             isSelected ? 'border-cyan-500 bg-cyan-950/10' : 'border-slate-800/80 hover:border-slate-700'
                                         }`}
                                     >
                                         <div className="flex items-center gap-2">
                                             <input
                                                 type="checkbox"
                                                 checked={isSelected}
                                                 onChange={() => {
                                                     if (isSelected) {
                                                         setSelectedPositionIds(selectedPositionIds.filter(id => id !== pos.id));
                                                     } else {
                                                         setSelectedPositionIds([...selectedPositionIds, pos.id]);
                                                     }
                                                 }}
                                                 className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
                                             />
                                             <div>
                                                 <span className="font-semibold text-white block">{pos.amount.toFixed(2)} ZPRED</span>
                                                 <span className="text-[10px] text-slate-400">Lock: {posDuration}d • Rate: {posDuration === 365 ? '15%' : posDuration === 90 ? '8%' : '5%'} APY</span>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <span className="text-rose-400 block font-mono">-{penaltyFee.toFixed(2)} ZPRED</span>
                                             <span className="text-[10px] text-slate-500 font-mono">Penalty ({posPenaltyRate}%)</span>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     )}
                 </div>
            </div>
        </motion.div>

        {/* Notif Toggle */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
           <h3 className="text-lg font-bold text-white mb-4">Alerts</h3>
           <button onClick={toggleNotifications} className={`flex items-center gap-3 p-4 rounded-lg border ${notificationsEnabled ? 'bg-cyan-950 border-cyan-800 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
               <Bell size={20} />
               <span>Enable 7-Day Expiry Notifications</span>
           </button>
        </div>
      </div>
      
      {address && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Staking History</h3>
                <button onClick={exportCSV} className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300">
                    <Download size={14} /> Export CSV
                </button>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="p-2">Type</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stakingHistory.map(evt => (
                    <tr key={evt.id} className="border-b border-slate-800/50 text-slate-300">
                      <td className={`p-2 uppercase font-bold ${evt.type === 'stake' ? 'text-emerald-400' : 'text-rose-400'}`}>{evt.type}</td>
                      <td className="p-2">{evt.amount}</td>
                      <td className="p-2">{evt.timestamp?.toDate().toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Rewards History</h3>
              <div className="flex bg-slate-950 rounded-lg p-1 text-xs">
                  <button onClick={() => setViewType('cumulative')} className={`px-3 py-1 rounded ${viewType === 'cumulative' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Cumulative</button>
                  <button onClick={() => setViewType('daily')} className={`px-3 py-1 rounded ${viewType === 'daily' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Daily</button>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [value.toFixed(4), name.replace('Yield', ' Yield')]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="baseYield" name="Base Yield" stroke="#22d3ee" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="bonusYield" name="Bonus Yield" stroke="#f87171" strokeWidth={2} dot={false} />
                  </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {showUnstakeModal && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4">
             <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-sm w-full">
                 <h2 className="text-xl font-bold text-white mb-4">Confirm Unstake</h2>
                 <p className="text-slate-400 text-sm mb-6">
                   Unstaking early incurs a {penaltyPercent}% penalty fee due to incomplete lock-up duration ({calcDuration} days). 
                   Are you sure you want to proceed?
                 </p>
                 <div className="flex gap-4">
                     <button onClick={() => setShowUnstakeModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                     <button onClick={handleIndividualUnstake} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-lg">Confirm</button>
                 </div>
             </div>
        </div>
      )}
      {showBatchUnstakeModal && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50 p-4">
             <div className="bg-slate-900 border border-slate-700 p-6 md:p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-scaleUp">
                 <h2 className="text-xl font-bold text-white mb-2">Confirm Batch Unstake</h2>
                 <p className="text-slate-400 text-xs mb-4">
                     You are about to batch unstake <span className="text-cyan-400 font-bold font-mono">{selectedPositionIds.length}</span> positions.
                 </p>
                 <div className="space-y-2 mb-6 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs max-h-36 overflow-y-auto font-mono">
                     {stakingHistory
                        .filter(h => selectedPositionIds.includes(h.id))
                        .map(pos => {
                            const posDuration = pos.duration || 30;
                            const posPenaltyRate = posDuration > 90 ? 15 : posDuration > 30 ? 10 : 5;
                            const penaltyVal = pos.amount * (posPenaltyRate / 100);
                            return (
                                <div key={pos.id} className="flex justify-between text-slate-300 border-b border-slate-900 pb-1 last:border-0 last:pb-0">
                                    <span>{pos.amount.toFixed(1)} ZPRED ({posDuration}d)</span>
                                    <span className="text-rose-400">-{penaltyVal.toFixed(1)} ZPRED</span>
                                </div>
                            );
                        })
                     }
                     <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white text-xs mt-2">
                         <span>Total Unstaked:</span>
                         <span className="text-cyan-400">
                             {stakingHistory
                                .filter(h => selectedPositionIds.includes(h.id))
                                .reduce((acc, curr) => acc + curr.amount, 0)
                                .toFixed(2)} ZPRED
                         </span>
                     </div>
                     <div className="flex justify-between font-bold text-rose-400 text-xs">
                         <span>Total Penalty:</span>
                         <span>
                             {stakingHistory
                                .filter(h => selectedPositionIds.includes(h.id))
                                .reduce((acc, curr) => {
                                    const dur = curr.duration || 30;
                                    const pen = dur > 90 ? 0.15 : dur > 30 ? 0.10 : 0.05;
                                    return acc + (curr.amount * pen);
                                }, 0)
                                .toFixed(2)} ZPRED
                         </span>
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <button onClick={() => setShowBatchUnstakeModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-sm transition-colors">Cancel</button>
                     <button onClick={handleBatchUnstake} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-sm transition-colors">Confirm</button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
}

