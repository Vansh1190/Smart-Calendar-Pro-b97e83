import { useState, useEffect } from "react";

/**
 * Custom hook for simplified local storage operations
 * @param {string} key - The key to use in localStorage
 * @param {any} initialValue - The initial value if the key doesn't exist in localStorage
 * @returns {Array} - [storedValue, setValue] tuple similar to useState
 */
const useLocalStorage = (key, initialValue) => {
  // State to store our value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage key", key, ":", error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch an event so other components using the same key can stay in sync
      window.dispatchEvent(new Event("local-storage"));
    } catch (error) {
      console.error("Error setting localStorage key", key, ":", error);
    }
  };

  // Listen for changes to this localStorage key in other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error("Error reading localStorage on storage event:", error);
      }
    };

    // Listen for the custom event we dispatch
    window.addEventListener("local-storage", handleStorageChange);
    
    // Also listen for actual localStorage changes from other tabs/windows
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        handleStorageChange();
      }
    });

    return () => {
      window.removeEventListener("local-storage", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
};

/**
 * Enhanced version that allows syncing between components without browser storage events
 * @param {string} key - The key to use in localStorage
 * @param {any} initialValue - The initial value if the key doesn't exist in localStorage
 * @param {Object} options - Additional options
 * @param {boolean} options.sessionOnly - If true, use sessionStorage instead of localStorage
 * @param {number} options.expiresIn - Time in milliseconds until the stored data expires
 * @returns {Array} - [storedValue, setValue, removeValue] tuple
 */
export const useStorage = (key, initialValue, options = {}) => {
  const storage = options.sessionOnly ? window.sessionStorage : window.localStorage;

  // Get stored value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = storage.getItem(key);
      
      // Check if the item has expired
      if (item) {
        const parsedItem = JSON.parse(item);
        if (parsedItem.__expiresAt && parsedItem.__expiresAt < Date.now()) {
          storage.removeItem(key);
          return initialValue;
        }
        
        // Return the data portion if it exists
        return parsedItem.__data !== undefined ? parsedItem.__data : parsedItem;
      }
      
      return initialValue;
    } catch (error) {
      console.error("Error reading from storage:", error);
      return initialValue;
    }
  });

  // Set the value in storage
  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // If expiration is set, wrap in object with expiration
      const itemToStore = options.expiresIn
        ? {
            __data: valueToStore,
            __expiresAt: Date.now() + options.expiresIn
          }
        : valueToStore;
      
      // Save state and storage
      setStoredValue(valueToStore);
      storage.setItem(key, JSON.stringify(itemToStore));
      
      // Dispatch events
      window.dispatchEvent(
        new CustomEvent("local-storage-change", { detail: { key, value: valueToStore } })
      );
    } catch (error) {
      console.error("Error setting storage value:", error);
    }
  };

  // Remove the item from storage
  const removeValue = () => {
    try {
      storage.removeItem(key);
      setStoredValue(initialValue);
      
      window.dispatchEvent(
        new CustomEvent("local-storage-change", { 
          detail: { key, value: undefined, removed: true } 
        })
      );
    } catch (error) {
      console.error("Error removing storage value:", error);
    }
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Handle custom event
      if (e.detail && e.detail.key === key) {
        if (e.detail.removed) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(e.detail.value);
        }
        return;
      }
      
      // Handle native storage event
      if (e.key === key) {
        try {
          const item = storage.getItem(key);
          if (item) {
            const parsedItem = JSON.parse(item);
            setStoredValue(parsedItem.__data !== undefined ? parsedItem.__data : parsedItem);
          } else {
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.error("Error reading from storage in event handler:", error);
        }
      }
    };

    window.addEventListener("local-storage-change", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("local-storage-change", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue, storage]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;