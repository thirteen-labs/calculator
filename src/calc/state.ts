import type { CalculatorState } from './types';

export const initialState: CalculatorState = {
  expression: '',
  result: null,
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