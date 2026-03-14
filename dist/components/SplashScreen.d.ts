import type { ScanProgress } from '../Scanner.js';
interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
  scanProgress: ScanProgress;
}
export declare function SplashScreen({
  onComplete,
  duration,
  scanProgress,
}: SplashScreenProps): import('react/jsx-runtime').JSX.Element;
export {};
//# sourceMappingURL=SplashScreen.d.ts.map
