import { renderHook, act } from '@testing-library/react';
import { useChatStorage } from './useChatStorage';

const STORAGE_KEY = 'ai_chats';

describe('useChatStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with empty chats when no data in localStorage', () => {
    const { result } = renderHook(() => useChatStorage());

    expect(result.current.chats).toEqual([]);
  });

  it('should initialize with chats from localStorage', () => {
    const existingChats = [
      { id: '1', message: 'Chat 1' },
      { id: '2', message: 'Chat 2' }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingChats));

    const { result } = renderHook(() => useChatStorage());

    expect(result.current.chats).toEqual(existingChats);
  });

  it('should re-initialize when activeChat changes', () => {
    const initialChats = [{ id: '1', message: 'Initial' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialChats));

    const { result, rerender } = renderHook(
      ({ activeChat }) => useChatStorage(activeChat),
      { initialProps: { activeChat: 'chat1' } }
    );

    expect(result.current.chats).toEqual(initialChats);

    // Update localStorage
    const updatedChats = [{ id: '2', message: 'Updated' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));

    // Change activeChat prop
    rerender({ activeChat: 'chat2' });

    expect(result.current.chats).toEqual(updatedChats);
  });

  it('should add a new chat', () => {
    const { result } = renderHook(() => useChatStorage());

    const newChat = { id: '1', message: 'New chat' };

    act(() => {
      result.current.addChat(newChat);
    });

    expect(result.current.chats).toEqual([newChat]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify([newChat]));
  });

  it('should add chat to beginning of list', () => {
    const existingChat = { id: '1', message: 'Existing' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([existingChat]));

    const { result } = renderHook(() => useChatStorage());

    const newChat = { id: '2', message: 'New' };

    act(() => {
      result.current.addChat(newChat);
    });

    expect(result.current.chats).toEqual([newChat, existingChat]);
  });

  it('should update an existing chat', () => {
    const initialChats = [
      { id: '1', message: 'Chat 1', read: false },
      { id: '2', message: 'Chat 2', read: false }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialChats));

    const { result } = renderHook(() => useChatStorage());

    act(() => {
      result.current.updateChat('1', (chat) => ({ ...chat, read: true }));
    });

    expect(result.current.chats[0].read).toBe(true);
    expect(result.current.chats[1].read).toBe(false);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored[0].read).toBe(true);
  });

  it('should not update chat with non-existent id', () => {
    const initialChats = [{ id: '1', message: 'Chat 1' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialChats));

    const { result } = renderHook(() => useChatStorage());

    act(() => {
      result.current.updateChat('999', (chat) => ({ ...chat, message: 'Updated' }));
    });

    expect(result.current.chats).toEqual(initialChats);
  });

  it('should get a chat by id', () => {
    const chats = [
      { id: '1', message: 'Chat 1' },
      { id: '2', message: 'Chat 2' }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));

    const { result } = renderHook(() => useChatStorage());

    const chat = result.current.getChat('2');
    expect(chat).toEqual({ id: '2', message: 'Chat 2' });
  });

  it('should return undefined for non-existent chat id', () => {
    const chats = [{ id: '1', message: 'Chat 1' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));

    const { result } = renderHook(() => useChatStorage());

    const chat = result.current.getChat('999');
    expect(chat).toBeUndefined();
  });

  it('should delete a chat', () => {
    const initialChats = [
      { id: '1', message: 'Chat 1' },
      { id: '2', message: 'Chat 2' },
      { id: '3', message: 'Chat 3' }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialChats));

    const { result } = renderHook(() => useChatStorage());

    act(() => {
      result.current.deleteChat('2');
    });

    expect(result.current.chats).toEqual([
      { id: '1', message: 'Chat 1' },
      { id: '3', message: 'Chat 3' }
    ]);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored).toHaveLength(2);
    expect(stored.find(chat => chat.id === '2')).toBeUndefined();
  });

  it('should handle deleting non-existent chat', () => {
    const initialChats = [{ id: '1', message: 'Chat 1' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialChats));

    const { result } = renderHook(() => useChatStorage());

    act(() => {
      result.current.deleteChat('999');
    });

    expect(result.current.chats).toEqual(initialChats);
  });
});