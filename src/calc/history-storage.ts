// Installs the SQLite-backed `localStorage` on native. Documented as a no-op on
// web (where the browser already provides it) and safe to import more than once.
import 'expo-sqlite/localStorage/install';

import type { HistoryEntry } from './types';
import { MAX_HISTORY } from './state';

const HISTORY_STORAGE_KEY = 'calculator.history.v1';

const MAX_STORED_ENTRIES = MAX_HISTORY;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.expression === 'string' &&
    typeof entry.result === 'string' &&
    typeof entry.timestamp === 'number' &&
    typeof entry.favorite === 'boolean'
  );
}

/**
 * Persisted history, newest first. Storage is untrusted input (it can be
 * corrupt, hand-edited, or left over from an older build), so every entry is
 * validated and anything unrecognised is dropped rather than crashing a screen.
 */
export function loadHistory(): HistoryEntry[] {
  const store = storage();
  if (store === null) return [];
  try {
    const raw = store.getItem(HISTORY_STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryEntry);
  } catch {
    return [];
  }
}

/**
 * Replaces persisted history with `entries`.
 *
 * The reducer is the single source of truth, so callers write the whole array
 * rather than mutating storage per action. That keeps deletes, favourites,
 * clears, undo/redo and repeat-operations consistent with what is on screen
 * without every one of them having to remember to persist itself.
 */
export function saveHistory(entries: HistoryEntry[]): void {
  const store = storage();
  if (store === null) return;
  try {
    store.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_STORED_ENTRIES))
    );
  } catch {
    // Persistence is best-effort; in-memory state remains authoritative.
  }
}
