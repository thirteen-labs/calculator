import type { HistoryEntry } from './types';

const HISTORY_STORAGE_KEY = 'calculator.history.v1';

export function saveHistoryEntry(entry: Omit<HistoryEntry, 'id'>): void {
  try {
    const stored = typeof localStorage !== 'undefined' 
      ? localStorage.getItem(HISTORY_STORAGE_KEY) 
      : null;
    const existing: HistoryEntry[] = stored 
      ? JSON.parse(stored) 
      : [];
    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
    };
    const updated = [newEntry, ...existing].slice(0, 100); // Keep last 100
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // Fail silently - in-memory state remains
  }
}

export function loadHistoryEntries(): HistoryEntry[] {
  try {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem(HISTORY_STORAGE_KEY)
      : null;
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function deleteHistoryEntry(id: string): void {
  try {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem(HISTORY_STORAGE_KEY)
      : null;
    if (!stored) return;
    const existing: HistoryEntry[] = JSON.parse(stored);
    const filtered = existing.filter((h) => h.id !== id);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Fail silently
  }
}

export function toggleHistoryFavorite(id: string, favorite: boolean): void {
  try {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem(HISTORY_STORAGE_KEY)
      : null;
    if (!stored) return;
    const existing: HistoryEntry[] = JSON.parse(stored);
    const updated = existing.map((h) =>
      h.id === id ? { ...h, favorite } : h
    );
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Fail silently
  }
}

export function clearHistory(): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
  } catch {
    // Fail silently
  }
}