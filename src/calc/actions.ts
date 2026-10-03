import type {
  AngleMode,
  BinaryOperator,
  FunctionName,
} from './types';

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export type Action =
  // INPUT
  | { type: 'INPUT_DIGIT'; digit: Digit }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'INPUT_OPERATOR'; operator: BinaryOperator }
  | { type: 'INPUT_FUNCTION'; fn: FunctionName }
  | { type: 'INPUT_CONSTANT'; constant: 'PI' | 'E' }
  /** Omit `paren` to let the reducer pick via `nextParen` (the `( )` key). */
  | { type: 'INPUT_PAREN'; paren?: '(' | ')' }
  | { type: 'INPUT_NEGATIVE' }

  // EDITING
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR_ENTRY' }
  | { type: 'CLEAR' }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' }

  // CALCULATION
  | { type: 'EVALUATE' }
  | { type: 'REPEAT_LAST_OPERATION' }

  // MEMORY
  | { type: 'MEMORY_CLEAR' }
  | { type: 'MEMORY_RECALL' }
  | { type: 'MEMORY_STORE' }
  | { type: 'MEMORY_ADD' }
  | { type: 'MEMORY_SUBTRACT' }

  // HISTORY
  | { type: 'HISTORY_REUSE'; id: string }
  | { type: 'HISTORY_DELETE'; id: string }
  | { type: 'HISTORY_CLEAR' }
  | { type: 'HISTORY_TOGGLE_FAVORITE'; id: string }

  // DISPLAY / MODE
  | { type: 'TOGGLE_SCIENTIFIC' }
  | { type: 'SET_ANGLE_MODE'; mode: AngleMode }
  | { type: 'SET_PRECISION'; precision: number };