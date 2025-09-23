import { getLocalStorageUser } from './getLocalStorageUser';

describe('getLocalStorageUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns parsed user object from localStorage', () => {
    const user = { name: 'Alice' };
    const persisted = { account: JSON.stringify(user) };
    localStorage.setItem('persist:root', JSON.stringify(persisted));
    expect(getLocalStorageUser()).toEqual(user);
  });
});
