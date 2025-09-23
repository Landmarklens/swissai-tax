import { capitalizeFirstLetter } from './capitalizeFirstLetter';

describe('capitalizeFirstLetter', () => {
  it('should capitalize the first letter of a lowercase string', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello');
  });

  it('should capitalize the first letter of an all lowercase string', () => {
    expect(capitalizeFirstLetter('hello world')).toBe('Hello world');
  });

  it('should not change an already capitalized string', () => {
    expect(capitalizeFirstLetter('Hello')).toBe('Hello');
  });

  it('should handle all uppercase strings', () => {
    expect(capitalizeFirstLetter('HELLO')).toBe('HELLO');
  });

  it('should handle mixed case strings', () => {
    expect(capitalizeFirstLetter('hELLO')).toBe('HELLO');
  });

  it('should handle single character strings', () => {
    expect(capitalizeFirstLetter('a')).toBe('A');
    expect(capitalizeFirstLetter('Z')).toBe('Z');
  });

  it('should handle strings starting with numbers', () => {
    expect(capitalizeFirstLetter('123hello')).toBe('123hello');
  });

  it('should handle strings starting with special characters', () => {
    expect(capitalizeFirstLetter('!hello')).toBe('!hello');
    expect(capitalizeFirstLetter('@world')).toBe('@world');
  });

  it('should handle strings with spaces at the beginning', () => {
    expect(capitalizeFirstLetter(' hello')).toBe(' hello');
  });

  it('should return empty string for empty input', () => {
    expect(capitalizeFirstLetter('')).toBe('');
  });

  it('should return null for null input', () => {
    expect(capitalizeFirstLetter(null)).toBe(null);
  });

  it('should return undefined for undefined input', () => {
    expect(capitalizeFirstLetter(undefined)).toBe(undefined);
  });

  it('should handle non-string falsy values', () => {
    expect(capitalizeFirstLetter(0)).toBe(0);
    expect(capitalizeFirstLetter(false)).toBe(false);
  });
});