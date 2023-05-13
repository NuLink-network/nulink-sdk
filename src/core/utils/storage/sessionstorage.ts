
/**
 * @internal
 */
export const sessionStore = {
    setItem: async (key: string, value: unknown): Promise<void> => {
        sessionStorage.setItem(key, value as string);
    },

    getItem: async (key: string): Promise<any> => {
        return sessionStorage.getItem(key);
    },
    removeItem: async (key: string): Promise<void> => {
        sessionStorage.removeItem(key);
    },

    removeItems: async (keys: string[]): Promise<void> => {
        for (const key of keys) {
            sessionStorage.removeItem(key);
        }
    },

    clear: async (): Promise<void> => {
        sessionStorage.clear();
    },
};
