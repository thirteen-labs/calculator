import { describe, it, expect } from '@jest/globals';
import { calculatorReducer, nextParen } from '../reducer';
import { initialState, MAX_HISTORY } from '../state';
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

  it('does not log a duplicate entry when = is pressed on a settled result', () => {
    // After `=` the expression is replaced by the result, so a second `=`
    // re-evaluates "4" and would otherwise add a pointless "4 = 4" entry.
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
    ]);
    expect(state.history).toHaveLength(1);

    state = pressActions([{ type: 'EVALUATE' }], state);
    expect(state.history).toHaveLength(1);
    expect(state.result).toBe('4');
  });

  it('logs an entry when a settled result is reused as an operand', () => {
    // 2 + 2 = 4, then 4 + 1 = 5 is a new calculation, not a duplicate.
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'EVALUATE' },
    ]);
    expect(state.result).toBe('5');
    expect(state.history).toHaveLength(2);
    expect(state.history[0]).toMatchObject({ expression: '4 + 1', result: '5' });
  });

  it('logs an entry when the same expression is re-entered after a clear', () => {
    const actions: Action[] = [
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
      { type: 'CLEAR' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
    ];
    expect(pressActions(actions).history).toHaveLength(2);
  });

  it('keeps history newest first and caps it', () => {
    let state = initialState;
    for (let i = 1; i <= MAX_HISTORY + 5; i++) {
      state = pressActions(
        [
          { type: 'INPUT_DIGIT', digit: '1' },
          { type: 'INPUT_OPERATOR', operator: '+' },
          { type: 'INPUT_DIGIT', digit: '1' },
          { type: 'EVALUATE' },
          { type: 'CLEAR' },
        ],
        state
      );
    }
    expect(state.history).toHaveLength(MAX_HISTORY);
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

  it('stores full precision, not the rounded display value', () => {
    // 1/3 is displayed as 0.3333333333 (10 dp). Re-parsing that string would
    // permanently lose the remaining digits in memory.
    const state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_OPERATOR', operator: DIV },
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'EVALUATE' },
      { type: 'MEMORY_STORE' },
    ]);
    expect(state.result).toBe('0.3333333333');
    expect(state.memory).toBe(1 / 3);
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

  it('recomputes the reused preview at the current precision', () => {
    // The entry was stored with a 10 dp preview; at 4 dp the reused expression
    // must show 0.3333, not the stale 0.3333333333 copied from the entry.
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_OPERATOR', operator: DIV },
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'EVALUATE' },
    ]);
    const entry = state.history[0];

    state = pressActions([{ type: 'SET_PRECISION', precision: 4 }], state);
    state = pressActions([{ type: 'HISTORY_REUSE', id: entry.id }], state);
    expect(state.expression).toBe('1 ÷ 3');
    expect(state.preview).toBe('0.3333');
  });

  it('drops the pending operation when reusing, so = evaluates instead of repeating', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '5' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '7' },
      { type: 'EVALUATE' },
    ]);
    const entry = state.history[0];
    expect(state.lastOperation).toEqual({ operator: '+', operand: '7' });

    state = pressActions([{ type: 'HISTORY_REUSE', id: entry.id }], state);
    expect(state.lastOperation).toBeUndefined();

    state = pressActions([{ type: 'EVALUATE' }], state);
    expect(state.result).toBe('12');
  });

  it('keeps a single result per expression when repeating the last operation', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'EVALUATE' },
      { type: 'REPEAT_LAST_OPERATION' },
    ]);
    expect(state.result).toBe('3');
    expect(state.history).toHaveLength(2);
    expect(state.history[0]).toMatchObject({ expression: '2 + 1', result: '3' });
  });

  it('undo after evaluate removes the history entry it added', () => {
    // The saved history has to be derived from state, so undoing an evaluation
    // must take the new entry back out of history or storage drifts.
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
    ]);
    expect(state.history).toHaveLength(1);

    state = pressActions([{ type: 'UNDO' }], state);
    expect(state.history).toHaveLength(0);
    expect(state.expression).toBe('2 + 2');

    state = pressActions([{ type: 'REDO' }], state);
    expect(state.history).toHaveLength(1);
  });

  it('undo of a favourite toggle restores the previous favourite state', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
      { type: 'HISTORY_TOGGLE_FAVORITE', id: 'nonexistent' },
    ]);
    expect(state.history).toHaveLength(1);

    const id = state.history[0].id;
    state = pressActions([{ type: 'HISTORY_TOGGLE_FAVORITE', id }], state);
    expect(state.history[0].favorite).toBe(true);

    state = pressActions([{ type: 'UNDO' }], state);
    expect(state.history[0].favorite).toBe(false);
  });

  it('ignores history actions for an unknown id', () => {
    const state = pressActions([{ type: 'HISTORY_DELETE', id: 'nope' }]);
    expect(state.history).toEqual([]);
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
    expect(state.resultValue).toBeNull();
    expect(state.error).toBeNull();
  });

  it('resets everything including history and undo stacks', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'INPUT_OPERATOR', operator: '+' },
      { type: 'INPUT_DIGIT', digit: '2' },
      { type: 'EVALUATE' },
      { type: 'MEMORY_STORE' },
    ]);
    expect(state.history).toHaveLength(1);
    expect(state.memory).toBe(4);

    state = pressActions([{ type: 'RESET' }], state);
    expect(state.expression).toBe('');
    expect(state.result).toBeNull();
    expect(state.resultValue).toBeNull();
    expect(state.memory).toBeNull();
    expect(state.history).toHaveLength(0);
    expect(state.past).toHaveLength(0);
    expect(state.future).toHaveLength(0);
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

  it('recomputes the preview when the angle mode changes', () => {
    let state = pressActions([
      { type: 'INPUT_FUNCTION', fn: 'sin' },
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'INPUT_PAREN', paren: ')' },
    ]);
    expect(state.preview).toBe('0.5');

    state = pressActions([{ type: 'SET_ANGLE_MODE', mode: 'RAD' }], state);
    expect(state.angleMode).toBe('RAD');
    expect(state.preview).toBe('-0.9880316241');
  });

  it('recomputes the preview and re-formats the result when precision changes', () => {
    let state = pressActions([
      { type: 'INPUT_DIGIT', digit: '1' },
      { type: 'INPUT_OPERATOR', operator: DIV },
      { type: 'INPUT_DIGIT', digit: '3' },
    ]);
    expect(state.preview).toBe('0.3333333333');

    state = pressActions([{ type: 'SET_PRECISION', precision: 4 }], state);
    expect(state.preview).toBe('0.3333');

    state = pressActions([{ type: 'EVALUATE' }], state);
    expect(state.result).toBe('0.3333');

    // Widening precision again must recover digits rather than re-reading the
    // already-rounded result string.
    state = pressActions([{ type: 'SET_PRECISION', precision: 10 }], state);
    expect(state.result).toBe('0.3333333333');
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

describe('nextParen', () => {
  it('opens a group by default', () => {
    expect(nextParen('')).toBe('(');
    expect(nextParen('2+')).toBe('(');
    expect(nextParen('2+3')).toBe('(');
  });

  it('closes an open group once the operand is complete', () => {
    expect(nextParen('sin(30')).toBe(')');
    expect(nextParen('(1+2')).toBe(')');
    expect(nextParen('(5!')).toBe(')');
  });

  it('opens again after the group is balanced', () => {
    expect(nextParen('(1+2)')).toBe('(');
  });

  it('does not close an empty group that the user just opened', () => {
    // Pressing `( )` right after `2+` must not produce `2+()`, which is a parse
    // error, and must not claim to close something that has no operand yet.
    expect(nextParen('2+(')).toBe('(');
    expect(nextParen('sin(')).toBe('(');
  });

  it('is what INPUT_PAREN applies when no paren is supplied', () => {
    const state = pressActions([
      { type: 'INPUT_FUNCTION', fn: 'sin' },
      { type: 'INPUT_DIGIT', digit: '3' },
      { type: 'INPUT_DIGIT', digit: '0' },
      { type: 'INPUT_PAREN' },
    ]);
    expect(state.expression).toBe('sin(30)');
    expect(state.preview).toBe('0.5');
  });
});
