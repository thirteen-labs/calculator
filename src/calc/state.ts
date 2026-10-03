import type { CalculatorState } from './types';

/**
 * Newest-first cap on history, shared by the reducer (what it keeps in memory)
 * and the storage layer (what it writes), so the two can never disagree about
 * how many entries exist.
 */
export const MAX_HISTORY = 100;

export const initialState: CalculatorState = {
  expression: '',
  result: null,
  resultValue: null,
  preview: null,
  mode: 'basic',
  angleMode: 'DEG',
  precision: 10,
  memory: null,
  history: [],
  error: null,
  past: [],
  future: [],
};
