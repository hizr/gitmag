import { useEffect, useState } from 'react';

export interface ScanProgress {
  phase: string;
  done: boolean;
}

const SCAN_PHASES: Array<{ ms: number; phase: string }> = [
  { ms: 0, phase: 'Scanning repositories...' },
  { ms: 1250, phase: 'Indexing commits...' },
  { ms: 2500, phase: 'Analyzing activity...' },
  { ms: 3750, phase: 'Preparing digest...' },
  { ms: 6000, phase: 'Finalizing...' },
];

export function useScanner(): ScanProgress {
  const [progress, setProgress] = useState<ScanProgress>({
    phase: SCAN_PHASES[0]!.phase,
    done: false,
  });

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Schedule each phase transition (skip index 0 — it's the initial state)
    for (let i = 1; i < SCAN_PHASES.length; i++) {
      const { ms, phase } = SCAN_PHASES[i]!;
      timers.push(
        setTimeout(() => {
          setProgress((prev) => ({ ...prev, phase }));
        }, ms)
      );
    }

    // Schedule completion
    timers.push(
      setTimeout(
        () => {
          setProgress({ phase: SCAN_PHASES[SCAN_PHASES.length - 1]!.phase, done: true });
        },
        SCAN_PHASES[SCAN_PHASES.length - 1]!.ms + 1000 /* small buffer after final phase */
      )
    );

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, []);

  return progress;
}
