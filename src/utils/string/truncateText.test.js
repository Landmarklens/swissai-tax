import { truncateText } from './truncateText';

describe('truncateText', () => {
  it('should return text unchanged if shorter than maxLength', () => {
    expect(truncateText('Hello', 10)).toBe('Hello');
    expect(truncateText('Short text', 20)).toBe('Short text');
  });

  it('should return text unchanged if equal to maxLength', () => {
    expect(truncateText('Hello', 5)).toBe('Hello');
    expect(truncateText('Exact length', 12)).toBe('Exact length');
  });

  it('should truncate text longer than maxLength and add ellipsis', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
    expect(truncateText('This is a long text', 10)).toBe('This is a...');
  });

  it('should trim trailing spaces before adding ellipsis', () => {
    expect(truncateText('Hello World   ', 6)).toBe('Hello...');
    expect(truncateText('Test   spaces   ', 7)).toBe('Test...');
  });

  it('should handle very short maxLength', () => {
    expect(truncateText('Hello', 1)).toBe('H...');
    expect(truncateText('Test', 2)).toBe('Te...');
  });

  it('should handle maxLength of 0', () => {
    expect(truncateText('Hello', 0)).toBe('...');
  });

  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('');
    expect(truncateText('', 0)).toBe('');
  });

  it('should return empty string for non-string inputs', () => {
    expect(truncateText(null, 10)).toBe('');
    expect(truncateText(undefined, 10)).toBe('');
    expect(truncateText(123, 10)).toBe('');
    expect(truncateText({}, 10)).toBe('');
    expect(truncateText([], 10)).toBe('');
    expect(truncateText(true, 10)).toBe('');
  });

  it('should handle strings with only spaces', () => {
    expect(truncateText('     ', 3)).toBe('...');
    expect(truncateText('     ', 10)).toBe('     ');
  });

  it('should handle unicode characters correctly', () => {
    // Note: slice() doesn't handle multi-byte Unicode properly, so emoji may be cut
    const result1 = truncateText('Hello 👋 World', 7);
    expect(result1.endsWith('...')).toBe(true);
    expect(result1.length).toBeLessThanOrEqual(10); // 7 + '...'
    
    const result2 = truncateText('émojis 🎉🎊🎈', 8);
    expect(result2.endsWith('...')).toBe(true);
    expect(result2.startsWith('émojis')).toBe(true);
  });

  it('should handle multi-line text', () => {
    expect(truncateText('Line 1\nLine 2', 6)).toBe('Line 1...');
    expect(truncateText('First\nSecond\nThird', 12)).toBe('First\nSecond...');
  });

  it('should handle text with multiple consecutive spaces', () => {
    expect(truncateText('Hello    World', 8)).toBe('Hello...');
  });

  it('should handle negative maxLength', () => {
    expect(truncateText('Hello', -5)).toBe('...');
  });

  it('should handle fractional maxLength', () => {
    expect(truncateText('Hello World', 5.7)).toBe('Hello...');
  });
});