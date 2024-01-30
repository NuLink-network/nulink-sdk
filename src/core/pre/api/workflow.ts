/**
 *  Encapsulate the entire pre file sharing process
 * Note: Anything with an Account parameter is placed in the first parameter of the function. It is convenient to unify the calling format when interacting with the browser page
 */
import sleep from 'await-sleep'
import { signMessage } from '../../utils/sign.message'

import { Account, Strategy, web3 } from '../../hdwallet/api/account'
import { GAS_LIMIT_FACTOR, GAS_PRICE_FACTOR } from '../../chainnet/config'
import { DecimalToInteger } from '../../utils/math'
import { hexlify, arrayify } from 'ethers/lib/utils'
//import { arrayify } from '@ethersproject/bytes'

// notice: bacause the MessageKit use the SecretKey import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Alice,
  BlockchainPolicyParameters,
  MultiBlockchainPolicyParameters,
  EnactedPolicy,
  MultiEnactedPolicy,
  MessageKit,
  RemoteBob
} from '@nulink_network/nulink-ts-crosschain'

import { EncryptedTreasureMap, HRAC } from '@nucypher/nucypher-core'

//reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
// notice: bacause the encryptedMessage.decrypt( get by MessageKit) use the SecretKey import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
// eslint-disable-next-line import/no-extraneous-dependencies
import { PublicKey, SecretKey as NucypherTsSecretKey, CrossChainHRAC } from '@nulink_network/nulink-ts-crosschain'

import { encryptMessage } from './enrico'
import { isBlank } from '../../utils/null'
import { DataCategory, DataInfo, DataType } from '../types'
//import { message as Message } from "antd";
import assert from 'assert-ts'
import { getCurrentNetworkKey, getSettingsData } from '../../chainnet'
import { serverGet, serverPost } from '../../servernet'
import { nanoid } from 'nanoid'
import { Bob, makeBob, makeRemoteBob } from './bob'
import { Porter, Ursula } from '@nulink_network/nulink-ts-crosschain/build/main/src/characters/porter'
import {
  BlockchainPolicy,
  MultiBlockchainPolicy,
  createChainPolicy,
  createMultiChainPolicy,
  makeAlice,
  getBalance,
  getUrsulas,
  approveNLK,
  estimateApproveNLKGas
} from './alice'

import { BigNumber } from 'ethers'
import { ethers } from 'ethers'
// import { SubscriptionManagerAgent } from '@nulink_network/nulink-ts-crosschain/build/main/src/agents/subscription-manager'
import { SubscriptionManagerAgent } from '@nulink_network/nulink-ts-crosschain'

import { toEpoch } from '../../utils/format'
import { compressPublicKeyBuffer, compressPublicKeyBuffer2, privateKeyBuffer } from '../../hdwallet/api/common'
import { getPorterUrl } from './porter'
import { GetStorageDataError, StorageManager } from '../../utils/external-storage'
import humps from 'humps'
import { getBlurThumbnail } from '../../utils/image'
import { ThumbailResult } from '../../utils/image'
import md5 from 'md5'
import { dataSuffix } from '../../utils/file'
import Web3 from 'web3'
import { fromBytes, fromBytesByEncoding } from '../../utils/encode'
import { decrypt as pwdDecrypt } from '../../utils/password.encryption'
import {
  getUrsulaError,
  InsufficientBalanceError,
  PolicyHasBeenActivedOnChain,
  GetStrategyError,
  DecryptError
} from '../../utils/exception'
import { getWeb3 } from '../../hdwallet/api'
import { getRandomElementsFromArray } from '../../../core/utils'
import { NETWORK_LIST } from '../../sol'
import { getDataCategoryString } from './utils'

/**
 * @internal
 */
export const getServerTimeStamp = async (): Promise<string> => {
  //get golbal time from server
  const sendData = {}

  const data = (await serverGet('/timestamp', sendData)) as object

  return data['timestamp'] as string
}

/**
 * @internal
 */
export const signUpdateServerDataMessage = async (account: Account, data: 'dataDict') => {
  // Do not use local time. Gets UTC real time in milliseconds with 0.001 precision from http://worldtimeapi.org/api/timezone/Etc/UTC.
  //data["timestamp"] = (new Date().getTime() / 1000) | 0; // Discard the decimal number
  //UTC real time
  data['timestamp'] = await getServerTimeStamp()

  return await signMessage(data, pwdDecrypt(account.encryptedKeyPair._privateKey, true))
}

/**
 * create account to center server
 * @param {Account} account - the current logined account object
 * @returns {Promise<void>}
 */
export const createAccountIfNotExist = async (account: Account) => {
  const exist: boolean = await IsExistAccount(account)
  if (!exist) {
    await createAccount(account)
  }
}

/**
Determines whether an account exists on the server.
@param {Account} account - the current logined account object
@returns {Promise<boolean>} - Returns true if the account exists on the server, otherwise returns false.
*/
export const IsExistAccount = async (account: Account): Promise<boolean> => {
  const sendData = {
    // name: account.name,
    account_id: account.id
    // ethereum_addr: account.address,
    // encrypted_pk: account.encryptedKeyPair._publicKey,
    // verify_pk: account.encryptedKeyPair._publicKey, //account.verifyKeyPair._publicKey, //Adapter code for nucypher-ts  Note Bob, Enrico's Encrypted PK SK is the same as Verify PK SK.  Alice verify PK can use encrypted PK.  In Nucypher-TS, Alice encryption key uses the public and private key pair generated by label, which is the policy public key for us.
  }

  const data = (await serverPost('/account/isexist', sendData)) as object

  return data['is_exist'] as boolean
}

/**
 * Sends a request to create an account on the server.
 * @param {Account} account - the account object
 * @returns {Promise<void>}
 */
export const createAccount = async (account: Account) => {
  // https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E5%88%9B%E5%BB%BA%E7%94%A8%E6%88%B7

  const sendData = {
    name: account.name,
    account_id: account.id,
    ethereum_addr: account.address,
    encrypted_pk: account.encryptedKeyPair._publicKey,
    verify_pk: account.encryptedKeyPair._publicKey //account.verifyKeyPair._publicKey, //Adapter code for nucypher-ts   Note Bob, Enrico's Encrypted PK SK is the same as Verify PK SK.  Alice verify PK can use encrypted PK.  In Nucypher-TS, Alice encryption key uses the public and private key pair generated by label, which is the policy public key for us.
  }

  const data = await serverPost('/account/create', sendData)

  return data
}

/**
 * get account info by account id
 * @param {string} - accountId 
 * @returns {Promise<object>} - account information details
 *          {
              name	string	account name
              account_id	string	account ID(UUID v4)
              ethereum_addr	string	eth address
              encrypted_pk	string	encrypted PK
              verify_pk	string	verifyed PK
              status	number	account state 
              created_at	number	account create time
              avatar           string  IPFS address of avatar
              name         string  nickname            
              user_site         string  Address of the user's primary site   
              twitter          string  twitter address     
              instagram        string  instagram address  
              facebook         string  facebook address    
              profile string  personal data        
          }
 */
export const getAccountInfo = async (accountId: string) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF

  const sendData = {
    account_id: accountId
  }

  const data = await serverPost('/account/get', sendData)

  return data
}

/**
 * get account infos by multiple account ids
 * @param {string[]} - accountId s
 * @returns {Promise<object>} - account information details list
 * 
 *         [ {
              name	string	account name
              account_id	string	account ID(UUID v4)
              ethereum_addr	string	eth address
              encrypted_pk	string	encrypted PK
              verify_pk	string	verifyed PK
              status	number	account state 
              created_at	number	account create time
              avatar           string  IPFS address of avatar
              name         string  nickname            
              user_site         string  Address of the user's primary site   
              twitter          string  twitter address     
              instagram        string  instagram address  
              facebook         string  facebook address    
              profile string  personal data        
          },
          ...
        ]
 */
export const getAccountInfos = async (accountIds: string[]): Promise<object[]> => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E8%8E%B7%E5%8F%96%E7%94%A8%E6%88%B7%E4%BF%A1%E6%81%AF

  const sendData = {
    account_ids: accountIds
  }

  const data = (await serverPost('/account/batch-get', sendData)) as object

  const dataDict: object = data['list']
  if (isBlank(dataDict)) {
    return []
  }
  const retList: object[] = []
  for (let index = 0; index < accountIds.length; index++) {
    const accountId: string = accountIds[index]
    if (accountId in dataDict) {
      retList.push(dataDict[accountId])
    } else {
      retList.push({})
    }
  }

  return retList
}

/** update info of current user account
 * @param {Account} account - the current account object
 * @param {string} avatar - (Optional) the photo of current account
 * @param {string} nickname - (Optional) the nickname of current account
 * @param {string} userSite - (Optional) the user site of current account
 * @param {string} twitter - (Optional) the twitter of current account
 * @param {string} instagram - (Optional) the instagram of current account
 * @param {string} facebook - (Optional) the facebook of current account
 * @param {string} personalProfile - (Optional) the personal profile of current account
 * @returns {Promise<void>}
 */
export const updateAccountInfo = async (account: Account, updateData: Record<string, string>) => {
  const sendData: any = {
    account_id: account.id
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'avatar') && !!updateData['avatar']) {
    sendData['avatar'] = updateData['avatar']
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'nickname') && !!updateData['nickname']) {
    sendData['name'] = updateData['nickname']

    account.name = updateData['nickname']

    //Store account meta information in a decentralized manner
    await account.saveAccountItselfInfo()
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'userSite')) {
    sendData['user_site'] = updateData['userSite']
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'twitter')) {
    sendData['twitter'] = updateData['twitter']
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'instagram')) {
    sendData['instagram'] = updateData['instagram']
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'facebook')) {
    sendData['facebook'] = updateData['facebook']
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'personalProfile')) {
    sendData['profile'] = updateData['personalProfile']
  }

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData)

  const data = await serverPost('/account/update', sendData)

  return data
}

/**
 * Uploads files/datas to the server by creating a new local policy and uploading the files encrypted with the policy's public key to IPFS.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} account - The account to use to create the policy and upload the files/datas.
 * @param {DataCategory | string} category - The category of the files/datas being uploaded. Must be a valid DataCategory value or a string.
 * @param {DataInfo[]} dataInfoList - The list of files/datas to upload. Each element of the array must be an object with properties 'label' and 'dataArrayBuffer'.
 * @returns {Promise<Strategy>} - Returns the strategy used to upload the files/datas.
 */
export const uploadDatasByCreatePolicy = async (
  account: Account,
  category: DataCategory | string, //data category, according to the design: only one category is allowed to be uploaded in batches, and different categories need to be uploaded separately
  dataInfoList: DataInfo[] //data information list
): Promise<Strategy> => {
  console.log('uploadDatasByCreatePolicy account', account)

  let label = getDataCategoryString(category)
  if (!label) {
    if (dataInfoList.length > 0 && !isBlank(dataInfoList[0]?.category)) {
      label = getDataCategoryString(dataInfoList[0]?.category as any)
    }
    if (!label) {
      label = ''
    }
  }

  // Number.isNaN(parseInt("Philosophy"))
  const strategy: Strategy = await account.createStrategyByLabel(label)
  // console.log("uploadDatasByCreatePolicy strategy", strategy);

  // console.log("uploadDatasByCreatePolicy dataList", dataList);
  /*   //for test start
  const plainText = "This is a history book content";
  const enc = new TextEncoder(); // always utf-8
  const historyContent: Uint8Array = enc.encode(plainText);

  dataList = [{ name: `history-${nanoid()}.pdf`, dataArrayBuffer: historyContent.buffer }];
  //for test end */

  const dataContentList: ArrayBuffer[] = []
  for (const dataInfo of dataInfoList) {
    dataContentList.push(dataInfo.dataArrayBuffer)
  }
  // console.log("uploadDatasByCreatePolicy fileContentList", fileContentList);

  const _encryptMessages: MessageKit[] = encryptMessage(strategy.strategyKeyPair._publicKey, dataContentList)
  // console.log("uploadDatasByCreatePolicy _encryptMessages", _encryptMessages);
  const mockIPFSAddressList: string[] = []

  const datas: Uint8Array[] = _encryptMessages.map((encryptMessage) => encryptMessage.toBytes() /*Uint8Array*/)
  const cids: string[] = await StorageManager.setData(datas, account)
  mockIPFSAddressList.push(...cids)

  // console.log("uploadDatasByCreatePolicy mockIPFSAddressList", mockIPFSAddressList);
  const dataInfos: object[] = []
  for (let index = 0; index < dataInfoList.length; index++) {
    const dataInfo = dataInfoList[index]

    const dataId = nanoid()

    //The generation of thumbnail logic should be handled by a third-party DApp, rather than implemented in the pre-process. Therefore, it needs to be moved to the third-party DApp, and this part should be blocked
    //generate and upload thumbnail files to IPFS
    // eslint-disable-next-line prefer-const
    let thumbnail = ''
    // try {
    //  const result = await getBlurThumbnail(
    //    dataInfo.dataArrayBuffer,
    //    dataInfo.label
    //  );
    //  if (isBlank(result)) {
    //    thumbnail = "";
    //  } else {
    //    const { buffer: thumbnailBuffer, mimeType }: ThumbailResult =
    //      result as ThumbailResult;
    //    const cid: string = await StorageManager.setData([thumbnailBuffer.buffer], account)[0];
    //    thumbnail = mimeType + "|" + cid;
    //  }
    // } catch (error) {
    //  thumbnail = "";
    //  console.error(
    //    `generate or upload thumbail failed data label: ${dataInfo.label}, data id:${dataId}`,
    //    error
    //  );
    // }

    const _data = {
      id: dataId,
      name: dataInfo.label,
      address: mockIPFSAddressList[index],
      md5: md5(new Uint8Array(dataInfo.dataArrayBuffer), {
        encoding: 'binary'
      }),
      suffix: dataSuffix(dataInfo.label),
      category: label,
      thumbnail: thumbnail || ''
    }
    dataInfos.push(_data)
  }
  // console.log("uploadDatasByCreatePolicy dataInfos", dataInfos);
  try {
    const sendData: any = {
      files: dataInfos,
      account_id: account.id,
      policy_label_id: strategy.id,
      policy_label: strategy.label,
      policy_label_index: String(strategy.addressIndex),
      encrypted_pk: strategy.strategyKeyPair._publicKey
    }

    sendData['signature'] = await signUpdateServerDataMessage(account, sendData)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = await serverPost('/file/create-policy-and-upload', sendData)
  } catch (error) {
    // Message.error("upload file failed!");
    console.error('upload data failed!: ', error)

    // clear this failed strategy info
    await account.deleteStrategy(strategy.addressIndex)
    throw error
  }

  // console.log("uploadDatasByCreatePolicy after serverPost", data);
  return strategy
}
/**
 * Uploads files/datas to the server by selecting an existing policy and uploading the files encrypted with the policy's public key to IPFS.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} account - The account to use to upload the files/datas.
 * @param {DataCategory | string} category - The category of the files/datas being uploaded. Must be a valid FileCategory value or a string.
 * @param {DataInfo[]} dataList - The list of files/datas to upload. Each element of the array must be an object with properties 'name' and 'dataArrayBuffer'.
 * @param {number} policyId - The ID of the policy to use to encrypt and upload the files/datas.
 * @returns {Promise<string[]>} - Returns an array of file/data IDs uploaded to the server.
 */
export const uploadDatasBySelectPolicy = async (
  account: Account,
  category: DataCategory | string, //File category, according to the design: only one category is allowed to be uploaded in batches, and different categories need to be uploaded separately
  dataList: DataInfo[], //file information list
  policyId: number // policy info id
): Promise<string[]> => {
  //return file id array

  let label = getDataCategoryString(category)
  if (!label) {
    if (dataList.length > 0 && !isBlank(dataList[0]?.category)) {
      label = getDataCategoryString(dataList[0]?.category as any)
    }
    if (!label) {
      label = ''
    }
  }
  const dataContentList: ArrayBuffer[] = []
  for (const dataInfo of dataList) {
    dataContentList.push(dataInfo.dataArrayBuffer)
  }

  //Get poliy info by policy Id
  const policyInfo = (await getPoliciesInfo(policyId)) as object
  assert(policyInfo && !isBlank(policyInfo) && policyInfo['total'] > 0)
  const policyEncrypedPublicKey = policyInfo['list'][0]['encrypted_pk']

  const _encryptMessages: MessageKit[] = encryptMessage(policyEncrypedPublicKey, dataContentList)

  const mockIPFSAddressList: string[] = []

  const datas: Uint8Array[] = _encryptMessages.map((encryptMessage) => encryptMessage.toBytes() /*Uint8Array*/)
  const cids: string[] = await StorageManager.setData(datas, account)
  mockIPFSAddressList.push(...cids)

  const retInfo: string[] = []
  const dataInfos: object[] = []
  for (let index = 0; index < dataList.length; index++) {
    const dataInfo = dataList[index]
    const dataId = nanoid()

    //The generation of thumbnail logic should be handled by a third-party DApp, rather than implemented in the pre-process. Therefore, it needs to be moved to the third-party DApp, and this part should be blocked
    //generate and upload thumbnail files to IPFS
    // eslint-disable-next-line prefer-const
    let thumbnail = ''
    //try {
    //  const result = await getBlurThumbnail(dataInfo.dataArrayBuffer, dataInfo.label)
    //  if (isBlank(result)) {
    //    thumbnail = ''
    //  } else {
    //    const { buffer: thumbnailBuffer, mimeType }: ThumbailResult = result as ThumbailResult
    //    const cid: string = await StorageManager.setData([thumbnailBuffer.buffer], account)[0]
    //    thumbnail = mimeType + '|' + cid
    //  }
    //} catch (error) {
    //  thumbnail = ''
    //  console.error(`generate or upload thumbail failed data label: ${dataInfo.label}, data id:${dataId}`, error)
    //}

    const _data = {
      id: dataId,
      name: dataInfo.label,
      address: mockIPFSAddressList[index],
      md5: md5(new Uint8Array(dataInfo.dataArrayBuffer), {
        encoding: 'binary'
      }),
      suffix: dataSuffix(dataInfo.label),
      category: label,
      thumbnail: thumbnail || ''
    }

    dataInfos.push(_data)
    retInfo.push(_data.id)
  }

  const sendData: any = {
    files: dataInfos,
    account_id: account.id,
    policy_id: policyId
  }

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData)

  //Select an existing policy
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await serverPost('/file/upload', sendData)

  return retInfo
}

/**
* Gets a list of files/datas uploaded by the specified account from the server. This account acts as the publisher
* @category File/Data Publisher(Alice) Interface
* @param {Account} account - The account to retrieve the file/data list for.
* @param {string} dataLabel - (Optional) The name of the file/data to search for. Leave blank to retrieve all files/datas.
* @param {number} pageIndex - (Optional) The index of the page to retrieve. Default is 1.
* @param {number} pageSize - (Optional) The number of files/datas to retrieve per page. Default is 10.
* @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
            {
                list: [
                  {
                    {string} file_id - File/Data ID
                    {string} file_name - File/Data name
                    {string} owner - File/Data owner
                    {string} owner_id - File/Data owner account ID
                    {string} address - File/Data address
                    {string} thumbnail - File/Data thumbnail
                    {number} created_at - File/Data upload timestamp
                  },
                  ...
                ],
                total: total cnt
            }
*/
export const getUploadedDatas = async (account: Account, dataLabel?: string, pageIndex = 1, pageSize = 10) => {
  return await getDataInfosByAccount(account, dataLabel, pageIndex, pageSize)
}

/**
* Gets a list of files/datas uploaded by the specified account from the server. This account acts as the publisher
* @category File/Data Publisher(Alice) Interface
* @param {Account} account - The account to retrieve the file/data list for.
* @param {string} dataLabel - (Optional) The label of the file/data to search for. Leave blank to retrieve all files/datas.
* @param {number} pageIndex - (Optional) The index of the page to retrieve. Default is 1.
* @param {number} pageSize - (Optional) The number of files/datas to retrieve per page. Default is 10.
* @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
            {
                list: [
                  {
                    {string} file_id - File/Data ID
                    {string} file_name - File/Data name
                    {string} owner - File/Data owner
                    {string} owner_id - File/Data owner account ID
                    {string} address - File/Data address
                    {string} thumbnail - File/Data thumbnail
                    {number} created_at - File/Data upload timestamp
                  },
                  ...
                ],
                total: total cnt
            }
*/
export const getDataInfosByAccount = async (account: Account, dataLabel?: string, pageIndex = 1, pageSize = 10) => {
  //file_name support fuzzy query
  // https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%96%87%E4%BB%B6%E5%88%97%E8%A1%A8

  const sendData = {
    account_id: account.id,
    paginate: {
      page: pageIndex,
      page_size: pageSize
    }
  }

  if (!isBlank(dataLabel)) {
    sendData['file_name'] = dataLabel
  }

  const data = await serverPost('/file/list', sendData)

  return data
}

/**
 * Deletes the specified files/datas uploaded by the account from the server, This account acts as the publisher
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} account - The account that owns the files/datas to be deleted.
 * @param {string[]} dataIds - An array of file/data IDs to delete.
 * @returns {Promise<void>}
 */
export const deleteUploadedDatas = async (account: Account, dataIds: string[]) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E5%88%A0%E9%99%A4%E6%96%87%E4%BB%B6
  /*  
          return the list of deleted files/datas is displayed: [
              {"file_id": "", "file_name": ""},
              ...
            ]
  */

  const sendData: any = {
    account_id: account.id,
    file_ids: dataIds
  }

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData)

  const data = await serverPost('/file/delete', sendData)

  return data
}

/**
* Gets a list of files/datas shared by others (files uploaded by the current account are not included). This account acts as the user(Bob).
* @category File/Data User(Bob) Interface
* @param {Account} account - The current account information.
* @param {string} dataLabel - (Optional) The name of the file/data to search for. support fuzzy query. Leave blank to retrieve all files.
* @param {boolean} include - Indicates whether the query result contains file/data list data of the current account.
* @param {DataCategory|string} category - (Optional) The category of the file/data to search for.
* @param {DataType} dataType - (Optional) The type of the file/data to search for.
* @param {boolean} descOrder - (Optional) Whether to sort by upload time in reverse order.
* @param {number} pageIndex - (Optional) The index of the page to retrieve. Default is 1.
* @param {number} pageSize - (Optional) The number of files/datas to retrieve per page. Default is 10.
* @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
                        {
                            total: number
                            list: [{
                                file_id: string - File/Data ID
                                file_name: string - File/Data name
                                category: string - File/Data category/type
                                format: string - File/Data format
                                suffix: string - File/Data suffix
                                address: string - File/Data address
                                thumbnail: string - File/Data thumbnail
                                owner: string - File/Data owner
                                owner_id: string - File/Data owner's account ID
                                owner_avatar: string - File/Data owner's avatar
                                created_at: number - File/Data upload timestamp
                            }]
                        }
*/
export const getOtherShareDatas = async (
  account: Account, //current account info
  dataLabel?: string, //file_name support fuzzy query
  include?: boolean, //indicates whether the query result contains file list data of the current account
  category?: DataCategory | string,
  dataType?: DataType,
  descOrder = true, //Whether to sort by upload time in reverse order
  pageIndex = 1,
  pageSize = 10
) => {
  /*
https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E5%85%B6%E4%BB%96%E4%BA%BA%E7%9A%84%E6%96%87%E4%BB%B6%E5%88%97%E8%A1%A8
return data format: {
  list: [
    {file_id, file_name:, owner, owner_id, address:,thumbnail:,create_at}
    ...
  ],
  total: 300,
}
*/

  const sendData = {
    account_id: account.id,
    desc: descOrder,
    paginate: {
      page: pageIndex,
      page_size: pageSize
    }
  }

  sendData['include'] = !!include

  if (!isBlank(dataLabel)) {
    sendData['file_name'] = dataLabel
  }

  if (!isBlank(category)) {
    sendData['category'] = DataCategory[(category as DataCategory).toString()] || (category as string)
  }

  if (!isBlank(dataType)) {
    sendData['format'] = DataType[(dataType as DataType).toString()]
  }

  const data = await serverPost('/file/others-list', sendData)

  return data
}

/**
 * Applies for file/data usage permission for the specified files/datas, This account acts as the user(Bob).
 * @category File/Data User(Bob) Interface
 * @param {string[]} dataIds - An array of file IDs to apply for usage permission.
 * @param {Account} account - The account that applies for the permission.
 * @param {number} usageDays - (Optional) The validity period of the application, in days. Default is 7.
 * @returns {Promise<void>}
 */
export const applyForDatasUsagePermission = async (dataIds: string[], account: Account, usageDays = 7) => {
  // https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%94%B3%E8%AF%B7%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8
  //TODO:  Consider returning the apply record ID

  if (usageDays <= 0) {
    throw Error("The application file/data's validity period must be greater than 0 days")
  }

  const sendData: any = {
    file_ids: dataIds,
    proposer_id: account.id,
    account_id: account.id, //new for backend signature
    days: usageDays
  }
  /*   console.log(
    `usageDays: ${usageDays}, startMs: ${startMs}, endMs: ${endMs}, endMs-startMs:${
      (endMs - startMs) / (1000.0 * 60 * 60 * 24)
    }`,
  ); */

  // console.log("apply file user account", account);
  // console.log("apply file file_ids", fileIds);

  const settingsData = await getSettingsData()
  sendData['chain_id'] = settingsData.chainId

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData)

  const data = await serverPost('/apply/file', sendData)

  return data
}

/**
 * Revokes the permission application of the specified files/datas. This account acts as the user(Bob).
 * If it has been approved or failed, it can not be revoked.
 * The background service processing logic is such that if there are multiple permission applications, either all of them will be successful or none of them will be successful.
 * @category File/Data User(Bob) Interface
 * @param {Account} account - The account that revokes the permission application.
 * @param {number[]} applyIds - An array of application applyIds to revoke.
 * @returns {Promise<object>} - Returns an empty object.
 */
export const revokePermissionApplicationOfDatas = async (
  account: Account, //Bob
  applyIds: number[] //Application Record ID
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%92%A4%E9%94%80%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  const sendData: any = {
    apply_ids: applyIds,
    proposer_id: account.id,
    account_id: account.id //new for backend signature
  }

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData)

  const data = await serverPost('/apply/revoke', sendData)

  return data
}

/**
 * The file/data publisher retrieves a list of files/datas in all states.
 * @category File/Data Publisher(Alice) Interface  
 * @param {Account} account - the current account object 
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file type category",
                    "format": "image",
                    "suffix": "jpg",
                    "owner": "account name",
                    "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                    "owner_avatar": "Profile picture",
                    "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                    "created_at": 1684116370
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getDatasAllStatusAsPublisher = async (account: Account, pageIndex = 1, pageSize = 10) => {
  /*return data format: {
  list: [
    { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, days, created_at }
    ...
  ],
  total: 300,
}
*/

  return await getDatasByStatus(undefined, undefined, account.id, undefined, 0, pageIndex, pageSize)
}

/**
 * Retrieve a list of files/datas in a specified state that need to be approved for use by others, for the file/data publisher.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} account - the current account object 
 * @param {number} status - (Optional) default 0: All state 1: Under review, 2: Approved, 3: Rejected, 4: Under approval, 5: Expired
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file type category",
                    "format": "image",
                    "suffix": "jpg",
                    "owner": "account name",
                    "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                    "owner_avatar": "Profile picture",
                    "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                    "created_at": 1684116370
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getDatasByApplyStatusAsPublisher = async (account: Account, status = 0, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, undefined, account.id, undefined, status, pageIndex, pageSize)
}

/**
* Gets a list of files/datas pending approval (applying but not yet approved). This account acts as the publisher (Alice) and needs to approve them.
* @category File/Data Publisher(Alice) Interface
* @param {Account} account - (Optional) The current account information.
* @param {number} pageIndex - (Optional) The index of the page to retrieve. Default is 1.
* @param {number} pageSize - (Optional) The number of files/datas to retrieve per page. Default is 10.
* @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
                          {
                            "list": [
                              {
                                "file_id": "8feS-wp5lYhGOCtOLTKZH",
                                "file_name": "1.jpg",
                                "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                                "category": "file type category",
                                "format": "image",
                                "suffix": "jpg",
                                "owner": "account name",
                                "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                                "owner_avatar": "Profile picture",
                                "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                                "created_at": 1684116370
                              },
                              ...
                          ],
                          "total": total count
                        }
*/
export const getDatasPendingApprovalAsPublisher = async (account: Account, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, undefined, account.id, undefined, 1, pageIndex, pageSize)
}

/**
 * get the Approved success status files/datas for others to use. This account acts as the publisher (Alice)
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} account - Account the current account object
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file type category",
                    "format": "image",
                    "suffix": "jpg",
                    "owner": "account name",
                    "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                    "owner_avatar": "Profile picture",
                    "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                    "created_at": 1684116370
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getApprovedDatasAsPublisher = async (account: Account, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, undefined, account.id, undefined, 2, pageIndex, pageSize)
}

/**
* Gets a list of files/datas with the "approved failed" status for others to use. This account acts as the publisher (Alice).
* @category File/Data Publisher(Alice) Interface
* @param {Account} account - The current account information.
* @param {number} pageIndex - The index of the page to retrieve. Default is 1.
* @param {number} pageSize - The number of files/datas to retrieve per page. Default is 10.
* @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
              {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file type category",
                    "format": "image",
                    "suffix": "jpg",
                    "owner": "account name",
                    "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                    "owner_avatar": "Profile picture",
                    "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                    "created_at": 1684116370
                  },
                  ...
              ],
              "total": total count
            }
*/
export const getDatasForRefusedAsPublisher = async (account: Account, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, undefined, account.id, undefined, 3, pageIndex, pageSize)
}

/**
* Gets a list of all files/datas with any status as a user (Bob) using this account.
* @category File/Data User(Bob) Interface
* @param {Account} account - The current account information.
* @param {number} pageIndex - The index of the page to retrieve. Default is 1.
* @param {number} pageSize - The number of files/datas to retrieve per page. Default is 10.
* @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
                            {
                              "list": [
                                {
                                  "file_id": "8feS-wp5lYhGOCtOLTKZH",
                                  "file_name": "1.jpg",
                                  "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                                  "category": "file type category",
                                  "format": "image",
                                  "suffix": "jpg",
                                  "owner": "account name",
                                  "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                                  "owner_avatar": "Profile picture",
                                  "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                                  "created_at": 1684116370
                                },
                                ...
                            ],
                            "total": total count
                          }
*/
export const getDatasAllStatusAsUser = async (account: Account, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, account.id, undefined, undefined, 0, pageIndex, pageSize)
}

/**
 * The file/data applicant retrieves a list of files/datas in a specified state that need to be approved by others.
 * @category File/Data User(Bob) Interface
 * @param {Account} account -  the current account object 
 * @param status - (Optional) default 0: All state 1: Under review, 2: Approved, 3: Rejected, 4: Under approval, 5: Expired
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file type category",
                    "format": "image",
                    "suffix": "jpg",
                    "owner": "account name",
                    "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                    "owner_avatar": "Profile picture",
                    "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                    "created_at": 1684116370
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getDatasByApplyStatusAsUser = async (account: Account, status = 0, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, account.id, undefined, undefined, status, pageIndex, pageSize)
}

/**
  * Gets a list of files/datas pending approval (applying but not yet approved). This account acts as a user (Bob) and needs to approve them.
  * @category File/Data User(Bob) Interface
  * @param {Account} account - The current account information.
  * @param {number} pageIndex - (Optional) The index of the page to retrieve. Default is 1.
  * @param {number} pageSize - (Optional) The number of files/datas to retrieve per page. Default is 10.
  * @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
                            {
                              "list": [
                                {
                                  "file_id": "8feS-wp5lYhGOCtOLTKZH",
                                  "file_name": "1.jpg",
                                  "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                                  "category": "file type category",
                                  "format": "image",
                                  "suffix": "jpg",
                                  "owner": "account name",
                                  "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                                  "owner_avatar": "Profile picture",
                                  "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                                  "created_at": 1684116370
                                },
                                ...
                            ],
                            "total": total count
                          }
*/
export const getDatasPendingApprovalAsUser = async (account: Account, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, account.id, undefined, undefined, 1, pageIndex, pageSize)
}

/**
 * The file applicant retrieves a list of files/datas that have been approved for their own use.
 * @category File/Data User(Bob) Interface
 * @param {Account} account - the current account object 
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file type category",
                    "format": "image",
                    "suffix": "jpg",
                    "owner": "account name",
                    "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                    "owner_avatar": "Profile picture",
                    "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                    "created_at": 1684116370
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getApprovedDatasAsUser = async (account: Account, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, account.id, undefined, undefined, 2, pageIndex, pageSize)
}

/**
 * Gets a list of files/datas with the "approved failed" status, which cannot be used by the user (Bob) using this account.
 * @category File/Data User(Bob) Interface
 * @param {Account} account - The current account information.
 * @param {number} pageIndex - The index of the page to retrieve. Default is 1.
 * @param {number} pageSize - The number of files/datas to retrieve per page. Default is 10.
 * @returns {Promise<object>} - Returns an object containing the list of files/datas and pagination information.
 */
export const getUnapprovedDatasAsUser = async (account: Account, pageIndex = 1, pageSize = 10) => {
  return await getDatasByStatus(undefined, account.id, undefined, undefined, 3, pageIndex, pageSize)
}

/**
 * get files/datas info by status This account acts as the user (Bob) or publisher (Alice)
 * @category File/Data Publisher(Alice)/User(Bob) Interface
 * @param {string} dataId - (Optional)  file/data's id
 * @param {string} proposerId - (Optional) proposer's account id
 * @param {string} dataOwnerId - (Optional) account id of the file owner
 * @param {string} applyId - (Optional) to apply for id
 * @param {number} status - (Optional) number default 1  1 - In progress, 2 - Approved, 3 - Rejected, 4 - Under review, 5 - Expired.
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file type category",
                    "format": "image",
                    "suffix": "jpg",
                    "owner": "account name",
                    "owner_id": "1b79f5def27bebcc71a71058a7771cc476769fc5dba32f45bcdc1b8c6e353917",
                    "owner_avatar": "Profile picture",
                    "thumbnail": "thumbnail mimetype and ipfs address: image/jpeg|QmUmCdMxu2MnnCmodc5VvnLqqoJn21s2M2LQqV9T5zDgYy",
                    "created_at": 1684116370
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getDatasByStatus = async (
  dataId?: string,
  proposerId?: string, //	Proposer's account id
  dataOwnerId?: string, //Account id of the file/data owner
  applyId?: string, //To apply for id
  status = 1, //Application status: 1 - In progress, 2 - Approved, 3 - Rejected, 4 - Under review, 5 - Expired.
  pageIndex = 1,
  pageSize = 10
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%94%B3%E8%AF%B7%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E5%88%97%E8%A1%A8

  if (isBlank(applyId) && isBlank(proposerId) && isBlank(dataOwnerId)) {
    // Message.error(
    //   `The request parameters proposer_id, file_owner_id must be passed at least one of these fields or pass the applyId field `,
    // );
    throw new Error(
      `The proposerId and dataOwnerId parameters must be provided for at least one of these fields or the applyId field must be passed`
    )
  }

  const sendData = {
    status: status,
    paginate: {
      page: pageIndex,
      page_size: pageSize
    }
  }

  if (!isBlank(dataId)) {
    sendData['file_id'] = dataId
  }

  if (!isBlank(applyId)) {
    sendData['apply_id'] = applyId
  }

  if (!isBlank(proposerId)) {
    sendData['proposer_id'] = proposerId
  }

  if (!isBlank(dataOwnerId)) {
    sendData['file_owner_id'] = dataOwnerId
  }

  const settingsData = await getSettingsData()
  sendData['chain_id'] = settingsData.chainId

  const data = (await serverPost('/apply/list', sendData)) as object

  if (isBlank(data)) {
    return {}
  }

  return data
}

/**
 * The applicant of the file/data obtains a list of the policy information. 
 * get information about the current of all using policies by publiser others, the current account as Bob
 * @category File/Data User(Bob) Interface
 * @param {Account} account -  current account object info      
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "hrac":"Policy hrac",
                    "policy_id":"Policy ID",
                    "creator":"Policy creator",
                    "creator_id":"Policy creator ID",
                    "creator_address":"Ethereum address of the policy creator",
                    "consumer":"Policy consumer",
                    "consumer_id":"Policy consumer ID",
                    "consumer_address":"Ethereum address of the policy consumer",
                    "gas":"Gas fee in wei",
                    "tx_hash":"Transaction hash",
                    "encrypted_pk":"Policy encryption public key",
                    "start_at":"Policy start timestamp",
                    "end_at":"Policy end timestamp",
                    "created_at":"Policy creation timestamp"
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getInUsePoliciesInfo = async (account: Account, pageIndex = 1, pageSize = 10) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%AD%96%E7%95%A5%E4%BF%A1%E6%81%AF%E5%88%97%E8%A1%A8  return data format: {

  const data = (await getPoliciesInfo(undefined, undefined, account.id, undefined, pageIndex, pageSize)) as object
  return data
}

/**
 * The publisher of the file/data obtains a list of the information of the policies published on the blockchain.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} account 
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "hrac":"Policy hrac",
                    "policy_id":"Policy ID",
                    "creator":"Policy creator",
                    "creator_id":"Policy creator ID",
                    "creator_address":"Ethereum address of the policy creator",
                    "consumer":"Policy consumer",
                    "consumer_id":"Policy consumer ID",
                    "consumer_address":"Ethereum address of the policy consumer",
                    "gas":"Gas fee in wei",
                    "tx_hash":"Transaction hash",
                    "encrypted_pk":"Policy encryption public key",
                    "start_at":"Policy start timestamp",
                    "end_at":"Policy end timestamp",
                    "created_at":"Policy creation timestamp"
                  },
                  ...
              ],
              "total": total count
            }

 */
export const getPublishedPoliciesInfo = async (account: Account, pageIndex = 1, pageSize = 10) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%AD%96%E7%95%A5%E4%BF%A1%E6%81%AF%E5%88%97%E8%A1%A8

  const data = (await getPoliciesInfo(undefined, account.id, undefined, undefined, pageIndex, pageSize)) as object
  return data
}

/**
 * Obtains a list of the information of the policies published on the blockchain.
 * @param {number} policyId - policyId
 * @param {string} creatorId - the publisher's account id of the file/data
 * @param {string} consumerId - the user's account id of the file/data
 * @param {string} policyLabelId - the `label` fields of the Strategy object in the Account Object
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "hrac":"Policy hrac",
                    "policy_id":"Policy ID",
                    "creator":"Policy creator",
                    "creator_id":"Policy creator ID",
                    "creator_address":"Ethereum address of the policy creator",
                    "consumer":"Policy consumer",
                    "consumer_id":"Policy consumer ID",
                    "consumer_address":"Ethereum address of the policy consumer",
                    "gas":"Gas fee in wei",
                    "tx_hash":"Transaction hash",
                    "encrypted_pk":"Policy encryption public key",
                    "start_at":"Policy start timestamp",
                    "end_at":"Policy end timestamp",
                    "created_at":"Policy creation timestamp"
                  },
                  ...
              ],
              "total": total count
            }

 */
export const getPoliciesInfo = async (
  policyId?: number,
  creatorId?: string, //ID of the policy creator account
  consumerId?: string, //ID of the policy user account
  policyLabelId?: string, // label id of policy
  pageIndex = 1,
  pageSize = 10
) => {
  // https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%AD%96%E7%95%A5%E4%BF%A1%E6%81%AF%E5%88%97%E8%A1%A8

  const sendData = {
    paginate: {
      page: pageIndex,
      page_size: pageSize
    }
  }

  if (!isBlank(policyId)) {
    sendData['policy_id'] = policyId // center server policyId must be number
  }

  if (!isBlank(policyLabelId)) {
    sendData['policy_label_id'] = policyLabelId
  }

  if (!isBlank(creatorId)) {
    sendData['creator_id'] = creatorId
  }

  if (!isBlank(consumerId)) {
    sendData['consumer_id'] = consumerId
  }

  const settingsData = await getSettingsData()
  sendData['chain_id'] = settingsData.chainId

  const data = await serverPost('/policy/list', sendData)

  return data
}

/**
 * calcurate publish policy server fee (nlk/tnlk): By calling calcPolicyCost
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - the current logined Account object
 * @param {Date} startDate - Start time of file/data usage application in seconds
 * @param {Date} endDate - End time of file/data usage application in seconds
 * @param {number} ursulaShares - Number of service shares
 * @returns {Promise<BigNumber>} - the amount of NLK/TNLK in wei
 */
export const getPolicyTokenCost = async (
  publisher: Account,
  startDate: Date, //policy usage start date
  endDate: Date, //policy usage start date
  ursulaShares: number //URSULA_N_SHARES,
): Promise<BigNumber> => {
  const alice: Alice = await makeAlice(publisher)

  // const startDate: Date = new Date(startSeconds * 1000); //  start_at is seconds, but Date needs milliseconds
  // const endDate: Date = new Date(endSeconds * 1000); //  end_at is seconds, but Date needs milliseconds

  //return wei
  const gasWei = await calcPolicyCost(alice, startDate, endDate, ursulaShares)
  return gasWei
}

/**
 * Calculating service fees (nlk/tnlk) for publishing multiple policys. : By calling calcPolicysCost
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - the current logined Account object
 * @param {Date[]} startDates -  An array of the start time of file/data usage application in seconds
 * @param {Date[]} endDates -  An array of the end time of file/data usage application in seconds
 * @param {number[]} ursulaShares -  An array of the number of service shares
 * @returns {Promise<BigNumber>} - All services fees of the amount of NLK/TNLK in wei
 */
export const getPolicysTokenCost = async (
  publisher: Account,
  startDates: Date[], //policy usage start date
  endDates: Date[], //policy usage start date
  ursulaShares: number[] //URSULA_N_SHARES,
): Promise<BigNumber> => {
  const alice: Alice = await makeAlice(publisher)

  // const startDate: Date = new Date(startSeconds * 1000); //  start_at is seconds, but Date needs milliseconds
  // const endDate: Date = new Date(endSeconds * 1000); //  end_at is seconds, but Date needs milliseconds

  //return wei
  const gasWei = await calcPolicysCost(alice, startDates, endDates, ursulaShares)
  return gasWei
}

/**
 * calcurate publish policy server fee (nlk/tnlk), you can get ether: Web3.utils.fromWei(costGasWei.toNumber().toString(), "ether" )
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} alice - the current logined Account object as file/data publisher
 * @param {Date} startDate - Start time of file/data usage application
 * @param {Date} endDate - End time of file/data usage application
 * @param {number} ursulaShares - Number of service shares
 * @returns {Promise<BigNumber>} - the amount of NLK/TNLK in wei
 */
const calcPolicyCost = async (
  alice: Alice,
  startDate: Date, //policy usage start date
  endDate: Date, //policy usage start date
  ursulaShares: number //URSULA_N_SHARES must be great than 0
): Promise<BigNumber> => {
  if (ursulaShares <= 0) {
    throw new Error('shares must be greater than zero')
  }

  //return wei
  const value = await SubscriptionManagerAgent.getPolicyCost(
    alice.web3Provider.provider, //note: the provider must be nulink network provider
    ursulaShares,
    toEpoch(startDate),
    toEpoch(endDate)
  )

  return value
}

/**
 * Calculating service fees (nlk/tnlk) for publishing multiple policys, you can get ether: Web3.utils.fromWei(costGasWei.toNumber().toString(), "ether" )
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} alice - the current logined Account object as file/data publisher
 * @param {Date[]} startDates - Start time of file/data usage application
 * @param {Date[]} endDates - End time of file/data usage application
 * @param {number[]} ursulaShares - Number of service shares
 * @returns {Promise<BigNumber>} - the amount of NLK/TNLK in wei
 */
const calcPolicysCost = async (
  alice: Alice,
  startDates: Date[], //policy usage start date
  endDates: Date[], //policy usage start date
  ursulaShares: number[] //URSULA_N_SHARES must be great than 0
): Promise<BigNumber> => {
  const startSeconds: number[] = []
  const endSeconds: number[] = []
  for (let index = 0; index < startDates.length; index++) {
    const startDate = startDates[index]
    const endDate = endDates[index]
    startSeconds.push(toEpoch(startDate))
    endSeconds.push(toEpoch(endDate))

    if (ursulaShares[index] <= 0) {
      throw new Error(`index: ${index} ${ursulaShares[index]} shares must be greater than zero`)
    }

    console.log(index, startDate, endDate, ursulaShares[index])
  }

  //return wei
  const value = await SubscriptionManagerAgent.getPolicysCost(
    alice.web3Provider.provider, //note: the provider must be nulink network provider
    ursulaShares,
    startSeconds,
    endSeconds
  )

  return value
}
/**
 * estimate gas fees for sharing files/datas
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - Account the account object of the file/data publisher (Alice)
 * @param {string} userAccountId - the account Id of the file/data publisher (Alice)
 * @param {string} applyId - The application ID returned to the user by the interface when applying to use a specific file/data
 * @param {number} ursulaShares - Number of service shares
 * @param {number} ursulaThreshold - The file/data user can download the file after obtaining the specified number of service data shares
 * @param {Date} startDate - Start date(UTC date) of file/data usage application
 * @param {Date} endDate - End date(UTC date) of file/data usage application
 * @param {BigNumber} serverFee - server fees by call function of `getPolicyServerGasFee`
 * @param {BigNumber} gasPrice - the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
 * @param {string} porterUri - (Optional) the porter service url
 * @returns {Promise<BigNumber>} - the amount of bnb/tbnb in wei
 */
export const estimatePolicyGas = async (
  publisher: Account,
  userAccountId: string, // proposer account id
  applyId: string, // Application Record id
  ursulaShares: number, //n   m of n => 3 of 5
  ursulaThreshold: number, // m
  startDate: Date, //policy usage start date
  endDate: Date, //policy usage start date
  serverFee: BigNumber, //nlk in wei
  gasPrice: BigNumber = BigNumber.from('0'), //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
  porterUri?: string
): Promise<BigNumber> => {
  // calcPolicyEstimateGasFee
  const beingApprovedOrApproved: boolean = await checkDataApprovalStatusIsApprovedOrApproving(applyId)

  if (beingApprovedOrApproved) {
    throw new PolicyHasBeenActivedOnChain('Policy is currently active')
  }

  const resultInfo = await getBlockchainPolicy(
    publisher,
    userAccountId,
    applyId,
    ursulaShares,
    ursulaThreshold,
    startDate,
    endDate,
    porterUri,
    false
  )

  // //enPolicy service fee wei
  // const costServerFeeWei: BigNumber = await calcPolicyCost(
  //   resultInfo.alice,
  //   resultInfo.policyParameters.startDate,
  //   resultInfo.policyParameters.endDate,
  //   resultInfo.policyParameters.shares,
  // );

  // const nlkEther: string = await publisher.getNLKBalance();
  // const nlkWei: string = Web3.utils.toWei(nlkEther, "ether");
  const nlkThresholdWei: string = '10000000000000000000000000'
  const approveNLKwei: string = nlkThresholdWei
  // if(BigNumber.from(nlkThresholdWei).gt(BigNumber.from(nlkWei))){
  //   approveNLKwei = nlkWei;
  // }

  console.log('before estimateApproveNLKGas approveNLK')

  const approveGasInWei: number = await estimateApproveNLKGas(publisher, BigNumber.from(approveNLKwei), serverFee)

  console.log('before policy estimateApproveNLKGas')

  //Note that it takes time to evaluate gas, and since the transfer nlk function is called, it must be approved first
  const txHash: string = await approveNLK(publisher, BigNumber.from(approveNLKwei), serverFee, false)

  console.log('after policy approveNLK txHash:', txHash)

  console.log('before policy estimateCreatePolicyGas ')

  const gasInWei: BigNumber = await resultInfo.blockchainPolicy.estimateCreatePolicyGas(resultInfo.alice, gasPrice)

  console.log('after policy estimateCreatePolicyGas wei:', gasInWei.toString())

  return gasInWei.add(approveGasInWei)
}

/**
 *
 * estimate the gas fee for batch (sharing files/datas) creating policies.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - Account the account object of the file/data publisher (Alice)
 * @param {string[]} userAccountIds - the account Id of the file/data publisher (Alice)
 * @param {string[]} applyIds - The application ID returned to the user by the interface when applying to use a specific file/data
 * @param {number[]} ursulaShares - Number of service shares
 * @param {number[]} ursulaThresholds - The file/data user can download the file/data after obtaining the specified number of service data shares
 * @param {Date[]} startDates - Start date(UTC date) of file/data usage application
 * @param {Date[]} endDates - End date(UTC date) of file/data usage application
 * @param {BigNumber} serverFee - server fees by call function of `getPolicyServerGasFee`
 * @param {BigNumber} gasPrice - the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
 * @param {string} porterUri - (Optional) the porter service url
 * @returns {Promise<BigNumber>} - the amount of bnb/tbnb in wei
 */
export const estimatePolicysGas = async (
  publisher: Account,
  userAccountIds: string[], // proposer account id
  applyIds: string[], // Application Record id
  ursulaShares: number[], //n   m of n => 3 of 5
  ursulaThresholds: number[], // m
  startDates: Date[], //policy usage start date
  endDates: Date[], //policy usage start date
  serverFee: BigNumber, //nlk in wei
  gasPrice: BigNumber = BigNumber.from('0'), //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
  porterUri?: string
): Promise<BigNumber> => {
  // calcPolicyEstimateGasFee
  const approvingAndApprovedApplyIds: string[] = await checkMultiDataApprovalStatusIsApprovedOrApproving(applyIds)

  if (approvingAndApprovedApplyIds.length > 0) {
    throw new PolicyHasBeenActivedOnChain(`Policys ${approvingAndApprovedApplyIds} is currently active`)
  }

  /**
   * {
   *    multiBlockchainPolicy: MultiBlockchainPolicy
   *    strategys: Strategy []
   *    policyParameters: MultiBlockchainPolicyParameters
   *    alice: Alice
   *    ursulasArray: Array<Ursula[]>
   *    publisherAccount: Account
   *  }
   */
  const resultInfo = await getBlockchainPolicys(
    publisher,
    userAccountIds,
    applyIds,
    ursulaShares,
    ursulaThresholds,
    startDates,
    endDates,
    porterUri,
    false
  )

  // //enPolicy service fee wei
  // const costServerFeeWei: BigNumber = await calcPolicyCost(
  //   resultInfo.alice,
  //   resultInfo.policyParameters.startDate,
  //   resultInfo.policyParameters.endDate,
  //   resultInfo.policyParameters.shares,
  // );

  console.log('before estimateApproveNLKGas')
  const approveGasInWei: number = await estimateApproveNLKGas(
    publisher,
    BigNumber.from('10000000000000000000000000'),
    serverFee
  )

  console.log('before multi policy approveNLK')
  //Note that it takes time to evaluate gas, and since the transfer nlk function is called, it must be approved first
  const txHash: string = await approveNLK(publisher, BigNumber.from('10000000000000000000000000'), serverFee, false)
  console.log('after multi policy approveNLK txHash:', txHash)

  console.log('before multi policy estimateCreatePolicyGas ')

  const gasInWei: BigNumber = await resultInfo.multiBlockchainPolicy.estimateCreatePolicysGas(
    resultInfo.alice,
    gasPrice
  )

  console.log('after multi policy estimatePolicyGas wei:', gasInWei.toString())

  return gasInWei.add(approveGasInWei)
}

/**
 * @internal
 */
const getBlockchainPolicy = async (
  publisher: Account,
  userAccountId: string, // proposer account id
  applyId: string, // Application Record ID
  ursulaShares: number, //n   m of n => 3 of 5
  ursulaThreshold: number, // m
  startDate: Date,
  endDate: Date,
  porterUri?: string,
  calcUrsula = true
): Promise<{
  blockchainPolicy: BlockchainPolicy
  strategy: Strategy
  policyParameters: BlockchainPolicyParameters
  alice: Alice
  ursulas: Ursula[]
  publisherAccount: Account
}> => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%89%B9%E5%87%86%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  //return {}

  porterUri = porterUri || (await getPorterUrl())

  const userInfo = (await getAccountInfo(userAccountId)) as object
  // if(!userInfo || isBlank(userInfo))
  // {
  //   Message.error(`get user failed by user id: ${userAccountId}`);
  //   throw new Error(`get user failed by user id: ${userAccountId}`)
  // }
  // assert(userInfo && !isBlank(userInfo));
  if (!userInfo || isBlank(userInfo)) {
    throw new Error(`Failed to retrieve account information from the database for account ID: ${userAccountId}`)
  }
  // console.log("Bob account Info: ", userInfo);
  const alice: Alice = await makeAlice(publisher, porterUri)
  // Note Bob, Enrico's Encrypted PK SK is the same as Verify PK SK.  Alice verify PK can use encrypted PK.

  const bob: RemoteBob = makeRemoteBob(userInfo['encrypted_pk'], userInfo['encrypted_pk']) //userInfo["verify_pk"]);

  // console.log("Bob encrypted_pk: ", userInfo["encrypted_pk"]);
  // console.log("Bob verify_pk: ", userInfo["verify_pk"]);

  //1. get apply policy info
  //return {start_at, end_at, policy_label, policy_label_id, file_owner_id,proposer_id,file_id}
  const policyData = (await getApplyDetails(applyId)) as object
  // assert(policyData && !isBlank(policyData));
  if (!policyData || isBlank(policyData)) {
    throw new Error(`Failed to retrieve policyData information from the database for apply ID: ${applyId}`)
  }

  //2. create policy to block chain
  // const config = await getSettingsData();
  // const porter = new Porter(porterUri);
  const label = policyData['policy_label']
  const threshold = ursulaThreshold //THRESHOLD
  const shares = ursulaShares // SHARES

  // const startDate: Date = new Date();
  // const startMs: number = Date.parse(startDate.toString());
  // const endMs: number = startMs + (policyData["days"] as number) * 24 * 60 * 60 * 1000;
  // const endDate: Date = new Date(endMs); //  start_at is seconds, but Date needs milliseconds

  const policyParameters: BlockchainPolicyParameters = {
    bob: bob,
    label: label,
    threshold: threshold,
    shares: shares,
    startDate: startDate,
    endDate: endDate
  }

  //get ursula start
  let ursulas

  if (calcUrsula) {
    /*   try {
    ursulas = await porter.getUrsulas(shares);
  } catch (e) {
    const info = e as Object;
    if (Object.prototype.hasOwnProperty.call(info, "status") && info["status"].toString().startsWith("2")) {
      //2xx
      // console.log("businsesFlow getUrsulas info['data']", info);
      ursulas = info["data"].result.ursulas;
    } else {
      throw e;
    }
  } */

    let i = 0
    while (i < 3) {
      try {
        ursulas = await getUrsulas(porterUri, shares)
        break
      } catch (error) {
        //http request retry again
        i++

        console.error('getUrsulas: ', error)
        if (i >= 3) {
          console.error('Failed to retrieve Ursula information due to network issues; please try again', error)
          throw new getUrsulaError('Failed to retrieve Ursula information due to network issues; please try again')
        }

        await sleep(1000)
      }
    }

    // console.log("before ursulas:",ursulas);
    try {
      ursulas = ursulas.result.ursulas
    } catch (error) {
      ursulas = ursulas.data.result.ursulas
    }

    //Change the underline naming to small hump naming
    ursulas = humps.camelizeKeys(ursulas)

    // length 66 public string to PublicKey Object
    //now @nulink_network/nulink-ts-crosschain@0.7.0 must be the version 0.7.0
    for (const ursula of ursulas) {
      ursula.encryptingKey = PublicKey.fromBytes(compressPublicKeyBuffer2(ursula.encryptingKey))
    }

    //get ursula end
    // console.log("ursulas:",ursulas);
  }

  const strategy: Strategy | undefined = publisher.getAccountStrategyByStategyId(
    policyData['policy_label_id'] as string
  )
  // console.log("ApprovalUseDatas strategy", strategy);
  // assert(strategy !== undefined);
  if (!strategy || isBlank(strategy)) {
    //` get account strategy failed, label_id ${policyData["policy_label_id"]},\n When you Restore Account, You must Import account Vault data!!!`
    throw new Error(
      `The user's data version is outdated and cannot be imported. Please export the latest data to prevent data loss!`
    )
  }

  // console.log("the account address is:", publisher.address);
  // console.log("the account key is:", pwdDecrypt(publisher.encryptedKeyPair._privateKey, true));

  console.log('before createChainPolicy')
  const policy: BlockchainPolicy = await createChainPolicy(alice, policyParameters, strategy)
  console.log('after createChainPolicy')
  // "@nucypher_network/nucypher-ts": "^0.7.0",  must be this version

  return {
    blockchainPolicy: policy,
    strategy: strategy,
    policyParameters: policyParameters,
    alice: alice,
    ursulas: calcUrsula ? ursulas : [],
    publisherAccount: publisher
  }
}

/**
 * @internal
 */
const getBlockchainPolicys = async (
  publisher: Account,
  userAccountIds: string[], // proposer account ids
  applyIds: string[], // Application Record ids
  ursulaShares: number[], //n   m of n => 3 of 5
  ursulaThresholds: number[], // m
  startDates: Date[],
  endDates: Date[],
  porterUri?: string,
  calcUrsula = true
): Promise<{
  multiBlockchainPolicy: MultiBlockchainPolicy
  strategys: Strategy[]
  policyParameters: MultiBlockchainPolicyParameters
  alice: Alice
  ursulasArray: Array<Ursula[]>
  publisherAccount: Account
}> => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%89%B9%E5%87%86%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  //return {}

  porterUri = porterUri || (await getPorterUrl())

  const userInfos = (await getAccountInfos(userAccountIds)) as object[]

  for (let index = 0; index < userInfos.length; index++) {
    const userInfo = userInfos[index]
    if (!userInfo || isBlank(userInfo)) {
      throw new Error(
        `Failed to retrieve account information from the database for account ID: ${userInfo['account_id']}`
      )
    }
    // console.log("Bob account Info: ", userInfo);
  }

  const alice: Alice = await makeAlice(publisher, porterUri)

  //1. get apply policy info
  //return {start_at, end_at, policy_label, policy_label_id, file_owner_id,proposer_id,file_id}
  const policyDatas = await getMultiApplyDetails(applyIds)
  // assert(policyDatas && !isBlank(policyDatas));
  if (!policyDatas || isBlank(policyDatas)) {
    throw new Error(`Failed to retrieve policyData information from the database for apply ID: ${applyIds}`)
  }

  const maxShares: number = Math.max(...ursulaShares)

  //get ursula start
  let ursulas

  if (calcUrsula) {
    /*   try {
    ursulas = await porter.getUrsulas(shares);
  } catch (e) {
    const info = e as Object;
    if (Object.prototype.hasOwnProperty.call(info, "status") && info["status"].toString().startsWith("2")) {
      //2xx
      // console.log("businsesFlow getUrsulas info['data']", info);
      ursulas = info["data"].result.ursulas;
    } else {
      throw e;
    }
  } */

    let i = 0
    while (i < 3) {
      try {
        ursulas = await getUrsulas(porterUri, maxShares)
        break
      } catch (error) {
        //http request retry again
        i++

        console.error('getUrsulas: ', error)
        if (i >= 3) {
          console.error('Failed to retrieve Ursula information due to network issues; please try again', error)
          throw new getUrsulaError('Failed to retrieve Ursula information due to network issues; please try again')
        }

        await sleep(1000)
      }
    }

    // console.log("before ursulas:",ursulas);
    try {
      ursulas = ursulas.result.ursulas
    } catch (error) {
      ursulas = ursulas.data.result.ursulas
    }

    //Change the underline naming to small hump naming
    ursulas = humps.camelizeKeys(ursulas)

    // length 66 public string to PublicKey Object
    //now @nulink_network/nulink-ts-crosschain@0.7.0 must be the version 0.7.0
    for (const ursula of ursulas) {
      ursula.encryptingKey = PublicKey.fromBytes(compressPublicKeyBuffer2(ursula.encryptingKey))
    }

    //get ursula end
    // console.log("ursulas:",ursulas);
  }

  const bobs: RemoteBob[] = []
  const labels: string[] = []
  const strategys: Strategy[] = []
  const ursulasArray: Array<Ursula[]> = []

  //2. create policy to block chain
  // const config = await getSettingsData();
  // const porter = new Porter(porterUri);
  for (let index = 0; index < policyDatas.length; index++) {
    const policyData = policyDatas[index]
    const label = policyData['policy_label']

    const userInfo = userInfos[index]
    // const startDate: Date = new Date();
    // const startMs: number = Date.parse(startDate.toString());
    // const endMs: number = startMs + (policyData["days"] as number) * 24 * 60 * 60 * 1000;
    // const endDate: Date = new Date(endMs); //  start_at is seconds, but Date needs milliseconds

    // Note Bob, Enrico's Encrypted PK SK is the same as Verify PK SK.  Alice verify PK can use encrypted PK.

    const bob: RemoteBob = makeRemoteBob(userInfo['encrypted_pk'], userInfo['encrypted_pk']) //userInfo["verify_pk"]);

    // console.log("Bob encrypted_pk: ", userInfo["encrypted_pk"]);
    // console.log("Bob verify_pk: ", userInfo["verify_pk"]);

    const strategy: Strategy | undefined = publisher.getAccountStrategyByStategyId(
      policyData['policy_label_id'] as string
    )
    // console.log("ApprovalUseFiles strategy", strategy);
    // assert(strategy !== undefined);
    if (!strategy || isBlank(strategy)) {
      //` get account strategy failed, label_id ${policyData["policy_label_id"]},\n When you Restore Account, You must Import account Vault data!!!`
      throw new Error(
        `The user's data version is outdated and cannot be imported. Please export the latest data to prevent data loss!`
      )
    }

    // console.log("the account address is:", publisher.address);
    // console.log("the account key is:", pwdDecrypt(publisher.encryptedKeyPair._privateKey, true));

    const shares = ursulaShares[index]
    const sharesUrsulas: Ursula[] = getRandomElementsFromArray(ursulas ?? [], shares)

    strategys.push(strategy)
    bobs.push(bob)
    labels.push(label)
    ursulasArray.push(sharesUrsulas)
  }

  const multiBlockchainPolicyParameters: MultiBlockchainPolicyParameters = {
    bobs: bobs,
    labels: labels,
    thresholds: ursulaThresholds,
    shares: ursulaShares,
    startDates: startDates,
    endDates: endDates
  }

  console.log(`getBlockchainPolicys before createMultiChainPolicy`)
  const policy: MultiBlockchainPolicy = await createMultiChainPolicy(alice, multiBlockchainPolicyParameters, strategys)
  console.log(`getBlockchainPolicys after createMultiChainPolicy`)
  // "@nucypher_network/nucypher-ts": "^0.7.0",  must be this version

  return {
    multiBlockchainPolicy: policy,
    strategys: strategys,
    policyParameters: multiBlockchainPolicyParameters,
    alice: alice,
    ursulasArray: ursulasArray,
    publisherAccount: publisher
  }
}

/**
 * Check if the application status is "under review" or "approved"
 * @param {string} applyId - string | number
 * @returns  Promise<boolean>
 */
export const checkDataApprovalStatusIsApprovedOrApproving = async (applyId: string | number): Promise<boolean> => {
  //Query whether the approval status is being approved or approving
  const data = (await getApplyDetails(applyId as string)) as any

  if (data && [2, 4].includes(data?.status)) {
    //2: approved , 4: approving
    return true
  }

  return false
}

/**
 * Check whether the status of multiple applications is "under review" or "approved".
 * @param {string[]} applyIds - string[]| number[]
 * @returns  Promise<string[]> -- return a list of applyIds that are not in the "pending approval" and "approved" statuses.
 */
export const checkMultiDataApprovalStatusIsApprovedOrApproving = async (
  applyIds: string[] | number[]
): Promise<string[]> => {
  //Query whether the approval status is being approved or approving
  const policyDatas = await getMultiApplyDetails(applyIds as string[])

  if (!policyDatas || isBlank(policyDatas)) {
    throw new Error(`Failed to retrieve policyData information from the database for apply ID: ${applyIds}`)
  }

  const approveApplyIds: string[] = []
  for (let index = 0; index < policyDatas.length; index++) {
    const policyData = policyDatas[index] as object
    if (policyDatas && [2, 4].includes((policyData as any)?.status)) {
      //2: approved , 4: approving
      approveApplyIds.push(applyIds[index] as string)
    }
  }

  return approveApplyIds
}

/**
 * Approval of application for use of Files/Datas, This account acts as Publisher (Alice) grant
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - Account the current account object
 * @param {string} userAccountId - string
 * @param {string} applyId - string
 * @param {number} ursulaShares - number
 * @param {number} ursulaThreshold - number
 * @param {Date} startDate - policy usage start date
 * @param {Date} endDate - policy usage end date
 * @param {string} remark - (Optional)
 * @param {string} porterUri - (Optional) the porter services url
 * @param {BigNumber} gasFeeInWei - (Optional) by call 'getPolicyGasFee', must be the token of the chain (e.g. bnb), not be the nlk
 * @param {BigNumber} gasPrice - (Optional) the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
 * @returns {object} - {
 *                       txHash: 'the transaction hash of the "approve" transaction',
 *                       from: 'publisher.address'
 *                     }
 */
export const approvalApplicationForUseDatas = async (
  publisher: Account,
  userAccountId: string, // proposer account id
  applyId: string, // Application Record ID
  ursulaShares: number, //n   m of n => 3 of 5
  ursulaThreshold: number, // m
  startDate: Date, //policy usage start date
  endDate: Date, //policy usage end date
  remark = '', //remark
  porterUri = '',
  //To handle whole numbers, Wei can be converted using BigNumber.from(), and Ether can be converted using ethers.utils.parseEther(). It's important to note that BigNumber.from("1.2") cannot handle decimal numbers (x.x).
  gasFeeInWei: BigNumber = BigNumber.from('0'), //must be the token of the chain (e.g. bnb), not be the nlk
  gasPrice: BigNumber = BigNumber.from('0') //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%89%B9%E5%87%86%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  //return { txHash: enPolicy.txHash, from: publisher.address , data }

  // console.log("the account address is:", publisher.address);
  // console.log("the account key is:", pwdDecrypt(publisher.encryptedKeyPair._privateKey, true));

  const beingApprovedOrApproved: boolean = await checkDataApprovalStatusIsApprovedOrApproving(applyId)

  if (beingApprovedOrApproved) {
    throw new PolicyHasBeenActivedOnChain('Policy is currently active')
  }

  const resultInfo = await getBlockchainPolicy(
    publisher,
    userAccountId,
    applyId,
    ursulaShares,
    ursulaThreshold,
    startDate, //policy usage start date
    endDate, //policy usage start date
    porterUri
  )

  //Ensure that the BNB balance is greater than the GAS fee balance
  const balance: BigNumber = await getBalance(publisher.address)
  const chainConfigInfo = await getSettingsData()

  console.log(`the account token balance is: ${balance.toString()} wei ${chainConfigInfo.token_symbol}`)
  console.log(`the create policy gas fee is: ${gasFeeInWei.toString()} wei ${chainConfigInfo.token_symbol}`)

  if (!gasFeeInWei.lte(BigNumber.from('0')) && balance.lt(gasFeeInWei)) {
    const balanceValue = Web3.utils.fromWei(balance.toString(), 'ether')
    const gasValue = Web3.utils.fromWei(gasFeeInWei.toString(), 'ether')
    // Message.error(
    //   `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.token_symbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`,
    // );
    console.log(
      `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.token_symbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`
    )
    throw new InsufficientBalanceError(
      `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.token_symbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`
    )
  }

  //enPolicy service fee gas wei
  const costServerFeeWei: BigNumber = await calcPolicyCost(
    resultInfo.alice,
    resultInfo.policyParameters.startDate,
    resultInfo.policyParameters.endDate,
    resultInfo.policyParameters.shares
  )

  const txHashOrEmpty: string = await approveNLK(
    publisher,
    BigNumber.from('10000000000000000000000000'),
    costServerFeeWei,
    false
  )

  // eslint-disable-next-line no-extra-boolean-cast
  console.log(
    !txHashOrEmpty
      ? `approvalApplicationForUseDatas no need approve nlk`
      : `approvalApplicationForUseDatas approveNLK txHash: ${txHashOrEmpty}`
  )

  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey()

  if (curNetwork === NETWORK_LIST.Horus) {
    //only mainnet can get nlk balance. if not crosschain mainnet, no nlk token, no need get nlk balance

    //wei can use  BigNumber.from(), ether can use ethers.utils.parseEther(), because the BigNumber.from("1.2"), the number can't not be decimals (x.x)
    //await publisher.getNLKBalance() return ethers
    //Check whether the account balance is less than the policy creation cost
    const nlkBalanceEthers: BigNumber = ethers.utils.parseEther((await publisher.getNLKBalance()) as string)
    const costServerGasEther = Web3.utils.fromWei(costServerFeeWei.toString(), 'ether')

    console.log(`the account balance is: ${nlkBalanceEthers.toString()} ether nlk`)
    console.log(`the create policy server fee is: ${costServerGasEther.toString()} ether nlk`)

    //Don't forget the mint fee (service charge), so use the method lte, not le
    if (nlkBalanceEthers.lt(costServerFeeWei)) {
      // Message.error(
      //   `The account ${publisher.address} balance of ${nlkBalanceEthers} ether in [token] ${chainConfigInfo.nlk_token_symbol} is insufficient to publish policy with a value of ${costServerGasEther} ether`,
      // );
      console.log(
        `The account ${publisher.address} balance of ${nlkBalanceEthers} ether in [token] ${chainConfigInfo.nlk_token_symbol} is insufficient to publish policy with a value of ${costServerGasEther} ether`
      )
      throw new InsufficientBalanceError(
        `The account ${publisher.address} balance of ${nlkBalanceEthers} ether in [token] ${chainConfigInfo.nlk_token_symbol} is insufficient to publish policy with a value of ${costServerGasEther} ether`
      )
    }
  } //end of if (curNetwork === NETWORK_LIST.Horus)

  // "@nucypher_network/nucypher-ts": "^0.7.0",  must be this version
  console.log('before policy enact')
  const waitReceipt = false

  const web3: Web3 = await getWeb3()
  const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] = DecimalToInteger(GAS_PRICE_FACTOR)

  //estimatedGas * gasPrice * factor
  if (gasPrice.lte(BigNumber.from('0'))) {
    // the gasPrice is obtained in real time
    gasPrice = BigNumber.from(await web3.eth.getGasPrice())
    gasPrice = gasPrice.mul(GAS_PRICE_FACTOR_LEFT).div(GAS_PRICE_FACTOR_RIGHT)
  } else {
    //If the gasPrice is manually set, the GAS_PRICE_FACTOR is not set
  }

  const _gasPrice = gasPrice

  const gasLimit: BigNumber = gasFeeInWei.gt(BigNumber.from('0')) ? gasFeeInWei.div(_gasPrice) : BigNumber.from('0')
  const enPolicy: EnactedPolicy = await resultInfo.blockchainPolicy.enact(
    resultInfo.ursulas,
    waitReceipt,
    gasLimit,
    _gasPrice
  )
  console.log('after policy enact')
  // // Persist side-channel
  // const aliceVerifyingKey: PublicKey = alice.verifyingKey;
  // const policyEncryptingKey: PublicKey = enPolicy.policyKey;

  const encryptedTreasureMap: EncryptedTreasureMap = enPolicy.encryptedTreasureMap
  const encryptedTreasureMapBytes: Uint8Array = encryptedTreasureMap.toBytes()

  //3. upload encrypt files to IPFS
  const encryptedTreasureMapIPFS: string = await StorageManager.setData([encryptedTreasureMapBytes], publisher)[0]

  //4. call center server to save policy info
  const crossChainHrac: CrossChainHRAC = enPolicy.id

  const hracBytes = crossChainHrac.toBytes()

  const sendData: any = {
    account_id: publisher.id,
    apply_id: Number(applyId),
    remark: remark,
    policy: {
      hrac: hexlify(crossChainHrac.toBytes() /* Uint8Array[]*/), //fromBytesByEncoding(crossChainHrac.toBytes(), 'binary'),
      gas: costServerFeeWei.toString(),
      tx_hash: enPolicy.txHash,
      encrypted_address: encryptedTreasureMapIPFS,
      encrypted_pk: resultInfo.strategy.strategyKeyPair._publicKey //policy_encrypted_pk
    }
  }
  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData)
  //V1->V2: The background approve logic changes to: store tx_hash to a table , and then execute approve operator after listening for an on-chain event
  const data = await serverPost('/apply/approve', sendData)
  return Object.assign({ txHash: enPolicy.txHash, from: publisher.address }, data || { info: 'succeed' })
}

/**
 * Approval of applications for use of Files/Datas, This account acts as Publisher (Alice) grant. The batch version of the function refusalApplicationForUseDatas.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - Account the current account object
 * @param {string[]} userAccountIds - string
 * @param {string[]} applyIds - string
 * @param {number[]} ursulaShares - number
 * @param {number[]} ursulaThresholds - number
 * @param {Date[]} startDates - policy usage start date
 * @param {Date[]} endDates - policy usage end date
 * @param {string} remark - (Optional)
 * @param {string} porterUri - (Optional) the porter services url
 * @param {BigNumber} gasFeeInWei - (Optional) by call 'getPolicysGasFee', must be the token of the chain (e.g. bnb), not be the nlk
 * @param {BigNumber} gasPrice - (Optional) the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
 * @returns {object} - {
 *                       txHash: 'the transaction hash of the "approve" transaction',
 *                       from: 'publisher.address'
 *                     }
 */
export const approvalApplicationsForUseDatas = async (
  publisher: Account,
  userAccountIds: string[], // proposer account id
  applyIds: string[], // Application Record ID
  ursulaShares: number[], //n   m of n => 3 of 5
  ursulaThresholds: number[], // m
  startDates: Date[], //policy usage start date
  endDates: Date[], //policy usage end date
  remark = '', //remark
  porterUri = '',
  //To handle whole numbers, Wei can be converted using BigNumber.from(), and Ether can be converted using ethers.utils.parseEther(). It's important to note that BigNumber.from("1.2") cannot handle decimal numbers (x.x).
  gasFeeInWei: BigNumber = BigNumber.from('0'), //must be the token of the chain (e.g. bnb), not be the nlk
  gasPrice: BigNumber = BigNumber.from('0') //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%89%B9%E5%87%86%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  //return { txHash: enPolicy.txHash, from: publisher.address , data }

  // console.log("the account address is:", publisher.address);
  // console.log("the account key is:", pwdDecrypt(publisher.encryptedKeyPair._privateKey, true));

  const approvingAndApprovedApplyIds: string[] = await checkMultiDataApprovalStatusIsApprovedOrApproving(applyIds)

  if (approvingAndApprovedApplyIds.length > 0) {
    throw new PolicyHasBeenActivedOnChain(`Policys ${approvingAndApprovedApplyIds} is currently active`)
  }

  const resultInfo = await getBlockchainPolicys(
    publisher,
    userAccountIds,
    applyIds,
    ursulaShares,
    ursulaThresholds,
    startDates, //policy usage start date
    endDates, //policy usage start date
    porterUri
  )

  //Ensure that the BNB balance is greater than the GAS fee balance
  const balance: BigNumber = await getBalance(publisher.address)
  const chainConfigInfo = await getSettingsData()

  console.log(`the account token balance is: ${balance.toString()} wei ${chainConfigInfo.token_symbol}`)
  console.log(`the create policy gas fee is: ${gasFeeInWei.toString()} wei ${chainConfigInfo.token_symbol}`)

  if (!gasFeeInWei.lte(BigNumber.from('0')) && balance.lt(gasFeeInWei)) {
    const balanceValue = Web3.utils.fromWei(balance.toString(), 'ether')
    const gasValue = Web3.utils.fromWei(gasFeeInWei.toString(), 'ether')
    // Message.error(
    //   `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.token_symbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`,
    // );
    console.log(
      `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.token_symbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`
    )
    throw new InsufficientBalanceError(
      `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.token_symbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`
    )
  }

  const costServerFeeWei: BigNumber = BigNumber.from('0')

  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey()

  if (curNetwork === NETWORK_LIST.Horus) {
    //only mainnet can get nlk balance. if not crosschain mainnet, no nlk token, no need get nlk balance

    //enPolicy service fee gas wei
    const costServerFeeWei: BigNumber = await calcPolicysCost(
      resultInfo.alice,
      resultInfo.policyParameters.startDates,
      resultInfo.policyParameters.endDates,
      resultInfo.policyParameters.shares
    )

    const txHashOrEmpty: string = await approveNLK(
      publisher,
      BigNumber.from('10000000000000000000000000'),
      costServerFeeWei,
      false
    )

    // eslint-disable-next-line no-extra-boolean-cast
    console.log(
      !txHashOrEmpty
        ? `approvalApplicationForUseDatas no need approve nlk`
        : `approvalApplicationForUseDatas approveNLK txHash: ${txHashOrEmpty}`
    )

    //wei can use  BigNumber.from(), ether can use ethers.utils.parseEther(), because the BigNumber.from("1.2"), the number can't not be decimals (x.x)
    //await publisher.getNLKBalance() return ethers
    //Check whether the account balance is less than the policy creation cost
    const nlkBalanceEthers: BigNumber = ethers.utils.parseEther((await publisher.getNLKBalance()) as string)
    const costServerGasEther = Web3.utils.fromWei(costServerFeeWei.toString(), 'ether')

    console.log(`the account balance is: ${nlkBalanceEthers.toString()} ether nlk`)
    console.log(`the create policy server fee is: ${costServerGasEther.toString()} ether nlk`)

    //Don't forget the mint fee (service charge), so use the method lte, not le
    if (nlkBalanceEthers.lt(costServerFeeWei)) {
      // Message.error(
      //   `The account ${publisher.address} balance of ${nlkBalanceEthers} ether in [token] ${chainConfigInfo.nlk_token_symbol} is insufficient to publish policy with a value of ${costServerGasEther} ether`,
      // );
      console.log(
        `The account ${publisher.address} balance of ${nlkBalanceEthers} ether in [token] ${chainConfigInfo.nlk_token_symbol} is insufficient to publish policy with a value of ${costServerGasEther} ether`
      )
      throw new InsufficientBalanceError(
        `The account ${publisher.address} balance of ${nlkBalanceEthers} ether in [token] ${chainConfigInfo.nlk_token_symbol} is insufficient to publish policy with a value of ${costServerGasEther} ether`
      )
    }
  } //end of if (curNetwork === NETWORK_LIST.Horus)

  // "@nucypher_network/nucypher-ts": "^0.7.0",  must be this version
  console.log('before multi policy enact')
  const waitReceipt = false

  const web3: Web3 = await getWeb3()

  const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] = DecimalToInteger(GAS_PRICE_FACTOR)

  //estimatedGas * gasPrice * factor
  if (gasPrice.lte(BigNumber.from('0'))) {
    // the gasPrice is obtained in real time
    gasPrice = BigNumber.from(await web3.eth.getGasPrice())
    gasPrice = gasPrice.mul(GAS_PRICE_FACTOR_LEFT).div(GAS_PRICE_FACTOR_RIGHT)
  } else {
    //If the gasPrice is manually set, the GAS_PRICE_FACTOR is not set
  }

  const _gasPrice = gasPrice

  const gasLimit: BigNumber = gasFeeInWei.gt(BigNumber.from('0')) ? gasFeeInWei.div(_gasPrice) : BigNumber.from('0')
  //MultiPreEnactedPolicy
  const enMultiPolicy: MultiEnactedPolicy = await resultInfo.multiBlockchainPolicy.enact(
    resultInfo.ursulasArray,
    waitReceipt,
    gasLimit,
    _gasPrice
  )

  console.log('after mulit policy enact')
  // // Persist side-channel
  // const aliceVerifyingKey: PublicKey = alice.verifyingKey;
  // const policyEncryptingKey: PublicKey = enPolicy.policyKey;

  const encryptedTreasureMapBytesArray: Uint8Array[] = enMultiPolicy.encryptedTreasureMaps.map((encryptedTreasureMap) =>
    encryptedTreasureMap.toBytes()
  )

  const encryptedTreasureMapIPFSs: string[] = []

  //3. upload multiple encrypt files to IPFS
  const cids: string[] = await StorageManager.setData(encryptedTreasureMapBytesArray, publisher)
  encryptedTreasureMapIPFSs.push(...cids)

  //4. call center server to save policy info
  const policy_list: object[] = []
  const crossChainHracs: CrossChainHRAC[] = enMultiPolicy.ids

  for (let index = 0; index < crossChainHracs.length; index++) {
    const crossChainHrac: CrossChainHRAC = crossChainHracs[index]

    policy_list.push({
      hrac: hexlify(crossChainHrac.toBytes() /* Uint8Array[]*/), //fromBytesByEncoding(crossChainHrac.toBytes(), 'binary'),
      gas: costServerFeeWei.toString(),
      tx_hash: enMultiPolicy.txHash,
      encrypted_address: encryptedTreasureMapIPFSs[index],
      encrypted_pk: resultInfo.strategys[index].strategyKeyPair._publicKey //policy_encrypted_pk
    })
  }

  const sendData: any = {
    account_id: publisher.id,
    apply_ids: applyIds.map((applyId) => Number(applyId)),
    remark: remark,
    policy_list: policy_list
  }
  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData)
  //V1->V2: The background approve logic changes to: store tx_hash to a table , and then execute approve operator after listening for an on-chain event
  const data = await serverPost('/apply/batch-approve', sendData)
  return Object.assign({ txHash: enMultiPolicy.txHash, from: publisher.address }, data || { info: 'succeed' })
}

/**
 * Rejects the application for the use of files/datas. This account acts as the publisher (Alice).
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - The account of the publisher (Alice).
 * @param {string} applyId - The application apply ID to reject.
 * @param {string} remark - (Optional) Additional remarks for the rejection. Default is an empty string.
 * @returns {Promise<void>}
 */
export const refusalApplicationForUseDatas = async (
  publisher: Account,
  applyId: string, // Application Record ID
  remark = '' //remark
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%8B%92%E7%BB%9D%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  const sendData: any = {
    account_id: publisher.id,
    apply_id: Number(applyId),
    remark: remark
  }

  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData)
  const data = await serverPost('/apply/reject', sendData)
  return data
}

/**
 * Rejects the applications for the use of files/datas. This account acts as the publisher (Alice). The batch version of the function refusalApplicationForUseDatas.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisher - The account of the publisher (Alice).
 * @param {string[]} applyIds - The application apply ID to reject.
 * @param {string} remark - (Optional) Additional remarks for the rejection. Default is an empty string.
 * @returns {Promise<void>}
 */
export const refusalApplicationsForUseDatas = async (
  publisher: Account,
  applyIds: string[], // Application Record ID
  remark = '' //remark
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%8B%92%E7%BB%9D%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  const sendData: any = {
    account_id: publisher.id,
    apply_ids: applyIds.map((applyId) => Number(applyId)),
    remark: remark
  }

  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData)
  const data = await serverPost('/apply/batch-reject', sendData)
  return data
}

/**
 * Gets the file/data information associated with the published policy (so the policy has been published)
 * @param {string} policyId - policyId
 * @param {string} policyPublisherId - (Optional) The account id of the file/data publisher, acting as the role of file publisher
 * @param {string} policyUserId - (Optional) The account id of the file/data user, acting as the role of file applicant
 *                        Only one of the two parameters, "policyPublisherId" and "policyUserId", can be selected, or neither of them can be passed
 * @param {number} pageIndex - (Optional) number default 1
 * @param {number} pageSize - (Optional) number default 10
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "File ID",
                    "file_name": "File name",
                    "owner": "File owner",
                    "owner_id": "File owner account ID",
                    "owner_avatar": "File owner avatar",
                    "address": "File address",
                    "thumbnail": "File thumbnail",
                    "created_at": "File upload timestamp",
                    "policy_id": "Policy ID",
                    "policy_hrac": "Policy HRAC",
                    "policy_start_at": "Policy start timestamp",
                    "policy_end_at": "Policy end timestamp",
                  },
                  ...
              ],
              "total": total count
            }
 */
export const getDataInfosByPolicyId = async (
  policyId: string, // filter policyLabelId
  policyPublisherId?: string, // policy publisher id, This account acts as Alice account.id
  policyUserId?: string, // policy user id,This account acts as Bob account.id
  pageIndex = 1,
  pageSize = 10
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E8%8E%B7%E5%8F%96%E7%AD%96%E7%95%A5%E5%85%B3%E8%81%94%E7%9A%84%E6%96%87%E4%BB%B6%E4%BF%A1%E6%81%AF%E5%88%97%E8%A1%A8

  const sendData = {
    policy_id: policyId,
    paginate: {
      page: pageIndex,
      page_size: pageSize
    }
  }

  if (!isBlank(policyPublisherId)) {
    sendData['creator_id'] = policyPublisherId
  }

  if (!isBlank(policyUserId)) {
    sendData['consumer_id'] = policyUserId
  }

  const settingsData = await getSettingsData()
  sendData['chain_id'] = settingsData.chainId

  const data = await serverPost('/policy/file-detail-list', sendData)
  return data
}

/**
 * (Revoke)Undoes published policies, the account as publisher (Alice)
 * action: Cancel the policy and delete the association between the file and the policy and the application for using all files corresponding to the policy,the policy label records can not be delete
 * notice: the policy must be pulished can be revoked, otherwise(the policy not published)
 * revoke the apply of use files by call the api revokePermissionApplicationOfDatas
 * @internal
 * @param publisher
 * @param userAccountId
 * @param policyId
 * @returns {Promise<void>}
 */
export const revokePublishedPolicies = async (publisher: Account, userAccountId: string, policyId: string) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%92%A4%E9%94%80%E7%AD%96%E7%95%A5

  //TODO: Current version not supported

  //TODO: 1. revoke the contract on blockchain
  throw new Error(' Current version not supported')

  //2. center server revoke the policy info etc.
  const sendData: any = {
    account_id: publisher.id, //policy have published
    cousumer_id: userAccountId,
    policy_id: policyId
  }

  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData)
  const data = await serverPost('/policy/revoke', sendData)
  return data
}

/**
 * Gets the content of an approved file/data, which can be downloaded. The input parameter is obtained by calling getApprovedDatasAsUser (Account).
 * @category File/Data User(Bob) Interface
 * @param {Account} userAccount - The current account information.
 * @param {string} policyEncryptingKey - The policy encrypting key used to encrypt the file/data.
 * @param {string} aliceVerifyingKey - The Alice verifying key used to verify the policy.
 * @param {string} dataIPFSAddress - The IPFS address of the file/data to download.
 * @param {string} encryptedTreasureMapIPFSAddress - The IPFS address of the encrypted treasure map.
 * @param {string} porterUri - The URI of the porter node. Default is undefined, and will be retrieved from the API.
 * @returns {Promise<ArrayBuffer>} - Returns the file/data content as an ArrayBuffer.
 */
export const getDataContentAsUser = async (
  userAccount: Account,
  policyEncryptingKey: string,
  aliceVerifyingKey: string, //note: adapter nucypher-ts ,this input parameter should be aliceEncryptedKey string
  dataIPFSAddress: string,
  encryptedTreasureMapIPFSAddress: string,
  crossChainHrac: CrossChainHRAC,
  porterUri?: string
): Promise<ArrayBuffer> => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%92%A4%E9%94%80%E7%AD%96%E7%95%A5
  //return {}

  if (isBlank(encryptedTreasureMapIPFSAddress)) {
    console.error(
      'get Encrypted failed! Please check if the document has expired. If it has expired, please reapply for its use! error: encryptedTreasureMapIPFSAddress is invalid: ',
      encryptedTreasureMapIPFSAddress
    )
    throw new DecryptError(
      'get Encrypted failed! Please check if the document has expired. If it has expired, please reapply for its use!'
    )
  }

  porterUri = porterUri || (await getPorterUrl())

  const bob: Bob = await makeBob(userAccount, porterUri)
  // console.log("Bob userAccount: ", userAccount);
  // console.log("porterUri: ", porterUri);
  //getFileContent from IPFS
  const fileIpfsData: Uint8Array | null | undefined /*| Buffer*/ = await StorageManager.getData(dataIPFSAddress)

  // console.log("fileIpfsData: ", fileIpfsData);

  if (isBlank(fileIpfsData)) {
    throw new GetStorageDataError(`get encrypted data error! key: ${fileIpfsData}`)
  }

  const encryptedMessage: MessageKit = MessageKit.fromBytes(fileIpfsData as Uint8Array)
  const encryptedTreasureMapIpfsData: Uint8Array | null | undefined /*| Buffer*/ = await StorageManager.getData(
    encryptedTreasureMapIPFSAddress
  )

  if (isBlank(encryptedTreasureMapIpfsData)) {
    throw new GetStorageDataError(`get encrypted TreasureMap data error! key: ${encryptedTreasureMapIPFSAddress}`)
  }
  // console.log("encryptedTreasureMapIpfsData: ", encryptedTreasureMapIpfsData);
  const encryptedTreasureMap: EncryptedTreasureMap = EncryptedTreasureMap.fromBytes(
    encryptedTreasureMapIpfsData as Uint8Array
  )

  // console.log("encryptedMessage: ", encryptedMessage);
  // console.log("encryptedTreasureMap: ", encryptedTreasureMap);
  // console.log("policyEncryptingKey: ", policyEncryptingKey);
  // console.log("compressed policyEncryptingKey: ", compressPublicKeyBuffer(policyEncryptingKey));
  // console.log("aliceVerifyingKey: ", aliceVerifyingKey);
  // console.log("compressed aliceVerifyingKey: ", compressPublicKeyBuffer(aliceVerifyingKey));

  // console.log("before retrievedMessage");

  const retrievedMessage = await bob.retrieveAndDecrypt(
    PublicKey.fromBytes(compressPublicKeyBuffer(policyEncryptingKey)),
    PublicKey.fromBytes(compressPublicKeyBuffer(aliceVerifyingKey)),
    [encryptedMessage],
    encryptedTreasureMap,
    crossChainHrac
  )

  // console.log("retrievedMessage: ", retrievedMessage);

  return retrievedMessage[0].buffer

  //const bobPlaintext = Buffer.from(retrievedMessage[0].buffer).toString('binary');
  // const bobPlaintext = fromBytes(retrievedMessage[0]);
  // console.log("bobPlaintext: ", bobPlaintext);
}

/**
 * Get approved document content (downloadable). The file/data applicant retrieves the content of a file/data that has been approved for their usage.
 * @category File/Data User(Bob) Interface
 * @param {Account} userAccount - Account the current account object
 * @param {string} dataId - file/data's id
 * @returns {Promise<ArrayBuffer>}
 */
export const getDataContentByDataIdAsUser = async (userAccount: Account, dataId: string): Promise<ArrayBuffer> => {
  //get file info
  const data = (await getDataDetails(dataId, userAccount.id)) as object

  assert(data && !isBlank(data))

  const policyEncryptingKey = data['policy_encrypted_pk']
  const aliceVerifyingKey = data['alice_verify_pk']
  const fileIPFSAddress = data['file_ipfs_address']
  const encryptedTreasureMapIPFSAddress = data['encrypted_treasure_map_ipfs_address']

  // hexlify: Convert a byte array to a hexadecimal encoded string -> arrayify: Convert a hexadecimal encoded string back to a byte array
  const crossChainHrac: CrossChainHRAC = CrossChainHRAC.fromBytes(arrayify(data['hrac']))

  return getDataContentAsUser(
    userAccount,
    policyEncryptingKey,
    aliceVerifyingKey,
    fileIPFSAddress,
    encryptedTreasureMapIPFSAddress,
    crossChainHrac
  )
}

/**
 * The file publisher obtains the content of the file
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} userAccount - Account the current account object
 * @param {string} fileId - file's id
 * @returns {Promise<ArrayBuffer>}
 */
export const getFileContentByFileIdAsPublisher = async (userAccount: Account, fileId: string): Promise<ArrayBuffer> => {
  //get file info
  const data = (await getDataDetails(fileId, userAccount.id)) as object

  assert(data && !isBlank(data))

  const policyEncryptingKey = data['policy_encrypted_pk'] || ''
  const aliceVerifyingKey = data['alice_verify_pk'] || '' //account.encryptedKeyPair._publicKey
  const fileIPFSAddress = data['file_ipfs_address']

  //Firstcheck whether the file belongs to the user
  if (userAccount.encryptedKeyPair._publicKey.toLowerCase() !== aliceVerifyingKey.toLowerCase()) {
    throw new Error('Illegal request: you must be the file uploader to decrypt') // data recovery failed
  }

  let strategyPrivatekey: string | null = null
  //find the strategy private key for decrypt
  const strategys: Strategy[] = userAccount.getAllStrategy()
  for (let index = 0; index < strategys.length; index++) {
    const strategy = strategys[index]
    if (strategy.strategyKeyPair._publicKey.toLowerCase() === policyEncryptingKey.toLowerCase()) {
      strategyPrivatekey = strategy.strategyKeyPair._privateKey
      break
    }
  }

  if (!strategyPrivatekey) {
    throw new Error('Failed to obtain strategy information') // data recovery failed
  }

  //getFileContent from IPFS
  const fileIpfsData: Uint8Array | null | undefined /*| Buffer*/ = await StorageManager.getData(fileIPFSAddress)

  if (isBlank(fileIpfsData)) {
    throw new GetStorageDataError(`publisher get encrypted data error! key: ${fileIpfsData}`)
  }

  // console.log("fileIpfsData: ", fileIpfsData);
  const encryptedMessage: MessageKit = MessageKit.fromBytes(fileIpfsData as Uint8Array)

  const privateKeyString = pwdDecrypt(strategyPrivatekey as string, true)
  // console.log("makeBob BobEncrypedPrivateKey: ",privateKeyString);

  // notice: bacause the encryptedMessage.decrypt( get by MessageKit) use the SecretKey import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e

  const secretKey = NucypherTsSecretKey.fromBytes(privateKeyBuffer(privateKeyString))
  const plainText: Uint8Array = encryptedMessage.decrypt(secretKey)

  return plainText.buffer
}

/**
 * Gets the details of an application record.
 * @param {string} applyId - The ID of the application record.
 * @returns {Promise<object>} - Returns an object containing the details of the application record, or null if the record does not exist.
 *              {
 *                start_at:  "The start timestamp of the application",
 *                end_at: "The end timestamp of the application",
 *                policy_label: "The label of the policy",
 *                policy_label_id: "The ID of the policy label",
 *                days: "days",
 *                status: "apply status: 1 - In progress, 2 - Approved, 3 - Rejected, 4 - Under review, 5 - Expired"
 *              }
 */
export const getApplyDetails = async (applyId: string) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%94%B3%E8%AF%B7%E8%AF%A6%E6%83%85

  const sendData = {
    apply_id: Number(applyId)
  }

  try {
    const data = (await serverPost('/apply/detail', sendData)) as object
    return data
  } catch (error: any) {
    if (error?.data?.code === 4006) {
      //"apply does not exist"
      return null
    }

    console.error(`getApplyDetails error apply id ${applyId}`, error?.data?.msg || error?.message || error)
    throw error
  }
}

/**
 * Gets the details of multiple application records.
 * @param {string []} applyId - The ID of the application record.
 * @returns {Promise<object[]>} - Returns an array object containing the multiple details of the application record, or null if the record does not exist.
 *              {
 *                start_at:  "The start timestamp of the application",
 *                end_at: "The end timestamp of the application",
 *                policy_label: "The label of the policy",
 *                policy_label_id: "The ID of the policy label",
 *                days: "days",
 *                status: "apply status: 1 - In progress, 2 - Approved, 3 - Rejected, 4 - Under review, 5 - Expired"
 *              }
 */
export const getMultiApplyDetails = async (applyIds: string[]): Promise<object[] | null> => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%94%B3%E8%AF%B7%E8%AF%A6%E6%83%85

  const sendData = {
    apply_ids: applyIds.map((applyId) => Number(applyId))
  }

  try {
    const data = (await serverPost('/apply/batch-detail', sendData)) as object

    const dataDict: object = data['list']
    if (isBlank(dataDict)) {
      return []
    }
    const retList: object[] = []
    for (let index = 0; index < applyIds.length; index++) {
      const applyId: string = applyIds[index]
      if (applyId in dataDict) {
        retList.push(dataDict[applyId])
      } else {
        retList.push({})
      }
    }

    return retList
  } catch (error: any) {
    if (error?.data?.code === 4006) {
      //"apply does not exist"
      return null
    }

    console.error(`getMultiApplyDetails error apply ids: ${applyIds}`, error?.data?.msg || error?.message || error)
    throw error
  }
}

/**
  * Retrieves the details of a file/data (include apply file/data info, file/data info, about policy info) by its ID and user account ID.
  * @param {string} dataId - The ID of the file/data to retrieve details for.
  * @param {string} fileUserAccountId - This parameter passes the file/data finder when the file/data consumer is not known, fileUserAccountId should be passed the current account I
  * @returns {Promise<object>} - The returned object contains the following properties:
                    {
                    file_id: string,
                    file_name: string,
                    thumbnail: string,
                    file_created_at: number,
                    apply_id: string,
                    status: number, "Application status, where 0 means not applied, 1 means in progress, 2 approved, and 3 means rejected"
                    apply_start_at: number,
                    apply_end_at: number,
                    apply_created_at: number,
                    policy_id: string,
                    hrac: string,
                    creator: string,
                    creator_id: string,
                    consumer: string,
                    consumer_id: string,
                    gas: number,
                    tx_hash: string,
                    policy_created_at: number,
                    file_ipfs_address: string,
                    policy_encrypted_pk: string,
                    encrypted_treasure_map_ipfs_address: string,
                    alice_verify_pk: string
                    }
*/
export const getDataDetails = async (dataId: string, fileUserAccountId: string) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%96%87%E4%BB%B6%E8%AF%A6%E6%83%85
  //status: 0 => not applied (Initial state), 1=> Application in progress, 2 =>approved, 3=> rejected

  const sendData = {
    file_id: dataId,
    consumer_id: fileUserAccountId
  }

  const settingsData = await getSettingsData()
  sendData['chain_id'] = settingsData.chainId

  const data = await serverPost('/file/detail', sendData)
  return data
}

/**
 * @internal
 * Gets information about policy labels info created by the given publisher account.
 * @category File/Data Publisher(Alice) Interface
 * @param {Account} publisherAccount - The account of the publisher who created the policy labels.
 * @param {number} pageIndex - (Optional) The index of the page to retrieve. Default is 1.
 * @param {number} pageSize - (Optional) The size of each page. Default is 10.
 * @returns {Promise<object>} - Returns an object with a list of policy label information and the total number of policy labels.
                                {
                                  list: [
                                    {
                                      label: "The label of the policy", 
                                      label_id: "The ID of the policy label", 
                                      creator: "The creator of the policy label",
                                      creator_id: "The ID of the creator of the policy label",
                                      create_at: "The timestamp when the policy label was created",
                                    }
                                    ...
                                  ],
                                  total: 300,
                                }
 */
export const getPolicyLabelInfos = async (publisherAccount: Account, pageIndex = 1, pageSize = 10) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%AD%96%E7%95%A5-label-%E5%88%97%E8%A1%A8

  const sendData = {
    account_id: publisherAccount.id,
    paginate: {
      page: pageIndex,
      page_size: pageSize
    }
  }

  const data = await serverPost('/label/list', sendData)
  return data
}

/**
  * @internal
  * Gets information about policy label's infos associated with the specified account address.
  * @param {string} accountAddress - The address of the account.
  * @returns {Promise<[object]>} - Returns an array of objects containing information about the policy labels associated with the account.
                          [
                            { 
                              'policy_label_id': '', 
                              'policy_label':'', 
                              'policy_label_index': '', 
                              'policy_encrypted_pk':'This is the encrypted_pk passed in the /file/create-policy-and-upload API interface', 
                            },
                            ...
                          ]                 
*/
export const getPolicyLabelInfosByAddr = async (accountAddress: string) => {
  return Account.getStrategyInfosFromServerByAddr(accountAddress)
}

/**
  * @internal
  * Gets the IDs of all policy labels created by the specified publisher account.
  * @category File/Data Publisher(Alice) Interface
  * @param {Account} publisherAccount - The account of the publisher who created the policy labels.
  * @returns {Promise<object>} - Returns an object with an array of policy label IDs.
                              {
                                "label_ids": [ label_id1, label_id2,label_id3, ...]
                              }
*/
export const getAccountAllofPolicyLabelIds = async (publisherAccount: Account) => {
  //publisherAccount : the creater of label
  /*
    return data format: {
      "label_ids": [ label_id1, label_id2,label_id3, ...]
    }
  */

  return getPolicyLabelIdsByAccountId(publisherAccount.id)
}

//Get Policy Label's Id infos
/**
  * @internal
  * Gets the IDs of all policy labels created by the specified publisher account.
  * @param {string} accountId - The account's id of the publisher who created the policy labels.
  * @returns {Promise<object>} - Returns an object with an array of policy label IDs.
                              {
                                "label_ids": [ label_id1, label_id2,label_id3, ...]
                              }
*/
export const getPolicyLabelIdsByAccountId = async (accountId: string) => {
  //accountId : string
  /*
    return data format: {
      "label_ids": [ label_id1, label_id2,label_id3, ...]
    }
*/
  const sendData = {
    creator_id: accountId
  }

  const data = await serverPost('/label/label-ids', sendData)
  return data
}
