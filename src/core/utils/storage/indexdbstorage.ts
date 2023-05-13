// import {indexDBCache, createIndexDBCache} from '@void-cache/indexdb'
//https://www.npmjs.com/package/@void-cache/indexdb

/**
 * @internal
 */
export const indexdbStore = {
  setItem: async (key: string, value: unknown): Promise<void> => {
    const { indexDBCache } = await import("@void-cache/indexdb");
    await indexDBCache.set(key, value as string);
  },

  getItem: async (key: string): Promise<any> => {
    const { indexDBCache } = await import("@void-cache/indexdb");
    return await indexDBCache.get(key);
  },

  removeItem: async (key: string): Promise<void> => {
    const { indexDBCache } = await import("@void-cache/indexdb");
    if (await indexDBCache.has(key)) {
      try {
        await indexDBCache.remove(key);
      } catch (error) {
        console.info(`removeItem: ${key}`);
      }
    }
  },

  removeItems: async (keys: string[]): Promise<void> => {
    for (const key of keys) {
      await indexdbStore.removeItem(key);
    }
  },

  clear: async (): Promise<void> => {
    const { indexDBCache } = await import("@void-cache/indexdb");
    await indexDBCache.clear();
  },
};
