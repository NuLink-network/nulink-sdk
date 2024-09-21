import { getGlobalThis } from '@offirmo/globalthis-ponyfill';
import SingletonService from 'singleton-service';
// import { SnowflakeIdv1 } from "simple-flakeid"
import { nanoid } from 'nanoid'; //https://cloud.tencent.com/developer/article/1743958
import { isBlank } from './null';

const ANDROIDBRIDGE_INSTANCE_NAME = 'android_bridge';

// let gen1 = new SnowflakeIdv1({ workerId: 1 })

/**
 * @internal
 */
export type AsyncMessageHandler = (data: string | any) => Promise<any>;

/**
 * @internal
 */
const asyncMessageHandler = {};

/**
 * @internal
 * All messages for communication with the Android/iOS app are registered through this function.
 * Note that all registered functions must return a JSON object.
 */
export const registerOnAppMessageHandler = async (method: string, asyncCallFackFunction: AsyncMessageHandler) => {
  asyncMessageHandler[method.toLowerCase()] = asyncCallFackFunction;
};

// Create an object to store pending Promises for sendMessage
const pendingPromises: { [key: string]: (response: any) => void } = {};

/**
 * @internal
 */
export class AndroidBridge {
  private constructor() {}

  public static getInstance(): AndroidBridge {
    if (isBlank(SingletonService.get<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}`))) {
      SingletonService.set<AndroidBridge>(`${ANDROIDBRIDGE_INSTANCE_NAME}`, new AndroidBridge(), true);
    }

    this.initialize();

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

      // // Registering a one-time message handler
      // const messageHandler = (id: string, receivedMethod: string, receivedData: any) => {
      //   if (receivedMethod.toLowerCase() === method.toLowerCase() && id.toLowerCase() == thisId.toLowerCase()) {
      //     //console.log("postmessage message callback: " + receivedMethod + " method: " + method + " receive id: " + id + "  origin id: " + thisId + " receivedData: ", receivedData);
      //     resolve(receivedData);
      //   } else {
      //     console.log("Missing message callback: " + receivedMethod + " method: " + method + " receive id: " + id + "  origin id: " + thisId + " receivedData: ", receivedData);
      //   }
      // };
      // this.registerMessageHandler(messageHandler);

      const responseId = `${thisId.toLowerCase()}_${method.toLowerCase()}`;
      //register the callback function (`resolve`) to receive the response
      pendingPromises[responseId] = resolve; // Store the `resolve` function.

      globalThis.__JSHOST.postMessage(JSON.stringify(messageData));

      //(window as any).__JSHOST.postMessage(JSON.stringify(messageData));
      // console.log("after window.__JSHOST. postMessage: " + JSON.stringify(messageData));
    });
  }

  // private registerMessageHandler(callback: (id: string, method: string, data: any) => void): void {
  //   const globalThis = getGlobalThis();

  //   //Note: The Android side can directly send messages to me via __jMessage.
  //   globalThis.__jMessage = (id: string, method: string, data: string) => {
  //   // (window as any).__jMessage = (id: string, method: string, data: string) => {

  //     // console.log("registerMessageHandler get __jMessage origin message: " + method + " data: " + data);

  //     let _data = {};
  //     try {
  //       _data = JSON.parse(data)
  //     } catch (error) {
  //       _data = data as string;
  //     }
  //     callback(id, method, _data);
  //   };
  // }

  private static ensureJsonObject(obj: any): any {
    return Object.assign({ code: 0, msg: 'success' }, obj);
  }
  private static messageHandler(id: string, method: string, data: any): void {
    let _data = {};
    try {
      _data = JSON.parse(data);
    } catch (error) {
      _data = data as string;
    }

    const lowerMethod = method.toLowerCase();
    const responseId = `${id.toLowerCase()}_${lowerMethod}`;
    // If there is a corresponding Promise, call resolve.
    if (!isBlank(pendingPromises[responseId])) {
      pendingPromises[responseId](_data);
      delete pendingPromises[responseId]; // Clean up the processed Promise.
    } else {
      //Messages sent proactively from the Android side.
      console.log(
        `messageHandler: Messages sent proactively from the Android side:  id-> ${id} method: ${method}, data:`,
        data
      );

      if (Object.prototype.hasOwnProperty.call(asyncMessageHandler, lowerMethod)) {
        const f = asyncMessageHandler[lowerMethod];
        try {
          f(_data)
            .then((response: any) => {
              response = AndroidBridge.ensureJsonObject(response);

              //Return the request result to the app side.
              // Note:response must be JSON object
              console.log(`messageHandler method ${method} call success:`, response);

              return new Promise((resolve, reject) => {
                const messageData = {
                  id: id,
                  method,
                  data: response
                };

                const globalThis = getGlobalThis();
                globalThis.__JSHOST.postMessage(JSON.stringify(messageData));
              });
            })
            .catch((error) => {
              //Return the request result to the app side.
              // Note:response must be JSON object
              console.error(`messageHandler method ${method} call failed:`, error);
              return new Promise((resolve, reject) => {
                const messageData = {
                  id: id,
                  method,
                  data: { code: -500, msg: error }
                };

                const globalThis = getGlobalThis();
                globalThis.__JSHOST.postMessage(JSON.stringify(messageData));
              });
            });
        } catch (error) {
          console.error(`messageHandler method: ${method} exception: `, error);
        }
      }
    }
  }

  public static initialize(): void {
    console.log('AndroidBridge initialize');

    const globalThis = getGlobalThis();

    if (typeof globalThis.__jMessage !== 'undefined') {
      return;
    }

    //Note: The Android side can directly send messages to me via __jMessage.
    globalThis.__jMessage = (id: string, method: string, data: string) => {
      // (window as any).__jMessage = (id: string, method: string, data: string) => {

      console.log(`__jMessage: receive message from android:  id-> ${id} method: ${method}, data:`, data);
      this.messageHandler(id, method, data);
    };
  }
}
