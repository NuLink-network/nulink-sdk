import { getGlobalThis } from '@offirmo/globalthis-ponyfill'

/**
 * @internal
 */
//TODO: now for testing
export const androidStore =  {
  setItem: async (key: string, value: unknown): Promise<void> => {

    const globalThis = getGlobalThis();

    if(globalThis.nulink == null || typeof globalThis.nulink === 'undefined')
    {
        globalThis.nulink = {}
    }
    
    globalThis.nulink[key] = value as string;

  },

  getItem: async (key: string): Promise<any> => {

    const globalThis = getGlobalThis();
    
    if(globalThis != null && typeof globalThis === 'undefined' && (globalThis as any).nulink != null && typeof  (globalThis as any).nulink !== 'undefined')
    {
      return (globalThis as any).nulink[key];
    }
    return null;    
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const globalThis = getGlobalThis();

      if(globalThis.nulink == null || typeof globalThis.nulink === 'undefined')
      {
          globalThis.nulink = {}
      }

      globalThis.nulink[key] = undefined;

      //delete globalThis.nulink[key]

      //localStorage.removeItem(key);

    } catch (error) {
      console.info(`removeItem: ${key}`);
    }
  },

  removeItems: async (keys: string[]): Promise<void> => {
    if(globalThis.nulink == null || typeof globalThis.nulink === 'undefined')
      {
          globalThis.nulink = {}
      }

    for (const key of keys) {
      globalThis.nulink[key] = undefined;
      //localStorage.removeItem(key);
    }
  },

  clear: async (): Promise<void> => {
    globalThis.nulink = {}
  },
};
