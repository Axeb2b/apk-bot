import React, { useState } from "react";
import { 
  Key, 
  Terminal, 
  Cpu, 
  Check, 
  Copy, 
  Play, 
  CornerDownRight, 
  Sparkles,
  Search,
  Loader2
} from "lucide-react";
import { apiEndpointsList } from "../data";
import { ApiEndpoint } from "../types";
import SwapPortalInfo from "./SwapPortalInfo";

interface ApiDocsProps {
  onNavigateToSwap?: () => void;
}

export default function ApiDocs({ onNavigateToSwap }: ApiDocsProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(apiEndpointsList[0]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [simulatedResponse, setSimulatedResponse] = useState<string | null>(null);
  const [loadingSandbox, setLoadingSandbox] = useState(false);

  const generateApiKey = () => {
    const randomHex = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setApiKey(`zp_live_${randomHex}`);
    setCopiedKey(false);
  };

  const copyKeyToClipboard = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyCurlToClipboard = (endpoint: ApiEndpoint) => {
    const curl = `curl -X ${endpoint.method} \\
  "https://api.zpredict.io${endpoint.path}" \\
  -H "Authorization: Bearer ${apiKey || "zp_live_your_api_key_here"}" \\
  -H "Content-Type: application/json" ${
    endpoint.requestBody ? `\\\n  -d '${endpoint.requestBody.replace(/\s+/g, " ")}'` : ""
  }`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const executeSandboxSimulation = () => {
    setLoadingSandbox(true);
    setSimulatedResponse(null);

    setTimeout(() => {
      setSimulatedResponse(selectedEndpoint.responseBody);
      setLoadingSandbox(false);
    }, 800);
  };

  return (
    <div className="space-y-8" id="api-portal">
      
      {/* Intro Portal Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-slate-950 border border-slate-900 rounded-2xl">
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-950/40 border border-indigo-800/40 rounded-full">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 tracking-wider">DeFi Middleware Webhooks</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">zPredict Developer Portal</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Integrate high-speed swaps, cross-chain bridge estimates, and prediction rate indicators into your smart-contracts or node backends. Generate a client token to authenticate webhook routes.
          </p>
        </div>

        {/* API Key Generator widget */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 w-full md:w-80">
          <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block">Access Credentials</span>
          {apiKey ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 border border-slate-800 rounded-lg">
                <span className="font-mono text-xs text-cyan-400 truncate w-44">{apiKey}</span>
                <button
                  id="api-key-copy"
                  onClick={copyKeyToClipboard}
                  className="p-1 px-1.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Header Key"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                id="api-key-refresh"
                onClick={generateApiKey}
                className="text-[10px] hover:underline hover:text-white text-slate-500 font-mono"
              >
                Regenerate key code
              </button>
            </div>
          ) : (
            <button
              id="api-key-generate"
              onClick={generateApiKey}
              className="w-full py-2 px-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <Key className="w-3.5 h-3.5" />
              Generate API Auth Secret
            </button>
          )}
        </div>
      </div>

      {/* Main split docs workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sidebar routes mapping */}
        <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 h-fit">
          <span className="block text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-3 px-1">Endpoints Registry</span>
          <div className="space-y-1">
            {apiEndpointsList.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path;
              const isGet = ep.method === "GET";
              return (
                <button
                  key={ep.path}
                  id={`api-endpoint-${ep.method}-${ep.path.replace(/\//g, "-")}`}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    setSimulatedResponse(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-slate-900 border-slate-800 text-white shadow-xs" 
                      : "border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                  }`}
                >
                  <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded-md ${
                    isGet ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30" : "bg-sky-950/40 text-sky-400 border border-sky-900/30"
                  }`}>
                    {ep.method}
                  </span>
                  <div className="truncate text-xs font-mono">
                    {ep.path}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documentation details & Interactive Sandbox */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded border ${
                  selectedEndpoint.method === "GET" ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-sky-950 text-sky-400 border-sky-900"
                }`}>
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm sm:text-base font-semibold text-white tracking-tight">{selectedEndpoint.path}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-sans mt-2 leading-relaxed">
                {selectedEndpoint.description}
              </p>
            </div>

            {/* Simulated request payloads */}
            {selectedEndpoint.requestBody && (
              <div className="space-y-1.5">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-500">JSON Request Sample payload</span>
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-350 overflow-x-auto">
                  {selectedEndpoint.requestBody}
                </pre>
              </div>
            )}

            {/* CURL snippet tools */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">cURL bash template</span>
                <button
                  id="api-curl-copy"
                  onClick={() => copyCurlToClipboard(selectedEndpoint)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:underline cursor-pointer"
                >
                  {copiedCurl ? <>Copied curl snippet</> : <>Copy cURL code</>}
                </button>
              </div>
              <pre className="p-3.5 bg-slate-950 border border-slate-900 rounded-lg text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {`curl -X ${selectedEndpoint.method} \\
  "https://api.zpredict.io${selectedEndpoint.path}" \\
  -H "Authorization: Bearer ${apiKey || "zp_live_your_api_key_here"}" \\
  -H "Content-Type: application/json" ${
    selectedEndpoint.requestBody ? `\\\n  -d '${selectedEndpoint.requestBody.replace(/\s+/g, " ")}'` : ""
  }`}
              </pre>
            </div>
          </section>

          {/* CODE INTERACTIVE SANDBOX */}
          <section className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400">
                <Terminal className="w-5 h-5" />
                <h3 className="font-sans font-bold text-base text-white">Interactive Endpoint Sandbox</h3>
              </div>
              <button
                id="api-sandbox-execute"
                onClick={executeSandboxSimulation}
                disabled={loadingSandbox}
                className="py-1.5 px-3 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {loadingSandbox ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Execute Sandbox Call
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
              Select any endpoint on the sidebar and click execute. Our sandbox triggers high-fidelity simulations returning realistic JSON bodies with responsive latencies.
            </p>

            {simulatedResponse ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 uppercase">
                  <span>Simulated Status: 200 OK</span>
                  <span>Latency: 12ms</span>
                </div>
                <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">
                  {simulatedResponse}
                </pre>
              </div>
            ) : (
              <div className="py-12 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 font-mono text-xs">
                {loadingSandbox ? "Routing mock gateways..." : "Awaiting Execution Click..."}
              </div>
            )}
          </section>
        </div>

      </div>

      <SwapPortalInfo context="api" onNavigateToSwap={onNavigateToSwap} />
    </div>
  );
}
