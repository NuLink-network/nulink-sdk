import { AndroidBridge } from './androidbridge';
/**
 * @internal
 */
export const AndroidMessage = {
  info: async (messageInfo: string): Promise<void> => {
    let _value: string = '';
    try {
      _value = JSON.stringify(messageInfo);
    } catch (error) {
      _value = messageInfo as string;
    }

    //Note: The app parser does not support backslashes in strings, so it needs to be escaped

    _value = '_inter_encode_' + encodeURIComponent(_value);

    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage('message', { en: messageInfo});
  }
}