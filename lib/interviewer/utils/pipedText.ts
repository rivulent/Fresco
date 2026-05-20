import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { PipedData } from '~/schemas/interviews';
import { getPipedData } from '../selectors/session';

/**
 * Substitutes {{key}} placeholders in text with values from pipedData.
 * Missing keys are replaced with empty string.
 *
 * @example
 * const text = "Hello {{name}}, welcome to wave {{waveNumber}}!";
 * const pipedData = { name: "John", waveNumber: 2 };
 * substitutePipedText(text, pipedData); // "Hello John, welcome to wave 2!"
 */
export function substitutePipedText(
  text: string | undefined | null,
  pipedData?: PipedData,
): string {
  if (!text) return '';
  if (!pipedData) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = pipedData[key];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

/**
 * React hook for piped text substitution.
 * Returns a memoized function that substitutes text using pipedData from Redux state.
 *
 * @example
 * const substitutePipedText = useSubstitutePipedText();
 * const processedText = substitutePipedText("Hello {{name}}!");
 */
export function useSubstitutePipedText(): (
  text: string | undefined | null,
) => string {
  const pipedData = useSelector(getPipedData);
  return useCallback(
    (text: string | undefined | null) => substitutePipedText(text, pipedData),
    [pipedData],
  );
}
