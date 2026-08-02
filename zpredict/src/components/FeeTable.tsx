import React from "react";

export default function FeeTable() {
  return (
    <div className="mt-6 border border-slate-900 bg-slate-950/60 rounded-xl p-6">
        <h4 className="text-sm font-bold text-white mb-4">Fee Structure</h4>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                    <th className="p-2">Action</th>
                    <th className="p-2">Fee</th>
                    <th className="p-2">Notes</th>
                </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800"><td className="p-2">Swap (same chain)</td><td className="p-2">0.2%</td><td className="p-2">0.1% goes to stakers</td></tr>
              <tr className="border-b border-slate-800"><td className="p-2">Bridge (L1→L2)</td><td className="p-2">0.3% + gas</td><td className="p-2">Variable by route</td></tr>
              <tr className="border-b border-slate-800"><td className="p-2">Staking deposit</td><td className="p-2">Free</td><td className="p-2">Unstake lock 7 days</td></tr>
              <tr><td className="p-2">API access</td><td className="p-2">Free</td><td className="p-2">Up to 1k req/day</td></tr>
            </tbody>
          </table>
        </div>
    </div>
  );
}
