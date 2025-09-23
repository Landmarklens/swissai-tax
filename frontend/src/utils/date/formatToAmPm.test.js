import { formatToAmPm } from './formatToAmPm';

describe('formatToAmPm', () => {
  it('should format morning times correctly', () => {
    expect(formatToAmPm('2024-01-01T09:30:00Z')).toBe('09:30 AM');
    expect(formatToAmPm('2024-01-01T11:45:00Z')).toBe('11:45 AM');
  });

  it('should format afternoon times correctly', () => {
    expect(formatToAmPm('2024-01-01T13:30:00Z')).toBe('01:30 PM');
    expect(formatToAmPm('2024-01-01T17:45:00Z')).toBe('05:45 PM');
    expect(formatToAmPm('2024-01-01T23:59:00Z')).toBe('11:59 PM');
  });

  it('should handle midnight correctly', () => {
    expect(formatToAmPm('2024-01-01T00:00:00Z')).toBe('12:00 AM');
    expect(formatToAmPm('2024-01-01T00:30:00Z')).toBe('12:30 AM');
  });

  it('should handle noon correctly', () => {
    expect(formatToAmPm('2024-01-01T12:00:00Z')).toBe('12:00 PM');
    expect(formatToAmPm('2024-01-01T12:30:00Z')).toBe('12:30 PM');
  });

  it('should handle single digit hours', () => {
    expect(formatToAmPm('2024-01-01T01:05:00Z')).toBe('01:05 AM');
    expect(formatToAmPm('2024-01-01T09:05:00Z')).toBe('09:05 AM');
  });

  it('should handle single digit minutes', () => {
    expect(formatToAmPm('2024-01-01T10:05:00Z')).toBe('10:05 AM');
    expect(formatToAmPm('2024-01-01T15:09:00Z')).toBe('03:09 PM');
  });

  it('should handle different date formats', () => {
    expect(formatToAmPm('2024-01-01T14:30:00.000Z')).toBe('02:30 PM');
    expect(formatToAmPm('2024-12-31T22:45:30.123Z')).toBe('10:45 PM');
  });

  it('should handle dates without timezone indicator', () => {
    // Note: This will be interpreted in local timezone, results may vary
    const result = formatToAmPm('2024-01-01T14:30:00');
    expect(result).toMatch(/\d{2}:\d{2} (AM|PM)/);
  });

  it('should handle edge cases at day boundaries', () => {
    expect(formatToAmPm('2024-01-01T23:59:59Z')).toBe('11:59 PM');
    expect(formatToAmPm('2024-01-02T00:00:01Z')).toBe('12:00 AM');
  });

  it('should handle invalid date strings', () => {
    expect(formatToAmPm('invalid-date')).toBe('Invalid Date');
    expect(formatToAmPm('')).toBe('Invalid Date');
  });

  it('should handle numeric timestamps', () => {
    // January 1, 2024, 14:30:00 UTC
    const timestamp = new Date('2024-01-01T14:30:00Z').getTime();
    expect(formatToAmPm(timestamp)).toBe('02:30 PM');
  });

  it('should handle Date objects', () => {
    const date = new Date('2024-01-01T16:45:00Z');
    expect(formatToAmPm(date)).toBe('04:45 PM');
  });
});