import { calculatorReducer, initialState } from '@/calc/index';
import { evaluateExpression, formatNumber } from '@/calc/engine';

let failures = 0;
function assertEq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    failures += 1;
    console.error('FAIL ' + label + ': got ' + JSON.stringify(actual) + ', expected ' + JSON.stringify(expected));
  } else {
    console.log('ok   ' + label);
  }
}

function engineErrorCode(expr: string, opts?: { angleMode?: 'DEG' | 'RAD' | 'GRAD' }) {
  try {
    evaluateExpression(expr, opts);
    return undefined;
  } catch (e) {
    return (e as { code: string }).code;
  }
}

type Action = Parameters<typeof calculatorReducer>[1];
function pressActions(actions: Action[], from?: Parameters<typeof calculatorReducer>[0]) {
  let state = from ?? initialState;
  for (const a of actions) state = calculatorReducer(state, a);
  return state;
}

// engine
assertEq(evaluateExpression('12 + 5 x 3'.replace('x', String.fromCharCode(215))), 27, '12+5*3');
assertEq(evaluateExpression('25 + 10 ' + String.fromCharCode(215) + ' 2'), 45, '25+10*2');
assertEq(evaluateExpression('(25 + 5) ' + String.fromCharCode(215) + ' 2'), 60, 'paren mult');
assertEq(evaluateExpression('2' + String.fromCharCode(960)), 2 * Math.PI, '2pi implicit');
assertEq(evaluateExpression('2(1+2)'), 6, '2(1+2)');
assertEq(evaluateExpression('(1+2)(3+4)'), 21, '(1+2)(3+4)');
assertEq(formatNumber(evaluateExpression('sin(30)', { angleMode: 'DEG' }), 10), '0.5', 'sin(30) deg');
assertEq(evaluateExpression('2^10'), 1024, '2^10');
assertEq(evaluateExpression('5!'), 120, '5!');
assertEq(evaluateExpression('-3^2'), -9, '-3^2');
assertEq(evaluateExpression('2^-3'), 0.125, '2^-3');
assertEq(engineErrorCode('1' + String.fromCharCode(247) + '0'), 'DIVISION_BY_ZERO', '1/0');
assertEq(engineErrorCode('sqrt(-1)'), 'DOMAIN_ERROR', 'sqrt(-1)');
assertEq(engineErrorCode('(1+2'), 'UNMATCHED_PARENTHESES', '(1+2 unbalanced');
assertEq(engineErrorCode('12+'), 'MISSING_OPERAND', '12+ incomplete');

// reducer: 12 x 3 = 36
let state = pressActions([
  { type: 'INPUT_DIGIT', digit: '1' },
  { type: 'INPUT_DIGIT', digit: '2' },
  { type: 'INPUT_OPERATOR', operator: String.fromCharCode(215) } as Action,
  { type: 'INPUT_DIGIT', digit: '3' },
  { type: 'EVALUATE' },
]);
assertEq(state.result, '36', '12x3=36');
assertEq(state.history.length, 1, 'history entry');
assertEq(state.expression, '36', 'expr=result');

// operator replacement: 5 + 7
state = pressActions([
  { type: 'INPUT_DIGIT', digit: '5' },
  { type: 'INPUT_OPERATOR', operator: String.fromCharCode(215) } as Action,
  { type: 'INPUT_OPERATOR', operator: '+' },
  { type: 'INPUT_DIGIT', digit: '7' },
  { type: 'EVALUATE' },
]);
assertEq(state.result, '12', 'replace operator');

// repeat
state = pressActions([{ type: 'REPEAT_LAST_OPERATION' }], state);
assertEq(state.result, '19', 'repeat');

// division by zero error
state = pressActions([
  { type: 'INPUT_DIGIT', digit: '5' },
  { type: 'INPUT_OPERATOR', operator: String.fromCharCode(247) } as Action,
  { type: 'INPUT_DIGIT', digit: '0' },
  { type: 'EVALUATE' },
]);
assertEq(state.error?.code, 'DIVISION_BY_ZERO', 'div zero error');

// parentheses
state = pressActions([
  { type: 'INPUT_PAREN', paren: '(' },
  { type: 'INPUT_DIGIT', digit: '2' },
  { type: 'INPUT_OPERATOR', operator: '+' },
  { type: 'INPUT_DIGIT', digit: '3' },
  { type: 'INPUT_PAREN', paren: ')' },
  { type: 'INPUT_OPERATOR', operator: String.fromCharCode(215) } as Action,
  { type: 'INPUT_DIGIT', digit: '4' },
  { type: 'EVALUATE' },
]);
assertEq(state.result, '20', '(2+3)x4=20');

// memory
state = pressActions([
  { type: 'INPUT_DIGIT', digit: '1' },
  { type: 'INPUT_DIGIT', digit: '0' },
  { type: 'INPUT_DIGIT', digit: '0' },
  { type: 'MEMORY_STORE' },
  { type: 'INPUT_OPERATOR', operator: '+' },
  { type: 'MEMORY_RECALL' },
  { type: 'EVALUATE' },
]);
assertEq(state.memory, 100, 'memory=100');
assertEq(state.result, '200', '100+MR=200');

// history reuse
const historyExpression = state.history[0].expression;
const reused = pressActions([{ type: 'HISTORY_REUSE', id: state.history[0].id }], state);
assertEq(reused.expression, historyExpression, 'reuse restores expression');

// undo
const undone = calculatorReducer(reused, { type: 'UNDO' });
assertEq(undone.expression, '200', 'undo');

// scientific sqrt
state = pressActions([
  { type: 'INPUT_FUNCTION', fn: 'sqrt' },
  { type: 'INPUT_DIGIT', digit: '9' },
  { type: 'INPUT_PAREN', paren: ')' },
  { type: 'EVALUATE' },
]);
assertEq(state.result, '3', 'sqrt(9)=3');

// formatting
assertEq(formatNumber(0.0000000000001, 10), '1e-13', 'format small');
assertEq(formatNumber(0.1 + 0.2, 10), '0.3', 'float');
assertEq(formatNumber(123456789012345678901234567890, 10), '1.234568e+29', 'format big');

// decimal guards
state = pressActions([
  { type: 'INPUT_DIGIT', digit: '1' },
  { type: 'INPUT_DECIMAL' },
  { type: 'INPUT_DECIMAL' },
  { type: 'INPUT_DIGIT', digit: '5' },
]);
assertEq(state.expression, '1.5', 'single decimal');

if (failures > 0) {
  console.error(failures + ' failures');
  process.exit(1);
} else {
  console.log('all smoke checks passed');
}