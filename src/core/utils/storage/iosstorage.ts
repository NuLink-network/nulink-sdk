

/**
 * @internal
 */
//TODO: 
export const iosStore =  {
  setItem: async (key: string, value: unknown): Promise<void> => {
    localStorage.setItem(key, value as string);
  },

  getItem: async (key: string): Promise<any> => {
    return localStorage.getItem(key);
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.info(`removeItem: ${key} failed`);
    }
  },

  removeItems: async (keys: string[]): Promise<void> => {
    for (const key of keys) {
      localStorage.removeItem(key);
    }
  },

  clear: async (): Promise<void> => {
    localStorage.clear();
  },
};
