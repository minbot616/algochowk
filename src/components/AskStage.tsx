'use client';

import React, { useState } from 'react';

interface AskStageProps {
  initialQuestion: string;
  onSubmit: (question: string) => void;
}

export function AskStage({ initialQuestion, onSubmit }: AskStageProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [unsupportedNotice, setUnsupportedNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    // Check if the query matches the supported prototype scope (NIFTY market research questions)
    const normalized = trimmed.toLowerCase();
    const isSupported =
      normalized.includes('nifty') ||
      normalized.includes('fall') ||
      normalized.includes('drop') ||
      normalized.includes('sharp') ||
      normalized.includes('pump') ||
      normalized.includes('rise') ||
      normalized.includes('rally') ||
      normalized.includes('surge') ||
      normalized.includes('spike') ||
      normalized.includes('move') ||
      normalized.includes('now') ||
      normalized.includes('buy') ||
      normalized.includes('buying') ||
      normalized.includes('long') ||
      normalized.includes('sell') ||
      normalized.includes('selling') ||
      normalized.includes('short');

    if (isSupported) {
      setUnsupportedNotice(null);
      onSubmit(trimmed);
    } else {
      setUnsupportedNotice(
        'This prototype is configured to analyze NIFTY 50 research questions. Please use or adapt the starting question below.'
      );
    }
  };

  const handleUseDefault = () => {
    const defaultQ = 'Does buying NIFTY after a sharp fall work?';
    setQuestion(defaultQ);
    setUnsupportedNotice(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 my-auto">
      {/* Eyebrow & Header */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          RESEARCH QUESTION
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Turn a question into an experiment
        </h1>
        <p className="text-sm text-slate-400">
          Start with a question. We&apos;ll help turn it into something we can test.
        </p>
      </div>

      {/* Primary Form Area */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <label htmlFor="research-question" className="text-xs font-semibold text-slate-300">
            Your question
          </label>
          <textarea
            id="research-question"
            rows={3}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (unsupportedNotice) setUnsupportedNotice(null);
            }}
            placeholder="e.g., Does buying NIFTY after a sharp fall work?"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-base text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all resize-none font-medium"
          />

          {/* Visually connected Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleUseDefault}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
            >
              Reset to sample question
            </button>

            <button
              type="submit"
              disabled={!question.trim()}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Start research →
            </button>
          </div>
        </div>

        {/* Unsupported Notice */}
        {unsupportedNotice && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-200 flex items-center justify-between gap-3">
            <span>{unsupportedNotice}</span>
            <button
              type="button"
              onClick={handleUseDefault}
              className="px-3 py-1 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-semibold text-xs transition-colors shrink-0"
            >
              Use Supported Question
            </button>
          </div>
        )}
      </form>
    </div>
  );
}


