//upload data to IPFS by backend service(with added verification logic)

import sleep from 'await-sleep'
import { AwaitIterable } from 'ipfs-core-types'
import { Account } from '../../../hdwallet/api/account'
import { serverPostFormData } from '../../../servernet'
// eslint-disable-next-line import/no-extraneous-dependencies
import FormData from 'form-data'
import { isBlank, isNotBlankAndEmptyObject } from '../../null'
import { MultiDataUploadError } from '../../exception'
import { decrypt as pwdDecrypt } from '../../password.encryption'
import { signUpdateServerDataMessage } from '../utils'
import { create, IPFSHTTPClient } from 'ipfs-http-client'
import SingletonService from 'singleton-service'

const IPFS_CLIENT_INSTANCE_NAME_PREFIX = 'ipfsClient'

export const getIPFSClient = async () => {
  //const secret = pwdEncrypt('Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64'));
  //console.log("encrypt: ", secret);

  // for get instance with saved key
  let client = SingletonService.get<IPFSHTTPClient>(IPFS_CLIENT_INSTANCE_NAME_PREFIX)
  if (isBlank(client)) {
    // const { getSettingsData } = await import('../../../chainnet')
    // const config = await /* getConfigData */ getSettingsData()
    const ipfsAddress = (process.env.REACT_APP_IPFS_NODE_URL as string) || ''
    const bInfura: boolean = ipfsAddress.indexOf('infura') >= 0
    let options: any = { url: ipfsAddress }
    if (bInfura) {
      const infura_ipfs_encrypted_auth: string = (process.env.REACT_APP_INFURA_IPFS_ENCRYPT_AUTH as string) || ''
      options = {
        ...options,
        headers: {
          authorization: pwdDecrypt(infura_ipfs_encrypted_auth, false)
        }
      }
    }

    client = create(options) //create("/ip4/54.241.67.36/tcp/5001");
    SingletonService.set<IPFSHTTPClient>(IPFS_CLIENT_INSTANCE_NAME_PREFIX, client, true)
  }

  return client
}

/**
 * Set data to storage. The entry points for uploading data/files to various storage services
 * @param {Account} account - Account the current account object.
 * @param {string[] | InstanceType<typeof String>[] | ArrayBufferView[] | ArrayBuffer[] | Blob[] | AwaitIterable<Uint8Array>[] | ReadableStream<Uint8Array>[]} userDatas - upload data stream
 * @returns {Promise<string[]>} - the list of the data/file key.
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
  const blobDatas: Blob[] = []
  for (let index = 0; index < datas.length; index++) {

    const data = datas[index]
    
    if (!(data instanceof Blob)) {
      blobDatas.push(
        new Blob([data as any /*Uint8Array*/], {
          type: 'application/octet-stream'
        })
      )
    }
    else{
      blobDatas.push(data as Blob/*Blob*/);
    }

  }

  return await _setDatas(blobDatas, account)
}

/**
 * setDatas: upload pre data function, internal use
 * @internal
 * @param {Account} account - Account the current account object
 * @param {string[] | InstanceType<typeof String>[] | ArrayBufferView[] | ArrayBuffer[] | Blob[] | AwaitIterable<Uint8Array>[] | ReadableStream<Uint8Array>[]} datas - upload data stream
 * @returns {Promise<string[]>} - the list of the data/file key.
 */
const _setDatas = async (
  datas: Blob[],
  account: Account
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

      sendData.append("account_id", account.id, "account_id");
      
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
          throw new MultiDataUploadError(`The pre storage: data/file upload failed! data/file index ${index}`)
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

/**
 * get data from ipfs
 * @param {string} cid - data key/cid ..
 * @returns {Promise<Buffer>} - the content of the data stream.
 */
export const getData = async (cid: string): Promise<Buffer> => {
  let i = 0
  do {
    try {
      const client = await getIPFSClient()
      // console.log("ipfs getData cid", cid);
      const stream = client.cat(cid)
      const chunks: Uint8Array[] = []
      for await (const chunk of stream) {
        // chunks of data are returned as a Buffer, convert it back to a string
        chunks.push(chunk)
      }

      // console.log("ipfs getData cid string", Buffer.concat(chunks).toString());
      return Buffer.concat(chunks)
    } catch (error) {
      i++
      console.log('ipfs http getData retrying ....')
      if (i >= 3) {
        console.error('ipfs http getData error: ', error)
        //Message.error("ipfs http getData error: " + error);
        throw error
      }
      await sleep(1000)
    }
  } while (i < 3)

  throw new Error('The IPFS getData function has failed. Please check the network for possible issues.')
}
