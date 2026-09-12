'use client';

import React from 'react';
import { ExperimentSpec } from '@/types';

interface DefineStageProps {
  spec: ExperimentSpec;
  onBackToClarify: () => void;
  onContinueToTest: () => void;
}

export function DefineStage({ spec, onBackToClarify, onContinueToTest }: DefineStageProps) {
  if (spec.signalDirection === 'unknown' || spec.tradeDirection === 'unknown') {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-6 flex flex-col gap-4 text-amber-200 shadow-xl">
          <h2 className="text-base font-bold text-amber-100">Unresolved Experiment Parameters</h2>
          <p className="text-xs leading-relaxed text-amber-200">
            This experiment requires direction clarification (Sharp Fall vs Sharp Pump) before it can be defined or tested.
          </p>
          <button
            type="button"
            onClick={onBackToClarify}
            className="self-start px-5 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-100 font-semibold text-xs transition-colors"
          >
            ← Return to CLARIFY to resolve direction
          </button>
        </div>
      </div>
    );
  }

  const isPump = spec.signalDirection === 'pump';
  const isSell = spec.tradeDirection === 'sell';
  const thresholdPct = Math.abs(spec.fallThresholdPct.value);
  const holdingDays = spec.holdingPeriod.value;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBackToClarify}
          className="text-xs text-slate-400 hover:text-slate-200 self-start transition-colors"
        >
          ← Edit rules
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Here&apos;s what we&apos;re going to test
        </h1>
        <p className="text-sm text-slate-400">
          Review the complete experiment definition before running the test.
        </p>
      </div>

      {/* Summary Definition Review Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-y-3.5 gap-x-4 text-sm items-baseline">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:col-span-1">
            QUESTION
          </span>
          <p className="text-slate-200 font-medium italic sm:col-span-3">
            &quot;{spec.originalQuestion}&quot;
          </p>

          <hr className="sm:col-span-4 border-slate-800/80" />

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:col-span-1">
            SIGNAL
          </span>
          <span className="text-white font-medium sm:col-span-3">
            NIFTY {isPump ? 'rises' : 'falls'} at least <strong className="text-slate-100">{thresholdPct}%</strong> from previous close
          </span>

          <hr className="sm:col-span-4 border-slate-800/80" />

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:col-span-1">
            ENTRY
          </span>
          <span className="text-white font-medium sm:col-span-3">
            Next trading day&apos;s open ({isSell ? 'Sell/Short' : 'Buy/Long'})
          </span>

          <hr className="sm:col-span-4 border-slate-800/80" />

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:col-span-1">
            EXIT
          </span>
          <span className="text-white font-medium sm:col-span-3">
            {holdingDays} trading days later (at market close)
          </span>

          <hr className="sm:col-span-4 border-slate-800/80" />

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:col-span-1">
            DATA
          </span>
          <span className="text-white font-medium sm:col-span-3">
            NIFTY 50 daily spot data (12 Sep 2016 – 11 Sep 2026)
          </span>

          <hr className="sm:col-span-4 border-slate-800/80" />

          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:col-span-1">
            COSTS
          </span>
          <span className="text-white font-medium sm:col-span-3">
            Prototype transaction-friction assumption (~0.10%)
          </span>
        </div>
      </div>

      {/* Rationale Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-1.5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Why this setup?
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Using the next day&apos;s open avoids look-ahead bias. The threshold ({thresholdPct}%) and holding period ({holdingDays} days) are explicit assumptions rather than claims that they are optimal.
        </p>
      </div>

      {/* Primary Action Row */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBackToClarify}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onContinueToTest}
          className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-xs transition-all shadow-sm"
        >
          Run experiment →
        </button>
      </div>
    </div>
  );
}


