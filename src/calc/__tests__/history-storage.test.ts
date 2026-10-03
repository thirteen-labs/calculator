import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

import { loadHistory, saveHistory } from '../history-storage';
import type { HistoryEntry } from '../types';

const KEY = 'calculator.history.v1';

function entry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: 'id-1',
    expression: '2 + 2',
    result: '4',
    timestamp: 1_700_000_000_000,
    favorite: false,
    ...overrides,
  };
}

const original = (globalThis as { localStorage?: Storage }).localStorage;

function useFakeStorage(initial: Record<string, string> = {}): void {
  const map = new Map(Object.entries(initial));
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

beforeEach(() => useFakeStorage());
afterEach(() => {
  (globalThis as { localStorage?: Storage }).localStorage = original;
});

describe('history storage', () => {
  it('round-trips entries in order', () => {
    // Newest first; storage preserves the given order.
    saveHistory([entry({ id: 'id-2', expression: '1 / 0', result: 'Error' }), entry()]);
    expect(loadHistory()).toHaveLength(2);
    expect(loadHistory().map((e) => e.id)).toEqual(['id-2', 'id-1']);
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('replaces rather than appends, so deletes and clears persist', () => {
    saveHistory([entry(), entry({ id: 'id-2' })]);
    saveHistory([entry({ id: 'id-2' })]);
    expect(loadHistory().map((e) => e.id)).toEqual(['id-2']);

    saveHistory([]);
    expect(loadHistory()).toEqual([]);
  });

  it('survives corrupt JSON instead of throwing into a screen', () => {
    useFakeStorage({ [KEY]: '{not json' });
    expect(loadHistory()).toEqual([]);
  });

  it('survives a non-array payload', () => {
    useFakeStorage({ [KEY]: '{"entries":[]}' });
    expect(loadHistory()).toEqual([]);
  });

  it('drops entries that do not match the schema', () => {
    useFakeStorage({
      [KEY]: JSON.stringify([entry(), { id: 'bad' }, null, 42, entry({ id: 'id-9' })]),
    });
    expect(loadHistory().map((e) => e.id)).toEqual(['id-1', 'id-9']);
  });

  it('returns an empty list when storage is unavailable', () => {
    (globalThis as { localStorage?: Storage }).localStorage = undefined as never;
    expect(loadHistory()).toEqual([]);
    expect(() => saveHistory([entry()])).not.toThrow();
  });
});
