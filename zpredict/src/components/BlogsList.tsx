import React, { useState } from "react";
import { ArrowLeft, BookOpen, Clock, Tag, User } from "lucide-react";
import { Article } from "../types";
import { mockArticles } from "../data";
import SwapPortalInfo from "./SwapPortalInfo";

interface BlogsListProps {
  onNavigateToSwap?: () => void;
}

export default function BlogsList({ onNavigateToSwap }: BlogsListProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  if (selectedArticle) {
    // Read full details of a specific blog article
    return (
      <article className="max-w-4xl mx-auto space-y-6" id="blog-reader-frame">
        
        {/* Back control */}
        <button
          id="blog-back-to-list"
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Insights Catalog
        </button>

        {/* Article banner */}
        <div className="relative h-64 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-900 shadow-xl">
          <img
            src={selectedArticle.image}
            alt={selectedArticle.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 right-6">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-400 text-slate-950 mb-3 uppercase tracking-wider font-mono">
              {selectedArticle.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold font-sans text-white leading-tight">
              {selectedArticle.title}
            </h1>
          </div>
        </div>

        {/* Metadata sublayer */}
        <div className="flex flex-wrap items-center gap-5 p-4 bg-slate-950 border border-slate-900 rounded-xl text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-600" />
            Authored by <strong className="text-slate-300">{selectedArticle.author}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-600" />
            {selectedArticle.readTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-slate-600" />
            Published <strong className="text-slate-300">{selectedArticle.publishedAt}</strong>
          </span>
        </div>

        {/* Body content */}
        <div className="prose prose-invert max-w-none prose-slate text-sm sm:text-base leading-relaxed text-slate-300 font-sans space-y-6 pt-2">
          <p className="text-lg font-medium text-slate-200 border-l-2 border-cyan-400 pl-4 italic">
            {selectedArticle.summary}
          </p>
          <div className="space-y-4">
            <p>{selectedArticle.content}</p>
            <p>
              In the context of the highly dynamic zPredict network, we analyze liquidity aggregates based on gas volatility across Arbitrum, Optimism, Solana, and Ethereum structures. Developers can refer to our open API documents to integrate custom forecasting triggers into their smart pools directly.
            </p>
            <p>
              By standardizing cross-chain routing and locks within unified self-custodial vaults, users maintain perfect security over their cryptographic secrets. When our transaction logs write to decentralized states, developers can query rate indexes synchronously using specialized endpoints.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6">
          <button
            id="blog-back-to-list-bottom"
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Insights Catalog
          </button>
        </div>

      </article>
    );
  }

  return (
    <div className="space-y-6" id="blogs-container">
      
      {/* Blog header section */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold font-sans text-white">Market Insights & Publications</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Analysis from zPredict researchers on decentralized bridges, slippage optimization algorithms, and web3 network trends.
        </p>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockArticles.map((article) => (
          <div
            key={article.id}
            id={`blog-card-${article.id}`}
            onClick={() => setSelectedArticle(article)}
            className="flex flex-col bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden hover:border-slate-800 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyan-500/5 group"
          >
            {/* thumbnail */}
            <div className="h-48 w-full overflow-hidden relative">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs border border-slate-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-400 uppercase">
                {article.category}
              </span>
            </div>

            {/* description content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> {article.publishedAt} • {article.readTime}
                </span>
                <h3 className="font-bold text-base text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              <div className="pt-2 text-xs font-semibold text-cyan-400 group-hover:underline flex items-center gap-1">
                Read Complete Post ➔
              </div>
            </div>

          </div>
        ))}
      </div>

      <SwapPortalInfo context="blogs" onNavigateToSwap={onNavigateToSwap} />
    </div>
  );
}
