import { useInput, useApp } from 'ink';

/**
 * Global quit hook that exits the app when 'q' is pressed.
 * Only activates when canQuit is true (i.e., not on the splash screen).
 */
export function useQuit(canQuit: boolean): void {
  const { exit } = useApp();

  // Only set up the input listener if we're allowed to quit
  useInput(
    (input) => {
      if (input === 'q') {
        exit();
      }
    },
    { isActive: canQuit }
  );
}
