import { useCallback, useReducer } from 'react';

import { calculatorReducer, initialState } from '@/calc';
import type { Action } from '@/calc';

export function useCalculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  const dispatchAndForget = useCallback((action: Action) => dispatch(action), [dispatch]);

  return { state, dispatch: dispatchAndForget };
}