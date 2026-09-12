import { ResearchInterpretation } from '@/types';

/**
 * Validates AI-generated interpretation response for schema compliance and cautious research tone.
 * If validation fails, returns null to trigger fallback interpretation.
 */
export function validateInterpretationResponse(
  data: unknown,
  experimentId: string
): ResearchInterpretation | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  const isStringArray = (arr: unknown): arr is string[] =>
    Array.isArray(arr) && arr.length > 0 && arr.every((item) => typeof item === 'string' && item.trim().length > 0);

  if (!isStringArray(obj.dataFindings)) return null;
  if (!isStringArray(obj.conclusions)) return null;
  if (!isStringArray(obj.limitations)) return null;
  if (!isStringArray(obj.suggestedNextQuestions)) return null;

  // Prohibited promotional or reckless claims
  const prohibitedPhrases = [
    'guaranteed',
    'strategy is profitable',
    'easy money',
    'foolproof',
    'risk-free',
    'buy now',
    'sure win',
  ];

  const allText = [
    ...obj.dataFindings,
    ...obj.conclusions,
    ...obj.limitations,
    ...obj.suggestedNextQuestions,
  ].join(' ').toLowerCase();

  for (const phrase of prohibitedPhrases) {
    if (allText.includes(phrase)) {
      console.warn(`[AI Validation] Prohibited phrase detected: "${phrase}"`);
      return null;
    }
  }

  return {
    experimentId,
    dataFindings: obj.dataFindings,
    conclusions: obj.conclusions,
    limitations: obj.limitations,
    suggestedNextQuestions: obj.suggestedNextQuestions,
  };
}
