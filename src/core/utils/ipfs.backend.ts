//upload data to IPFS by backend service(with added verification logic)

import sleep from 'await-sleep'
import { AwaitIterable } from 'ipfs-core-types'
import { Account } from '../hdwallet/api/account'
import { serverPostFormData } from '../servernet'
// eslint-disable-next-line import/no-extraneous-dependencies
import FormData from 'form-data'
import { isBlank, isNotBlankAndEmptyObject } from './null'
import { MultiFileUploadError } from './exception'

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
      const sendData: FormData = new FormData()

      for (let index = 0; index < userDatas.length; index++) {
        const userData = userDatas[index]
        sendData.append('file', userData, `file${index + 1}`)
      }

      //TODO: Verification can be done by paying on-chain, and then listening for on-chain events. If payment has been made, the file can be uploaded.
      //sendData['signature'] = await signUpdateServerDataMessage(account, sendData)

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
          throw new MultiFileUploadError(`the file upload failed! file index ${index}`)
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
