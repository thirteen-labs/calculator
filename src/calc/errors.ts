import type { CalculatorError, CalculatorErrorCode } from './types';

const MESSAGES: Record<CalculatorErrorCode, string> = {
  DIVISION_BY_ZERO: 'Division by zero',
  INVALID_EXPRESSION: 'Invalid expression',
  MISSING_OPERAND: 'Incomplete expression',
  UNMATCHED_PARENTHESES: 'Unmatched parentheses',
  OVERFLOW: 'Result is too large',
  UNDERFLOW: 'Result is too small',
  INVALID_FUNCTION: 'Unknown function',
  DOMAIN_ERROR: 'Invalid input for function',
  SYNTAX_ERROR: 'Syntax error',
  NUMBER_TOO_LARGE: 'Number too large',
};

export class CalcError extends Error {
  readonly code: CalculatorErrorCode;

  constructor(code: CalculatorErrorCode, message?: string) {
    super(message ?? MESSAGES[code]);
    this.name = 'CalcError';
    this.code = code;
  }

  toError(): CalculatorError {
    return { code: this.code, message: this.message };
  }
}

export const MAX_SAFE_NUMBER = 1e100;