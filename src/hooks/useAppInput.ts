import { useInput, useApp } from 'ink';

interface AppInputProps {
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
   * Called on Backspace or Delete key
   */
  onBack?: () => void;

  /**
   * Called on Tab key — used to cycle focus between panels
   */
  onTab?: () => void;
}

/**
 * Centralized keyboard input handler for the entire app.
 * Consolidates:
 * - Global quit ('q') from any screen
 * - Navigation (arrows, j/k) on router screens
 * - Selection (Enter) on router screens
 * - Back (Backspace/Delete) on router screens
 */
export function useAppInput({ onUp, onDown, onSelect, onBack, onTab }: AppInputProps): void {
  const { exit } = useApp();

  useInput(
    (input, key) => {
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
      } else if (key.backspace || key.delete) {
        onBack?.();
      } else if (key.tab) {
        onTab?.();
      }
    },
    { isActive: true }
  );
}
