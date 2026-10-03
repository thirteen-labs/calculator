export type CalculatorMode = 'basic' | 'scientific';

export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export type BinaryOperator = '+' | '-' | '×' | '÷' | '%' | '^';

export type CalculatorErrorCode =
  | 'DIVISION_BY_ZERO'
  | 'INVALID_EXPRESSION'
  | 'MISSING_OPERAND'
  | 'UNMATCHED_PARENTHESES'
  | 'OVERFLOW'
  | 'UNDERFLOW'
  | 'INVALID_FUNCTION'
  | 'DOMAIN_ERROR'
  | 'SYNTAX_ERROR'
  | 'NUMBER_TOO_LARGE';

export interface CalculatorError {
  code: CalculatorErrorCode;
  message: string;
}

export type FunctionName =
  | 'sqrt'
  | 'cbrt'
  | 'square'
  | 'cube'
  | 'reciprocal'
  | 'abs'
  | 'floor'
  | 'ceil'
  | 'sign'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'asin'
  | 'acos'
  | 'atan'
  | 'log'
  | 'ln'
  | 'log2'
  | 'factorial';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  favorite: boolean;
}

export interface LastOperation {
  operator: BinaryOperator;
  operand: string;
}

export interface CalculatorState {
  expression: string;
  /** The formatted result, ready for display. */
  result: string | null;
  /**
   * The raw numeric result. `result` is rounded for display, so anything that
   * needs full precision (memory, re-formatting after a precision change) must
   * use this instead of parsing `result` back with `Number()`.
   */
  resultValue: number | null;
  preview: string | null;

  mode: CalculatorMode;
  angleMode: AngleMode;
  precision: number;

  memory: number | null;

  history: HistoryEntry[];

  error: CalculatorError | null;

  lastOperation?: LastOperation;

  past: Snapshot[];
  future: Snapshot[];
}

export type Snapshot = Pick<
  CalculatorState,
  | 'expression'
  | 'result'
  | 'resultValue'
  | 'preview'
  | 'mode'
  | 'angleMode'
  | 'precision'
  | 'memory'
  | 'history'
  | 'error'
  | 'lastOperation'
>;