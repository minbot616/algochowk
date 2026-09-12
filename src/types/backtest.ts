/**
 * Individual trade result record computed by the deterministic backtest engine.
 */
export interface TradeResult {
  tradeId: string;
  signalDate: string;       // YYYY-MM-DD (Date when sharp drop signal occurred after Close)
  entryDate: string;        // YYYY-MM-DD (Date when trade was entered at Open)
  entryPrice: number;       // Execution entry price (Open price)
  exitDate: string;         // YYYY-MM-DD (Date when trade was exited after holding period)
  exitPrice: number;        // Execution exit price (Close price)
  holdingDays: number;      // Actual trading days held
  rawReturnPct: number;     // Return before costs (% gain/loss)
  netReturnPct: number;     // Net return after brokerage, slippage & taxes (%)
  isWin: boolean;           // True if netReturnPct > 0
  exitReason: 'holding_period_expired' | 'stop_loss' | 'take_profit' | 'end_of_data';
}

/**
 * Aggregated quantitative metrics computed over historical price action.
 */
export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;       // (winningTrades / totalTrades) * 100
  averageReturnPct: number; // Mean net return per trade
  medianReturnPct: number;  // Median net return per trade
  bestReturnPct: number;    // Maximum single trade net return
  worstReturnPct: number;   // Minimum single trade net return
  maxDrawdownPct: number;   // Maximum peak-to-trough decline percentage (event study peak-to-trough)
  profitFactor: number;     // Gross profits / Gross losses
  totalNetReturnPct: number;// Sum of trade-level net returns (%)
}

/**
 * Historical dataset metadata summary.
 */
export interface DatasetSummary {
  symbol: string;
  startDate: string;
  endDate: string;
  totalTradingDays: number;
}

/**
 * Factual computed empirical backtest output.
 * Contains only quantitative outputs generated deterministically from historical data.
 */
export interface EmpiricalResult {
  experimentId: string;
  executedAt: string;       // ISO 8601 timestamp of backtest execution
  dataset: DatasetSummary;
  metrics: BacktestMetrics;
  trades: TradeResult[];
}
