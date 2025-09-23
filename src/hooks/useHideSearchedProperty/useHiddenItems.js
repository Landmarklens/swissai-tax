import React, { createContext, useContext, useState } from 'react';

// Create a context
const HiddenItemsContext = createContext();

// Provider component
export const HiddenItemsProvider = ({ children }) => {
  const [hiddenItems, setHiddenItems] = useState([]);

  const hideItem = (id) => {
    setHiddenItems((prev) => [...prev, id]);
  };

  const isItemHidden = (id) => {
    return hiddenItems.includes(id);
  };

  const restoreItem = (id) => {
    setHiddenItems((prev) => prev.filter((itemId) => itemId !== id));
  };

  return (
    <HiddenItemsContext.Provider value={{ hiddenItems, hideItem, isItemHidden, restoreItem }}>
      {children}
    </HiddenItemsContext.Provider>
  );
};

// Custom hook to use the context
export const useHiddenItems = () => useContext(HiddenItemsContext);
