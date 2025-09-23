import { toQueryParamValue } from './toQueryParamValue';
import { fromQueryParamValue } from './fromQueryParamValue';

describe('query param helpers', () => {
  test('toQueryParamValue trims and encodes string', () => {
    expect(toQueryParamValue(' Hello World ')).toBe('Hello%20World');
  });

  test('toQueryParamValue throws on non-string', () => {
    expect(() => toQueryParamValue(123)).toThrow(TypeError);
  });

  test('fromQueryParamValue decodes string', () => {
    expect(fromQueryParamValue('Hello%20World')).toBe('Hello World');
  });

  test('fromQueryParamValue returns undefined for non-string', () => {
    expect(fromQueryParamValue(null)).toBeUndefined();
  });
});
