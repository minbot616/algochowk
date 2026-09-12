import { ExperimentSpec, EmpiricalResult, ResearchInterpretation } from '@/types';

/**
 * Generates a deterministic research interpretation from empirical test results.
 * Used when an AI API key is unconfigured, offline, or returns invalid outputs.
 *
 * GUARANTEES:
 * - 100% factual data findings grounded in computed EmpiricalResult
 * - Strictly cautious, non-promotional research conclusions
 * - Explicit experiment limitations & caveats
 * - Actionable follow-up research questions
 */
export function generateFallbackInterpretation(
  spec: ExperimentSpec,
  result: EmpiricalResult
): ResearchInterpretation {
  const thresholdPct = Math.abs(spec.fallThresholdPct.value);
  const holdingDays = spec.holdingPeriod.value;
  const isPump = spec.signalDirection === 'pump';
  const isSell = spec.tradeDirection === 'sell';
  const isPositiveAvg = result.metrics.averageReturnPct >= 0;

  const moveWord = isPump ? 'rise' : 'drop';
  const eventWord = isPump ? 'rise' : 'decline';
  const positionWord = isSell ? 'short' : 'long';

  // Dynamic alternative thresholds for limitations (do not list current threshold as an alternative)
  let altThresholds = '1.5% or 2.0%';
  if (thresholdPct === 1.5) altThresholds = '1.0% or 2.0%';
  else if (thresholdPct === 2.0) altThresholds = '1.0% or 1.5%';
  else if (thresholdPct === 1.0) altThresholds = '1.5% or 2.0%';

  const dataFindings = [
    `The experiment identified ${result.metrics.totalTrades} qualifying ${eventWord} events (daily close ${moveWord} ≥ ${thresholdPct}%) across ${result.dataset.totalTradingDays} trading sessions between ${result.dataset.startDate} and ${result.dataset.endDate}.`,
    `${result.metrics.winningTrades} of ${result.metrics.totalTrades} completed event observations achieved positive net ${positionWord} returns after friction costs, representing a ${result.metrics.winRatePct}% trade-level win rate.`,
    `The mean net return per trade was ${isPositiveAvg ? '+' : ''}${result.metrics.averageReturnPct}%, with a median net return of ${result.metrics.medianReturnPct >= 0 ? '+' : ''}${result.metrics.medianReturnPct}% over ${holdingDays} trading ${holdingDays === 1 ? 'day' : 'days'}.`,
    `Individual trade outcomes exhibited wide dispersion, ranging from a best net trade return of +${result.metrics.bestReturnPct}% to a worst single trade return of ${result.metrics.worstReturnPct}%.`,
    `The cumulative sum of trade-level net returns across all ${result.metrics.totalTrades} independent events was ${result.metrics.totalNetReturnPct >= 0 ? '+' : ''}${result.metrics.totalNetReturnPct}%.`,
  ];

  const conclusions = isPositiveAvg
    ? [
        `Under this specific experiment definition and prototype cost assumptions, the historical sample produced a positive average net return (+${result.metrics.averageReturnPct}%) following qualifying ${isPump ? 'rises' : 'drops'}.`,
        `This indicates that positive post-${moveWord} ${positionWord} outcomes were observed on average in this sample, but it does not establish that the strategy possesses a persistent or reliable future trading edge.`,
        `Historical event observations show positive expectation on average, but individual trade losses can be substantial during persistent trend moves.`,
      ]
    : [
        `Under this specific experiment definition and prototype cost assumptions, the historical sample produced a negative average net return (${result.metrics.averageReturnPct}%) following qualifying ${isPump ? 'rises' : 'drops'}.`,
        `Some individual ${positionWord} trades were profitable (${result.metrics.winningTrades} of ${result.metrics.totalTrades}), but the average net return across the event observations was slightly negative.`,
        `Historical event observations show negative expectation on average, and individual trade losses can be substantial during persistent trend moves.`,
      ];

  const limitations = [
    `"${isPump ? 'Sharp pump' : 'Sharp fall'}" was operationalized specifically as a ${thresholdPct}% single-day close-to-close ${moveWord}; alternative thresholds (e.g. ${altThresholds}) could yield different signal frequencies and returns.`,
    `The ${holdingDays} trading ${holdingDays === 1 ? 'day' : 'days'} holding duration is a fixed prototype assumption and does not model dynamic stop-loss or take-profit exit logic.`,
    `Transaction costs (total 0.10% friction) are prototype modelling assumptions, not authoritative estimates of actual statutory charges or real-time order slippage.`,
    `The experiment treats qualifying signals as independent event study observations rather than simulating a real-money sequential portfolio P&L.`,
    `Historical data from ${result.dataset.startDate} to ${result.dataset.endDate} reflects past market regimes; past performance does not guarantee future market behavior.`,
  ];

  const suggestedNextQuestions = [
    `Does the observed post-${moveWord} behavior persist when the threshold is changed to ${altThresholds}?`,
    `How do net returns and win rates vary across 1-day, 3-day, 5-day, and 10-day holding horizons?`,
    `How does strategy performance differ between high-volatility regimes and low-volatility pullbacks?`,
    `How sensitive is expected net return to higher transaction friction or severe market impact slippage?`,
  ];

  return {
    experimentId: spec.id,
    dataFindings,
    conclusions,
    limitations,
    suggestedNextQuestions,
  };
}
