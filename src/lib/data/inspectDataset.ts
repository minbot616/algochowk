import fs from 'fs';
import path from 'path';

export interface MarketBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface DatasetInspectionResult {
  filePath: string;
  sourceAttribution: string;
  instrumentRepresented: string;
  frequency: string;
  columns: string[];
  totalRows: number;
  earliestDate: string;
  latestDate: string;
  isSortedAscending: boolean;
  duplicateDatesCount: number;
  missingValuesCount: number;
  invalidOhlcRelationsCount: number;
  totalSignals_1_5_pct: number;
  signalsWithNextTradingDay: number;
  signalsWith5DayHoldingPeriod: number;
  isSufficientForExperiment: boolean;
}

/**
 * Loads the NIFTY 50 daily JSON dataset from the repository.
 */
export function loadNifty50Dataset(): MarketBar[] {
  const jsonPath = path.join(process.cwd(), 'data', 'nifty50_daily.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Dataset file not found at ${jsonPath}`);
  }
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  return JSON.parse(raw) as MarketBar[];
}

/**
 * Deterministically inspects the NIFTY 50 dataset for data quality and signal availability.
 * STRICTLY COMPUTES DESCRIPTIVE SIGNAL COUNTS ONLY.
 * DOES NOT CALCULATE STRATEGY RETURNS, WIN RATES, OR DRAWDOWN.
 */
export function inspectNifty50Dataset(): DatasetInspectionResult {
  const records = loadNifty50Dataset();
  const filePath = path.join('data', 'nifty50_daily.csv');
  const columns = ['Date', 'Open', 'High', 'Low', 'Close'];

  let isSorted = true;
  const dateSet = new Set<string>();
  let duplicateDatesCount = 0;
  let missingValuesCount = 0;
  let invalidOhlcRelationsCount = 0;

  for (let i = 0; i < records.length; i++) {
    const bar = records[i];

    // Check date sorting
    if (i > 0 && records[i - 1].date >= bar.date) {
      isSorted = false;
    }

    // Check duplicates
    if (dateSet.has(bar.date)) {
      duplicateDatesCount++;
    } else {
      dateSet.add(bar.date);
    }

    // Check missing / NaN
    if (
      !bar.date ||
      bar.open == null ||
      bar.high == null ||
      bar.low == null ||
      bar.close == null ||
      isNaN(bar.open) ||
      isNaN(bar.high) ||
      isNaN(bar.low) ||
      isNaN(bar.close)
    ) {
      missingValuesCount++;
    }

    // Check invalid OHLC relationships (e.g. low > high, low > open, etc.)
    if (
      bar.low > bar.high ||
      bar.low > bar.open ||
      bar.low > bar.close ||
      bar.high < bar.open ||
      bar.high < bar.close
    ) {
      invalidOhlcRelationsCount++;
    }
  }

  // Signal Count Inspection (Decline >= 1.5%)
  let totalSignals_1_5_pct = 0;
  let signalsWithNextTradingDay = 0;
  let signalsWith5DayHoldingPeriod = 0;

  for (let t = 1; t < records.length; t++) {
    const prevClose = records[t - 1].close;
    const currClose = records[t].close;
    const returnPct = ((currClose - prevClose) / prevClose) * 100;

    // 1.5% drop condition (-1.5% or worse)
    if (returnPct <= -1.5) {
      totalSignals_1_5_pct++;

      // Check if day t+1 exists in chronological trading order (for next-open entry)
      if (t + 1 < records.length) {
        signalsWithNextTradingDay++;
      }

      // Check if day t+5 exists (for 5 trading days holding period exit)
      if (t + 5 < records.length) {
        signalsWith5DayHoldingPeriod++;
      }
    }
  }

  return {
    filePath,
    sourceAttribution: 'Yahoo Finance (^NSEI - NIFTY 50 Index Spot Chart API)',
    instrumentRepresented: 'NIFTY 50 Index Spot',
    frequency: 'Daily (1d trading days)',
    columns,
    totalRows: records.length,
    earliestDate: records[0]?.date || '',
    latestDate: records[records.length - 1]?.date || '',
    isSortedAscending: isSorted,
    duplicateDatesCount,
    missingValuesCount,
    invalidOhlcRelationsCount,
    totalSignals_1_5_pct,
    signalsWithNextTradingDay,
    signalsWith5DayHoldingPeriod,
    isSufficientForExperiment: signalsWith5DayHoldingPeriod >= 30 && records.length >= 1000,
  };
}
