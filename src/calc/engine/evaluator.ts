import { CalcError } from '@/calc/errors';
import type { AngleMode, BinaryOperator } from '@/calc/types';
import { parseExpression, type ExprNode } from './parser';

export interface EvaluateOptions {
  angleMode?: AngleMode;
}

const DEG_TO_RAD = Math.PI / 180;
const GRAD_TO_RAD = Math.PI / 200;

function angleToRad(value: number, mode: AngleMode): number {
  switch (mode) {
    case 'DEG':
      return value * DEG_TO_RAD;
    case 'GRAD':
      return value * GRAD_TO_RAD;
    default:
      return value;
  }
}

function radToAngle(value: number, mode: AngleMode): number {
  switch (mode) {
    case 'DEG':
      return value / DEG_TO_RAD;
    case 'GRAD':
      return value / GRAD_TO_RAD;
    default:
      return value;
  }
}

/** 170! is the largest factorial representable as a finite double. */
const MAX_FACTORIAL = 170;

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new CalcError('DOMAIN_ERROR');
  }
  // Without this guard the loop below runs once per unit of n, and n is
  // user-typable (e.g. `factorial(999999999)`), which locks the JS thread.
  if (n > MAX_FACTORIAL) {
    throw new CalcError('OVERFLOW');
  }
  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }
  return result;
}

function checkResult(value: number): number {
  if (Number.isNaN(value)) {
    throw new CalcError('INVALID_EXPRESSION');
  }
  if (!Number.isFinite(value)) {
    throw new CalcError('OVERFLOW');
  }
  if (Math.abs(value) > 1e100) {
    throw new CalcError('OVERFLOW');
  }
  if (value !== 0 && Math.abs(value) < 1e-320) {
    throw new CalcError('UNDERFLOW');
  }
  return value;
}

function callFunction(name: string, args: number[], mode: AngleMode): number {
  const x = args[0] ?? 0;
  switch (name) {
    case 'sqrt':
      if (x < 0) throw new CalcError('DOMAIN_ERROR');
      return Math.sqrt(x);
    case 'cbrt':
      return Math.cbrt(x);
    case 'square':
      return x * x;
    case 'cube':
      return x * x * x;
    case 'reciprocal':
      if (x === 0) throw new CalcError('DIVISION_BY_ZERO');
      return 1 / x;
    case 'abs':
      return Math.abs(x);
    case 'floor':
      return Math.floor(x);
    case 'ceil':
      return Math.ceil(x);
    case 'sign':
      return Math.sign(x);
    case 'factorial':
      return factorial(x);
    case 'sin':
      return Math.sin(angleToRad(x, mode));
    case 'cos':
      return Math.cos(angleToRad(x, mode));
    case 'tan':
      return Math.tan(angleToRad(x, mode));
    case 'asin':
      if (x < -1 || x > 1) throw new CalcError('DOMAIN_ERROR');
      return radToAngle(Math.asin(x), mode);
    case 'acos':
      if (x < -1 || x > 1) throw new CalcError('DOMAIN_ERROR');
      return radToAngle(Math.acos(x), mode);
    case 'atan':
      return radToAngle(Math.atan(x), mode);
    case 'log':
      if (x <= 0) throw new CalcError('DOMAIN_ERROR');
      return Math.log10(x);
    case 'ln':
      if (x <= 0) throw new CalcError('DOMAIN_ERROR');
      return Math.log(x);
    case 'log2':
      if (x <= 0) throw new CalcError('DOMAIN_ERROR');
      return Math.log2(x);
    default:
      throw new CalcError('INVALID_FUNCTION', `Unknown function "${name}"`);
  }
}

export function evaluateNode(node: ExprNode, mode: AngleMode = 'RAD'): number {
  switch (node.type) {
    case 'number':
      return checkResult(node.value);
    case 'constant':
      return checkResult(node.value === 'PI' ? Math.PI : Math.E);
    case 'unary':
      return checkResult(-evaluateNode(node.arg, mode));
    case 'factorial':
      return checkResult(factorial(evaluateNode(node.arg, mode)));
    case 'function':
      return checkResult(callFunction(node.name, node.args.map((a) => evaluateNode(a, mode)), mode));
    case 'binary': {
      const left = evaluateNode(node.left, mode);
      const right = evaluateNode(node.right, mode);
      switch (node.op) {
        case '+':
          return checkResult(left + right);
        case '-':
          return checkResult(left - right);
        case '×':
          return checkResult(left * right);
        case '÷':
          if (right === 0) throw new CalcError('DIVISION_BY_ZERO');
          return checkResult(left / right);
        case '%':
          if (right === 0) throw new CalcError('DIVISION_BY_ZERO');
          return checkResult(left % right);
        case '^': {
          if (left < 0 && !Number.isInteger(right)) {
            throw new CalcError('DOMAIN_ERROR');
          }
          return checkResult(Math.pow(left, right));
        }
        default:
          throw new CalcError('INVALID_EXPRESSION');
      }
    }
  }
}

export function evaluateExpression(expression: string, options: EvaluateOptions = {}): number {
  const node = parseExpression(expression);
  return evaluateNode(node, options.angleMode ?? 'RAD');
}

/**
 * The last binary operator and its right operand value, for repeat operations.
 * `angleMode` must match the one used to evaluate the expression, otherwise a
 * trailing trig operand is captured in the wrong unit (e.g. `2 + sin(30)` in
 * DEG would repeat with sin(30 rad) instead of 0.5).
 */
export function getLastOperation(
  expression: string,
  options: EvaluateOptions = {}
): { operator: BinaryOperator; operand: string } | null {
  const mode = options.angleMode ?? 'RAD';
  const node = parseExpression(expression);
  if (node.type !== 'binary') return null;

  let operator: BinaryOperator = node.op;
  let right = node.right;
  let current: ExprNode = node;
  while (current.type === 'binary') {
    operator = current.op;
    if (current.right.type === 'binary') {
      current = current.right;
    } else {
      right = current.right;
      break;
    }
  }

  let value: number;
  try {
    value = evaluateNode(right, mode);
  } catch {
    return null;
  }
  return { operator, operand: String(value) };
}