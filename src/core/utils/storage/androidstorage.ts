import { getGlobalThis } from '@offirmo/globalthis-ponyfill';
import SingletonService from 'singleton-service';
// import { SnowflakeIdv1 } from "simple-flakeid"
import { nanoid } from 'nanoid'; //https://cloud.tencent.com/developer/article/1743958

const ANDROIDBRIDGE_INSTANCE_NAME = 'android_bridge';

// let gen1 = new SnowflakeIdv1({ workerId: 1 })

/**
 * @internal
 */
class AndroidBridge {
  private constructor() {}

  public static getInstance(): AndroidBridge {
    if (!SingletonService.get<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}`)) {
      SingletonService.set<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}}`, new AndroidBridge(), true);
    }

    return SingletonService.get<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}`);
  }

  public sendMessage(method: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const thisId = nanoid();
      const messageData = {
        id: thisId,
        method,
        data: JSON.stringify(data)
      };

      const globalThis = getGlobalThis();

      globalThis.__JSHOST.postMessage(JSON.stringify(messageData));

      // Registering a one-time message handler
      const messageHandler = (id: string, receivedMethod: string, receivedData: any) => {
        if (receivedMethod === method && id == thisId) {
          resolve(receivedData);
        }
        else{
          console.log("Missing message callback: " + receivedMethod + "method: " + method + " receive id: " + id + "  origin id: " + thisId + " receivedData: " + receivedData);
        }
        
      };
      this.registerMessageHandler(messageHandler);
    });
  }

  private registerMessageHandler(callback: (id: string, method: string, data: any) => void): void {
    const globalThis = getGlobalThis();

    globalThis.__jMessage = (id: string, method: string, data: string) => {
      
      console.log("__jMessage origin message: " + method + " data: " + data);

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
    const bridge = AndroidBridge.getInstance();
    await bridge.sendMessage("setItem", {"key": key, "value": _value});

  },

  getItem: async (key: string): Promise<any> => {

    const bridge = AndroidBridge.getInstance();
    const value = await bridge.sendMessage("getItem", {"key": key});

    try {
      return JSON.parse(value)
    } catch (error) {
      return value as string;
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
