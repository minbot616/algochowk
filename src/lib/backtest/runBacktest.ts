import { MarketBar } from '@/lib/data';
import { ExperimentSpec, EmpiricalResult, TradeResult, BacktestMetrics } from '@/types';

/**
 * Pure deterministic backtest execution engine.
 *
 * LOOK-AHEAD BIAS PREVENTION MECHANISM:
 * The signal uses the close of day t. Entry occurs at the next trading day's open (t+1),
 * so the signal does not use future information. Position is held for N trading sessions
 * and exits at the close of day (t+1+N).
 *
 * @param bars Chronologically sorted historical market daily OHLC bars
 * @param spec Experiment specification contract
 * @returns Factual empirical backtest result containing trade records and quantitative metrics
 */
export function runBacktest(bars: MarketBar[], spec: ExperimentSpec): EmpiricalResult {
  if (!bars || bars.length < 2) {
    throw new Error('Insufficient historical market data bars for backtesting');
  }

  if (spec.signalDirection === 'unknown' || spec.tradeDirection === 'unknown') {
    throw new Error('Cannot run backtest: experiment signal direction or trade direction is unresolved.');
  }

  const signalDirection = spec.signalDirection;
  const tradeDirection = spec.tradeDirection;
  const thresholdMagnitude = Math.abs(spec.fallThresholdPct.value); // e.g. 1.5%
  const holdingDays = spec.holdingPeriod.value;    // e.g. 5 trading days
  const costs = spec.costAssumptions.value;

  // Prototype cost modelling convention: total friction = sum of percentages
  const totalCostPct = costs.brokeragePct + costs.slippagePct + costs.sttAndTaxesPct;

  const trades: TradeResult[] = [];
  let signalCounter = 0;

  for (let t = 1; t < bars.length; t++) {
    const prevClose = bars[t - 1].close;
    const currClose = bars[t].close;
    const returnPct = ((currClose - prevClose) / prevClose) * 100;

    // Signal condition: fall (<= -threshold) or pump (>= +threshold)
    const isSignal =
      signalDirection === 'pump'
        ? returnPct >= thresholdMagnitude
        : returnPct <= -thresholdMagnitude;

    if (isSignal) {
      signalCounter++;

      const entryIndex = t + 1;
      const exitIndex = t + 1 + holdingDays;

      // End-of-data boundary handling
      if (exitIndex >= bars.length) {
        // Trade cannot complete full holding period before dataset end
        continue;
      }

      const signalBar = bars[t];
      const entryBar = bars[entryIndex];
      const exitBar = bars[exitIndex];

      const entryPrice = entryBar.open;
      const exitPrice = exitBar.close;

      // Return calculation: Buy/Long = (exit - entry)/entry; Sell/Short = (entry - exit)/entry
      const rawReturnPct =
        tradeDirection === 'sell'
          ? ((entryPrice - exitPrice) / entryPrice) * 100
          : ((exitPrice - entryPrice) / entryPrice) * 100;

      const netReturnPct = rawReturnPct - totalCostPct;
      const isWin = netReturnPct > 0;

      trades.push({
        tradeId: `trade_${trades.length + 1}_${entryBar.date}`,
        signalDate: signalBar.date,
        entryDate: entryBar.date,
        entryPrice: Number(entryPrice.toFixed(2)),
        exitDate: exitBar.date,
        exitPrice: Number(exitPrice.toFixed(2)),
        holdingDays,
        rawReturnPct: Number(rawReturnPct.toFixed(4)),
        netReturnPct: Number(netReturnPct.toFixed(4)),
        isWin,
        exitReason: 'holding_period_expired',
      });
    }
  }

  // Calculate quantitative metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter((tr) => tr.isWin).length;
  const losingTrades = totalTrades - winningTrades;
  const winRatePct = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const netReturns = trades.map((tr) => tr.netReturnPct);

  const averageReturnPct =
    totalTrades > 0
      ? netReturns.reduce((sum, r) => sum + r, 0) / totalTrades
      : 0;

  // Median return calculation
  let medianReturnPct = 0;
  if (totalTrades > 0) {
    const sortedReturns = [...netReturns].sort((a, b) => a - b);
    const mid = Math.floor(sortedReturns.length / 2);
    medianReturnPct =
      sortedReturns.length % 2 !== 0
        ? sortedReturns[mid]
        : (sortedReturns[mid - 1] + sortedReturns[mid]) / 2;
  }

  const bestReturnPct = totalTrades > 0 ? Math.max(...netReturns) : 0;
  const worstReturnPct = totalTrades > 0 ? Math.min(...netReturns) : 0;

  // Sum of trade-level net returns (descriptive event-study aggregate)
  const totalNetReturnPct = netReturns.reduce((sum, r) => sum + r, 0);

  // Peak-to-trough drawdown calculation over cumulative event returns
  let peak = 0;
  let maxDrawdown = 0;
  let cumReturn = 0;
  for (const ret of netReturns) {
    cumReturn += ret;
    if (cumReturn > peak) peak = cumReturn;
    const dd = peak - cumReturn;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Profit factor calculation
  const grossProfits = netReturns
    .filter((r) => r > 0)
    .reduce((sum, r) => sum + r, 0);
  const grossLosses = Math.abs(
    netReturns.filter((r) => r < 0).reduce((sum, r) => sum + r, 0)
  );
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 999 : 0;

  const metrics: BacktestMetrics = {
    totalTrades,
    winningTrades,
    losingTrades,
    winRatePct: Number(winRatePct.toFixed(2)),
    averageReturnPct: Number(averageReturnPct.toFixed(4)),
    medianReturnPct: Number(medianReturnPct.toFixed(4)),
    bestReturnPct: Number(bestReturnPct.toFixed(4)),
    worstReturnPct: Number(worstReturnPct.toFixed(4)),
    maxDrawdownPct: Number(maxDrawdown.toFixed(4)),
    profitFactor: Number(profitFactor.toFixed(2)),
    totalNetReturnPct: Number(totalNetReturnPct.toFixed(4)),
  };

  return {
    experimentId: spec.id,
    executedAt: new Date().toISOString(),
    dataset: {
      symbol: spec.instrument.value.symbol,
      startDate: bars[0]?.date || '',
      endDate: bars[bars.length - 1]?.date || '',
      totalTradingDays: bars.length,
    },
    metrics,
    trades,
  };
}
