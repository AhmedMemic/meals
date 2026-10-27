// localStorage is shared with other apps on this origin: every key gets the "meals:" prefix.
const PREFIX = 'meals:';

export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // Storage blocked: the app still works, only the reminder is lost.
  }
}
