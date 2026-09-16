// Client-only, localStorage-backed "save for later" list — no accounts,
// so no server-side bookmarks table; this is per-device by design.

const STORAGE_KEY = "btp_saved_confessions";

interface SavedConfession {
  id: string;
  preview: string;
  savedAt: string;
}

function readAll(): SavedConfession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedConfession[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: SavedConfession[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private mode, quota) — saving silently
    // no-ops rather than crashing the page.
  }
}

export function isSaved(id: string): boolean {
  return readAll().some((entry) => entry.id === id);
}

export function saveConfession(id: string, preview: string): void {
  const withoutExisting = readAll().filter((entry) => entry.id !== id);
  writeAll([...withoutExisting, { id, preview, savedAt: new Date().toISOString() }]);
}

export function unsaveConfession(id: string): void {
  writeAll(readAll().filter((entry) => entry.id !== id));
}

export function getSavedConfessions(): SavedConfession[] {
  return readAll().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
