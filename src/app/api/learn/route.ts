import { NextRequest, NextResponse } from 'next/server';
import { ExperimentSpec, EmpiricalResult } from '@/types';
import { generateFallbackInterpretation, validateInterpretationResponse } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spec, result } = body as { spec: ExperimentSpec; result: EmpiricalResult };

    if (!spec || !result || !result.metrics) {
      return NextResponse.json({ error: 'Missing experiment spec or empirical results' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    // Fallback if API key is not configured
    if (!apiKey) {
      console.log('[API /api/learn] API key not found. Using deterministic fallback interpretation.');
      const fallback = generateFallbackInterpretation(spec, result);
      return NextResponse.json({ interpretation: fallback, isFallback: true });
    }

    const isPump = spec.signalDirection === 'pump';
    const isSell = spec.tradeDirection === 'sell';

    // Prepare strict structured prompt
    const promptText = `
ROLE: You are an expert AI trading research interpreter for AlgoChowk.

EXPERIMENT CONTEXT:
- Original Question: "${spec.originalQuestion}"
- Hypothesis: "${spec.hypothesis.value}"
- Target Instrument: ${spec.instrument.value.symbol} (${spec.instrument.value.assetClass})
- Signal Direction: ${isPump ? 'Pump / Price Rise' : 'Fall / Price Drop'}
- Trade Position: ${isSell ? 'Sell / Short' : 'Buy / Long'}
- Signal Threshold: Daily Close-to-Close ${isPump ? 'Rise' : 'Drop'} >= ${Math.abs(spec.fallThresholdPct.value)}%
- Entry Timing: Next Trading-Day Open (${isSell ? 'Sell/Short' : 'Buy/Long'})
- Holding Duration: ${spec.holdingPeriod.value} Trading Days
- Dataset Window: ${result.dataset.startDate} to ${result.dataset.endDate} (${result.dataset.totalTradingDays} trading days)

DETERMINISTIC EMPIRICAL METRICS (COMPUTED BY BACKTEST ENGINE - DO NOT CHANGE THESE NUMBERS):
- Total Signals / Completed Trades: ${result.metrics.totalTrades}
- Winning Trades: ${result.metrics.winningTrades} (${result.metrics.winRatePct}% win rate)
- Losing Trades: ${result.metrics.losingTrades}
- Mean Net Return per Trade: ${result.metrics.averageReturnPct}%
- Median Net Return per Trade: ${result.metrics.medianReturnPct}%
- Best Net Trade Return: +${result.metrics.bestReturnPct}%
- Worst Net Trade Return: ${result.metrics.worstReturnPct}%
- Sum of Trade Net Returns: +${result.metrics.totalNetReturnPct}%

INSTRUCTIONS & CONSTRAINTS:
1. DO NOT invent, calculate, or alter numerical backtest metrics.
2. Use ONLY the supplied empirical metrics above.
3. DO NOT claim future performance, guaranteed edge, or that "the strategy is profitable".
4. Match terminology to Signal Direction (${isPump ? 'rise/pump' : 'fall/decline'}) and Trade Position (${isSell ? 'short' : 'long'}).
5. If Mean Net Return is negative (${result.metrics.averageReturnPct}%), explicitly state that average net return was negative across the sample, even if some trades were profitable.
6. DO NOT call individual trade losses "drawdown". Reserve the word "drawdown" for peak-to-trough max drawdown metrics. Refer to single-trade losses as "individual trade losses" or "worst single trade return".
7. For limitation threshold examples, do NOT list the current threshold (${Math.abs(spec.fallThresholdPct.value)}%) as an alternative.
8. Phrase follow-up volatility questions neutrally without claiming statistical significance (e.g., "How does strategy performance differ between high-volatility regimes and low-volatility pullbacks?").

RETURN ONLY VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "dataFindings": [ "string array of 4-5 factual observations grounded in metrics" ],
  "conclusions": [ "string array of 2-3 cautious research conclusions" ],
  "limitations": [ "string array of 4-5 experiment caveats and limitations" ],
  "suggestedNextQuestions": [ "string array of 3-4 concrete next research questions" ]
}
`;

    // Attempt Gemini / LLM API call using native fetch
    try {
      const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (res.ok) {
        const jsonRes = await res.json();
        const rawText = jsonRes?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          const parsed = JSON.parse(rawText);
          const validated = validateInterpretationResponse(parsed, spec.id);

          if (validated) {
            return NextResponse.json({ interpretation: validated, isFallback: false });
          }
        }
      }
    } catch (apiErr) {
      console.warn('[API /api/learn] LLM call failed or returned invalid JSON:', apiErr);
    }

    // Fallback if API fails or validation fails
    const fallback = generateFallbackInterpretation(spec, result);
    return NextResponse.json({ interpretation: fallback, isFallback: true });
  } catch (err) {
    console.error('[API /api/learn] Error:', err);
    return NextResponse.json({ error: 'Failed to process learn request' }, { status: 500 });
  }
}
