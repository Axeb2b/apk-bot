import React, { useState } from "react";
import { 
  Shuffle, 
  Cpu, 
  Coins, 
  Zap, 
  Layers, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  TrendingUp, 
  ChevronRight, 
  Activity, 
  Compass, 
  Check, 
  Sparkles, 
  HelpCircle,
  Clock,
  ExternalLink,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SwapPortalInfoProps {
  context: "dashboard" | "swap" | "bridge" | "buysell" | "blogs" | "api" | "legal" | string;
  onNavigateToSwap?: () => void;
}

export default function SwapPortalInfo({ context, onNavigateToSwap }: SwapPortalInfoProps) {
  const [activeSegment, setActiveSegment] = useState<string>("routing");
  const [simulationFrom, setSimulationFrom] = useState<string>("ETH");
  const [simulationTo, setSimulationTo] = useState<string>("ZPRED");
  const [simulationAmount, setSimulationAmount] = useState<number>(1);
  const [routingStep, setRoutingStep] = useState<number>(0);

  // Pool Statistics
  const poolStats = [
    { label: "Predictive Pool Depth", value: "$45.8M", change: "+12.4% last week" },
    { label: "AMM 24h Trading Volume", value: "$8,241,920", change: "-2.1% low volatility" },
    { label: "Optimal Routing Pathways", value: "32 EVM Chains", change: "Latency < 12ms" },
    { label: "Average Token Slippage", value: "0.08%", change: "Industry-leading" }
  ];

  // Routing Nodes Simulation
  const handleSimulateRoute = () => {
    setRoutingStep(1);
    const intervals = [
      setTimeout(() => setRoutingStep(2), 800),
      setTimeout(() => setRoutingStep(3), 1600),
      setTimeout(() => setRoutingStep(4), 2400)
    ];
    return () => intervals.forEach(clearTimeout);
  };

  return (
    <div 
      className="mt-12 bg-slate-950/40 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative"
      id={`swap-portal-info-${context}`}
    >
      {/* Top micro-gradient border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-transparent" />
      
      {/* Container spacing */}
      <div className="p-5 sm:p-6 lg:p-8">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-slate-900/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1 px-2.5 rounded-full bg-cyan-950/25 border border-cyan-800/45 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Ecosystem Module
              </div>
              <span className="text-[10px] text-slate-500 font-mono">• Telemetry Activated</span>
            </div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-cyan-400 animate-pulse" />
              zPredict AI Swap Protocols Guide
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl font-sans">
              Learn how our multi-tiered Automated Market Maker (AMM) and predictive smart routing protocols secure instant swaps with minimized token slippage.
            </p>
          </div>
          
          {context !== "swap" && onNavigateToSwap && (
            <button
              onClick={onNavigateToSwap}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 hover:shadow-lg hover:shadow-cyan-500/10 transition-all font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              Launch Core Swap Engine <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CONTEXT-SPECIFIC DETAILS */}
        
        {/* 1. SWAP PAGE CONTENT - FULL ARCHITECTURAL OVERVIEW */}
        {context === "swap" && (
          <div className="mt-6 space-y-8">
            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Feature column 1 */}
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Predictive routing</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  The router checks state vectors across 12 distinct EVM-compatible liquidity pools simultaneously. By utilizing historical network gas costs and real-time bid-ask queues, it splits transactions to achieve the lowest possible impact price.
                </p>
                <div className="pt-2">
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded-sm border border-cyan-900/40">
                    Slippage target: &lt; 0.1%
                  </span>
                </div>
              </div>

              {/* Feature column 2 */}
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">AMM Liquidity Pools</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Native ZPRED pools maintain a dual-asset bonding curve mathematically stabilized by threshold pricing nodes. Stakers earn up to 0.12% in transactional fees, reinforcing deep, resident liquidity across major token pairs.
                </p>
                <div className="pt-2">
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded-sm border border-purple-900/40">
                    Rewards Protocol: v2-EVM
                  </span>
                </div>
              </div>

              {/* Feature column 3 */}
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Gas-optimized Contracts</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Built on heavily audited Solidity smart contracts with assembly-level optimizations, our trading functions consume 28% less gas than conventional decentralized routers during complex cross-token state transfers.
                </p>
                <div className="pt-2">
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded-sm border border-amber-900/40">
                    Gas Efficiency: +28%
                  </span>
                </div>
              </div>

            </div>

            {/* Interactive route visualization */}
            <div className="p-5 bg-slate-900/20 border border-slate-900 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Dynamic Smart Router Simulator</h4>
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">Simulate how zPredict optimal routing splits and delivers your crypto exchange request.</p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateRoute}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono font-bold text-cyan-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Trigger Simulation Run
                </button>
              </div>

              {/* Simulation steps graphic */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 relative" id="swap-simulation-graphic">
                {[
                  { title: "Initiating Input", step: 1, desc: "Sensing wallet balances & slippage vectors", icon: Compass },
                  { title: "Smart Splitting", step: 2, desc: "60% Native Pool / 40% Secondary Node", icon: Cpu },
                  { title: "Gas Mitigation", step: 3, desc: "State compression reduces gas payload", icon: Zap },
                  { title: "Atomic Dispatch", step: 4, desc: "Assets deposited directly back to address", icon: CheckCircle2 }
                ].map((node, idx) => {
                  const IconNode = node.icon;
                  const isPending = routingStep > 0 && routingStep < node.step;
                  const isActive = routingStep === node.step;
                  const isCompleted = routingStep > node.step;
                  
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isActive 
                          ? "bg-cyan-950/10 border-cyan-500/60" 
                          : isCompleted 
                            ? "bg-slate-900/60 border-indigo-900/30 text-slate-400"
                            : "bg-slate-950 border-slate-900/60 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`p-1.5 rounded-md ${
                          isActive 
                            ? "bg-cyan-400 text-slate-950" 
                            : isCompleted 
                              ? "bg-indigo-950/50 text-indigo-400"
                              : "bg-slate-900 text-slate-600"
                        }`}>
                          <IconNode className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold font-mono uppercase tracking-wide">
                          {idx + 1}. {node.title}
                        </span>
                      </div>
                      <p className="text-[9px] leading-relaxed">
                        {isActive ? (
                          <span className="text-cyan-400 font-mono animate-pulse">Processing telemetry...</span>
                        ) : node.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Static analytics counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {poolStats.map((stat, idx) => (
                <div key={idx} className="p-3.5 bg-slate-900/20 border border-slate-900/40 rounded-xl space-y-1">
                  <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-none">{stat.label}</span>
                  <span className="block text-base font-extrabold text-white font-mono">{stat.value}</span>
                  <span className="block text-[9px] font-mono text-cyan-400/80">{stat.change}</span>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 2. DASHBOARD TAB CONTENT */}
        {context === "dashboard" && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                <TrendingUp className="w-4 h-4" /> Threshold-Linked Trading
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Convert triggered alert assets in 1 click</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                zPredict links your custom threshold Price Alerts directly into the AI Swap pools. The moment an alert triggers, you can instantly swap out of volatile positions or accumulate stable currencies using the pre-calculated, automated route mapping.
              </p>
              <ul className="space-y-1.5 text-[10px] text-slate-500 font-mono">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Auto-population of triggered token amounts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Zero manual address indexing reduces human error
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> Integrated price trend prediction indicators
                </li>
              </ul>
            </div>

            {/* Side preview component */}
            <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3 font-mono">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block">AMM Pool Tickers</span>
              
              <div className="space-y-2">
                {[
                  { pair: "ZPRED/ETH", price: "0.00018 ETH", depth: "$22.4M", status: "Optimal" },
                  { pair: "BTC/USDT", price: "68,421.50 USDT", depth: "$150.8M", status: "Optimal" },
                  { pair: "ETH/USDT", price: "3,412.20 USDT", depth: "$85.2M", status: "Optimal" }
                ].map((pairData, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-900/50 hover:border-slate-800 text-[10px] transition-colors">
                    <span className="font-bold text-white">{pairData.pair}</span>
                    <span className="text-slate-400">{pairData.price}</span>
                    <span className="text-slate-500">Liquidity: {pairData.depth}</span>
                    <span className="text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded-sm text-[8px] font-bold border border-emerald-900/30 uppercase">
                      {pairData.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. BRIDGE TAB CONTENT */}
        {context === "bridge" && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-slate-900/20 p-4 rounded-xl border border-slate-900">
              <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider block">Bridge vs. AI Swap Comparison</span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                While our **Cross-Chain Bridge** migrates the same token asset securely between layer networks (e.g. USDT Polygon to USDT Ethereum), the **AI Swap Engine** allows immediate atomic asset trade swaps (e.g. ZPRED on BSC to ETH on Ethereum network) utilizing decentralized liquid bridge routing.
              </p>
              <div className="pt-2">
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pb-1 border-b border-slate-900">
                  <span>Aspect:</span>
                  <span>Cross-Bridge</span>
                  <span className="text-cyan-400 font-bold">AI Swap</span>
                </div>
                <div className="flex items-center justify-between text-[10px] py-1 border-b border-slate-900/40 font-mono">
                  <span>Token Change:</span>
                  <span>None (Same)</span>
                  <span className="text-slate-300">Flexible pairs</span>
                </div>
                <div className="flex items-center justify-between text-[10px] py-1 font-mono">
                  <span>Relay Engine:</span>
                  <span>State Tunnels</span>
                  <span className="text-slate-300">Router pools</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Cross-chain swapping telemetry</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1">
                  Integrate bridge relay metrics into smart swaps. Access 32 external validation networks to guarantee lockup states before swap conversion processes fire.
                </p>
              </div>
              <ul className="space-y-1.5 text-[10px] text-slate-400 font-mono">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Dual validations guarantee atomic reversibility</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Slippage limits secured via temporary escrow layers</li>
              </ul>
            </div>
          </div>
        )}

        {/* 4. BUY/SELL TAB CONTENT */}
        {context === "buysell" && (
          <div className="mt-6 bg-slate-900/20 p-4 rounded-xl border border-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-400 uppercase tracking-semibold">
              <DollarSign className="w-4 h-4" /> Optimizing Purchases with AI Swapping
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When purchasing assets through standard fiat gateway modules, credit limits or regional regulations might restrict direct access to emerging altcoins like **ZPRED**. 
              The optimal institutional strategy is to check out in native stablecoins (such as USDT or USDC), and immediately route them through the zero-trust **zPredict AI Swap Engine** for efficient, premium currency conversions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] font-mono text-slate-500">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
                <span className="block text-white font-bold mb-1">Step 1: Buy stable asset</span>
                Acquire USDT easily with fiat systems with minimal fees.
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
                <span className="block text-white font-bold mb-1">Step 2: Connect router</span>
                Launch zPredict Swap to route stablecoins into ZPRED.
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-900">
                <span className="block text-white font-bold mb-1">Step 3: Secure & Earn</span>
                Stake your acquired assets to start monitoring threshold alerts.
              </div>
            </div>
          </div>
        )}

        {/* 5. BLOGS / INSIGHTS TAB CONTENT */}
        {context === "blogs" && (
          <div className="mt-6 p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3 font-sans">
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest block font-bold">Research Abstract: Automated Market Mappings</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our engineering blogs frequently publish mathematical analyses of our dynamic routing algorithm. Read the latest whitepapers detailing multi-hop fee architectures, liquidity pool depletion warnings, and historical slip calculations.
            </p>
            <div className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
              <span className="font-mono text-slate-300">Technical Report #24BG - "Slippage Optimization on EVM Networks"</span>
              <button 
                onClick={onNavigateToSwap}
                className="text-cyan-400 hover:text-white font-mono hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
              >
                Launch Trade <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* 6. API DOCS TAB CONTENT */}
        {context === "api" && (
          <div className="mt-6 space-y-4">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Integrate programmatic swap triggers directly into your trading scripts or algorithmic trading bots. Our REST endpoints allow querying real-time AMM pools, estimating returned asset outputs, and preparing router execution vectors.
            </p>
            
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-400">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-900 text-[9px] text-slate-500 uppercase mb-2">
                <span>Core AMM API Endpoints</span>
                <span className="text-emerald-400 font-bold">Live Node</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-900 text-emerald-400 rounded-xs font-bold text-[8px]">GET</span>
                  <span className="text-white">/api/v1/swap/quote?from=ETH&amp;to=ZPRED&amp;amount=1.0</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="px-1.5 py-0.2 bg-blue-950 border border-blue-900 text-blue-400 rounded-xs font-bold text-[8px]">POST</span>
                  <span className="text-white">/api/v1/swap/execute</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. LEGAL VIEWS TAB CONTENT */}
        {context === "legal" && (
          <div className="mt-6 p-4 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3 font-sans">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">AMM Protocol Disclosures</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              zPredict Swap operates entirely via decentralized, immutable smart contracts. Liquidity pools, price outputs, and order routes are calculated deterministically on-chain without custodial escrow. Users remain sole arbiters of their key pairs. All asset transactions are non-custodial and carry inherent crypto markets risk factors.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
