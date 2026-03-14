import { useEffect, useRef } from 'react';

interface CompletionGateProps {
  animationDone: boolean;
  scanDone: boolean;
  onComplete: () => void;
}

/**
 * Custom hook that calls onComplete only when both animationDone AND scanDone are true.
 * This encapsulates the gating logic so it can be tested separately from Ink rendering.
 */
export function useCompletionGate({
  animationDone,
  scanDone,
  onComplete,
}: CompletionGateProps): void {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (animationDone && scanDone) {
      onCompleteRef.current();
    }
  }, [animationDone, scanDone]);
}
