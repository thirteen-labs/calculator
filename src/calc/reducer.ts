import type { Action } from './actions';
import { CalcError } from './errors';
import { evaluateExpression, formatNumber, getLastOperation } from './engine';
import { MAX_HISTORY, initialState } from './state';
import type { AngleMode, CalculatorState, Snapshot, HistoryEntry } from './types';

const MAX_UNDO = 100;

const OPERATOR_CHARS = new Set(['+', '-', '−', '×', '*', '÷', '/', '%', '^']);

function snapshotOf(state: CalculatorState): Snapshot {
  return {
    expression: state.expression,
    result: state.result,
    resultValue: state.resultValue,
    preview: state.preview,
    mode: state.mode,
    angleMode: state.angleMode,
    precision: state.precision,
    memory: state.memory,
    history: state.history,
    error: state.error,
    lastOperation: state.lastOperation,
  };
}

/** Trailing numeric entry (with optional unary minus) and its start index. */
function getCurrentNumber(expression: string): { number: string; start: number } {
  let i = expression.length;
  while (i > 0) {
    const ch = expression[i - 1];
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      i -= 1;
    } else {
      break;
    }
  }
  if (i > 0 && (expression[i - 1] === '-' || expression[i - 1] === '−')) {
    const before = i >= 2 ? expression[i - 2] : '';
    const isUnary = before === '' || before === '(' || OPERATOR_CHARS.has(before);
    if (isUnary) {
      i -= 1;
    }
  }
  return { number: expression.slice(i), start: i };
}

function trimEnd(expression: string): string {
  return expression.replace(/\s+$/, '');
}

function hasPendingOperator(expression: string): { pending: boolean; op?: string } {
  const trimmed = trimEnd(expression);
  if (trimmed.length === 0) return { pending: false };
  const last = trimmed[trimmed.length - 1];
  const op = OPERATOR_CHARS.has(last) ? last : undefined;
  return { pending: op !== undefined, op };
}

function appendDigit(expression: string, digit: string): string {
  const { number } = getCurrentNumber(expression);
  if (number === '0') {
    return expression.slice(0, -1) + digit;
  }
  if (number === '-0') {
    return expression.slice(0, -2) + '-' + digit;
  }
  return expression + digit;
}

function appendDecimal(expression: string): string {
  const { number } = getCurrentNumber(expression);
  if (number.includes('.')) return expression;
  if (number !== '') return expression + '.';
  return expression + '0.';
}

function appendOperator(expression: string, operator: string): string {
  const trimmed = trimEnd(expression);
  if (trimmed === '') return expression;
  const last = trimmed[trimmed.length - 1];
  if (last === '(') return expression;
  if (OPERATOR_CHARS.has(last)) {
    return trimmed.slice(0, -1) + operator;
  }
  return trimmed + ' ' + operator + ' ';
}

function countChar(expression: string, char: string): number {
  let total = 0;
  for (const c of expression) {
    if (c === char) total += 1;
  }
  return total;
}

/** True when the text right before the caret can end an operand. */
function endsOperand(expression: string): boolean {
  const last = trimEnd(expression).slice(-1);
  return (
    (last >= '0' && last <= '9') ||
    last === '.' ||
    last === ')' ||
    last === '!' ||
    last === String.fromCharCode(960) /* π */ ||
    last === 'e'
  );
}

/**
 * Which paren the combined `( )` key should insert next.
 *
 * This is the single source of truth for that key: the reducer applies it on
 * `INPUT_PAREN` and the keypad renders it as the button's behaviour, so the two
 * can no longer drift apart.
 */
export function nextParen(expression: string): '(' | ')' {
  const trimmed = trimEnd(expression);
  if (trimmed === '') return '(';
  if (countChar(trimmed, '(') > countChar(trimmed, ')') && endsOperand(trimmed)) {
    return ')';
  }
  return '(';
}

function appendParen(expression: string, paren: '(' | ')'): string {
  if (paren === '(') {
    const trimmed = trimEnd(expression);
    if (trimmed === '') return '(';
    const last = trimmed[trimmed.length - 1];
    if ((last >= '0' && last <= '9') || last === ')' || last === '.') {
      return trimmed + '×(';
    }
    return trimmed + '(';
  }

  const trimmed = trimEnd(expression);
  if (trimmed === '') return expression;
  const last = trimmed[trimmed.length - 1];
  if (last === '(' || OPERATOR_CHARS.has(last)) return expression;
  if (countChar(trimmed, ')') >= countChar(trimmed, '(')) return expression;
  return trimmed + ')';
}

function appendNegative(expression: string): string {
  const trimmed = trimEnd(expression);
  if (trimmed === '') return '-';
  const last = trimmed[trimmed.length - 1];
  const { number, start } = getCurrentNumber(expression);

  if (number !== '' && start > 0) {
    const before = expression[start - 1];
    if (before !== '-' && before !== '−') {
      return expression.slice(0, start) + '-' + number;
    }
  }

  if (OPERATOR_CHARS.has(last) || last === '(') {
    return expression + '-';
  }
  if (number === '') {
    return expression + '×-';
  }
  return expression;
}

function backspace(expression: string): string {
  const trimmed = trimEnd(expression);
  const { pending } = hasPendingOperator(trimmed);
  if (pending) {
    return trimEnd(trimmed.slice(0, -1));
  }
  return trimmed.slice(0, -1);
}

function clearEntry(expression: string): string {
  const { start } = getCurrentNumber(expression);
  if (start === 0) return '';
  return expression.slice(0, start);
}

function appendFunction(expression: string, fn: string): string {
  const trimmed = trimEnd(expression);
  if (trimmed === '') return fn + '(';
  if (endsOperand(trimmed)) return trimmed + '×' + fn + '(';
  return trimmed + fn + '(';
}

function appendConstant(expression: string, constant: 'PI' | 'E'): string {
  const trimmed = trimEnd(expression);
  const text = constant === 'PI' ? 'π' : 'e';
  if (trimmed === '') return text;
  if (endsOperand(trimmed)) return trimmed + '×' + text;
  return trimmed + text;
}

export function computePreview(
  expression: string,
  precision: number,
  angleMode: AngleMode
): string | null {
  if (trimEnd(expression) === '') return null;
  try {
    const value = evaluateExpression(expression, { angleMode });
    return formatNumber(value, precision);
  } catch {
    return null;
  }
}

function computeResult(
  expression: string,
  precision: number,
  angleMode: AngleMode
): { result: string; resultValue: number; lastOperation: CalculatorState['lastOperation'] } {
  const value = evaluateExpression(expression, { angleMode });
  const formatted = formatNumber(value, precision);
  let lastOperation: CalculatorState['lastOperation'];
  try {
    const op = getLastOperation(expression, { angleMode });
    lastOperation = op ?? undefined;
  } catch {
    lastOperation = undefined;
  }
  return { result: formatted, resultValue: value, lastOperation };
}

export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pushHistory(
  state: CalculatorState,
  expression: string,
  result: string
): CalculatorState {
  const entry: HistoryEntry = {
    id: createId(),
    expression,
    result,
    timestamp: Date.now(),
    favorite: false,
  };
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) };
}

export function calculatorReducer(state: CalculatorState, action: Action): CalculatorState {
  if (action.type === 'UNDO' || action.type === 'REDO') {
    const stack = action.type === 'UNDO' ? state.past : state.future;
    if (stack.length === 0) return state;
    const snapshot = stack[stack.length - 1];
    const remaining = stack.slice(0, -1);
    const saved = snapshotOf(state);
    return {
      ...state,
      ...snapshot,
      past: action.type === 'UNDO' ? remaining : [...state.past, saved],
      future: action.type === 'REDO' ? remaining : [...state.future, saved],
    };
  }

  const snapshot = snapshotOf(state);
  const record = (next: CalculatorState): CalculatorState => ({
    ...next,
    past: [...state.past.slice(-(MAX_UNDO - 1)), snapshot],
    future: [],
  });

  switch (action.type) {
    case 'INPUT_DIGIT': {
      const expression = appendDigit(state.expression, action.digit);
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'INPUT_DECIMAL': {
      const expression = appendDecimal(state.expression);
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'INPUT_OPERATOR': {
      const expression = appendOperator(state.expression, action.operator);
      if (expression === state.expression) return state;
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'INPUT_FUNCTION': {
      const expression = appendFunction(state.expression, action.fn);
      if (expression === state.expression) return state;
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'INPUT_CONSTANT': {
      const expression = appendConstant(state.expression, action.constant);
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'INPUT_PAREN': {
      const expression = appendParen(state.expression, action.paren ?? nextParen(state.expression));
      if (expression === state.expression) return state;
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'INPUT_NEGATIVE': {
      const expression = appendNegative(state.expression);
      if (expression === state.expression) return state;
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'BACKSPACE': {
      const expression = backspace(state.expression);
      if (expression === state.expression) return state;
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'CLEAR_ENTRY': {
      const expression = clearEntry(state.expression);
      if (expression === state.expression) return state;
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'CLEAR': {
      return record({
        ...state,
        expression: '',
        result: null,
        resultValue: null,
        preview: null,
        lastOperation: undefined,
        error: null,
      });
    }

    case 'RESET': {
      return {
        ...initialState,
        history: [],
        past: [],
        future: [],
      };
    }

    case 'EVALUATE': {
      if (state.expression.trim() === '') return state;
      const expression = trimEnd(state.expression);
      // After `=` the expression *is* the result string, so pressing `=` again
      // would re-evaluate that same string and log a pointless `4 = 4` entry.
      if (state.result !== null && expression === state.result) return state;
      try {
        const { result, resultValue, lastOperation } = computeResult(
          expression,
          state.precision,
          state.angleMode
        );
        const next: CalculatorState = {
          ...state,
          expression: result,
          result,
          resultValue,
          preview: null,
          error: null,
          lastOperation,
        };
        return record(pushHistory(next, expression, result));
      } catch (error) {
        const calcError =
          error instanceof CalcError
            ? error.toError()
            : { code: 'INVALID_EXPRESSION' as const, message: 'Invalid expression' };
        return record({ ...state, expression, error: calcError, preview: null });
      }
    }

    case 'REPEAT_LAST_OPERATION': {
      if (!state.lastOperation) return state;
      const expression =
        trimEnd(state.expression) +
        ' ' +
        state.lastOperation.operator +
        ' ' +
        state.lastOperation.operand;
      try {
        const { result, resultValue, lastOperation } = computeResult(
          expression,
          state.precision,
          state.angleMode
        );
        const next: CalculatorState = {
          ...state,
          expression: result,
          result,
          resultValue,
          preview: null,
          error: null,
          lastOperation,
        };
        return record(pushHistory(next, expression, result));
      } catch {
        return record({
          ...state,
          expression,
          error: { code: 'INVALID_EXPRESSION', message: 'Invalid expression' },
          preview: null,
        });
      }
    }

    case 'MEMORY_CLEAR': {
      if (state.memory === null) return state;
      return record({ ...state, memory: null });
    }

    case 'MEMORY_RECALL': {
      if (state.memory === null) return state;
      const memoryText = formatNumber(state.memory, state.precision);
      const trimmed = trimEnd(state.expression);
      const expression =
        endsOperand(trimmed) ? trimmed + '×' + memoryText : trimmed + memoryText;
      return record({
        ...state,
        expression,
        error: null,
        preview: computePreview(expression, state.precision, state.angleMode),
      });
    }

    case 'MEMORY_STORE':
    case 'MEMORY_ADD':
    case 'MEMORY_SUBTRACT': {
      // `result` has already been rounded to the display precision, so parsing
      // it back would store 1/3 as 0.3333333333. Prefer the raw value and fall
      // back to evaluating the live expression when nothing has been evaluated.
      const value =
        state.resultValue ??
        (() => {
          try {
            return evaluateExpression(state.expression, { angleMode: state.angleMode });
          } catch {
            return NaN;
          }
        })();
      if (!Number.isFinite(value)) return state;
      let memory = state.memory ?? 0;
      if (action.type === 'MEMORY_ADD') memory += value;
      if (action.type === 'MEMORY_SUBTRACT') memory -= value;
      if (action.type === 'MEMORY_STORE') memory = value;
      return record({ ...state, memory });
    }

    case 'HISTORY_REUSE': {
      const entry = state.history.find((h) => h.id === action.id);
      if (!entry) return state;
      return record({
        ...state,
        expression: entry.expression,
        result: null,
        resultValue: null,
        // Recomputed rather than copied from the entry: the entry was written
        // with whatever precision and angle mode were active back then.
        preview: computePreview(entry.expression, state.precision, state.angleMode),
        error: null,
        // The reused expression is unrelated to the operation that was pending,
        // so `=` must evaluate it instead of repeating that one.
        lastOperation: undefined,
      });
    }

    case 'HISTORY_DELETE': {
      const history = state.history.filter((h) => h.id !== action.id);
      if (history.length === state.history.length) return state;
      return record({ ...state, history });
    }

    case 'HISTORY_CLEAR': {
      if (state.history.length === 0) return state;
      return record({ ...state, history: [] });
    }

    case 'HISTORY_TOGGLE_FAVORITE': {
      const history = state.history.map((h) =>
        h.id === action.id ? { ...h, favorite: !h.favorite } : h
      );
      const changed = history.some((h) => h.id === action.id);
      if (!changed) return state;
      return record({ ...state, history });
    }

    case 'TOGGLE_SCIENTIFIC': {
      return record({ ...state, mode: state.mode === 'basic' ? 'scientific' : 'basic' });
    }

    case 'SET_ANGLE_MODE': {
      if (state.angleMode === action.mode) return state;
      // The live expression is trigonometric, so the preview has to be
      // recomputed in the new unit. A settled result is left alone: it is a
      // number now, not an angle.
      return record({
        ...state,
        angleMode: action.mode,
        preview: computePreview(state.expression, state.precision, action.mode),
      });
    }

    case 'SET_PRECISION': {
      if (state.precision === action.precision) return state;
      return record({
        ...state,
        precision: action.precision,
        preview: computePreview(state.expression, action.precision, state.angleMode),
        // Re-format the settled result from its raw value rather than re-parsing
        // the already-rounded string, which would bake in the old precision.
        result:
          state.resultValue === null ? state.result : formatNumber(state.resultValue, action.precision),
      });
    }

    default:
      return state;
  }
}