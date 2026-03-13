import { basename } from 'node:path';

/**
 * Truncates a string to maxLength, appending ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Formats a number with a + or - sign prefix for display (e.g. "+42", "-7").
 */
export function formatDelta(n: number, sign: '+' | '-'): string {
  return `${sign}${n.toLocaleString()}`;
}

/**
 * Returns the short name of a repository from its full path.
 */
export function repoName(repoPath: string): string {
  return basename(repoPath);
}

/**
 * Formats a commit count as a readable string.
 */
export function pluralise(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : singular + 's'}`;
}

/**
 * Formats a date string into a short relative label (e.g. "2h ago", "3d ago").
 */
export function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffM = Math.floor(diffMs / 60_000);
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffD < 14) return `${diffD}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
