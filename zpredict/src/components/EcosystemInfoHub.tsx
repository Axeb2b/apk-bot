import React, { useState } from "react";
import { 
  Activity, 
  Shuffle, 
  ArrowLeftRight, 
  CreditCard, 
  BookOpen, 
  Terminal, 
  FileText, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight,
  Percent,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PageDefinition {
  id: string;
  label: string;
  description: string;
  features: string[];
  role: string;
  icon: any;
  colorClass: string;
}

interface EcosystemInfoHubProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function EcosystemInfoHub({ activeTab, setActiveTab }: EcosystemInfoHubProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const pagesList: PageDefinition[] = [
    {
      id: "dashboard",
      label: "Analytical Dashboard",
      description: "Real-time market charts, tracking tokens, and custom threshold trigger management.",
      features: [
        "Interactive Price Alerts with Real-Time Push Notifications",
        "Asset Trend Indicators & Price Ticker Feeds",
        "EVM Wallet Portfolio Allocation Simulation"
      ],
      role: "Core monitoring & alerting hub for high-frequency token updates.",
      icon: Activity,
      colorClass: "from-cyan-500 to-blue-500"
    },
    {
      id: "swap",
      label: "AI Swap Pools",
      description: "Fast atomic decentralized swap mechanism for immediate p2p digital assets.",
      features: [
        "Smart Order Routing algorithm for optimal slippage rate",
        "Decentralized pool liquidity connections",
        "Zero-trust transaction simulation"
      ],
      role: "Seamless token migrations and decentralized peer-to-peer trading.",
      icon: Shuffle,
      colorClass: "from-purple-500 to-indigo-500"
    },
    {
      id: "bridge",
      label: "Cross-Bridge",
      description: "Decentralized state-relay engine enabling secure multi-chain token migration.",
      features: [
        "Instant lock-and-release cryptographic cross-chain tunnels",
        "Gas fee estimation across target chains (BSC, Polygon, Sol)",
        "Zero-knowledge verification status bars"
      ],
      role: "Interoperability gateway connecting divergent Layer-1 and Layer-2 blockchains.",
      icon: ArrowLeftRight,
      colorClass: "from-amber-500 to-orange-500"
    },
    {
      id: "buysell",
      label: "Buy & Sell",
      description: "Integrated secure fiat-to-crypto gateways for rapid funding and withdrawals.",
      features: [
        "Direct checkout integration with zero regional middleware",
        "Multiple payment options with high-entropy order security",
        "Instant dispatch directly to synchronized crypto wallets"
      ],
      role: "Seamless on-ramp & off-ramp protocol bridging traditional finance & Web3.",
      icon: CreditCard,
      colorClass: "from-emerald-500 to-teal-500"
    },
    {
      id: "staking",
      label: "Staking Dashboard",
      description: "Manage your ZPRED token staking, view rewards, and track locking periods.",
      features: [
        "Direct contract interaction for staking ZPRED",
        "Live reward tracking and claim interface",
        "Unstaking lock-period management dashboard"
      ],
      role: "Governance and reward maximization for long-term token holders.",
      icon: Percent,
      colorClass: "from-emerald-500 to-teal-500"
    },
    {
      id: "blogs",
      label: "Market Insights",
      description: "Timely publications, market indicators, developer telemetry, and network reports.",
      features: [
        "Cryptographic protocol improvements and development updates",
        "Automated AI intelligence feeds for emerging web3 assets",
        "Comprehensive market forecasts"
      ],
      role: "Deep intellectual resource, sharing system telemetry and cryptographic analysis.",
      icon: BookOpen,
      colorClass: "from-pink-500 to-rose-500"
    },
    {
      id: "chat",
      label: "AI Copilot",
      description: "Talk to real-time generative assistants configured for platform support, yield models, and contract audits.",
      features: [
        "Multi-turn conversation streams with adjustable AI tiers",
        "Custom personas including Quantitative Yield Strategist and Auditor",
        "Deep thinking mode powered by Gemini 3.1 Pro preview"
      ],
      role: "Sleek conversational portal providing immediate, context-aware intelligence on the zPredict protocols.",
      icon: Sparkles,
      colorClass: "from-indigo-500 to-cyan-500"
    },
    {
      id: "api",
      label: "DeFi APIs Docs",
      description: "Interactive REST endpoint specification for programmatic node triggers and query lookups.",
      features: [
        "Live schema documentation with mock headers and bodies",
        "Interactive request sandbox environment with status feedback",
        "Custom API Key deployment and validation structures"
      ],
      role: "Programmatic gateway for quantitative bots and enterprise system integrators.",
      icon: Terminal,
      colorClass: "from-sky-500 to-cyan-500"
    },
    {
      id: "legal",
      label: "Rules & Policies",
      description: "Institutional regulatory statements, smart contract licenses, and user conditions.",
      features: [
        "Cryptographic policy statements & zero-trust regulatory conditions",
        "Detailed liability limitations and decentralized protocols clauses",
        "Transparent update ledger tracking legal updates"
      ],
      role: "Compliance and structural agreement outlining rights and network limitations.",
      icon: FileText,
      colorClass: "from-slate-500 to-cool-gray-500"
    }
  ];

  return (
    <div 
      className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300" 
      id="ecosystem-directory-info-card"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-violet-500/3 pointer-events-none" />
      
      {/* Top Header Row */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              Platform Guide
              <span className="stat-badge !text-[8px] !py-0.5">
                {pagesList.length} modules
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Explore all features and navigate between modules
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          id="toggle-ecosystem-directory-btn"
          className="btn-secondary !text-xs !py-2 !px-3 self-start sm:self-auto"
        >
          {isExpanded ? (
            <>
              Hide Directory <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
            </>
          ) : (
            <>
              Explore App Pages ({pagesList.length}) <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
            </>
          )}
        </button>
      </div>

      {/* Expanded Bento Grid of Information */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 mt-4 border-t border-slate-900">
              {pagesList.map((page) => {
                const Icon = page.icon;
                const isPageActive = activeTab === page.id;
                
                return (
                  <div
                    key={page.id}
                    id={`directory-page-${page.id}`}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between group relative ${
                      isPageActive
                        ? "bg-slate-900/80 border-cyan-500/40 shadow-md shadow-cyan-500/5 text-slate-200"
                        : "bg-slate-950/40 hover:bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {/* Top gradient blur border decoration for active screen */}
                    {isPageActive && (
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500 to-indigo-500" />
                    )}

                    <div className="space-y-3">
                      {/* Icon header */}
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${page.colorClass} bg-opacity-10 text-white flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        {isPageActive ? (
                          <span className="text-[9px] font-mono font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                            Viewing Now
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                            Ready
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h4 className="font-sans font-bold text-xs text-white uppercase tracking-wider">
                          {page.label}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-normal mt-1 leading-relaxed font-sans">
                          {page.description}
                        </p>
                      </div>

                      {/* Feature Bullets */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Key Features</span>
                        <ul className="space-y-1">
                          {page.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                              <span className="text-cyan-500 font-bold shrink-0 mt-0.5">•</span>
                              <span className="font-sans">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Internal Protocol Persona Role */}
                      <div className="pt-2 border-t border-slate-900/50">
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest block">Role in Ecosystem</span>
                        <p className="text-[10px] text-slate-500 italic mt-0.5 leading-normal">
                          {page.role}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Fast-Action Trigger */}
                    <div className="pt-4 mt-4 border-t border-slate-900/30 flex justify-end">
                      {isPageActive ? (
                        <div className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/15 border border-emerald-900/30 px-2.5 py-1 rounded-lg flex items-center gap-1 leading-none select-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Currently Active
                        </div>
                      ) : (
                        <button
                          id={`nav-directory-trigger-${page.id}`}
                          onClick={() => {
                            setActiveTab(page.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/20 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-900/40 hover:border-transparent rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer group-hover:scale-[1.02]"
                          title={`Switch to ${page.label}`}
                        >
                          Launch View <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
