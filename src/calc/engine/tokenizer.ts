import { CalcError } from '@/calc/errors';
import type { BinaryOperator, FunctionName } from '@/calc/types';

export type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: BinaryOperator }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'function'; value: FunctionName }
  | { type: 'constant'; value: 'PI' | 'E' }
  | { type: 'factorial' };

const FUNCTIONS: FunctionName[] = [
  'factorial',
  'reciprocal',
  'asin',
  'acos',
  'atan',
  'sqrt',
  'cbrt',
  'square',
  'cube',
  'floor',
  'ceil',
  'sign',
  'sin',
  'cos',
  'tan',
  'log2',
  'log',
  'ln',
  'abs',
];

const OPERATORS: Record<string, BinaryOperator> = {
  '+': '+',
  '-': '-',
  '−': '-',
  '–': '-',
  '×': '×',
  '*': '×',
  '·': '×',
  '÷': '÷',
  '/': '÷',
  '%': '%',
  '^': '^',
};

const DIGITS = '0123456789';

function isDigit(ch: string): boolean {
  return DIGITS.includes(ch);
}

function isFunctionStart(ch: string): boolean {
  return /[a-zA-Z]/.test(ch);
}

/** Function names longest-first, so `log2` matches before `log`. Sorted once. */
const FUNCTIONS_BY_LENGTH = [...FUNCTIONS].sort((a, b) => b.length - a.length);

function matchFunction(input: string, index: number): FunctionName | null {
  for (const name of FUNCTIONS_BY_LENGTH) {
    if (input.slice(index, index + name.length).toLowerCase() === name) {
      return name;
    }
  }
  return null;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i += 1;
      continue;
    }

    if (isDigit(ch) || ch === '.') {
      let start = i;
      let seenDot = false;
      let seenExponent = false;

      while (i < input.length) {
        const c = input[i];
        if (isDigit(c)) {
          i += 1;
        } else if (c === '.' && !seenDot && !seenExponent) {
          seenDot = true;
          i += 1;
        } else if ((c === 'e' || c === 'E') && !seenExponent && i > start) {
          const next = input[i + 1];
          const nextIsDigit = next !== undefined && isDigit(next);
          const nextIsSignedDigit =
            (next === '+' || next === '-') &&
            input[i + 2] !== undefined &&
            isDigit(input[i + 2]);
          if (nextIsDigit || nextIsSignedDigit) {
            seenExponent = true;
            // Consume the sign too, otherwise the loop stops on it and leaves
            // a bare "1.5e" that parses as NaN.
            i += nextIsSignedDigit ? 2 : 1;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      const raw = input.slice(start, i);
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new CalcError('NUMBER_TOO_LARGE');
      }
      tokens.push({ type: 'number', value });
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' });
      i += 1;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen' });
      i += 1;
      continue;
    }

    if (ch === '!') {
      tokens.push({ type: 'factorial' });
      i += 1;
      continue;
    }

    if (ch === 'π' || ch === 'Π') {
      tokens.push({ type: 'constant', value: 'PI' });
      i += 1;
      continue;
    }

    if (isFunctionStart(ch)) {
      const fn = matchFunction(input, i);
      if (fn !== null) {
        tokens.push({ type: 'function', value: fn });
        i += fn.length;
        continue;
      }

      const lower = input.slice(i, i + 2).toLowerCase();
      if (lower === 'pi') {
        tokens.push({ type: 'constant', value: 'PI' });
        i += 2;
        continue;
      }

      if (ch.toLowerCase() === 'e' && !isFunctionStart(input[i + 1] ?? '')) {
        tokens.push({ type: 'constant', value: 'E' });
        i += 1;
        continue;
      }

      throw new CalcError('INVALID_FUNCTION', `Unknown function at position ${i}`);
    }

    const op = OPERATORS[ch];
    if (op !== undefined) {
      tokens.push({ type: 'operator', value: op });
      i += 1;
      continue;
    }

    throw new CalcError('SYNTAX_ERROR', `Unexpected character "${ch}"`);
  }

  return tokens;
}

function isAtomish(token: Token): boolean {
  return (
    token.type === 'number' ||
    token.type === 'rparen' ||
    token.type === 'constant' ||
    token.type === 'factorial'
  );
}

function beginsAtom(token: Token): boolean {
  return (
    token.type === 'number' ||
    token.type === 'lparen' ||
    token.type === 'function' ||
    token.type === 'constant'
  );
}

export function insertImplicitMultiplication(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const current = tokens[i];
    const next = tokens[i + 1];
    const isMultiply = isAtomish(current) && next !== undefined && beginsAtom(next);
    // Do not insert between 'factorial' and 'factorial' (5!!) — isAtomish handles min-one-side
    out.push(current);
    if (isMultiply) {
      out.push({ type: 'operator', value: '×' });
    }
  }
  return out;
}