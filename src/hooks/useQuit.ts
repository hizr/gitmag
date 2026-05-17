import { useInput, useApp } from 'ink';
import type { Key } from 'ink';
import { useCallback } from 'react';
import { DEFAULT_KEYMAP } from '../keymap/default-keymap.js';
import { isActionPressed } from '../keymap/match.js';
import { KEY_ACTION, type AppKeymap } from '../keymap/types.js';

/**
 * Global quit hook that exits the app when 'q' is pressed.
 * Only activates when canQuit is true (i.e., not on the splash screen).
 */
export function useQuit(canQuit: boolean, keymap: AppKeymap = DEFAULT_KEYMAP): void {
  const { exit } = useApp();

  // Only set up the input listener if we're allowed to quit
  const handleInput = useCallback(
    (input: string, key: Key) => {
      if (!canQuit) {
        return;
      }

      if (isActionPressed(keymap, KEY_ACTION.quit, input, key)) {
        exit();
      }
    },
    [canQuit, exit, keymap]
  );

  useInput(handleInput, { isActive: canQuit });
}
