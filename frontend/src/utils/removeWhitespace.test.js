import { removeWhitespace } from './removeWhitespace';

describe('removeWhitespace', () => {
  test('removes all whitespace characters', () => {
    expect(removeWhitespace(' a b  c ')).toBe('abc');
  });

  test('returns empty string for non-string', () => {
    expect(removeWhitespace(123)).toBe('');
  });
});
