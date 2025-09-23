import { createStringId } from './createIdFromAddress';

describe('createStringId', () => {
  test('converts address to lowercase hyphenated id', () => {
    const id = createStringId(' 123 Main St., #5A ');
    expect(id).toBe('123-main-st-5a');
  });

  test('removes diacritics and special characters', () => {
    const id = createStringId('Áccênted Äddrèss!');
    expect(id).toBe('accented-address');
  });
});
