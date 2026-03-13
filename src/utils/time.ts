const DURATION_RE = /^(\d+)\s*(s|m|h|d|w)$/i;

const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Parses a human-readable duration string into milliseconds.
 * Accepted formats: "1h", "24h", "7d", "2w", "30m", "90s"
 */
export function parseDuration(input: string): number {
  const match = DURATION_RE.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration: "${input}". Use formats like 1h, 24h, 7d, 2w.`);
  }
  const value = parseInt(match[1]!, 10);
  const unit = match[2]!.toLowerCase();
  return value * (UNIT_MS[unit] ?? 0);
}

/**
 * Calculates the start of the display time window.
 *
 * Rules:
 *  - If sinceOverride is provided, use it exactly (no floor).
 *  - Otherwise, use max(lastRun, now - 24h) to enforce a 24h minimum.
 *  - On first run (no lastRun), default to now - 7d.
 */
export function getTimeWindowStart(now: Date, lastRun: Date | null, sinceOverride?: string): Date {
  if (sinceOverride) {
    const ms = parseDuration(sinceOverride);
    return new Date(now.getTime() - ms);
  }

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1_000);

  if (!lastRun) {
    // First run — default to 7 days
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000);
  }

  // Enforce 24h minimum: if lastRun was more recent than 24h ago, still show 24h
  return lastRun < twentyFourHoursAgo ? lastRun : twentyFourHoursAgo;
}

/**
 * Returns a human-readable label for a time window start.
 */
export function formatTimeWindow(from: Date, to: Date): string {
  const diffMs = to.getTime() - from.getTime();
  const diffH = Math.round(diffMs / 3_600_000);

  if (diffH < 24) return `last ${diffH}h`;
  const diffD = Math.round(diffMs / 86_400_000);
  if (diffD < 14) return `last ${diffD}d`;
  const diffW = Math.round(diffMs / 604_800_000);
  return `last ${diffW}w`;
}
