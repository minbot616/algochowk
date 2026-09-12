/**
 * Provenance source for an experiment parameter.
 * Allows the system to explicitly track whether a parameter was explicitly provided
 * by the user, assumed by system defaults, or still requires clarification.
 */
export type ParameterProvenance =
  | 'user_provided'
  | 'system_default'
  | 'requires_clarification';

/**
 * Strongly typed wrapper for any experiment parameter.
 * Encapsulates the value alongside its provenance and optional clarification question.
 */
export interface ClarifiedParameter<T> {
  value: T;
  provenance: ParameterProvenance;
  description?: string;
  clarificationQuestion?: string;
}

/**
 * Supported methods to quantify a "sharp fall" in price action.
 */
export type FallCalculationType =
  | '1_day_drop'       // Single trading day drop percentage
  | 'n_day_drop'       // Drop over N consecutive trading days
  | 'intraday_drop'    // Peak to trough drop within a single trading session
  | 'peak_to_trough';  // Drawdown from recent N-day high

/**
 * Execution timing relative to signal trigger.
 */
export type EntryTiming =
  | 'same_close' // Buy on signal day market close
  | 'next_open'  // Buy on next trading day open
  | 'next_close'; // Buy on next trading day close

/**
 * Position exit rule strategy.
 */
export type ExitStrategy =
  | 'fixed_holding_days'   // Exit strictly after N trading days
  | 'stop_loss_or_target'  // Exit on stop loss or take profit, or max holding
  | 'trailing_stop';       // Exit on trailing drawdown from trade peak

/**
 * Friction & cost model applied to trades.
 */
export interface CostModel {
  brokeragePct: number;  // Brokerage & exchange fees as % of trade value
  slippagePct: number;   // Expected market impact / slippage %
  sttAndTaxesPct: number;// Securities Transaction Tax (STT) & regulatory fees %
}

/**
 * Asset / Market instrument definition.
 */
export interface InstrumentSpec {
  symbol: string;        // e.g. "NIFTY 50"
  assetClass: 'index' | 'equity' | 'futures' | 'etf';
  currency: 'INR' | 'USD';
}

/**
 * Quantitative rule for defining a sharp fall signal.
 */
export interface FallRule {
  type: FallCalculationType;
  lookbackDays: number;   // e.g. 1 day or 5 days
}

/**
 * Quantitative rule for entry into a long trade position.
 */
export interface EntryRule {
  timing: EntryTiming;
  conditionDescription?: string;
}

/**
 * Quantitative rule for exiting a position.
 */
export interface ExitRule {
  strategy: ExitStrategy;
  holdingDays: number;
  stopLossPct?: number;   // e.g. -2.0 for 2% stop loss
  takeProfitPct?: number; // e.g. +5.0 for 5% target
}

/**
 * Date range boundaries for historical backtesting.
 */
export interface TestPeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Experiment status state machine.
 */
export type ExperimentStatus =
  | 'draft'               // Initial user question entered
  | 'needs_clarification' // Pending parameter clarification
  | 'spec_ready'          // All parameters defined, ready for backtesting
  | 'tested';             // Backtest executed

export type SignalDirection = 'fall' | 'pump' | 'unknown';
export type TradeDirection = 'buy' | 'sell' | 'unknown';

/**
 * Master Experiment Specification contract.
 * Represents the complete structured experiment generated from user input + clarification.
 */
export interface ExperimentSpec {
  id: string;
  originalQuestion: string;
  signalDirection: SignalDirection;
  tradeDirection: TradeDirection;
  hypothesis: ClarifiedParameter<string>;
  instrument: ClarifiedParameter<InstrumentSpec>;
  fallDefinition: ClarifiedParameter<FallRule>;
  fallThresholdPct: ClarifiedParameter<number>; // Negative for drop, positive for rise
  entryRule: ClarifiedParameter<EntryRule>;
  exitRule: ClarifiedParameter<ExitRule>;
  holdingPeriod: ClarifiedParameter<number>; // Holding period in trading days
  testPeriod: ClarifiedParameter<TestPeriod>;
  costAssumptions: ClarifiedParameter<CostModel>;
  status: ExperimentStatus;
  createdAt: string; // ISO 8601 string
}
