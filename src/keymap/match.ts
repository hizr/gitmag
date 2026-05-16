import type { Key } from 'ink';
import type { AppKeymap, KeyActionId } from './types.js';

function normalizeInputToken(input: string): string | null {
  if (!input) return null;
  if (input === ' ') return 'space';
  return input;
}

function keyTokenPressed(token: string, key: Key): boolean {
  switch (token) {
    case 'up':
      return Boolean(key.upArrow);
    case 'down':
      return Boolean(key.downArrow);
    case 'left':
      return Boolean(key.leftArrow);
    case 'right':
      return Boolean(key.rightArrow);
    case 'enter':
    case 'return':
      return Boolean(key.return);
    case 'esc':
    case 'escape':
      return Boolean(key.escape);
    case 'backspace':
      return Boolean(key.backspace);
    case 'delete':
      return Boolean(key.delete);
    case 'tab':
      return Boolean(key.tab);
    default:
      return false;
  }
}

export function isActionPressed(
  keymap: AppKeymap,
  action: KeyActionId,
  input: string,
  key: Key
): boolean {
  const bindings = keymap.bindings[action] ?? [];
  const inputToken = normalizeInputToken(input);

  return bindings.some((token) => {
    if (inputToken !== null && token === inputToken) return true;
    return keyTokenPressed(token, key);
  });
}
