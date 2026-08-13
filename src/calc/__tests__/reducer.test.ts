import { describe, it, expect } from '@jest/globals';
import { calculatorReducer } from '../reducer';
import { initialState } from '../state';
import type { Action } from '../actions';
import type { CalculatorState, BinaryOperator } from '../types';

const MUL = String.fromCharCode(215) as BinaryOperator;
const DIV = String.fromCharCode(247) as BinaryOperator;

function pressActions(actions: Action[], from?: CalculatorState): CalculatorState {
  let state = from ?? initialState;
  for (const a of actions) state = calculatorReducer(state, a);
  return state;
}

describe('calculatorReducer - INPUT actions', () => {
  it('inputs digits', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DIGIT', digit: '2' },
    ]);
    expect(state.expression).toBe('12');
  });

  it('replaces leading 0 when inputting a digit', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'INPUT_DIGIT', digit: '5' },
    ]);
    expect(state.expression).toBe('5');
  });

  it('inputs decimal', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DECIMAL' },
      { type: 'INPUT_DIGIT', digit: '5' },
    ]);
    expect(state.expression).toBe('1.5');
  });

  it('prevents multiple decimals in one number', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DECIMAL' },
      { type: 'INPUT_DECIMAL' },
      { type: 'INPUT_DIGIT', digit: '5' },
    ]);
    expect(state.expression).toBe('1.5');
  });

  it('inputs operators', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '3' },
    ]);
    expect(state.expression).toBe('5 + 3');
  });

  it('replaces trailing operator with new one', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: MUL },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '3' },
    ]);
    expect(state.expression).toBe('5 +3');
  });

  it('inputs parentheses', () => {
    const state = pressActions([
      { type: 'INPUT_PAREN', paren: '(' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'INPUT_PAREN', paren: ')' },
      { type: 'INPUT_OPERATOR', operator: MUL },
      { type: 'INPUT_DIGIT', digit: '4' },
    ]);
    expect(state.expression).toBe('(2 + 3) x 4'.replace('x', MUL));
  });

  it('inputs negative', () => {
    const state = pressActions([{ type: 'INPUT_NEGATIVE' }]);
    expect(state.expression).toBe('-');
  });

  it('inputs functions', () => {
    const state = pressActions([
      { type: 'INPUT_FUNCTION', fn: 'sqrt' },
      { type: 'INPUT_DIGIT', digit: '9' },
      { type: 'INPUT_PAREN', paren: ')' },
    ]);
    expect(state.expression).toBe('sqrt(9)');
  });

  it('inputs constants', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_CONSTANT', constant: 'PI' },
    ]);
    expect(state.expression).toBe('2×π');
  });
});

describe('calculatorReducer - CALCULATION actions', () => {
  it('evaluates expressions', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: MUL },
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'EVALUATE' },
    ]);
    expect(state.result).toBe('36');
    expect(state.expression).toBe('36');
  });

  it('adds history entry on evaluate', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
    ]);
    expect(state.history).toHaveLength(1);
    expect(state.history[0].expression).toBe('2 + 2');
    expect(state.history[0].result).toBe('4');
  });

  it('repeats last operation', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '7' },
      { type: 'EVALUATE' },
    ]);
    expect(state.result).toBe('12');
    expect(state.lastOperation).toBeDefined();
    expect(state.lastOperation?.operator).toBe('+');

    state = pressActions([{ type: 'REPEAT_LAST_OPERATION' }], state);
    expect(state.result).toBe('19');
  });

  it('returns error on division by zero', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: DIV },
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'EVALUATE' },
    ]);
    expect(state.error).toBeDefined();
    expect(state.error?.code).toBe('DIVISION_BY_ZERO');
  });

  it('returns error on invalid expression', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'EVALUATE' },
    ]);
    expect(state.error).toBeDefined();
  });
});

describe('calculatorReducer - MEMORY actions', () => {
  it('stores value in memory', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'MEMORY_STORE' },
    ]);
    expect(state.memory).toBe(100);
  });

  it('recalls memory value', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'MEMORY_STORE' },
    ]);
    expect(state.memory).toBe(15);

    state = pressActions([
      { type: 'CLEAR' },
      { type: 'MEMORY_RECALL' },
    ], state);
    expect(state.expression).toBe('15');
  });

  it('adds to memory', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'MEMORY_STORE' },
    ]);
    state = pressActions([{ type: 'MEMORY_ADD' }], state);
    expect(state.memory).toBe(2);
  });

  it('subtracts from memory', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'MEMORY_STORE' },
    ]);
    state = pressActions([{ type: 'MEMORY_SUBTRACT' }], state);
    expect(state.memory).toBe(0);
  });

  it('clears memory', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'MEMORY_STORE' },
    ]);
    expect(state.memory).toBe(5);

    state = pressActions([{ type: 'MEMORY_CLEAR' }], state);
    expect(state.memory).toBeNull();
  });
});

describe('calculatorReducer - HISTORY actions', () => {
  it('toggles favorite on history entry', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'EVALUATE' },
    ]);
    expect(state.history).toHaveLength(1);
    const entryId = state.history[0].id;

    state = pressActions([{ type: 'HISTORY_TOGGLE_FAVORITE', id: entryId }], state);
    expect(state.history[0].favorite).toBe(true);

    state = pressActions([{ type: 'HISTORY_TOGGLE_FAVORITE', id: entryId }], state);
    expect(state.history[0].favorite).toBe(false);
  });

  it('deletes history entry', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
    ]);
    expect(state.history).toHaveLength(1);
    const entryId = state.history[0].id;

    state = pressActions([{ type: 'HISTORY_DELETE', id: entryId }], state);
    expect(state.history).toHaveLength(0);
  });

  it('clears all history', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'EVALUATE' },
    ]);
    expect(state.history.length).toBeGreaterThan(0);

    state = pressActions([{ type: 'HISTORY_CLEAR' }], state);
    expect(state.history).toHaveLength(0);
  });

  it('reuses history entry', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '4' },
      { type: 'EVALUATE' },
    ]);
    const entry = state.history[0];

    state = pressActions([{ type: 'HISTORY_REUSE', id: entry.id }], state);
    expect(state.expression).toBe('3 + 4');
    expect(state.preview).toBe('7');
  });
});

describe('calculatorReducer - EDITING actions', () => {
  it('clears current entry', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_DIGIT', digit: '3' },
    ]);
    expect(state.expression).toBe('123');

    state = pressActions([{ type: 'CLEAR_ENTRY' }], state);
    expect(state.expression).toBe('');
  });

  it('clears all input', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'CLEAR' },
    ]);
    expect(state.expression).toBe('');
    expect(state.result).toBeNull();
    expect(state.error).toBeNull();
  });

  it('backspaces', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'BACKSPACE' },
    ]);
    expect(state.expression).toBe('1');
  });

  it('handles backspace of trailing operator', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'BACKSPACE' },
    ]);
    expect(state.expression).toBe('5');
  });

  it('undoes previous action', () => {
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'UNDO' },
    ]);
    expect(state.expression).toBe('5');
  });

  it('redos previous undo', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'UNDO' },
    ]);
    expect(state.expression).toBe('5');

    state = pressActions([{ type: 'REDO' }], state);
    expect(state.expression).toBe('50');
  });

  it('does nothing when there is no undo history', () => {
    const state = pressActions([{ type: 'UNDO' }]);
    expect(state.expression).toBe('');
  });
});

describe('calculatorReducer - MODE actions', () => {
  it('toggles scientific mode', () => {
    let state = pressActions([{ type: 'TOGGLE_SCIENTIFIC' }]);
    expect(state.mode).toBe('scientific');

    state = pressActions([{ type: 'TOGGLE_SCIENTIFIC' }], state);
    expect(state.mode).toBe('basic');
  });

  it('sets mode directly', () => {
    const state = pressActions([{ type: 'SET_MODE', mode: 'scientific' }]);
    expect(state.mode).toBe('scientific');
  });

  it('sets angle mode', () => {
    const state = pressActions([{ type: 'SET_ANGLE_MODE', mode: 'RAD' }]);
    expect(state.angleMode).toBe('RAD');
  });

  it('sets precision', () => {
    const state = pressActions([{ type: 'SET_PRECISION', precision: 5 }]);
    expect(state.precision).toBe(5);
  });
});
