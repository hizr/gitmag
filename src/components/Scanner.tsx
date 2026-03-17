/**
 * ScanProgress — describes the current state of repository loading progress.
 * Used by SplashScreen to display status to the user.
 */
export interface ScanProgress {
  phase: string;
  done: boolean;
}
