import React, { useState } from "react";
import { FileText, ShieldAlert, Key, Globe, EyeOff, UserCheck } from "lucide-react";
import SwapPortalInfo from "./SwapPortalInfo";

interface LegalViewsProps {
  onNavigateToSwap?: () => void;
}

export default function LegalViews({ onNavigateToSwap }: LegalViewsProps) {
  const [activeSegment, setActiveSegment] = useState<"terms" | "privacy">("terms");

  return (
    <div className="space-y-6" id="legal-legal-view font-sans">
      
      {/* Tab Select Header */}
      <div className="flex glass-inner p-1 rounded-2xl max-w-md mx-auto">
        <button
          id="legal-toggle-terms"
          onClick={() => setActiveSegment("terms")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSegment === "terms" 
              ? "bg-slate-950 border border-slate-800 text-white" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Terms & Conditions
        </button>

        <button
          id="legal-toggle-privacy"
          onClick={() => setActiveSegment("privacy")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeSegment === "privacy" 
              ? "bg-slate-950 border border-slate-800 text-white" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Privacy Policy
        </button>
      </div>

      {/* Main legal article frame */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto">
        {activeSegment === "terms" ? (
          // Terms View
          <div className="space-y-6" id="terms-content">
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">Platform Terms & Conditions</h2>
              <p className="text-xs text-slate-500 mt-1">Effective Date: May 24, 2026 • Version 1.1</p>
            </div>

            <div className="space-y-5 text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              <p className="text-slate-300 font-medium bg-slate-900 p-3.5 border border-slate-800 rounded-xl">
                Please read these terms and conditions carefully before utilizing the zPredict web3 swap, bridge, buy & sell services. By accessing the site, you agree to comply with all on-chain simulation constraints.
              </p>

              {/* Point 1 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="flex items-center justify-center p-1 glass-inner rounded-md text-cyan-400 font-mono text-[10px] w-5 h-5">1</span>
                  Simulation & Experimental Use Notice
                </h4>
                <p>
                  zPredict provides a simulated visual and functional layer to experiment with cross-chain pools and routing pipelines. The actual capital movements depend on custom smart-contract connectors that you may inject or deploy. This application holds zero liability for any test token values.
                </p>
              </div>

              {/* Point 2 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="flex items-center justify-center p-1 glass-inner rounded-md text-cyan-400 font-mono text-[10px] w-5 h-5">2</span>
                  Self-Custody & External Key Integrations
                </h4>
                <p>
                  We do not manufacture or store private cryptographic credentials on our servers. At any turn of wallet popup connection, the authorization of transfers flows entirely through standard external client extensions (e.g. MetaMask, WalletConnect). It remains your pure responsibility to oversee gas parameters.
                </p>
              </div>

              {/* Point 3 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="flex items-center justify-center p-1 glass-inner rounded-md text-cyan-400 font-mono text-[10px] w-5 h-5">3</span>
                  Accuracy of Forecasts and AI Predictions
                </h4>
                <p>
                  All simulated forecasts, bullish/bearish indices, and pricing indicators generated inside the zPredict dashboards represent local algorithmic predictions. They do NOT constitute professional investment advisor statements or financial counseling guidelines of any form.
                </p>
              </div>

              {/* Point 4 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="flex items-center justify-center p-1 glass-inner rounded-md text-cyan-400 font-mono text-[10px] w-5 h-5">4</span>
                  Modifications & Service Discontinuances
                </h4>
                <p>
                  The zPredict team maintains full authorization to alter service rates, update developer api endpoints, refresh database parameters, and deploy updated security rules anytime without preceding warnings.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Privacy View
          <div className="space-y-6" id="privacy-content">
            <div className="border-b border-slate-900 pb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">Security & Privacy Protocol</h2>
              <p className="text-xs text-slate-500 mt-1">Effective Date: May 24, 2026 • Version 1.1</p>
            </div>

            <div className="space-y-5 text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              <p className="text-slate-300 font-medium bg-slate-900 p-3.5 border border-slate-800 rounded-xl">
                Security is our absolute priority. This protocol delineates how zPredict collects, separates, isolates, and protects email sign-ups and public cryptographic wallet tracks on Google Cloud Firestore structures.
              </p>

              {/* Point 1 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <EyeOff className="w-4.5 h-4.5 text-cyan-400" />
                  Isolation of Personally Identifiable Information (PII)
                </h4>
                <p>
                  As detailed in our security specification matrix, we strictly restrict read/list inquiries on the `/users` collection containing email registrations. Only the authentic authenticated account owner holds access rights (`get` privilege) matching their user ID. Blanket queries are blocked globally.
                </p>
              </div>

              {/* Point 2 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Key className="w-4.5 h-4.5 text-cyan-400" />
                  Zero-Storage for Private Keys
                </h4>
                <p>
                  Our database records never inquire after, collect, or cache cryptographic seed words or private keys. The connected wallet addresses saved inside user profiles are strictly public coordinates to track historic in-app transactions safely.
                </p>
              </div>

              {/* Point 3 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-cyan-400" />
                  Telemetry Logging Disclaimers No-Cache policy
                </h4>
                <p>
                  In compliance with elegant human interface practices, we reject any unrequested background tracking, telemetry logs, network ping crawlers, or cookie tracking in our borders. Your communication pipeline operates purely server-side with zero profiling caches.
                </p>
              </div>

              {/* Point 4 */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 text-cyan-400" />
                  Verification and Third-Party Compliance
                </h4>
                <p>
                  Our Google Social logins and Email signup bridges rely on Firebase Authentication protocols, complying with zero-trust token structures. If you invoke API webhook gateways, your secrets are verified directly within secure cloud nodes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <SwapPortalInfo context="legal" onNavigateToSwap={onNavigateToSwap} />
      </div>
    </div>
  );
}
