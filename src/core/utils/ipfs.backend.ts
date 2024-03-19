//upload data to IPFS by backend service(with added verification logic)

import sleep from 'await-sleep'
import { AwaitIterable } from 'ipfs-core-types'
import { Account } from '../hdwallet/api/account'
import { serverPostFormData } from '../servernet'
// eslint-disable-next-line import/no-extraneous-dependencies
import FormData from 'form-data'
import { isBlank, isNotBlankAndEmptyObject } from './null'
import { MultiDataUploadError } from './exception'
import { signUpdateServerDataMessage } from '../pre'
import { decrypt as pwdDecrypt } from "./password.encryption";

export const setDatas = async (
  // account: Account,
  userDatas:
    | string[]
    | InstanceType<typeof String>[]
    | ArrayBufferView[]
    | ArrayBuffer[]
    | Blob[]
    | AwaitIterable<Uint8Array>[]
    | ReadableStream<Uint8Array>[]
): Promise<string[]> => {
  //return cid string array

  let i = 0
  do {
    try {
      //FormData does not support signing
      const _signData = {}; 
      _signData["account_id"] = account.id;

      const signature = await signUpdateServerDataMessage(
        pwdDecrypt((account as Account).encryptedKeyPair._privateKey, true),
        _signData
      );


      const sendData: FormData = new FormData();
      sendData.append("account_id", account.id);
      sendData.append(`timestamp`, _signData["timestamp"]);

      // const blob = new Blob([signature], { type: 'text/plain' });
      // sendData.append("signature", blob, `signature`);
      sendData.append("signature", signature);
      

      //unsigned data 
      for (let index = 0; index < userDatas.length; index++) {
        const userData = userDatas[index]
        sendData.append('file', userData, `file${index + 1}`)
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = (await serverPostFormData('/file/batch-upload-file', sendData)) as object

      let dataList = data['list']

      if (isBlank(dataList)) {
        return []
      }
      dataList = dataList as object[]

      const retList: string[] = []
      for (let index = 0; index < dataList.length; index++) {
        const fileData: string = dataList[index]
        if (!isNotBlankAndEmptyObject(fileData)) {
          //retList.push("");
          throw new MultiDataUploadError(`the data/file upload failed! data/file index ${index}`)
        } else {
          retList.push(fileData['hash'])
        }
      }

      return retList
    } catch (error) {
      i++
      console.log('ipfs http setData retrying ....')
      if (i >= 3) {
        console.error('ipfs http setData error: ', error)
        // Message.error("ipfs http setData error: " + error);
        throw error
      }
      await sleep(1000)
    }
  } while (i < 3)

  throw new Error('The IPFS setData function has failed. Please check the network for possible issues.')
}
