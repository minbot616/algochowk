'use client';

import React, { useState, useEffect } from 'react';
import { ExperimentSpec, EmpiricalResult, ResearchInterpretation } from '@/types';
import { generateFallbackInterpretation } from '@/lib/ai';
import { downloadResearchReport } from '@/lib/report';

interface LearnStageProps {
  spec: ExperimentSpec;
  result: EmpiricalResult;
  onBackToTest: () => void;
  onResetWorkflow: () => void;
}

export function LearnStage({ spec, result, onBackToTest, onResetWorkflow }: LearnStageProps) {
  const [interpretation, setInterpretation] = useState<ResearchInterpretation | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchInterpretation() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spec, result }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.interpretation) {
            setInterpretation(data.interpretation);
            setIsFallback(!!data.isFallback);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API /api/learn request error, using fallback interpretation:', err);
      }

      if (isMounted) {
        const fallback = generateFallbackInterpretation(spec, result);
        setInterpretation(fallback);
        setIsFallback(true);
        setIsLoading(false);
      }
    }

    fetchInterpretation();

    return () => {
      isMounted = false;
    };
  }, [spec, result]);

  const isPump = spec.signalDirection === 'pump';
  const isSell = spec.tradeDirection === 'sell';
  const thresholdPct = Math.abs(spec.fallThresholdPct.value);
  const isPositiveAvg = result.metrics.averageReturnPct >= 0;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onBackToTest}
          className="text-xs text-slate-400 hover:text-slate-200 self-start transition-colors"
        >
          ← Back to results
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            What did we learn?
          </h1>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
            {isLoading ? 'Synthesizing...' : isFallback ? 'Deterministic synthesis' : 'AI interpretation'}
          </span>
        </div>
      </div>

      {/* Main Result Highlight Statement */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2 shadow-xl">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          RESULT SUMMARY
        </span>
        <p className="text-base font-medium text-slate-100 leading-relaxed">
          Over 10 years, {isSell ? 'selling/shorting' : 'buying'} NIFTY after a {thresholdPct}% sharp {isPump ? 'rise' : 'drop'} produced a <strong className="text-slate-100">{result.metrics.winRatePct}% win rate</strong> and an average return of <strong className={isPositiveAvg ? 'text-emerald-400' : 'text-rose-400'}>{isPositiveAvg ? '+' : ''}{result.metrics.averageReturnPct}%</strong> per trade across {result.metrics.totalTrades} occurrences.
        </p>
      </div>

      {/* SECTION 1: WHAT THE DATA SHOWS */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          1. WHAT THE DATA SHOWS
        </h3>
        {interpretation ? (
          <ul className="flex flex-col gap-2 text-sm text-slate-200">
            {interpretation.dataFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-500 font-bold">•</span>
                <span className="leading-relaxed">{finding}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-500 py-3">Analyzing empirical metrics...</div>
        )}
      </div>

      {/* SECTION 2: WHAT WE CAN REASONABLY CONCLUDE */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          2. WHAT WE CAN REASONABLY CONCLUDE
        </h3>
        {interpretation ? (
          <div className="flex flex-col gap-2.5 text-sm text-slate-200 leading-relaxed">
            {interpretation.conclusions.map((conclusion, idx) => (
              <p key={idx}>{conclusion}</p>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 py-3">Drawing cautious conclusions...</div>
        )}
      </div>

      {/* SECTION 3: LIMITATIONS */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          3. LIMITATIONS
        </h3>
        {interpretation ? (
          <ul className="flex flex-col gap-2 text-xs text-slate-300">
            {interpretation.limitations.map((limitation, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span className="leading-relaxed">{limitation}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-500 py-3">Reviewing experiment boundaries...</div>
        )}
      </div>

      {/* SECTION 4: WHAT SHOULD WE INVESTIGATE NEXT? */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          4. WHAT SHOULD WE INVESTIGATE NEXT?
        </h3>
        {interpretation ? (
          <ol className="flex flex-col gap-2 text-xs text-slate-300">
            {interpretation.suggestedNextQuestions.map((q, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-semibold text-slate-400">{idx + 1}.</span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-xs text-slate-500 py-3">Formulating next research questions...</div>
        )}
      </div>

      {/* Report Download Notice & Primary Action Row */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5 text-center sm:text-left">
          <span className="text-xs font-semibold text-slate-300">Export Research Report</span>
          <span className="text-[11px] text-slate-500">Save this experiment, evidence, and conclusions as a standalone HTML document.</span>
        </div>
        <button
          type="button"
          onClick={() => downloadResearchReport(spec, result, interpretation)}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-all shrink-0 shadow-sm flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Report
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBackToTest}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onResetWorkflow}
          className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-xs transition-all shadow-sm"
        >
          Start New Research →
        </button>
      </div>
    </div>
  );
}



