'use client';

import React from 'react';
import { ExperimentSpec } from '@/types';

interface TestPlaceholderStageProps {
  spec: ExperimentSpec;
  onBackToDefine: () => void;
  onBackToClarify: () => void;
}

export function TestPlaceholderStage({ spec, onBackToDefine, onBackToClarify }: TestPlaceholderStageProps) {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 self-center sm:self-start px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 border border-indigo-800/60 text-indigo-300">
          <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
          Stage 4 • Test (Next Phase)
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          TEST Stage Pending Dataset Selection
        </h2>
        <p className="text-sm text-slate-400">
          TEST is the next stage in the research workflow. Dataset selection and deterministic backtesting will be implemented next.
        </p>
      </div>

      {/* Main Placeholder Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-semibold text-white">Specification Ready for Backtest Engine</h3>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
            Spec ID: {spec.id}
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Strategy</span>
            <span className="font-semibold text-white">{spec.instrument.value.symbol} Sharp Fall</span>
          </div>
          <p className="text-sm font-medium text-slate-200">
            Signal: Daily Drop &ge; {Math.abs(spec.fallThresholdPct.value)}% &rarr; Entry: Next Open &rarr; Exit: {spec.holdingPeriod.value} Trading Days
          </p>
        </div>

        <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200">
          <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-amber-100">Next Step: Dataset Selection &amp; Execution</span>
            <p className="text-slate-300 leading-relaxed">
              Historical price action dataset loading, signal evaluation, trade log calculation, win-rate metrics, and qualitative interpretation (LEARN) will be implemented in subsequent phases.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
          <button
            type="button"
            onClick={onBackToDefine}
            className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-semibold transition-colors"
          >
            ← Back to Define Spec
          </button>

          <button
            type="button"
            onClick={onBackToClarify}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Adjust Parameters (Clarify)
          </button>
        </div>
      </div>
    </div>
  );
}
