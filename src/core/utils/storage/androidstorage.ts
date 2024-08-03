import { getGlobalThis } from '@offirmo/globalthis-ponyfill';
import SingletonService from 'singleton-service';
// import { SnowflakeIdv1 } from "simple-flakeid"
import { nanoid } from 'nanoid'; //https://cloud.tencent.com/developer/article/1743958
import { isBlank } from '../null';

const ANDROIDBRIDGE_INSTANCE_NAME = 'android_bridge';

// let gen1 = new SnowflakeIdv1({ workerId: 1 })

/**
 * @internal
 */
class AndroidBridge {
  private constructor() {}

  public static getInstance(): AndroidBridge {
    if (isBlank(SingletonService.get<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}`))) {
      SingletonService.set<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}`, new AndroidBridge(), true);
    }

    return SingletonService.get<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}`);
  }

  public sendMessage(method: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const thisId = nanoid();
      const messageData = {
        id: thisId,
        method,
        data: data
      };

      // console.log("before window.__JSHOST.postMessage ");
      const globalThis = getGlobalThis();

      globalThis.__JSHOST.postMessage(JSON.stringify(messageData));
      
      //(window as any).__JSHOST.postMessage(JSON.stringify(messageData));
      console.log("after window.__JSHOST. postMessage: " + JSON.stringify(messageData));

      // Registering a one-time message handler
      const messageHandler = (id: string, receivedMethod: string, receivedData: any) => {
        console.log("postmessage message callback: " + receivedMethod + " method: " + method + " receive id: " + id + "  origin id: " + thisId + " receivedData: ", receivedData);
        if (receivedMethod.toLowerCase() === method.toLowerCase() && id.toLowerCase() == thisId.toLowerCase()) {
          resolve(receivedData);
        }
        else{
          console.log("Missing message callback: " + receivedMethod + " method: " + method + " receive id: " + id + "  origin id: " + thisId + " receivedData: ", receivedData);
        }
        
      };
      this.registerMessageHandler(messageHandler);
    });
  }

  private registerMessageHandler(callback: (id: string, method: string, data: any) => void): void {
    const globalThis = getGlobalThis();

    globalThis.__jMessage = (id: string, method: string, data: string) => {
    // (window as any).__jMessage = (id: string, method: string, data: string) => {

      console.log("registerMessageHandler get __jMessage origin message: " + method + " data: " + data);

      let _data = {};
      try {
        _data = JSON.parse(data)
      } catch (error) {
        _data = data as string;
      }
      callback(id, method, _data);
    };
  }
}

/**
 * @internal
 */
export const androidStore = {
  setItem: async (key: string, value: unknown): Promise<void> => {
    let _value: string = "";
    try {
      _value = JSON.stringify(value)
    } catch (error) {
      _value = value as string;
    }

    //Note: The app parser does not support backslashes in strings, so it needs to be escaped

    _value = "_inter_encode_" + encodeURIComponent(_value);

    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage("setItem", {"key": key, "value": _value});

  },

  getItem: async (key: string): Promise<any> => {

    const bridge = AndroidBridge.getInstance();
    const value = await bridge.sendMessage("getItem", {"key": key});

    let _value = value;
    if(value.startsWith("_inter_encode_"))
    {
      _value = decodeURIComponent(value.replace("_inter_encode_", ""));
    }

    try {
      return JSON.parse(_value)
    } catch (error) {
      return _value as string;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage("removeItem", {"key": key});
  },

  removeItems: async (keys: string[]): Promise<void> => {
    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage("removeItems", {"key": keys});
  },

  clear: async (): Promise<void> => {
    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage("clear", "");
  }
};
