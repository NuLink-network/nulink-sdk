//get storage data from greenfield by backend service

// eslint-disable-next-line import/no-extraneous-dependencies
import FormData from "form-data";
import sleep from "await-sleep";
import { isBlank, isNotBlankAndEmptyObject } from '../../null'
import { AwaitIterable } from 'ipfs-core-types'
import SingletonService from 'singleton-service'
import { Client, IObjectResultType } from '@bnb-chain/greenfield-chain-sdk'
import * as exception from '../../exception'
import { Account } from '../../../hdwallet/api/account'
import { MultiFileUploadError } from "../../exception";
import { decrypt as pwdDecrypt } from "../../password.encryption";
import {
  signUpdateServerDataMessage,
} from "../utils";
import { serverPostFormData } from "../../../servernet";

const GREENFIELD_CLIENT_INSTANCE_NAME_PREFIX = 'greenFieldClient'
const GRPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org:443'
const GREEN_CHAIN_ID = 'greenfield_5600-1'
const SP_PROVIDER_RPC = 'https://gnfd-testnet-sp3.nodereal.io'

const bucketName: string = process.env.REACT_APP_BUCKET as string

export const getGreenFieldStorageProviderClient = async () => {
  //const secret = pwdEncrypt('Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64'));
  //console.log("encrypt: ", secret);

  // for get instance with saved key
  let client = SingletonService.get<Client>(GREENFIELD_CLIENT_INSTANCE_NAME_PREFIX)
  if (isBlank(client)) {
    client = Client.create(GRPC_URL, GREEN_CHAIN_ID)
    SingletonService.set<Client>(GREENFIELD_CLIENT_INSTANCE_NAME_PREFIX, client, true)
  }

  return client
}

export const getData = async (objectName: string): Promise<Buffer> => {
  //return cid string array
  const client: Client = await getGreenFieldStorageProviderClient()

  if (objectName.toLowerCase().trim().startsWith(bucketName.toLowerCase().trim())) {
    objectName = objectName.replace(bucketName + '/', '')
  }

  const result: IObjectResultType<Blob> = await client.object.getObject({
    bucketName: bucketName,
    objectName: objectName,
    endpoint: SP_PROVIDER_RPC
  })

  // debugger
  if (result.code != 0) {
    console.log('get greenfield sp data error: ', result)
    throw new exception.GetBucketDataError('get greenfield data failed! objectName: ' + objectName)
  }

  const blob = result.body as Blob
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return buffer
}

/**
 * Set data to storage. The entry points for uploading files to various storage services
 * @param {Account} account - Account the current account object.
 * @param {string[] | InstanceType<typeof String>[] | ArrayBufferView[] | ArrayBuffer[] | Blob[] | AwaitIterable<Uint8Array>[] | ReadableStream<Uint8Array>[]} datas - upload data stream
 * @returns {Promise<string[]>} - the list of the file key.
 */
export const setDatas = async (
  datas:
    | string[]
    | InstanceType<typeof String>[]
    | ArrayBufferView[]
    | ArrayBuffer[]
    | Blob[]
    | AwaitIterable<Uint8Array>[]
    | ReadableStream<Uint8Array>[],
  account: Account
): Promise<string[]> => {
  //Greenfield nodes do not support bulk upload. So you need to pass them one by one.
  const retList: any = []
  for (let index = 0; index < datas.length; index++) {
    const userData = datas[index]
    retList.push(await _setDatas( [userData as any], account))
  }
  return retList
}

/**
 * setDatas: upload pre data function, internal use
 * @internal
 * @param {Account} account - Account the current account object
 * @param {string[] | InstanceType<typeof String>[] | ArrayBufferView[] | ArrayBuffer[] | Blob[] | AwaitIterable<Uint8Array>[] | ReadableStream<Uint8Array>[]} datas - upload data stream
 * @returns {Promise<string[]>} - the list of the file key.
 */
const _setDatas = async (
  datas:
    | string[]
    | InstanceType<typeof String>[]
    | ArrayBufferView[]
    | ArrayBuffer[]
    | Blob[]
    | AwaitIterable<Uint8Array>[]
    | ReadableStream<Uint8Array>[],
    account: Account,
): Promise<string[]> => {
  //return cid string array

  let i = 0
  do {
    try {
      const sendData: FormData = new FormData()

      for (let index = 0; index < datas.length; index++) {
        const userData = datas[index]
        sendData.append('file', userData, `file${index + 1}`)
      }

      const signature = await signUpdateServerDataMessage(
        pwdDecrypt((account as Account).encryptedKeyPair._privateKey, true),
        sendData
      )

      const blob = new Blob([signature], { type: 'text/plain' })

      sendData.append('signature', blob, `signature`)

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
          throw new MultiFileUploadError(`The pre storage: file upload failed! file index ${index}`)
        } else {
          retList.push(fileData['hash'])
        }
      }

      return retList
    } catch (error) {
      i++
      console.log('The pre storage http setData retrying ....')
      if (i >= 3) {
        console.error('The pre storage setData error: ', error)
        // Message.error("ithirdparty storage setData error: " + error);
        throw error
      }
      await sleep(1000)
    }
  } while (i < 3)

  throw new Error('The pre storage setData function has failed. Please check the network for possible issues.')
}
