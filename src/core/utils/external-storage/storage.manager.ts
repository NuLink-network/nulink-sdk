import { AwaitIterable } from 'ipfs-core-types'
import { GetDataCallbackError } from './exception'
import { Account } from '../../hdwallet/api/account'

type DataType =
  | string[]
  | InstanceType<typeof String>[]
  | ArrayBufferView[]
  | ArrayBuffer[]
  | Blob[]
  | AwaitIterable<Uint8Array>[]
  | ReadableStream<Uint8Array>[]
/**
 * @type {AsyncSetDataCallback} The callback function defined by the user for bulk data storage, which will be automatically called by the Pre process to store user data
 * @property {string[] | InstanceType<typeof String>[] | ArrayBufferView[] | ArrayBuffer[] | Blob[]  | AwaitIterable<Uint8Array>[]| ReadableStream<Uint8Array>[]} data - Data that needs to be stored
 * @property {Account} account - (Optional) This parameter can be used if you need to use current account information(If the current account exists)  (for example, to sign with an account)
 * @returns {Promise<string[]>} - Returns an array of keys/hashes that store the data. When retrieving stored data, users need to use the corresponding key/hash to access it
 */
export type AsyncSetDataCallback =  | ((data: DataType, account: Account) => Promise<string[]>) | ((data: DataType) => Promise<string[]>);
/**
 * @type {AsyncGetDataCallback} The callback function for users to retrieve individual stored data, which will be automatically called by the Pre process to retrieve the stored user data.
 * @property {string} key - the key of saved data
 * @returns {Promise<Buffer | Uint8Array | null | undefined>} - Returns the data of stored by key
 */
export type AsyncGetDataCallback = (key: string) => Promise<Buffer | Uint8Array | null | undefined>

/**
 * @type {DataCallback} The callback function for users to save data and get data
 */
export type DataCallback = {
  setData: AsyncSetDataCallback;
  getData: AsyncGetDataCallback;
}

export class StorageManager {
  private static dataCallback: DataCallback | null = null

  public static setDataCallback(dataCallback: DataCallback) {
    StorageManager.dataCallback = dataCallback
  }

  /**
   * Set data to storage (invoke the callback function of `setData`). The entry points for uploading data/files to various storage services.
   * @param {string[] | InstanceType<typeof String>[] | ArrayBufferView[] | ArrayBuffer[] | Blob[] | AwaitIterable<Uint8Array>[] | ReadableStream<Uint8Array>[]} data - upload data stream
   * @param {Account} account - (Optional) This parameter can be used if you need to use current account information (for example, to sign with an account)
   * @returns {Promise<string[]>} - the list of the data/file key/hash/cid.
   */
  static async setData(data: DataType, account: Account): Promise<string[]> {
    if (StorageManager.dataCallback && StorageManager.dataCallback.setData) {

      if (StorageManager.dataCallback.setData.length >= 2) {
        return await StorageManager.dataCallback.setData(data, account)
      } else {
        const setDataCB: ((data: DataType) => Promise<string[]>) = StorageManager.dataCallback.setData as any;
        return await setDataCB(data)
      }
    } else {
      throw new GetDataCallbackError(
        'No callback function is set for storing/get data. Please call the StorageManager.setDataCallback function to set the callback function first'
      )
    }
  }

  /**
   * get data from storage
   * @param {string} fileKey - data key/cid/hash ..
   * @returns {Promise<Uint8Array | null | undefined>} - the content of the data stream.
   */

  static async getData(fileKey: string): Promise<Uint8Array | null | undefined /*| Buffer*/> {
    if (StorageManager.dataCallback && StorageManager.dataCallback.getData) {
      const ret = await StorageManager.dataCallback.getData(fileKey)
      //
      //
      if (ret instanceof Buffer) {
        return new Uint8Array(ret)
      } else {
        return ret
      }
      //
      //
    } else {
      throw new GetDataCallbackError(
        'No callback function is set for storing/get data. Please call the StorageManager.setDataCallback function to set the callback function first'
      )
    }
  }
}

export default StorageManager
