import { AndroidBridge } from '../androidbridge';

/**
 * @internal
 */
export const androidStore = {
  setItem: async (key: string, value: unknown): Promise<void> => {
    let _value: string = '';
    try {
      _value = JSON.stringify(value);
    } catch (error) {
      _value = value as string;
    }

    //Note: The app parser does not support backslashes in strings, so it needs to be escaped

    _value = '_inter_encode_' + encodeURIComponent(_value);

    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage('setItem', { key: key, value: _value });
  },

  getItem: async (key: string): Promise<any> => {
    const bridge = AndroidBridge.getInstance();
    const value = await bridge.sendMessage('getItem', { key: key });

    let _value = value;
    if (value.startsWith('_inter_encode_')) {
      _value = decodeURIComponent(value.replace('_inter_encode_', ''));
    }

    try {
      return JSON.parse(_value);
    } catch (error) {
      return _value as string;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage('removeItem', { key: key });
  },

  removeItems: async (keys: string[]): Promise<void> => {
    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage('removeItems', { key: keys });
  },

  clear: async (): Promise<void> => {
    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage('clear', '');
  }
};
