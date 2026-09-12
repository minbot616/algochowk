'use client';

import React, { useState } from 'react';
import { ExperimentSpec, EmpiricalResult } from '@/types';
import { createDefaultNiftyExperiment, parseQuestionIntent } from '@/lib/experiment';
import { runBacktest } from '@/lib/backtest';
import { MarketBar } from '@/lib/data';
import { AskStage, ClarifyStage, DefineStage, TestStage, LearnStage } from '@/components';
import niftyBars from '@data/nifty50_daily.json';

type ResearchStage = 'ask' | 'clarify' | 'define' | 'test' | 'learn';

export default function Home() {
  const [stage, setStage] = useState<ResearchStage>('ask');
  const [experimentSpec, setExperimentSpec] = useState<ExperimentSpec>(
    createDefaultNiftyExperiment()
  );
  const [empiricalResult, setEmpiricalResult] = useState<EmpiricalResult | null>(null);

  const marketBars = niftyBars as MarketBar[];

  // Journey steps definition for top stepper
  const journeySteps = [
    { key: 'ask', label: 'ASK' },
    { key: 'clarify', label: 'CLARIFY' },
    { key: 'define', label: 'DEFINE' },
    { key: 'test', label: 'TEST' },
    { key: 'learn', label: 'LEARN' },
  ];

  // Handle ASK submit
  const handleAskSubmit = (question: string) => {
    const intent = parseQuestionIntent(question);
    const isPump = intent.signalDirection === 'pump';
    const isSell = intent.tradeDirection === 'sell';
    const isUnknownSignal = intent.signalDirection === 'unknown';

    let hypothesisVal = 'Evaluate NIFTY 50 price movements and subsequent returns over a 5-day holding period.';
    if (intent.signalDirection === 'fall') {
      hypothesisVal = `Buying NIFTY 50 after a single-day sharp fall yields positive net return over a ${experimentSpec.holdingPeriod.value}-day holding period.`;
    } else if (intent.signalDirection === 'pump' && intent.tradeDirection === 'sell') {
      hypothesisVal = `Selling/Shorting NIFTY 50 after a single-day sharp pump yields positive net return over a ${experimentSpec.holdingPeriod.value}-day holding period.`;
    }

    const currentMag = Math.abs(experimentSpec.fallThresholdPct.value) || 1.5;
    const thresholdVal = isPump ? currentMag : -currentMag;

    const updatedSpec: ExperimentSpec = {
      ...experimentSpec,
      originalQuestion: question,
      signalDirection: intent.signalDirection,
      tradeDirection: intent.tradeDirection,
      hypothesis: {
        ...experimentSpec.hypothesis,
        value: hypothesisVal,
      },
      fallThresholdPct: {
        ...experimentSpec.fallThresholdPct,
        value: thresholdVal,
        description: isUnknownSignal
          ? 'Threshold to be determined upon signal direction clarification'
          : (isPump ? `Prototype default of ${currentMag}% daily close-to-close rise` : `Prototype default of ${currentMag}% daily close-to-close decline`),
      },
      id: `exp_${Date.now()}`,
    };
    setExperimentSpec(updatedSpec);
    setStage('clarify');
  };

  // Handle Spec updates in CLARIFY stage
  const handleUpdateSpec = (updatedSpec: ExperimentSpec) => {
    setExperimentSpec(updatedSpec);
  };

  // Handle Continue to DEFINE
  const handleContinueToDefine = (updatedSpec: ExperimentSpec) => {
    setExperimentSpec(updatedSpec);
    setStage('define');
  };

  // Handle Backtest execution in TEST stage
  const handleRunTest = (): EmpiricalResult => {
    const earliestDate = marketBars[0]?.date || '2016-09-12';
    const latestDate = marketBars[marketBars.length - 1]?.date || '2026-09-11';

    const updatedSpec: ExperimentSpec = {
      ...experimentSpec,
      testPeriod: {
        value: {
          startDate: earliestDate,
          endDate: latestDate,
        },
        provenance: 'system_default',
        description: `Resolved historical market evaluation window (${earliestDate} to ${latestDate})`,
      },
      status: 'tested',
    };

    setExperimentSpec(updatedSpec);
    const result = runBacktest(marketBars, updatedSpec);
    setEmpiricalResult(result);
    return result;
  };

  // Reset entire research workflow to ASK stage
  const handleResetWorkflow = () => {
    setExperimentSpec(createDefaultNiftyExperiment());
    setEmpiricalResult(null);
    setStage('ask');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      {/* Header Area */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm px-6 py-3.5 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-sm tracking-tight text-slate-200">
              AlgoChowk
            </span>
          </div>

          {/* Subtle Progress Indicator */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {journeySteps.map((step, idx) => {
              const isActive = stage === step.key;
              const stepOrder: Record<string, number> = { ask: 1, clarify: 2, define: 3, test: 4, learn: 5 };
              const currentOrder = stepOrder[stage] || 1;
              const isCompleted = stepOrder[step.key] < currentOrder;

              return (
                <React.Fragment key={step.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (step.key === 'ask') setStage('ask');
                      else if (step.key === 'clarify' && currentOrder >= 2) setStage('clarify');
                      else if (step.key === 'define' && currentOrder >= 3) setStage('define');
                      else if (step.key === 'test' && currentOrder >= 4) setStage('test');
                      else if (step.key === 'learn' && currentOrder >= 5 && empiricalResult) setStage('learn');
                    }}
                    disabled={stepOrder[step.key] > currentOrder && !(step.key === 'learn' && empiricalResult)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : isCompleted
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {step.label}
                  </button>
                  {idx < journeySteps.length - 1 && (
                    <span className="text-slate-700 text-[10px] select-none">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        {stage === 'ask' && (
          <AskStage
            initialQuestion={experimentSpec.originalQuestion}
            onSubmit={handleAskSubmit}
          />
        )}

        {stage === 'clarify' && (
          <ClarifyStage
            spec={experimentSpec}
            onUpdateSpec={handleUpdateSpec}
            onContinue={handleContinueToDefine}
            onBackToAsk={() => setStage('ask')}
          />
        )}

        {stage === 'define' && (
          <DefineStage
            spec={experimentSpec}
            onBackToClarify={() => setStage('clarify')}
            onContinueToTest={() => setStage('test')}
          />
        )}

        {stage === 'test' && (
          <TestStage
            spec={experimentSpec}
            bars={marketBars}
            onRunTest={handleRunTest}
            onContinueToLearn={(res) => {
              setEmpiricalResult(res);
              setStage('learn');
            }}
            onBackToDefine={() => setStage('define')}
          />
        )}

        {stage === 'learn' && empiricalResult && (
          <LearnStage
            spec={experimentSpec}
            result={empiricalResult}
            onBackToTest={() => setStage('test')}
            onResetWorkflow={handleResetWorkflow}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        AlgoChowk Guided Research Workflow • ASK → CLARIFY → DEFINE → TEST → LEARN
      </footer>
    </div>
  );
}


