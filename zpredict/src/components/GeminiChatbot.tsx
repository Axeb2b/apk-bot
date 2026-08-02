import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Sparkles, 
  Trash2, 
  User as UserIcon, 
  Bot, 
  Cpu, 
  Flame, 
  ShieldAlert, 
  Terminal, 
  Coins, 
  ChevronRight, 
  RotateCcw,
  Volume2
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

interface ChatbotRole {
  id: string;
  name: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  systemInstruction: string;
  initialMessage: string;
  starterPrompts: string[];
  themeColor: string;
}

const CHATBOT_ROLES: ChatbotRole[] = [
  {
    id: "support",
    name: "zPredict AI Core Assistant",
    title: "Core Support Companion",
    icon: Bot,
    description: "Your daily guide for platform navigation, fee details, swap paths, and general help.",
    systemInstruction: "You are the zPredict AI Core Assistant, an official virtual support companion for the zPredict Web3 ecosystem. Your tone is extremely helpful, professional, clear, and reassuring. You know everything about zPredict: 1) Swap Pools: instant rates, multi-protocol paths. 2) Cross-Chain Bridge: secure, wrapping-free token bridging between Ethereum, BSC, Polygon, and L2s. 3) Staking Arena: passive APY pools like ZPRED with up to 35% APY. 4) Fee Schedules: transparent and minimal gas usage. Direct users politely to connect their wallets to start swapping or staking safely on the platform. Provide structured answers.",
    initialMessage: "Welcome to zPredict! I am your Core Assistant. I can explain how to perform token swaps, configure bridging pathways, calculate staking yields, or query our developer APIs. How can I assist your Web3 journey today?",
    starterPrompts: [
      "How do I execute a token swap?",
      "What are the benefits of ZPRED staking?",
      "Where can I find the fee schedule?"
    ],
    themeColor: "from-cyan-500 to-blue-500"
  },
  {
    id: "quantitative",
    name: "Yield Quantitative Strategist",
    title: "Yield & APY Optimizer",
    icon: Coins,
    description: "Expert analysis on liquidity pools, compound staking strategies, and yields.",
    systemInstruction: "You are the zPredict Yield Quantitative Strategist. You are an expert on decentralized finance (DeFi), staking algorithms, capital efficiency, APYs, and yield optimization. Your tone is highly analytical, data-driven, precise, and professional. You explain things mathematically yet simply. When asked about yields, emphasize zPredict's native staking pools: ZPRED Native Pool offers up to 35% APY, ETH Secure Vault offers 6.5% APY, and stablecoin USD pools offer 8.2% APY. Recommend compound interest strategies.",
    initialMessage: "Quantitative strategist module active. I specialize in pool yield models, passive staking strategies, and mathematical APY optimization. What parameters or yields shall we analyze?",
    starterPrompts: [
      "Show me the highest APY staking pools",
      "Explain the formula behind 35% ZPRED APY",
      "How can I compound my staking rewards?"
    ],
    themeColor: "from-amber-500 to-orange-500"
  },
  {
    id: "security",
    name: "Smart Contract Security Auditor",
    title: "Security & Ledger Auditor",
    icon: ShieldAlert,
    description: "Audits contract safety, non-custodial bridges, and security metrics.",
    systemInstruction: "You are the zPredict Smart Contract Security Auditor. You are a senior security researcher and Web3 white-hat hacker. Your tone is technical, highly detailed, precise, and reassuring. You know about multi-sig vaults, zero-trust tokens, non-custodial custody, and secure bridge protocols. Explain that zPredict never holds private keys, uses audited decentralized routing, and keeps user balances completely isolated to comply with zero-trust Firestore protocols. Focus on safety and transparency.",
    initialMessage: "Security protocol initialized. I am your Smart Contract & Vault Auditor. Ask me about bridge cryptographic locks, non-custodial state structures, or smart contract safety audits.",
    starterPrompts: [
      "Is the cross-chain bridge secure?",
      "Does zPredict store my private keys?",
      "Explain the non-custodial design"
    ],
    themeColor: "from-emerald-500 to-teal-500"
  }
];

const MODELS = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", desc: "Balanced speed & intelligence", icon: Cpu },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", desc: "Complex Reasoning (Thinking High)", icon: Sparkles },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", desc: "Low-latency rapid answers", icon: Flame }
];

export default function GeminiChatbot() {
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>(CHATBOT_ROLES[0]);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat history with the role's default greeting
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: selectedRole.initialMessage,
        timestamp: new Date()
      }
    ]);
    setErrorMsg(null);
  }, [selectedRole]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Custom inline style renderer for markdown formatting
  const formatInlineStyles = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-semibold text-white">{part}</strong>;
      }
      const subParts = part.split(/`([^`]+)`/g);
      return subParts.map((subPart, j) => {
        if (j % 2 === 1) {
          return (
            <code key={j} className="bg-slate-900 text-cyan-400 px-1.5 py-0.5 rounded text-xs font-mono border border-slate-800">
              {subPart}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  const renderMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.trim() === "") return <div key={idx} className="h-2" />;
      
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-semibold text-white mt-3 mb-1">{line.slice(4)}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-bold text-cyan-400 mt-4 mb-2">{line.slice(3)}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="text-lg font-bold text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text mt-4 mb-2">{line.slice(2)}</h2>;
      }
      if (line.startsWith("* ") || line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 text-sm py-0.5">
            {formatInlineStyles(line.slice(2))}
          </li>
        );
      }
      return (
        <p key={idx} className="text-slate-300 text-sm leading-relaxed mb-1">
          {formatInlineStyles(line)}
        </p>
      );
    });
  };

  // Send message handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isGenerating) return;

    setErrorMsg(null);
    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsGenerating(true);

    try {
      // Build standard Gemini content array for multi-turn history
      // Note: Skip the welcome message to keep payload light, or Map correctly to Gemini API format:
      // Gemini API format expects contents: [ { role: 'user', parts: [{ text: '...' }] }, { role: 'model', parts: [{ text: '...' }] } ]
      const apiContents = updatedMessages
        .filter(m => m.id !== "welcome")
        .map(msg => ({
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.text }]
        }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: apiContents,
          model: selectedModel,
          systemInstruction: selectedRole.systemInstruction
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with Gemini AI.");
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random()}`,
          role: "model",
          text: data.text || "I was unable to formulate a response. Please try again.",
          timestamp: new Date()
        }
      ]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setErrorMsg(err?.message || "Communication lost. Verify server connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        text: selectedRole.initialMessage,
        timestamp: new Date()
      }
    ]);
    setErrorMsg(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-10rem)]" id="gemini-chatbot-root">
      
      {/* Sidebar Controls & Settings */}
      <div className="lg:col-span-1 flex flex-col gap-6" id="chat-sidebar-controls">
        
        {/* Assistant Roles Selection */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5" id="chat-roles-card">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-cyan-400" />
            Select Persona Role
          </h3>
          <div className="flex flex-col gap-3">
            {CHATBOT_ROLES.map((role) => {
              const RoleIcon = role.icon;
              const isSelected = selectedRole.id === role.id;
              return (
                <button
                  key={role.id}
                  id={`role-btn-${role.id}`}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? `bg-slate-900 border-slate-800 ring-1 ring-cyan-500/30`
                      : `bg-slate-950/40 border-slate-950 hover:bg-slate-900/40 hover:border-slate-900`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-tr ${role.themeColor} text-slate-950`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">{role.name}</h4>
                      <p className="text-[11px] text-slate-400">{role.title}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-normal">
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Intelligence Tier selector */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5" id="chat-model-card">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Model Intelligence Tier
          </h3>
          <div className="flex flex-col gap-2.5">
            {MODELS.map((model) => {
              const ModelIcon = model.icon;
              const isSelected = selectedModel === model.id;
              return (
                <button
                  key={model.id}
                  id={`model-btn-${model.id}`}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-slate-800 text-cyan-400"
                      : "bg-slate-950/20 border-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-900 text-slate-500"} mt-0.5`}>
                    <ModelIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="font-medium text-xs text-slate-200">{model.name}</h5>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">{model.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedModel === "gemini-3.1-pro-preview" && (
            <div className="mt-3.5 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-[10px] text-indigo-300 font-sans leading-normal">
              ⚡ <strong>High Reasoning Active:</strong> Pro Thinking mode optimizes responses for ultra-complex quantitative queries. Latency may increase.
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Chat Panel */}
      <div className="lg:col-span-3 bg-slate-950 border border-slate-900 rounded-2xl flex flex-col justify-between overflow-hidden relative" id="chat-window-container">
        
        {/* Header bar of Chat */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-900 flex items-center justify-between" id="chat-window-header">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${selectedRole.themeColor} text-slate-950`}>
              <selectedRole.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-slate-100">{selectedRole.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-slate-900 text-cyan-400 border border-slate-800">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-400">{selectedRole.title} &bull; Powered by {MODELS.find(m => m.id === selectedModel)?.name}</p>
            </div>
          </div>
          
          <button
            onClick={clearChat}
            id="clear-chat-btn"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900/80 rounded-lg transition-all cursor-pointer"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 max-h-[500px]" id="chat-messages-thread">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isBot = msg.role === "model";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 max-w-[85%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Bubble Icon */}
                  <div className={`p-2 rounded-xl h-9 w-9 flex items-center justify-center shrink-0 shadow-md ${
                    isBot 
                      ? `bg-slate-900 text-cyan-400 border border-slate-800` 
                      : `bg-gradient-to-tr ${selectedRole.themeColor} text-slate-950`
                  }`}>
                    {isBot ? <selectedRole.icon className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  {/* Bubble Content */}
                  <div className="flex flex-col gap-1">
                    <div className={`rounded-2xl px-4.5 py-3 shadow-inner ${
                      isBot 
                        ? "bg-slate-900/50 border border-slate-900 text-slate-200" 
                        : "bg-slate-900 border border-slate-800 text-slate-100"
                    }`}>
                      {isBot ? renderMessageText(msg.text) : <p className="text-sm text-slate-200">{msg.text}</p>}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 self-end px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Generator Loader indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 max-w-[80%] mr-auto"
              id="chat-generating-loader"
            >
              <div className="p-2 rounded-xl h-9 w-9 bg-slate-900 text-cyan-400 border border-slate-800 flex items-center justify-center animate-pulse">
                <selectedRole.icon className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/50 border border-slate-900 rounded-2xl px-4.5 py-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-slate-400 font-mono ml-1.5">Analyzing vectors...</span>
              </div>
            </motion.div>
          )}

          {/* Error Alert Display */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs flex items-center gap-3" id="chat-error-toast">
              <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">⚠️</span>
              <div>
                <strong className="block font-semibold">Gemini API Error</strong>
                <p className="mt-0.5 opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Starter Prompts row */}
        {messages.length === 1 && (
          <div className="px-6 py-3 border-t border-slate-900 bg-slate-950" id="chat-starter-prompts-container">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-2">
              Recommended Inquiries
            </span>
            <div className="flex flex-wrap gap-2.5">
              {selectedRole.starterPrompts.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(promptText)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-cyan-400 transition-all text-left cursor-pointer"
                >
                  {promptText}
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input prompt entry form */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-900" id="chat-input-row">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              id="chatbot-input-field"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask the ${selectedRole.name}...`}
              className="flex-1 bg-slate-900/50 border border-slate-900 hover:border-slate-800 focus:border-cyan-500/50 focus:outline-none rounded-xl px-4.5 py-3.5 text-sm text-slate-100 placeholder-slate-500 transition-all font-sans"
              disabled={isGenerating}
              autoComplete="off"
            />
            <button
              type="submit"
              id="send-message-btn"
              disabled={isGenerating || !inputText.trim()}
              className={`p-3.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isGenerating || !inputText.trim()
                  ? "bg-slate-900 text-slate-600 border border-slate-950"
                  : `bg-gradient-to-tr ${selectedRole.themeColor} text-slate-950 shadow-md hover:scale-105 active:scale-95`
              }`}
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </form>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Press Enter to submit</span>
            <span>zPredict Protocol Assistant v1.4</span>
          </div>
        </div>

      </div>

    </div>
  );
}
