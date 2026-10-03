import { useCallback } from 'react';

import { useCalculatorContext } from '@/components/calculator-provider';
import type { Action } from '@/calc';

export function useCalculator() {
  const { state, dispatch } = useCalculatorContext();
  const dispatchAndForget = useCallback((action: Action) => dispatch(action), [dispatch]);

  return { state, dispatch: dispatchAndForget };
}
