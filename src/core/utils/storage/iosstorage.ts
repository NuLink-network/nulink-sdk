

/**
 * @internal
 */
//TODO: 
export const iosStore =  {

  setItem: async (key: string, value: unknown): Promise<void> => {
    let _value: string = '';
    try {
      _value = JSON.stringify(value);
    } catch (error) {
      _value = value as string;
    }
    localStorage.setItem(key, _value as string);
  },

  getItem: async (key: string): Promise<any> => {
    let value = localStorage.getItem(key);

    if (value === null) {
      return null;
    }

    value = value as string;
    try {
      return JSON.parse(value);
    } catch (error) {
      return value as string;
    }
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
