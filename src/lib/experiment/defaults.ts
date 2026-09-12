import { ExperimentSpec } from '@/types';

/**
 * Factory creating an initial ExperimentSpec draft for the starting query:
 * "Does buying NIFTY after a sharp fall work?"
 *
 * Demonstrates explicit parameter provenance tracking across:
 * - user_provided
 * - system_default
 * - requires_clarification
 */
export function createDefaultNiftyExperiment(): ExperimentSpec {
  return {
    id: 'exp_nifty_sharp_fall_default',
    originalQuestion: 'Does buying NIFTY after a sharp fall work?',
    signalDirection: 'fall',
    tradeDirection: 'buy',
    hypothesis: {
      value: 'Buying NIFTY 50 after a single-day sharp fall yields positive net return over a 5-day holding period.',
      provenance: 'system_default',
      description: 'System hypothesis derived from user query',
    },
    instrument: {
      value: {
        symbol: 'NIFTY 50',
        assetClass: 'index',
        currency: 'INR',
      },
      provenance: 'user_provided',
      description: 'Extracted directly from user question',
    },
    fallDefinition: {
      value: {
        type: '1_day_drop',
        lookbackDays: 1,
      },
      provenance: 'system_default',
      description: 'Assumed single trading day price drop',
    },
    fallThresholdPct: {
      value: -1.5,
      provenance: 'system_default',
      description: 'Prototype default of 1.5% daily close-to-close decline (exposed for user confirmation)',
    },
    entryRule: {
      value: {
        timing: 'next_open',
        conditionDescription: 'Enter market order at next trading day open following signal',
      },
      provenance: 'system_default',
      description: 'Standard next market open entry',
    },
    exitRule: {
      value: {
        strategy: 'fixed_holding_days',
        holdingDays: 5,
      },
      provenance: 'system_default',
      description: 'Fixed 5 trading days holding period (prototype default exposed for user confirmation)',
    },
    holdingPeriod: {
      value: 5,
      provenance: 'system_default',
      description: 'Target holding duration in trading days (prototype default exposed for user confirmation)',
    },
    testPeriod: {
      value: {
        startDate: '2019-01-01',
        endDate: '2024-01-01',
      },
      provenance: 'system_default',
      description: 'Temporary prototype evaluation window (to be finalized upon dataset selection)',
    },
    costAssumptions: {
      value: {
        brokeragePct: 0.03,
        slippagePct: 0.05,
        sttAndTaxesPct: 0.02,
      },
      provenance: 'system_default',
      description: 'Prototype modelling assumption for transaction friction (brokerage, slippage, taxes)',
    },
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
}
