import { getCurrencySymbol } from './currencyMapping';

describe('getCurrencySymbol', () => {
  test('returns mapped symbol when available', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  test('returns input if symbol missing', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });
});
