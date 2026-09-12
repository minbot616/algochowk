import { EmpiricalResult } from './backtest';
import { ExperimentSpec } from './experiment';

/**
 * Qualitative research interpretation produced in the LEARN stage.
 * Maintains strict separation between raw empirical data and analytical insights/caveats.
 */
export interface ResearchInterpretation {
  experimentId: string;

  /**
   * Factual observations directly grounded in the empirical data.
   * e.g., "NIFTY generated 42 signals across 5 years with a 61.9% win rate."
   */
  dataFindings: string[];

  /**
   * Logical conclusions synthesized from the experiment findings.
   * e.g., "Buying NIFTY after a -2% drop exhibited positive expected value over 5-day holding horizons."
   */
  conclusions: string[];

  /**
   * Critical caveats and limitations to consider before drawing real-world inferences.
   * e.g., "Sample size is relatively small (N=42); performance is sensitive to slippage during high-volatility regimes."
   */
  limitations: string[];

  /**
   * Suggested follow-up research questions or variant experiments to test next.
   * e.g., "What happens if we extend the holding period to 10 days or add a volume surge filter?"
   */
  suggestedNextQuestions: string[];
}

/**
 * Master Experiment Report combining the Spec, Empirical Result, and Interpretation.
 */
export interface ExperimentReport {
  spec: ExperimentSpec;
  empiricalResult?: EmpiricalResult;
  interpretation?: ResearchInterpretation;
}
