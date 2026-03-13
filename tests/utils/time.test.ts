import { describe, it, expect } from 'vitest';
import { parseDuration, getTimeWindowStart } from '../../src/utils/time.js';

describe('parseDuration', () => {
  it('parses hours', () => {
    expect(parseDuration('1h')).toBe(3_600_000);
    expect(parseDuration('24h')).toBe(86_400_000);
  });

  it('parses days', () => {
    expect(parseDuration('1d')).toBe(86_400_000);
    expect(parseDuration('7d')).toBe(604_800_000);
  });

  it('parses weeks', () => {
    expect(parseDuration('1w')).toBe(604_800_000);
    expect(parseDuration('2w')).toBe(1_209_600_000);
  });

  it('parses minutes', () => {
    expect(parseDuration('30m')).toBe(1_800_000);
  });

  it('parses seconds', () => {
    expect(parseDuration('90s')).toBe(90_000);
  });

  it('is case-insensitive', () => {
    expect(parseDuration('1H')).toBe(3_600_000);
    expect(parseDuration('2D')).toBe(172_800_000);
  });

  it('throws on invalid format', () => {
    expect(() => parseDuration('bad')).toThrow('Invalid duration');
    expect(() => parseDuration('1x')).toThrow('Invalid duration');
    expect(() => parseDuration('')).toThrow('Invalid duration');
  });
});

describe('getTimeWindowStart', () => {
  const now = new Date('2026-03-13T12:00:00Z');
  const twentyFourHoursAgo = new Date('2026-03-12T12:00:00Z');

  it('uses sinceOverride exactly, ignoring lastRun', () => {
    const lastRun = new Date('2026-03-13T11:55:00Z'); // 5 min ago
    const result = getTimeWindowStart(now, lastRun, '1h');
    expect(result).toEqual(new Date('2026-03-13T11:00:00Z'));
  });

  it('defaults to 7d on first run (no lastRun)', () => {
    const result = getTimeWindowStart(now, null);
    const sevenDaysAgo = new Date('2026-03-06T12:00:00Z');
    expect(result).toEqual(sevenDaysAgo);
  });

  it('enforces 24h minimum when lastRun was recent', () => {
    const recentLastRun = new Date('2026-03-13T11:55:00Z'); // 5 min ago
    const result = getTimeWindowStart(now, recentLastRun);
    expect(result).toEqual(twentyFourHoursAgo);
  });

  it('uses lastRun when it is older than 24h', () => {
    const oldLastRun = new Date('2026-03-10T12:00:00Z'); // 3 days ago
    const result = getTimeWindowStart(now, oldLastRun);
    expect(result).toEqual(oldLastRun);
  });

  it('uses exactly 24h ago when lastRun equals 24h ago', () => {
    const result = getTimeWindowStart(now, twentyFourHoursAgo);
    expect(result).toEqual(twentyFourHoursAgo);
  });

  it('sinceOverride can be shorter than 24h', () => {
    const result = getTimeWindowStart(now, null, '1h');
    expect(result).toEqual(new Date('2026-03-13T11:00:00Z'));
  });
});
