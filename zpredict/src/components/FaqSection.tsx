import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const faqs: FaqItem[] = [
  {
    question: "What chains are supported?",
    answer: "We currently support Ethereum (ETH), Solana (SOL), Polygon (POL), and Arbitrum (ARB). We are actively adding more chains and integration bridges every month based on community feedback."
  },
  {
    question: "Is there a native zPredict token?",
    answer: "Yes, the ZPRED token is our native ecosystem token. It can be used for participation in our prediction markets, receiving reduced fees, and governance features. See the live market table for current pricing."
  },
  {
    question: "How are platform fees utilized?",
    answer: "Fee revenue (e.g., 0.3% bridge fee) is distributed sustainably: a majority is allocated to our liquidity providers and stakers, while remaining proceeds fund continuous smart-contract security audits and platform development."
  },
  {
    question: "Do I need KYC to use zPredict?",
    answer: "No. zPredict is designed as a decentralized, self-custodial interface. We never collect personal identification, hold user custody of assets, or require KYC documents."
  },
];

const FaqItemComponent: React.FC<{ faq: FaqItem }> = ({ faq }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60"
      >
        <span className="text-sm font-bold text-white">{faq.question}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-xs text-slate-400 bg-slate-900/20">{faq.answer}</div>
      )}
    </div>
  );
};

export default function FaqSection() {
  return (
      <section className="glass-card rounded-2xl p-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => <FaqItemComponent key={i} faq={faq} />)}
        </div>
      </section>
  );
}
