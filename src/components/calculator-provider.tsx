import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';

import { calculatorReducer } from '@/calc/reducer';
import { loadHistory, saveHistory } from '@/calc/history-storage';
import { initialState } from '@/calc/state';
import type { Action, CalculatorState } from '@/calc';

interface CalculatorContextValue {
  state: CalculatorState;
  dispatch: (action: Action) => void;
}

/**
 * Undefined outside a provider so a missing provider fails loudly with a
 * readable message instead of "cannot read property of undefined".
 */
const CalculatorContext = createContext<CalculatorContextValue | undefined>(undefined);

/**
 * Owns the single calculator state tree and mirrors it to storage.
 *
 * History used to be persisted from inside the reducer, which meant every
 * action that changed history had to remember to write it too. Anything that
 * forgot (undo/redo, repeat) drifted between what was on screen and what was
 * stored. The reducer is now pure and persistence is derived from state here.
 */
export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calculatorReducer, initialState, (base) => ({
    ...base,
    history: loadHistory(),
  }));

  // The reducer returns a new `history` array for every undo/redo too, so
  // comparing by identity is enough to catch any change.
  const history = state.history;
  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) {
      // The value in state came *from* storage; writing it straight back would
      // be a redundant (and, before hydration settles, a clobbering) write.
      isFirstSync.current = false;
      return;
    }
    saveHistory(history);
  }, [history]);

  const value: CalculatorContextValue = { state, dispatch };
  return <CalculatorContext value={value}>{children}</CalculatorContext>;
}

export function useCalculatorContext(): CalculatorContextValue {
  const value = useContext(CalculatorContext);
  if (value === undefined) {
    throw new Error('useCalculator must be used inside a <CalculatorProvider>');
  }
  return value;
}
