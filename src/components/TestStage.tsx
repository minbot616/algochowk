'use client';

import React, { useState } from 'react';
import { ExperimentSpec, EmpiricalResult } from '@/types';
import { MarketBar } from '@/lib/data';

interface TestStageProps {
  spec: ExperimentSpec;
  bars: MarketBar[];
  onRunTest: () => EmpiricalResult;
  onContinueToLearn: (result: EmpiricalResult) => void;
  onBackToDefine: () => void;
}

export function TestStage({ spec, bars, onRunTest, onContinueToLearn, onBackToDefine }: TestStageProps) {
  const [result, setResult] = useState<EmpiricalResult | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [displayCount, setDisplayCount] = useState<number>(10);

  const handleExecuteBacktest = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const res = onRunTest();
      setResult(res);
      setIsExecuting(false);
    }, 300);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBackToDefine}
          className="text-xs text-slate-400 hover:text-slate-200 self-start transition-colors"
        >
          ← Review setup
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          What happened?
        </h1>
        <p className="text-sm text-slate-400">
          Evaluating 10 years of NIFTY 50 daily market data (2,467 trading sessions).
        </p>
      </div>

      {/* Pre-Execution Run Button */}
      {!result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center gap-5 shadow-xl">
          <p className="text-sm text-slate-300 max-w-md">
            Ready to test rules: signal on &ge;{Math.abs(spec.fallThresholdPct.value)}% {spec.signalDirection === 'pump' ? 'rise' : 'drop'}, enter next open ({spec.tradeDirection === 'sell' ? 'short' : 'long'}), hold {spec.holdingPeriod.value} days.
          </p>
          <button
            type="button"
            onClick={handleExecuteBacktest}
            disabled={isExecuting}
            className="px-8 py-3.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-xs transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
          >
            {isExecuting ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></span>
                Evaluating market data...
              </>
            ) : (
              <>Run Backtest Now →</>
            )}
          </button>
        </div>
      )}

      {/* Post-Execution Hero Metrics */}
      {result && (
        <div className="flex flex-col gap-5">
          {/* 4 Main Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-0.5 shadow-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signal events</span>
              <span className="text-2xl font-extrabold text-white font-mono">{result.metrics.totalTrades}</span>
              <span className="text-[11px] text-slate-500">Occurrences</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-0.5 shadow-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Win rate</span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">{result.metrics.winRatePct}%</span>
              <span className="text-[11px] text-slate-500">{result.metrics.winningTrades} of {result.metrics.totalTrades} positive</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-0.5 shadow-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average net return</span>
              <span className={`text-2xl font-extrabold font-mono ${result.metrics.averageReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.metrics.averageReturnPct >= 0 ? '+' : ''}{result.metrics.averageReturnPct}%
              </span>
              <span className="text-[11px] text-slate-500">Net per trade</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-0.5 shadow-md">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Median net return</span>
              <span className={`text-2xl font-extrabold font-mono ${result.metrics.medianReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.metrics.medianReturnPct >= 0 ? '+' : ''}{result.metrics.medianReturnPct}%
              </span>
              <span className="text-[11px] text-slate-500">Net per trade</span>
            </div>
          </div>

          {/* Event Study Note */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400">
            <strong className="text-slate-300 font-semibold">Note on methodology:</strong> These are independent event observations, not a compounded portfolio return.
          </div>

          {/* Collapsible Secondary Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <span>{showDetails ? 'Hide Detailed Trade Logs' : 'View More Details & Trade Logs'}</span>
              <span>{showDetails ? '▲' : '▼'}</span>
            </button>

            {showDetails && (
              <div className="px-5 pb-5 flex flex-col gap-4 border-t border-slate-800 pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Best Trade Return</span>
                    <span className="text-emerald-400 font-bold font-mono text-base">+{result.metrics.bestReturnPct}%</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Worst single trade return</span>
                    <span className="text-rose-400 font-bold font-mono text-base">{result.metrics.worstReturnPct}%</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[11px]">Sum of Net Returns</span>
                    <span className="text-slate-200 font-bold font-mono text-base">{result.metrics.totalNetReturnPct >= 0 ? '+' : ''}{result.metrics.totalNetReturnPct}%</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">Signal Date</th>
                        <th className="py-2 px-2">Entry</th>
                        <th className="py-2 px-2">Exit</th>
                        <th className="py-2 px-2">Net Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 font-mono text-slate-300">
                      {result.trades.slice(0, displayCount).map((t, idx) => (
                        <tr key={t.tradeId} className="hover:bg-slate-950/40">
                          <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-2 text-slate-300">{t.signalDate}</td>
                          <td className="py-2 px-2">{t.entryPrice.toLocaleString('en-IN')}</td>
                          <td className="py-2 px-2">{t.exitPrice.toLocaleString('en-IN')}</td>
                          <td className={`py-2 px-2 font-bold ${t.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.netReturnPct >= 0 ? '+' : ''}{t.netReturnPct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {displayCount < result.trades.length && (
                  <button
                    type="button"
                    onClick={() => setDisplayCount((prev) => Math.min(prev + 25, result.trades.length))}
                    className="self-center px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Load More Trades ({result.trades.length - displayCount} remaining)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBackToDefine}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={() => onContinueToLearn(result)}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-xs transition-all shadow-sm"
            >
              Interpret the results →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


