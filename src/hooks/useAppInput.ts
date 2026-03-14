import { useInput, useApp } from 'ink';

interface AppInputProps {
  /**
   * Current screen: 'splash' (no input) or 'router' (handle navigation + quit)
   */
  screen: 'splash' | 'router';

  /**
   * Called on arrow-up or 'k' key
   */
  onUp?: () => void;

  /**
   * Called on arrow-down or 'j' key
   */
  onDown?: () => void;

  /**
   * Called on Enter key
   */
  onSelect?: () => void;

  /**
   * Called on Escape key
   */
  onBack?: () => void;
}

/**
 * Centralized keyboard input handler for the entire app.
 * Consolidates:
 * - Global quit ('q') from any screen
 * - Navigation (arrows, j/k) on router screens
 * - Selection (Enter) on router screens
 * - Back (Escape) on router screens
 */
export function useAppInput({ screen, onUp, onDown, onSelect, onBack }: AppInputProps): void {
  const { exit } = useApp();

  useInput(
    (input, key) => {
      // Only handle input on router screens
      if (screen !== 'router') {
        return;
      }

      // Global quit key
      if (input === 'q') {
        exit();
        return;
      }

      // Navigation and selection keys (route-specific)
      if (key.upArrow || input === 'k') {
        onUp?.();
      } else if (key.downArrow || input === 'j') {
        onDown?.();
      } else if (key.return) {
        onSelect?.();
      } else if (key.escape) {
        onBack?.();
      }
    },
    { isActive: screen === 'router' }
  );
}
