import { numberFormatter } from './index';

describe('numberFormatter', () => {
  test('formats number with commas', () => {
    expect(numberFormatter(1234567)).toBe('1,234,567');
  });

  test('returns null for falsy values', () => {
    expect(numberFormatter(0)).toBeNull();
    expect(numberFormatter(undefined)).toBeNull();
  });
});
