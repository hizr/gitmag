import { useInput, useApp } from 'ink';

/**
 * Global quit hook that exits the app when 'q' is pressed.
 * Only active when not on the splash screen.
 */
export function useQuit(): void {
  const { exit } = useApp();

  useInput((input) => {
    if (input === 'q') {
      exit();
    }
  });
}
