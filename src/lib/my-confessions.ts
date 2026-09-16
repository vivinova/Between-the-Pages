// Client-only, localStorage-backed record of confessions this browser
// submitted — the only way this app can offer "delete your own
// confession" without an account. Per-device by nature: clearing site
// data or switching browsers loses the ability to delete (the original
// token, shown once at submission, still works if the person saved it
// themselves).

const STORAGE_KEY = "btp_my_confessions";

interface MyConfessionEntry {
  id: string;
  ownerToken: string;
  createdAt: string;
}

function readAll(): MyConfessionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MyConfessionEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: MyConfessionEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private mode, quota) — the token was
    // already shown to the user directly, so nothing is lost, just not
    // remembered for next visit.
  }
}

export function saveMyConfession(id: string, ownerToken: string): void {
  const withoutExisting = readAll().filter((entry) => entry.id !== id);
  writeAll([...withoutExisting, { id, ownerToken, createdAt: new Date().toISOString() }]);
}

export function getMyConfessionToken(id: string): string | null {
  return readAll().find((entry) => entry.id === id)?.ownerToken ?? null;
}

export function forgetMyConfession(id: string): void {
  writeAll(readAll().filter((entry) => entry.id !== id));
}
