import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'ai_chats';

export const  useChatStorage = (activeChat) => {
  const { t } = useTranslation();
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setChats(JSON.parse(stored));
    }
  }, [activeChat]);

  const saveChats = (updatedChats) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedChats));
    setChats(updatedChats);
  };

  const addChat = (chat) => {
    const newChats = [chat, ...chats];
    saveChats(newChats);
  };

  const updateChat = (chatId, updaterFn) => {
    const updated = chats.map((chat) => (chat.id === chatId ? updaterFn(chat) : chat));
    saveChats(updated);
  };

  const getChat = (chatId) => {
    return chats.find((chat) => chat.id === chatId);
  };

  const deleteChat = (chatId) => {
    const updated = chats.filter((chat) => chat.id !== chatId);
    saveChats(updated);
  };

  return {
    chats,
    addChat,
    updateChat,
    getChat,
    deleteChat
  };
};
