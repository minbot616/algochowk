import { SignalDirection, TradeDirection } from '@/types';

export interface ParsedQuestionIntent {
  signalDirection: SignalDirection;
  tradeDirection: TradeDirection;
}

function hasWord(text: string, words: string[]): boolean {
  return words.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));
}

/**
 * Deterministic question intent parser.
 * Explicitly separates trade action (buy/sell) from signal direction (fall/pump).
 *
 * Handles edge cases like "long move" (where "long" is an adjective for duration, not a trade action).
 * Returns 'unknown' for missing/ambiguous parameters.
 */
export function parseQuestionIntent(question: string): ParsedQuestionIntent {
  const normalized = question.toLowerCase().trim();

  // Handle "long" context: ignore if part of "long move", "long term", "long duration", "long run"
  const cleanedForTradeAction = normalized.replace(/\blong\s+(move|term|time|run|duration)\b/gi, 'extended_$1');

  const buyKeywords = ['buy', 'buying'];
  const buyPhrases = [/\bgo\s+long\b/i, /\blong\s+position\b/i, /\btake\s+long\b/i, /\bgo\s+for\s+long\b/i];
  
  const sellKeywords = ['sell', 'selling', 'short'];
  const fallKeywords = ['fall', 'falls', 'drop', 'drops', 'decline', 'declines', 'selloff'];
  const pumpKeywords = ['pump', 'pumps', 'rise', 'rises', 'rally', 'rallies', 'surge', 'surges', 'spike', 'spikes'];

  let hasBuy = hasWord(cleanedForTradeAction, buyKeywords) || buyPhrases.some((re) => re.test(normalized));
  // If "long" appears without "move/term/time" and not as sell context
  if (!hasBuy && /\blong\b/i.test(cleanedForTradeAction)) {
    hasBuy = true;
  }

  const hasSell = hasWord(normalized, sellKeywords);
  const hasFall = hasWord(normalized, fallKeywords);
  const hasPump = hasWord(normalized, pumpKeywords);

  let tradeDirection: TradeDirection = 'unknown';
  if (hasBuy && !hasSell) {
    tradeDirection = 'buy';
  } else if (hasSell && !hasBuy) {
    tradeDirection = 'sell';
  } else if (hasBuy && hasSell) {
    tradeDirection = hasPump ? 'sell' : 'buy';
  }

  let signalDirection: SignalDirection = 'unknown';
  if (hasFall && !hasPump) {
    signalDirection = 'fall';
  } else if (hasPump && !hasFall) {
    signalDirection = 'pump';
  } else if (hasFall && hasPump) {
    signalDirection = 'unknown';
  }

  return {
    signalDirection,
    tradeDirection,
  };
}
