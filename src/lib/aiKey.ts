// The user's Claude API key (only on this phone) and AI errors; small, so pages can import it directly.
import { getItem, removeItem, setItem } from './storage';

const KEY_ITEM = 'apiKey';

export function getApiKey(): string | null {
  return getItem(KEY_ITEM);
}

export function setApiKey(key: string) {
  setItem(KEY_ITEM, key.trim());
}

export function clearApiKey() {
  removeItem(KEY_ITEM);
}

export type AiErrorKind = 'noKey' | 'badKey' | 'busy' | 'network' | 'refused' | 'unreadable' | 'other';

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string = kind,
  ) {
    super(message);
  }
}
