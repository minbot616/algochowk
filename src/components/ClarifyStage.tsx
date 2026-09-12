'use client';

import React, { useState } from 'react';
import { ExperimentSpec, ClarifiedParameter, SignalDirection, TradeDirection } from '@/types';

interface ClarifyStageProps {
  spec: ExperimentSpec;
  onUpdateSpec: (updatedSpec: ExperimentSpec) => void;
  onContinue: (updatedSpec: ExperimentSpec) => void;
  onBackToAsk: () => void;
}

export function ClarifyStage({ spec, onUpdateSpec, onContinue, onBackToAsk }: ClarifyStageProps) {
  const [thresholdOption, setThresholdOption] = useState<string>(
    Math.abs(spec.fallThresholdPct.value) === 1.0 ? '1.0' :
    Math.abs(spec.fallThresholdPct.value) === 1.5 ? '1.5' :
    Math.abs(spec.fallThresholdPct.value) === 2.0 ? '2.0' : 'custom'
  );
  const [customThreshold, setCustomThreshold] = useState<string>(
    Math.abs(spec.fallThresholdPct.value).toString()
  );

  const [holdingDaysOption, setHoldingDaysOption] = useState<number>(
    spec.holdingPeriod.value
  );

  const isUnknownSignal = spec.signalDirection === 'unknown';
  const isUnknownTrade = spec.tradeDirection === 'unknown';
  const isPump = spec.signalDirection === 'pump';
  const isSell = spec.tradeDirection === 'sell';

  const handleSelectSignalDirection = (dir: 'fall' | 'pump') => {
    const currentMag = Math.abs(spec.fallThresholdPct.value) || 1.5;
    const signedVal = dir === 'pump' ? currentMag : -currentMag;

    // Resolve trade direction if unknown: default buy for fall, sell for pump unless user set sell
    let resolvedTrade: TradeDirection = spec.tradeDirection;
    if (resolvedTrade === 'unknown') {
      resolvedTrade = dir === 'pump' ? 'sell' : 'buy';
    }

    const hypothesisVal = dir === 'pump' && resolvedTrade === 'sell'
      ? `Selling/Shorting NIFTY 50 after a single-day sharp pump yields positive net return over a ${spec.holdingPeriod.value}-day holding period.`
      : `Buying NIFTY 50 after a single-day sharp fall yields positive net return over a ${spec.holdingPeriod.value}-day holding period.`;

    const updated: ExperimentSpec = {
      ...spec,
      signalDirection: dir,
      tradeDirection: resolvedTrade,
      hypothesis: {
        ...spec.hypothesis,
        value: hypothesisVal,
      },
      fallThresholdPct: {
        ...spec.fallThresholdPct,
        value: signedVal,
        provenance: 'user_provided',
        description: `User-selected daily close-to-close ${dir === 'pump' ? 'rise' : 'decline'} threshold of ${currentMag}%`,
      },
    };
    onUpdateSpec(updated);
  };

  const handleSelectTradeDirection = (dir: 'buy' | 'sell') => {
    const currentMag = Math.abs(spec.fallThresholdPct.value) || 1.5;

    const hypothesisVal = spec.signalDirection === 'pump' && dir === 'sell'
      ? `Selling/Shorting NIFTY 50 after a single-day sharp pump yields positive net return over a ${spec.holdingPeriod.value}-day holding period.`
      : `Buying NIFTY 50 after a single-day sharp fall yields positive net return over a ${spec.holdingPeriod.value}-day holding period.`;

    const updated: ExperimentSpec = {
      ...spec,
      tradeDirection: dir,
      hypothesis: {
        ...spec.hypothesis,
        value: hypothesisVal,
      },
    };
    onUpdateSpec(updated);
  };

  const handleThresholdChange = (val: string) => {
    setThresholdOption(val);
    let numVal = 1.5;
    if (val === '1.0') numVal = 1.0;
    else if (val === '1.5') numVal = 1.5;
    else if (val === '2.0') numVal = 2.0;
    else if (val === 'custom') numVal = Math.abs(parseFloat(customThreshold) || 1.5);

    const signedVal = isPump ? Math.abs(numVal) : -Math.abs(numVal);
    const isDefault = Math.abs(signedVal) === 1.5;
    const newThreshold: ClarifiedParameter<number> = {
      value: signedVal,
      provenance: isDefault ? 'system_default' : 'user_provided',
      description: isDefault
        ? `Prototype default of 1.5% daily close-to-close ${isPump ? 'rise' : 'decline'}`
        : `User-specified daily ${isPump ? 'rise' : 'decline'} threshold of ${Math.abs(signedVal)}%`,
    };

    const updated: ExperimentSpec = {
      ...spec,
      fallThresholdPct: newThreshold,
    };
    onUpdateSpec(updated);
  };

  const handleCustomThresholdInput = (inputStr: string) => {
    setCustomThreshold(inputStr);
    const parsed = parseFloat(inputStr);
    if (!isNaN(parsed) && parsed > 0) {
      const signedVal = isPump ? Math.abs(parsed) : -Math.abs(parsed);
      const isDefault = Math.abs(signedVal) === 1.5;
      const updated: ExperimentSpec = {
        ...spec,
        fallThresholdPct: {
          value: signedVal,
          provenance: isDefault ? 'system_default' : 'user_provided',
          description: `User-specified daily ${isPump ? 'rise' : 'decline'} threshold of ${parsed}%`,
        },
      };
      onUpdateSpec(updated);
    }
  };

  const handleHoldingDaysChange = (days: number) => {
    setHoldingDaysOption(days);
    const isDefault = days === 5;
    const provenance = isDefault ? 'system_default' : 'user_provided';

    const updated: ExperimentSpec = {
      ...spec,
      holdingPeriod: {
        value: days,
        provenance,
        description: isDefault
          ? 'Fixed 5 trading days holding period'
          : `User-specified holding duration of ${days} trading days`,
      },
      exitRule: {
        value: {
          strategy: 'fixed_holding_days',
          holdingDays: days,
        },
        provenance,
        description: isDefault
          ? 'Fixed 5 trading days holding period'
          : `Fixed ${days} trading days holding period specified by user`,
      },
    };
    onUpdateSpec(updated);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Back button & Title */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBackToAsk}
          className="text-xs text-slate-400 hover:text-slate-200 self-start transition-colors"
        >
          ← Edit question
        </button>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Let&apos;s make your question testable
        </h1>
        <p className="text-sm text-slate-400">
          We need to clarify missing parameters before running the test.
        </p>
      </div>

      {/* You Said Summary */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          You Asked
        </span>
        <p className="text-base text-slate-200 font-medium italic">
          &quot;{spec.originalQuestion}&quot;
        </p>
      </div>

      {/* STEP 1: Signal Move Clarification (shown if signalDirection is unknown) */}
      {isUnknownSignal ? (
        <div className="bg-slate-900 border border-amber-800/60 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <span>Clarification Required</span>
          </div>
          <label className="text-sm font-semibold text-white">
            1. What kind of market move do you mean by your question?
          </label>
          <p className="text-xs text-slate-400">
            Your question did not specify whether the trade follows a sharp fall (price drop) or a sharp pump (price rise). Please choose below:
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleSelectSignalDirection('fall')}
              className="px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-400 text-slate-100 font-semibold text-xs transition-all flex flex-col gap-0.5 text-left shadow-sm"
            >
              <span className="text-white font-bold">Sharp Fall (Price Drop)</span>
              <span className="text-[11px] text-slate-400">NIFTY closes significantly lower than previous day</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSignalDirection('pump')}
              className="px-5 py-3 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-400 text-slate-100 font-semibold text-xs transition-all flex flex-col gap-0.5 text-left shadow-sm"
            >
              <span className="text-white font-bold">Sharp Pump (Price Rise)</span>
              <span className="text-[11px] text-slate-400">NIFTY closes significantly higher than previous day</span>
            </button>
          </div>
        </div>
      ) : (
        /* Decision 1: Threshold (shown once signalDirection is resolved) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">
              1. What counts as a &quot;{isPump ? 'sharp pump' : 'sharp fall'}&quot;?
            </label>
            <button
              type="button"
              onClick={() => handleSelectSignalDirection(isPump ? 'fall' : 'pump')}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors"
            >
              Switch to {isPump ? 'Sharp Fall' : 'Sharp Pump'}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {['1.0', '1.5', '2.0'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleThresholdChange(val)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  thresholdOption === val
                    ? 'bg-slate-100 text-slate-900 border-white shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {val}% {isPump ? 'Rise' : 'Drop'}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleThresholdChange('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                thresholdOption === 'custom'
                  ? 'bg-slate-100 text-slate-900 border-white shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Custom
            </button>

            {thresholdOption === 'custom' && (
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={customThreshold}
                  onChange={(e) => handleCustomThresholdInput(e.target.value)}
                  className="w-20 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 pt-1">
            A sharp {isPump ? 'pump' : 'fall'} means NIFTY&apos;s close is at least this much {isPump ? 'higher' : 'lower'} than the previous trading day&apos;s close.
          </p>
        </div>
      )}

      {/* Trade Direction Selector (if trade direction was unknown) */}
      {!isUnknownSignal && isUnknownTrade && (
        <div className="bg-slate-900 border border-amber-800/60 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <label className="text-sm font-semibold text-white">
            Trade Position Action
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectTradeDirection('buy')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                spec.tradeDirection === 'buy'
                  ? 'bg-slate-100 text-slate-900 border-white shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Buy / Long
            </button>
            <button
              type="button"
              onClick={() => handleSelectTradeDirection('sell')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                spec.tradeDirection === 'sell'
                  ? 'bg-slate-100 text-slate-900 border-white shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              Sell / Short
            </button>
          </div>
        </div>
      )}

      {/* Decision 2: Holding Period */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
        <label className="text-sm font-semibold text-white">
          2. How long should we hold the position?
        </label>
        
        <div className="flex flex-wrap items-center gap-2">
          {[1, 3, 5, 10].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => handleHoldingDaysChange(days)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                holdingDaysOption === days
                  ? 'bg-slate-100 text-slate-900 border-white shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {days} {days === 1 ? 'day' : 'days'}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400 pt-1">
          We&apos;ll measure the return after this many trading sessions.
        </p>
      </div>

      {/* What We'll Assume & Needs Confirmation Section */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          What we&apos;ll assume &amp; confirm
        </span>

        <ul className="flex flex-col gap-3 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-slate-500 font-bold">•</span>
            <span>Target market: <strong className="text-white">NIFTY 50 Index</strong> (Daily closing prices)</span>
          </li>

          {isUnknownSignal ? (
            <li className="flex items-start gap-2 text-amber-300">
              <span className="text-amber-400 font-bold">•</span>
              <span>Needs confirmation: <strong className="text-amber-200">Move direction (Sharp Fall or Sharp Pump) — Select above</strong></span>
            </li>
          ) : (
            <li className="flex items-start gap-2">
              <span className="text-slate-500 font-bold">•</span>
              <div>
                <span>{isSell ? 'Sell/Short' : 'Buy/Long'} timing: <strong className="text-white">Next trading day&apos;s open</strong></span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Waiting for the next open avoids using information that would only be known after the signal day closes.
                </p>
              </div>
            </li>
          )}

          <li className="flex items-start gap-2 text-xs text-slate-400">
            <span className="text-slate-500 font-bold">•</span>
            <span>Transaction costs: Prototype friction assumption (~0.10% total configured for experiment)</span>
          </li>
        </ul>
      </div>

      {/* Primary Action Row */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBackToAsk}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          {isUnknownSignal && (
            <span className="text-xs text-amber-400/90 font-medium">
              Select move direction above to continue
            </span>
          )}
          <button
            type="button"
            disabled={isUnknownSignal}
            onClick={() => onContinue(spec)}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-xs transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}



