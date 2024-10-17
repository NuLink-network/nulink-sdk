/**
 *  Encapsulate the entire pre file sharing process
 * Note: Anything with an Account parameter is placed in the first parameter of the function. It is convenient to unify the calling format when interacting with the browser page
 */
import sleep from 'await-sleep';
import { signMessage } from '../../utils/sign.message';

import { Account, Strategy, web3 } from '../../hdwallet/api/account';
import { GAS_LIMIT_FACTOR, GAS_PRICE_FACTOR } from '../../chainnet/config';
import { getClientId, setClientId, getSettingsData as getConfigData } from '../../chainnet/api/getData';
import { getWeb3Provider } from '../../chainnet/api/web3Provider';
import { Web3Provider } from '@ethersproject/providers';
import { Web3Provider as _Web3Provider } from '../../sol/agents/web3';
import { DecimalToInteger, isNumeric } from '../../utils/math';
import { hexlify, arrayify } from 'ethers/lib/utils';
//import { arrayify } from '@ethersproject/bytes'
import { TransactionReceipt } from 'web3-core';

// notice: bacause the MessageKit use the SecretKey import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
// eslint-disable-next-line import/no-extraneous-dependencies
import {
  Alice,
  BlockchainPolicyParameters,
  MultiBlockchainPolicyParameters,
  EnactedPolicy,
  MultiEnactedPolicy,
  MessageKit,
  RemoteBob,
  MultiPreEnactedPolicy
} from '@nulink_network/nulink-ts-app';

// nucypher-core must be 0.2.0
// import { EncryptedTreasureMap, HRAC } from '@nucypher/nucypher-core'
import { EncryptedTreasureMap, HRAC } from '../../nucypher-core-wasm-bin';
import * as NucypherCore from '../../nucypher-core-wasm-bin';

//reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
// notice: bacause the encryptedMessage.decrypt( get by MessageKit) use the SecretKey import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
// eslint-disable-next-line import/no-extraneous-dependencies
import { PublicKey, SecretKey as NucypherTsSecretKey, CrossChainHRAC } from '@nulink_network/nulink-ts-app';

import { encryptMessage } from './enrico';
import { isBlank } from '../../utils/null';
import { DataCategory, DataInfo, DataType, Dictionary, GasInfo } from '../types';
//import { message as Message } from "antd";
import assert from 'assert-ts';
import { getCurrentNetworkKey, getSettingsData } from '../../chainnet';
import { serverGet, serverPost } from '../../servernet';
import { nanoid } from 'nanoid';
import { Bob, makeBob, makeRemoteBob } from './bob';
import { Porter, Ursula } from '@nulink_network/nulink-ts-app/build/main/src/characters/porter';
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
} from './alice';

import { BigNumber, ContractTransaction, utils } from 'ethers';
import { ethers } from 'ethers';
// import { SubscriptionManagerAgent } from '@nulink_network/nulink-ts-app/build/main/src/agents/subscription-manager'
import { SubscriptionManagerAgent } from '@nulink_network/nulink-ts-app';

import { toEpoch } from '../../utils/format';
import { compressPublicKeyBuffer, compressPublicKeyBuffer2, privateKeyBuffer } from '../../hdwallet/api/common';
import { getPorterUrl } from './porter';
import { GetStorageDataError, StorageManager } from '../../utils/external-storage';
import humps from 'humps';
import { getBlurThumbnail } from '../../utils/image';
import { ThumbailResult } from '../../utils/image';
import md5 from 'md5';
import { dataSuffix } from '../../utils/file';
import Web3 from 'web3';
import { fromBytes, fromBytesByEncoding } from '../../utils/encode';
import { decrypt as pwdDecrypt } from '../../utils/password.encryption';
import {
  getUrsulaError,
  InsufficientBalanceError,
  BobPayError,
  PolicyHasBeenActivedOnChain,
  GetStrategyError,
  DecryptError,
  GetTransactionReceiptError,
  TransactionError,
  ApplyNotExist,
  PolicyApproving,
  PolicyNotExpired
} from '../../utils/exception';
import { getWeb3 } from '../../hdwallet/api';
import { AndroidBridge, getRandomElementsFromArray, getTransactionNonceLock } from '../../utils';
import { CONTRACT_NAME, contractList, NETWORK_LIST } from '../../sol';
import { getDataCategoryString } from './utils';
import {
  calcPolicysCost,
  checkMultiDataApprovalStatusIsApprovedOrApproving,
  convertApplyIdStatusToString,
  estimatePolicysGasFee,
  getBlockchainPolicys,
  getDataContentByDataIdAsUser,
  getDataDetails,
  getMultiApplyDetails,
  getApplyDetails,
  getPolicysTokenCost,
  signUpdateServerDataMessage
} from './workflow';
import { sendRawTransaction } from './transaction';
import { getContractInst } from '../../sol/contract';
import Contract from 'web3-eth-contract';
import { AppPayAgent } from '../../sol/agents/app-pay';
import { AndroidMessage as Message } from '../../utils/androidmessage';
import { toBytes } from '../../sol/agents/utils';
import { registerMessageHandler } from './app.sdk';
import AwaitLock from 'await-lock';

/**
 * SDK initialization. You need to call this initialization function before invoking any APIs.
 * @category initialization
 * @param {string} clientId - The project party ID, which needs to be applied for from Nulink's official team.
 * @returns {Promise<void>}
 */
export const init = async (clientId: string = '') => {
  AndroidBridge.initialize();

  console.log('init ing..., ', clientId, isBlank(clientId));
  if (!isBlank(clientId)) {
    console.log('initClientId set');
    await initClientId(clientId);
  }

  console.log('initClientId get clientId', await getClientId(false));
  await registerMessageHandler();
};

/**
 * @interal
 * @category initialization
 * @param {string} clientId - The project party ID, which needs to be applied for from Nulink's official team.
 * @returns {Promise<void>}
 */
export const initClientId = async (clientId: string) => {
  return setClientId(String(clientId));
};

/**
 * Uploads files/data for paid subscriber-only visible user
 * @category Data Publisher(Alice) Upload Data
 * @param {Account} account - The account to use to create the policy and upload the files/data.
 * @param {DataInfo[]} dataInfoList - The list of files/data to upload. Each element of the array must be an object with properties 'label' and 'dataArrayBuffer'.
 * @returns {Promise<object>} - Returns account, strategy id and files info
 * {    address: accountAddress,
 *      strategyId: strategyId,
 *      pk: accountPublicKey,
 *      filesInfo:
 *      [
 *       {
 *         id: fileId,
 *         label: fileName,
 *         thumbnail: fileThumbnail,  //return only if the input parameters include the specified parameters （thumbnail url or unique identifier ）
 *         mimtype: fileMimetype,   //return only if the input parameters include the specified parameters
 *       }
 *      ]
 * }
 */
export const publishDataForPaidSubscriberVisible = async (
  account: Account,
  dataInfoList: DataInfo[] //data information list
): Promise<object> => {
  console.log('uploadDataByCreatePolicy account', account);

  const strategyIndex = 0;
  let strategy: Strategy | undefined = account.getStrategy(strategyIndex);

  if (isBlank(strategy)) {
    const clientId = await getClientId(true);

    if (isBlank(clientId)) {
      throw new Error('clientId is not set, need invoke the function initClientId first');
    }

    /**
     * 1. Labels cannot use random nanoid, otherwise account recovery will be difficult if the account is lost.
     * 2. Paid subscriptions can only be used within the same project, cross-project subscriptions require re-payment.
     */
    const label =
      'pair_for_subscriber_visible_' +
      clientId.toLowerCase() +
      '_' +
      account.address.toLowerCase() +
      '_' +
      strategyIndex; //nanoid();
    strategy = await account.createStrategyByLabel(label);
  }
  strategy = strategy as Strategy;
  const filesInfo = await uploadDataSpecifiedLocalPolicy(account, strategy, dataInfoList);

  return {
    address: account.address,
    strategyId: strategy.id,
    pk: account.encryptedKeyPair._publicKey,
    filesInfo: filesInfo
  };
};

/** 
   * Uploads files/data that require individual paid subscription to view
   * @category Data Publisher(Alice) Upload Data
   * @param {Account} account - The account to use to create the policy and upload the files/data.
   * @param {DataInfo[]} dataInfoList - The list of files/data to upload. Each element of the array must be an object with properties 'label' and 'dataArrayBuffer'.
   * @returns {Promise<object>} - Returns account, strategy id and files info
   * {    address: accountAddress,
   *      strategyId: strategyId,
   *      pk: accountPublicKey,
   *      filesInfo:
   *      [                                                    
   *       {      
   *         id: fileId,
   *         label: fileName,
   *         thumbnail: fileThumbnail,  //return only if the input parameters include the specified parameters
   *         mimtype: fileMimtype,   //return only if the input parameters include the specified parameters
   *       }
   *      ]
   * }
  
   */
export const publishDataForIndividualPaid = async (
  account: Account,
  dataInfoList: DataInfo[] //data information list //just allow upload one file
): Promise<object> => {
  console.log('uploadDataByCreatePolicy account', account);

  const clientId = await getClientId(true);

  if (isBlank(clientId)) {
    throw new Error('clientId is not set, need invoke the function initClientId first');
  }

  //Note: In the createStrategyWithLabelPrefixAndStrategyIndex function, the label will also add the strategy's index to the base prefix, in order to increase the uniqueness.
  const labelPrefix = 'pair_for_individual_visible_' + clientId.toLowerCase() + account.address.toLowerCase() + '_'; //'_' + strategyIndex; //nanoid();
  const strategy: Strategy = await account.createStrategyWithLabelPrefixAndStrategyIndex(`${labelPrefix}`, '');

  const filesInfo = await uploadDataSpecifiedLocalPolicy(account, strategy, dataInfoList);

  return {
    address: account.address,
    strategyId: strategy.id,
    pk: account.encryptedKeyPair._publicKey,
    filesInfo: filesInfo
  };
};

/**
 * @internal
 * Uploads files/data to the server by exist local policy (note: policy may not yet be on-chain) and uploading the files/data encrypted with the policy's public key to IPFS.
 * @category Data Publisher(Alice) Upload Data
 * @param {Account} account - The account to use to create the policy and upload the files/data.
 * @param {DataInfo[]} dataInfoList - The list of files/data to upload. Each element of the array must be an object with properties 'label' and 'dataArrayBuffer'.
 * @returns {Promise<object []>} - Returns the fileInfo list:
 * [
 *  {
 *    id: fileId,
 *    label: fileName,
 *    thumbnail: fileThumbnail,  //return only if the input parameters include the specified parameters
 *    mimtype: fileMimtype,   //return only if the input parameters include the specified parameters
 *  }
 * ]
 */
export const uploadDataSpecifiedLocalPolicy = async (
  account: Account,
  strategy: Strategy,
  dataInfoList: DataInfo[] //data information list //just allow upload one file
): Promise<object[]> => {
  const dataContentList: ArrayBuffer[] = [];
  for (const dataInfo of dataInfoList) {
    dataContentList.push(dataInfo.dataArrayBuffer);
  }
  // console.log("uploadDataByCreatePolicy dataContentList", dataContentList);

  const _encryptMessages: MessageKit[] = encryptMessage(strategy.strategyKeyPair._publicKey, dataContentList);
  // console.log("uploadDataByCreatePolicy _encryptMessages", _encryptMessages);
  const mockIPFSAddressList: string[] = [];

  const data: Uint8Array[] = _encryptMessages.map((encryptMessage) => encryptMessage.toBytes() /*Uint8Array*/);
  const cids: string[] = await StorageManager.setData(data, account);
  mockIPFSAddressList.push(...cids);

  const retDataInfoList: object[] = [];
  // console.log("uploadDataByCreatePolicy mockIPFSAddressList", mockIPFSAddressList);
  const dataInfos: object[] = [];
  for (let index = 0; index < dataInfoList.length; index++) {
    const dataInfo = dataInfoList[index];

    const dataId = nanoid();

    //The generation of thumbnail logic should be handled by a third-party DApp, rather than implemented in the pre-process. Therefore, it needs to be moved to the third-party DApp, and this part should be blocked
    //generate and upload thumbnail files to IPFS
    // eslint-disable-next-line prefer-const
    let thumbnail = '';
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
      category: dataInfo.category || 'unkown',
      thumbnail: dataInfo.thumbnail || '', //thumbnail || '',
      mimtype: dataInfo.mimetype || ''
    };
    dataInfos.push(_data);

    retDataInfoList.push({
      id: _data.id,
      label: _data.name,
      thumbnail: _data.thumbnail,
      mimtype: _data.mimtype
    });
  }
  // console.log("uploadDataByCreatePolicy dataInfos", dataInfos);
  try {
    const sendData: any = {
      files: dataInfos,
      account_id: account.id,
      policy_label_id: strategy.id,
      policy_label: strategy.label,
      policy_label_index: String(strategy.addressIndex),
      encrypted_pk: strategy.strategyKeyPair._publicKey
    };

    sendData['signature'] = await signUpdateServerDataMessage(account, sendData);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const data = await serverPost('/file/create-or-specified-policy-and-upload', sendData);
  } catch (error: any) {
    // Message.error("upload file failed!");
    console.error('upload data failed!: ', error);

    if (error?.data?.code != 4011) {
      //Error code 4011(error?.data?.msg is policy label already exists) does not require deleting the policy.

      // clear this failed strategy info
      await account.deleteStrategy(strategy.addressIndex);
    } else {
      //4011
      if (!isBlank(error?.data?.msg)) {
        error.data.msg = error.data.msg + ' ' + 'Please refresh the file upload page and upload again';
      }
    }

    throw error;
  }

  // console.log("uploadDataByCreatePolicy after serverPost", data);

  return retDataInfoList;
};

/**
 * Query Bob's Payment Status
 
 * @category Data User(Bob) Request Data
 * @param {BigNumber | string} orderId - A unique string composed of numbers. 
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @returns {Promise<string>}   NOT_PAID (not paid or Insufficient payment), PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPRIED
 */
export const getBobPayStatus = async (orderId: BigNumber | string, payCheckUrl: string): Promise<string> => {
  //check the status and params
  if (typeof orderId === 'string') {
    if (!isNumeric(orderId)) {
      throw new Error('Each digit in the orderId must be composed of numbers');
    }
    orderId = BigNumber.from(orderId);
  }

  const sendData = {
    orderId: orderId.toString()
  };

  //payCheckUrl ==> http(s)://domain/subscribe/getOrderStatus
  const _data: any = (await serverGet(payCheckUrl, sendData)) as object;

  /*   {
    "success": false,
    "code": 400,
    "message": "order not found",
    "data": null
 } */

  const data = _data?.data;

  console.log(`getBobPayStatus _data: `, _data);
  if (Number(data['code']) != 200) {
    throw new Error(`${data['message']} orderId: ${orderId}`);
  }

  const dataStatus: string = isBlank(data['data']) ? '' : data['data'];

  return dataStatus.toUpperCase();
};

/**
 * @internal
 * Simulate order generation in the development environment.
  
 * @category Data User(Bob) Request Data
 * @param {BigNumber | string} orderId - A unique string composed of numbers. 
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @returns {Promise<string>}   orderId
 */
export const simulateOrderGenerationForDev = async (
  aliceAddress: string,
  bobAddress: string,
  appServiceUrl: string
): Promise<string> => {
  const sendData = {
    actualAmount: '100000000000000000',
    csmAmount: '0',
    currency: 'NLK',
    currencyAddress: '0x8A95eF66ef0b5bCD10cb8aB433c768f50B5822a8', //V14
    day: 30,
    id: 0,
    orderAmount: '100000000000000000',
    subscribeType: '1', //1-subscribe user; 2-subscribe post
    subscribedUserAddress: aliceAddress,
    userAddress: bobAddress
  };

  appServiceUrl = appServiceUrl.endsWith('/') ? appServiceUrl :  appServiceUrl + "/";
  //
  //http://47.237.123.177:8083/subscribe/getOrderStatus
  //payCheckUrl ==> http(s)://domain/subscribe/getOrderStatus
  const _data: any = (await serverPost(`${appServiceUrl}subscribe/initForDev`, sendData)) as object;

  const result = _data?.data;
  
  /*   
      {
      "success": true,
      "code": 200,
      "message": "Success",
      "data": {
        "id": 2,
        "orderId": 601725579337733,
        "userAddress": "0x5Cd0a102013321F5Bbf53dDe4EB73e59D32539B2",
        "userNickname": "test user name",
        "subscribeType": "1",
        "subscribedUserAddress": "0x2c6ac09d39c5ce4450b0b900ccc386301fe62e32",
        "subscribedUserNickname": "test_user_for_andi",
        "postId": null,
        "day": 30,
        "orderAmount": "100000000000000000",
        "currency": "NLK",
        "currencyAddress": "0x8A95eF66ef0b5bCD10cb8aB433c768f50B5822a8",
        "actualAmount": "100000000000000000",
        "csmAmount": "0",
        "subscribeTxHash": null,
        "approveTxHash": null,
        "refundTxHash": null,
        "status": "0",
        "startTime": null,
        "endTime": null,
        "shareProfit": false,
        "updateTime": 1729042061019,
        "createTime": 1729042061019
      }
    }
  */


  console.log(`getBobPayStatus _data: `, _data);
  
  const data = result?.data;

  if (Number(result['code']) != 200) {
    throw new Error(`${result['message']} orderId: ${isBlank(data) ? "": data?.orderId}`);
  }
  
  
  if (isBlank(data)) {
    throw new Error(`$simulateOrderGenerationForDev response error: `, _data);
  }
  


  return String(data['orderId']).toLowerCase();
  
};

// /** @Deprecated
//  * Query Bob's Payment Status
//  * @category Data User(Bob) Request Data
//  * @param {string} dataId - A file ID to apply for usage permission.
//  * @param {Account} account - The account that applies for the permission （Bob）.
//  * @returns {Promise<number>}   0: Unpaid
//                                 1: Payment Pending Confirmation
//                                 2: Paid
//                                 3: Payment Failed (Reset to Payment Failed status if unable to query)
//  */
// export const getBobPayStatusByBackend = async (dataId: string, account: Account): Promise<number> => {
//   //get golbal time from server
//   const sendData = {
//     file_id: dataId,
//     proposer_id: account.id
//   };

//   const data = (await serverGet('/pay/status', sendData)) as object;

//   return data['status'] as number;
// };

/**
 *  @internal
 * Apply for subscriber user feeds, This account acts as the user(Bob).
 * Note: Different from applying for the interface with multiple files (apply/files):
 *          If the policy corresponding to the document has already been applied for, it will return code: 4109, msg: "current file does not need to apply"
 * @category Data User(Bob) Request Data
 * @param {Account} account - The account that applies for the permission （Bob）.
 * @param {BigNumber | string} orderId - A unique string composed of numbers.
 * @param {string} dataId - A file/data ID to apply for usage permission.
 * @param {number} usageDays - (Optional) The validity period of the application, in days. Default is 30.
 * @param {string} payTokenAddress - payment token address
 * @param {string} payAmountInWei - payment amount, unit: wei
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @param {BigNumber} gasPrice - (Optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice().
 * @param {BigNumber} gasLimit - (Optional) set gas limit
 * @param {boolean} waitforReceipt - (Optional) default: false.
 *                                              If an on-chain transaction has been sent, should we wait for the transaction receipt?
 *                                              Note: Whether to wait for the transaction receipt here depends on whether there are other functions that need to be executed later (for example, calling the backend interface to upload the status).
 *                                                    Since waiting for the payment receipt generally takes a long time, if the user closes the dialog or software during the waiting process, the subsequent logic will not be able to execute.
 * @returns {Promise<string>} - throw an exception or
 *                              return
 *                               {
 *                                status: payStatus: get from contract:  enum payStatus{PayNull,PaySucc,PayCancel,SettlementSucc}
 *                                hash: transaction hash  // If an on-chain payment was made here, then there is a 'hash' key; otherwise, there is no such key of 'hash'.
 *                               }
 *
 *
 */
const bobPaySubscriptionFee = async (
  account: Account,
  orderId: BigNumber | string,
  dataId: string,
  payTokenAddress: string,
  payAmountInWei: BigNumber | string,
  usageDays = 30,
  payCheckUrl: string,
  gasLimit: BigNumber = BigNumber.from('0'), // Note that using gasUsedAmount ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  gasPrice: BigNumber = BigNumber.from('0'), // Note that using gasPrice ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  waitforReceipt: boolean = false
): Promise<any> => {
  /**
     * Flow:
            Query the backend method using Bob's account ID and file ID (the backend will find the corresponding strategy ID), which is equivalent to using Bob's account ID and Alice's strategy ID, to determine if the payment was successful (unpaid, payment pending confirmation, paid).
            If the status is unpaid/payment failed, you can call the payment interface. Other statuses are not allowed (payment pending confirmation status, wait for half an hour or 1 hour, if unable to query, reset to payment failed status (similar to the previous scheduled task)).
            When calling the /apply/subscribe interface, pass the tx_hash parameter, Bob's account ID, and file ID (the backend will find the corresponding strategy ID) to the backend. The backend will receive it and set the status to payment pending confirmation, and the subscription status to "under review".
            After the backend detects this payment event, it will update the payment status to "paid" and the subscription status to "approved".
    */

  //get alice address
  const data = (await getDataDetails(dataId, account.id)) as object;

  //assert(data && !isBlank(data));
  if (isBlank(data)) {
    throw new Error(`Uploaded dataid: ${dataId} not found`);
  }

  let aliceAddress = data['creator_address'];
  aliceAddress = Web3.utils.toChecksumAddress(aliceAddress);

  return bobPaySubscriptionFee2(
    account,
    orderId,
    aliceAddress,
    payTokenAddress,
    payAmountInWei,
    usageDays,
    payCheckUrl,
    gasLimit,
    gasPrice,
    waitforReceipt
  );
};

/**
 *  @internal
 * Apply for subscriber user feeds, This account acts as the user(Bob).
 * Note: Different from applying for the interface with multiple files (apply/files):
 *          If the policy corresponding to the document has already been applied for, it will return code: 4109, msg: "current file does not need to apply"
 * @category Data User(Bob) Request Data
 * @param {Account} account - The account that applies for the permission （Bob）.
 * @param {BigNumber | string} orderId - A unique string composed of numbers.
 * @param {string} aliceAddress - Alice checksum address
 * @param {number} usageDays - (Optional) The validity period of the application, in days. Default is 30.
 * @param {string} payTokenAddress - payment token address
 * @param {string} payAmountInWei - payment amount, unit: wei
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @param {BigNumber} gasPrice - (Optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice().
 * @param {BigNumber} gasLimit - (Optional) set gas limit
 * @param {boolean} waitforReceipt - (Optional) default: false.
 *                                              If an on-chain transaction has been sent, should we wait for the transaction receipt?
 *                                              Note: Whether to wait for the transaction receipt here depends on whether there are other functions that need to be executed later (for example, calling the backend interface to upload the status).
 *                                                    Since waiting for the payment receipt generally takes a long time, if the user closes the dialog or software during the waiting process, the subsequent logic will not be able to execute.
 * @returns {Promise<string>} - throw an exception or
 *                              return
 *                               {
 *                                status: payStatus: get from contract:  enum payStatus{PayNull,PaySucc,PayCancel,SettlementSucc}
 *                                hash: transaction hash  // If an on-chain payment was made here, then there is a 'hash' key; otherwise, there is no such key of 'hash'.
 *                               }
 *
 *
 */
const bobPaySubscriptionFee2 = async (
  account: Account,
  orderId: BigNumber | string,
  aliceAddress: string,
  payTokenAddress: string,
  payAmountInWei: BigNumber | string,
  usageDays = 30,
  payCheckUrl: string,
  gasLimit: BigNumber = BigNumber.from('0'), // Note that using gasUsedAmount ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  gasPrice: BigNumber = BigNumber.from('0'), // Note that using gasPrice ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  waitforReceipt: boolean = false
): Promise<any> => {
  /**
     * Flow:
            Query the backend method using Bob's account ID and file ID (the backend will find the corresponding strategy ID), which is equivalent to using Bob's account ID and Alice's strategy ID, to determine if the payment was successful (unpaid, payment pending confirmation, paid).
            If the status is unpaid/payment failed, you can call the payment interface. Other statuses are not allowed (payment pending confirmation status, wait for half an hour or 1 hour, if unable to query, reset to payment failed status (similar to the previous scheduled task)).
            When calling the /apply/subscribe interface, pass the tx_hash parameter, Bob's account ID, and file ID (the backend will find the corresponding strategy ID) to the backend. The backend will receive it and set the status to payment pending confirmation, and the subscription status to "under review".
            After the backend detects this payment event, it will update the payment status to "paid" and the subscription status to "approved".
    */

  if (typeof orderId === 'string') {
    if (!isNumeric(orderId)) {
      throw new Error('Each digit in the orderId must be composed of numbers');
    }
    orderId = BigNumber.from(orderId);
  }

  payAmountInWei = typeof payAmountInWei === 'string' ? BigNumber.from(payAmountInWei) : payAmountInWei;
  
  //2. call contact refund function
  const provider: Web3Provider = (await getWeb3Provider(account as any)) as Web3Provider;
  /**
     *     struct payInfoS{
              uint256 payID;
              uint256 payAmount;
              uint256 payTime;
              uint256 startTime;
              uint256 endTime;
              payStatus paySts;
              address bobAddress;
              address aliceAddress;
              address payToken; 
          }
     */

  //query bob's payment status by contract
  const payInfo: [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, number, string, string, string] & {
    payID: BigNumber;
    payAmount: BigNumber;
    payTime: BigNumber;
    startTime: BigNumber;
    endTime: BigNumber;
    paySts: number;
    bobAddress: string;
    aliceAddress: string;
    payToken: string;
  } = await AppPayAgent.getPayInfo(provider, orderId);

  if (
    !isBlank(payInfo) &&
    payInfo.payAmount.gte(payAmountInWei) &&
    payInfo.payToken.toLowerCase() == payTokenAddress.toLowerCase() &&
    payInfo.bobAddress.toLowerCase() == account.address.toLowerCase() &&
    payInfo.aliceAddress.toLowerCase() == aliceAddress.toLowerCase()
  ) {
    return { status: payInfo.paySts };
  }

  //No longer checking from the backend; directly checking from the contract.

  //Bob pre-paid tokens to subscribe to the user feeds
  //on chain transaction

  //Determine if the token balance is sufficient.
  const tokenBalanceInEther = await account.getERC20TokenBalance(payTokenAddress);
  const payAmountInEther = ethers.utils.formatEther(payAmountInWei); //Web3.utils.fromWei(payAmountInWei, 'ether');

  if (tokenBalanceInEther && tokenBalanceInEther < payAmountInEther) {
    throw new InsufficientBalanceError(
      `Insufficient account ${account.address}'s balance of token: ${payTokenAddress} for pay ${payAmountInEther} subscription fee`
    );
  }

  console.log('before bob pay approveNLK estimateGas');
  const approveGasInfo: GasInfo = await bobPaySubscriptionFeeApproveNLKEstimateGas(
    account,
    BigNumber.from('10000000000000000000000000'),
    gasPrice
  );

  console.log('before bob pay approveNLK approveGasInfo', approveGasInfo);
  //Note that it takes time to evaluate gas, and since the transfer nlk function is called, it must be approved first
  const txHash: string = (await bobPaySubscriptionFeeApproveNLK(
    account,
    BigNumber.from('10000000000000000000000000'),
    false,
    gasPrice
  )) as string;

  console.log('after bob pay approveNLK txHash:', txHash);
  

  //Check if the gas fee is sufficient.
  const gasInfo: GasInfo = await AppPayAgent.estimateGasByBobPay(
    _Web3Provider.fromEthersWeb3Provider(provider),
    orderId,
    payAmountInWei,
    payTokenAddress,
    usageDays,
    aliceAddress,
    gasPrice
  );

  const gasFeeInWei: BigNumber = gasInfo.gasFee;
  //Ensure that the BNB balance is greater than the GAS fee balance
  const balance: BigNumber = await getBalance(account.address);
  const chainConfigInfo = await getSettingsData();

  console.log(`the account token balance is: ${balance.toString()} wei ${chainConfigInfo.tokenSymbol}`);
  console.log(`the bob pay gas fee is: ${gasFeeInWei.toString()} wei ${chainConfigInfo.tokenSymbol}`);

  if (!gasFeeInWei.lte(BigNumber.from('0')) && balance.lt(gasFeeInWei)) {
    const balanceValue = Web3.utils.fromWei(balance.toString(), 'ether');
    const gasValue = Web3.utils.fromWei(gasFeeInWei.toString(), 'ether');
    // Message.error(
    //   `The account (${account.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to pay subscription fee with a gas value of ${gasValue} ether`,
    // );
    console.log(
      `The account (${account.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to pay subscription fee with a gas value of ${gasValue} ether`
    );
    throw new InsufficientBalanceError(
      `The account (${account.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to  pay subscription fee with a gas value of ${gasValue} ether`
    );
  }

  console.log("Bob address: ", account.address);
  
  const tx: ContractTransaction = await AppPayAgent.bobPay(
    _Web3Provider.fromEthersWeb3Provider(provider),
    orderId,
    payAmountInWei,
    payTokenAddress,
    usageDays,
    aliceAddress,
    true,
    gasLimit.lte(BigNumber.from('0')) ? gasInfo.gasLimit : gasLimit,
    gasInfo.gasPrice
  );

  if (isBlank(tx) || isBlank(tx.hash)) {
    console.log(`send Bob Pay transaction failed!`);
    throw new TransactionError(`send Bob Pay transaction failed!`);
  }

  console.log(`Bob pay txHash: ${tx.hash}`);

  /**
   * Note: Do not wait for the transaction receipt here, as it generally takes a long time.
   * If the user closes the dialog or software during the waiting period,
   * it may cause issues later if there are other functions that need to be executed (for example, calling the backend interface to upload the status).
   */
  if (waitforReceipt) {
    let receipt: any = null;

    let retryTimes = 130;
    do {
      try {
        receipt = await web3.eth.getTransactionReceipt(tx.hash);
        //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
      } catch (error) {
        console.log(`getTransactionReceipt bob Pay txHash: ${tx.hash} retrying ..., current error: `);
      }

      if (isBlank(receipt)) {
        if (retryTimes % 3 == 0) {
          Message.info('Transaction is being confirmed on the blockchain. Please wait patiently');
        }

        await sleep(3000);
      }
      retryTimes--;
    } while (isBlank(receipt) && retryTimes > 0);

    const txReceipt = receipt as TransactionReceipt;

    //const transaction = await web3.eth.getTransaction(tx.hash);
    //  //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
    if (isBlank(txReceipt)) {
      const transaction = await web3.eth.getTransaction(tx.hash);
      //console.log("transaction.input:", transaction.input);
      console.log('transaction:', transaction);
      console.log(`getTransactionReceipt error: Bob pay transaction Hash is ${tx.hash}, transaction receipt is null.!`);

      throw new GetTransactionReceiptError(
        `Bob pay: getTransactionReceipt error: transaction Hash is ${tx.hash}, transaction receipt is null.!`
      );
    } else {
      //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
      if (!txReceipt.status) {
        //The transaction failed. Users can manually pay again.

        console.log(
          `Bob pay Failed: transaction Hash is ${tx.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
        );
        throw new TransactionError(
          `Bob pay Failed: transaction Hash is ${tx.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
        );
      }
    }
  }
  const _payInfo = await AppPayAgent.getPayInfo(provider, orderId);
  return { hash: tx.hash, status: _payInfo.paySts };
  //
  //// //No longer checking from the backend; directly checking from the contract.
  /////*
  ////  0: Unpaid
  ////  1: Payment Pending Confirmation
  ////  2: Paid
  ////  3: Payment Failed (Reset to Payment Failed status if unable to query)
  ////*/
  ////if (payStatus == 3) {
  ////  throw new BobPayError('Payment Subscription Fee Failed');
  ////}
  ////
  ////console.log(`Bob pay status: ${payStatus}`);
  ////if (payStatus == 1) {
  ////  console.log(`Bob pay status: ${payStatus}`);
  ////}
  ////
  ////return { status: payStatus };
};



/**
 * @innernal
 * @returns 
 */
export const bobPaySubscriptionFeeApproveNLKEstimateGas = async (
  account: Account,
  nlkInWei: BigNumber,
  gasPrice: BigNumber = BigNumber.from('0') //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
): Promise<GasInfo> => {
  //approveNLKEstimateGas

  // const serverFeeNlkInWei: BigNumber = BigNumber.from("0")
  const gasInfo = await bobPaySubscriptionFeeApproveNLK(account, nlkInWei, true, gasPrice)
  return gasInfo as GasInfo
}

/**
 * @innernal
 * @param account
 * @param approveNlkInWei
// * @param serverFeeNlkInWei
 * @param estimateGas
 * @param gasPrice
 * @returns when estimateGas is true, return GasInfo. else return transaction Hash
 */
export const bobPaySubscriptionFeeApproveNLK = async (
  account: Account,
  approveNlkInWei: BigNumber,
  // serverFeeNlkInWei: BigNumber, //nlk
  estimateGas = false,
  gasPrice: BigNumber = BigNumber.from('0') //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
): Promise<string | GasInfo> => {
  // Allow my nlk to be deducted from the subscriptManager contract

  const web3: Web3 = await getWeb3()
  // const account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
  //web3.eth.accounts.wallet.add(account);

  const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] = DecimalToInteger(GAS_PRICE_FACTOR)

  if (gasPrice.lte(BigNumber.from('0'))) {
    // the gasPrice is obtained in real time
    gasPrice = BigNumber.from(await web3.eth.getGasPrice())
    gasPrice = gasPrice.mul(GAS_PRICE_FACTOR_LEFT).div(GAS_PRICE_FACTOR_RIGHT)
  } else {
    //If the gasPrice is manually set, the GAS_PRICE_FACTOR is not set
  }

  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey()

  if (![NETWORK_LIST.Horus, NETWORK_LIST.HorusMainNet].includes(curNetwork)) {
    //if (curNetwork !== NETWORK_LIST.Horus) {
    //not crosschain mainnet, no nlk token, no need approve nlk
    if (!isBlank(estimateGas)) {
      const gasInfo: GasInfo = {
        gasPrice: gasPrice,
        gasLimit: BigNumber.from('0'),
        gasFee: BigNumber.from('0')
      }
      return gasInfo
    }
    return ''
  }

  const nlkBalanceEthers = (await account.getNLKBalance()) as string

  const nlkBalanceWei = BigNumber.from(Web3.utils.toWei(nlkBalanceEthers))

  console.log('nlkBalanceWei is ', nlkBalanceWei.toString())
  // console.log('serverFeeInWei is ', serverFeeNlkInWei.toString())

  // const serverFeeNlkInEthers = Web3.utils.fromWei(serverFeeNlkInWei.toString(), 'ether')

  console.log('nlkBalanceEthers is ', nlkBalanceEthers)
  // console.log('serverFeeNlkInEthers is ', serverFeeNlkInEthers)

  const chainConfigInfo = await getSettingsData()

  //if (serverFeeNlkInWei.gt(nlkBalanceWei)) {
  //  // Message.error(
  //  //   `Insufficient balance ${nlkBalance} ${chainConfigInfo.nlkTokenSymbol} for pay ${nlkInWei} ${chainConfigInfo.nlkTokenSymbol}`,
  //  // );
  //  console.log(
  //    `approveNLK - Insufficient balance ${nlkBalanceEthers} ${chainConfigInfo.nlkTokenSymbol} to cover payment ${serverFeeNlkInEthers} ${chainConfigInfo.nlkTokenSymbol}`
  //  )
  //  throw new InsufficientBalanceError(
  //    `approveNLK - Insufficient balance ${nlkBalanceEthers} ${chainConfigInfo.nlkTokenSymbol} to cover payment ${serverFeeNlkInEthers} ${chainConfigInfo.nlkTokenSymbol}`
  //  )
  //}

  const nuLinkTokenContractInfo: any = contractList[curNetwork][CONTRACT_NAME.nuLinkToken]
  const appPayContractInfo: any = contractList[curNetwork][CONTRACT_NAME.appPay]

  const nuLinkTokenContract: Contract = await getContractInst(CONTRACT_NAME.nuLinkToken)

  const aliceBob = Web3.utils.toChecksumAddress(
    account.address //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
  )

  const appPayAddress = Web3.utils.toChecksumAddress(appPayContractInfo.address)
  const nuLinkTokenAddress = Web3.utils.toChecksumAddress(nuLinkTokenContractInfo.address)

  //owner, spender,
  const allowanceWei: string = await nuLinkTokenContract.methods
    .allowance(aliceBob, appPayAddress)
    .call()

  if (BigNumber.from(allowanceWei).gte(approveNlkInWei)) {
    console.log(`allowance is ${allowanceWei}, to approve is ${approveNlkInWei}`)
    return ''
  }

  //privateKeyString startwith 0x and total length is 66( include the length of 0x)
  const privateKeyStringHex = pwdDecrypt(account.encryptedKeyPair._privateKey, true)
  const privateKeyString = privateKeyStringHex.substring(2, 66)
  // console.log(privateKeyString);

  const _encodedABI = nuLinkTokenContract.methods
    .approve(appPayAddress, web3.utils.toBN(approveNlkInWei.toHexString()))
    .encodeABI()

  const transactionNonceLock: AwaitLock = await getTransactionNonceLock(aliceBob)
  await transactionNonceLock.acquireAsync()

  try {
    const txCount = await web3.eth.getTransactionCount(aliceBob)

    const gasPriceHex = web3.utils.toHex(gasPrice.toString())

    const rawTx = {
      nonce: web3.utils.toHex(txCount),
      from: aliceBob,
      to: nuLinkTokenAddress,
      data: _encodedABI,
      gasPrice: gasPriceHex, //'0x09184e72a000',
      value: '0x0'
    }

    // const networkId = await web3.eth.net.getId();

    //https://github.com/paulmillr/noble-ed25519/issues/23
    // const tx = new Tx(rawTx, {common});  //attention: cause extension error: Cannot convert a BigInt value to a number
    // tx.sign(/* Buffer.from("1aefdd79679b4e8fe2d55375d976a79b9a0082d23fff8e2768befe6aceb8d3646", 'hex') */ account.encryptedKeyPair.privateKeyBuffer()); //Buffer.from(aliceEthAccount.privateKey, 'hex')

    // const serializedTx = tx.serialize().toString("hex");

    //don't add this
    // if (!!estimateGas) {
    //   //fix error: invalid argument 0: json: cannot unmarshal non-string into Go struct field TransactionArgs.chainId of type *hexutil.Big
    //   rawTx["chainId"] = web3.utils.toHex(chainConfigInfo.chainId);
    // } else {
    //   rawTx["chainId"] =chainConfigInfo.chainId; // chainConfigInfo.chainId.toString(); //97
    // }

    // gasUsed => estimateGas return gasUsed is the gasLimit (How many gas were used,that is the amount of gas), not the gasFee (gasLimit * gasPrice)
    const gasUsed: number = await web3.eth.estimateGas(rawTx as any)
    console.log(`approveNLK estimateGas Used is ${gasUsed} wei`)

    const [GAS_LIMIT_FACTOR_LEFT, GAS_LIMIT_FACTOR_RIGHT] = DecimalToInteger(GAS_LIMIT_FACTOR)

    //estimatedGas * gasPrice * factor
    const gasLimit = BigNumber.from(gasUsed).mul(GAS_LIMIT_FACTOR_LEFT).div(GAS_LIMIT_FACTOR_RIGHT)
    const gasFeeInWei = gasLimit.mul(BigNumber.from(gasPrice))

    console.log(`approveNLK estimate GasFee is ${gasFeeInWei} wei`)
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!estimateGas) {
      const gasInfo: GasInfo = {
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        gasFee: gasFeeInWei
      }
      return gasInfo
    }

    const tokenBalanceEthers = (await account.balance()) as string //tbnb
    const tokenBalanceWei = Web3.utils.toWei(tokenBalanceEthers)

    // tokenBalanceWei must be great than gasUsed(gasLimit) * gitPrice
    // Calculate if the balance is enough to cover the fee of approveNLK
    if (BigNumber.from(tokenBalanceWei).lt(gasFeeInWei)) {
      const tips = `Insufficient balance ${tokenBalanceEthers} ${
        chainConfigInfo.tokenSymbol
      } for approveNLK ${Web3.utils.fromWei(gasFeeInWei.toString(), 'ether')} ${chainConfigInfo.tokenSymbol}`

      // Message.error(tips);
      console.error(tips)
      throw new InsufficientBalanceError(tips)
    }

    // https://ethereum.stackexchange.com/questions/87606/ethereumjs-tx-returned-error-invalid-sender

    //estimatedGas * factor
    rawTx['gasLimit'] = web3.utils.toHex(gasLimit.toString()) // '0x2710'  The amount of gas

    const signedTx = await web3.eth.accounts.signTransaction(rawTx as any, privateKeyString) // privateKeyString is the length of 64
    const txReceipt: TransactionReceipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction as string /* "0x" + serializedTx */
    )
    /*
    {
      raw: '0xf86c808504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a04f4c17305743700648bc4f6cd3038ec6f6af0df73e31757007b7f59df7bee88da07e1941b264348e80c78c4027afc65a87b0a5e43e86742b8ca0823584c6788fd0',
      tx: {
          nonce: '0x0',
          gasPrice: '0x4a817c800',
          gas: '0x5208',
          to: '0x3535353535353535353535353535353535353535',
          value: '0xde0b6b3a7640000',
          input: '0x',
          v: '0x25',
          r: '0x4f4c17305743700648bc4f6cd3038ec6f6af0df73e31757007b7f59df7bee88d',
          s: '0x7e1941b264348e80c78c4027afc65a87b0a5e43e86742b8ca0823584c6788fd0',
          hash: '0xda3be87732110de6c1354c83770aae630ede9ac308d9f7b399ecfba23d923384'
      }
    */

    console.log('txReceipt:', txReceipt)

    //wait txReceipt
    console.log(
      // eslint-disable-next-line no-extra-boolean-cast
      !txReceipt.transactionHash ? `In Bob pay approveNLK: : get transaction receipt failed` : `txHash: ${txReceipt.transactionHash}`
    )

    // eslint-disable-next-line no-extra-boolean-cast
    if (!!txReceipt.transactionHash) {
      let receipt: any = null

      do {
        receipt = await web3.eth.getTransactionReceipt(txReceipt.transactionHash)
        //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
        await sleep(2000)
      } while (isBlank(receipt))
    }

    return txReceipt.transactionHash
  } finally {
    transactionNonceLock.release()
  }
}

/**
 * Apply for subscriber user feeds, This account acts as the user(Bob).
 * Note: Different from applying for the interface with multiple files (apply/files):
 *          If the policy corresponding to the document has already been applied for, it will return code: 4109, msg: "current file does not need to apply"
 * @category Data User(Bob) Request Data
 * @param {Account} account - The account that applies for the permission （Bob）.
 * @param {BigNumber | string} orderId - A unique string composed of numbers.
 * @param {string} dataId - A file/data ID to apply for usage permission.
 * @param {string} payTokenAddress - payment token address
 * @param {string} payAmountInWei - payment amount, unit: wei
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @param {number} usageDays - (Optional) The validity period of the application, in days. Default is 30.
 * @param {BigNumber} gasPrice - (Optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice().
 * @param {BigNumber} gasLimit - (Optional) set gas limit
 * @returns {Promise<number>} - The application ID: Used by the applicant when checking the approval status.
 */
export const applyForSubscriptionAccess = async (
  account: Account,
  orderId: BigNumber | string,
  dataId: string,
  usageDays = 30,
  payTokenAddress: string,
  payAmountInWei: BigNumber | string,
  payCheckUrl: string,
  gasLimit: BigNumber = BigNumber.from('0'), // Note that using gasUsedAmount ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  gasPrice: BigNumber = BigNumber.from('0') // Note that using gasPrice ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
): Promise<number> => {
  /**
     * Flow:
            Query the backend method using Bob's account ID and file ID (the backend will find the corresponding strategy ID), which is equivalent to using Bob's account ID and Alice's strategy ID, to determine if the payment was successful (unpaid, payment pending confirmation, paid).
            If the status is unpaid/payment failed, you can call the payment interface. Other statuses are not allowed (payment pending confirmation status, wait for half an hour or 1 hour, if unable to query, reset to payment failed status (similar to the previous scheduled task)).
            When calling the /apply/subscribe interface, pass the tx_hash parameter, Bob's account ID, and file ID (the backend will find the corresponding strategy ID) to the backend. The backend will receive it and set the status to payment pending confirmation, and the subscription status to "under review".
            After the backend detects this payment event, it will update the payment status to "paid" and the subscription status to "approved".
    */

  if (typeof orderId === 'string') {
    if (!isNumeric(orderId)) {
      throw new Error('Each digit in the orderId must be composed of numbers');
    }
    orderId = BigNumber.from(orderId);
  }

  //check the pay status by payCheckUrl
  const payStatus: string = await getBobPayStatus(orderId, payCheckUrl);

  //eslint-disable-next-line no-debugger
  debugger;
  
  //NOT_PAID (not paid or Insufficient payment), PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPRIED

  let payInfo: any = null;
  if (payStatus === 'NOT_PAID' || payStatus === 'EXPRIED' || payStatus === 'REJECTED') {
    payInfo = await bobPaySubscriptionFee(
      account,
      orderId,
      dataId,
      payTokenAddress,
      payAmountInWei,
      usageDays,
      payCheckUrl,
      gasLimit,
      gasPrice,
      false //Notify the backend first, then wait for it to be on-chain to prevent the user from closing the dialog prematurely
    );
  }

  //apply for Subscriber User Feeds Permission
  const data = await applyForSubscriberVisiblePermission(
    orderId,
    dataId,
    account,
    isBlank(payInfo) ? '' : payInfo?.hash,
    /* payCheckUrl,  */ usageDays
  );

  if (!isBlank(payInfo) && !isBlank(payInfo?.hash)) {
    //wait for receipt
    let receipt: any = null;

    let retryTimes = 130;
    do {
      try {
        receipt = await web3.eth.getTransactionReceipt(payInfo.hash);
        //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
      } catch (error) {
        console.log(
          `applyForSubscriptionAccess getTransactionReceipt bob Pay txHash: ${payInfo.hash} retrying ..., current error: `
        );
      }

      if (isBlank(receipt)) {
        if (retryTimes % 3 == 0) {
          Message.info('Bob pay transaction is being confirmed on the blockchain. Please wait patiently');
        }

        await sleep(3000);
      }
      retryTimes--;
    } while (isBlank(receipt) && retryTimes > 0);

    const txReceipt = receipt as TransactionReceipt;

    //const transaction = await web3.eth.getTransaction(tx.hash);
    //  //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
    if (isBlank(txReceipt)) {
      const transaction = await web3.eth.getTransaction(payInfo.hash);
      //console.log("transaction.input:", transaction.input);
      console.log('applyForSubscriptionAccess transaction:', transaction);
      console.log(
        `applyForSubscriptionAccess getTransactionReceipt error: Bob pay transaction Hash is ${payInfo.hash}, transaction receipt is null.!`
      );

      throw new GetTransactionReceiptError(
        `Bob pay: getTransactionReceipt error: transaction Hash is ${payInfo.hash}, transaction receipt is null.!`
      );
    } else {
      //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
      if (!txReceipt.status) {
        //The transaction failed. Users can manually pay again.

        console.log(
          `applyForSubscriptionAccess Bob pay Failed: transaction Hash is ${payInfo.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
        );
        throw new TransactionError(
          `Bob pay Failed: transaction Hash is ${payInfo.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
        );
      }
    }
  }

  return (data as object)['apply_id'] as number;
};

/**
 * @internal
 * Apply for Subscriber User Feeds Permission. The interface automatically approves the application result, without the need for manual approval.
 * Note: This is for the application of strategies. Applying for access to any file within the feed is sufficient.
 * So if the app applies twice, using different file IDs but corresponding to the same strategy, if the first application is approved, then the second one should be rejected.
 * Note: Different from applying for the interface with multiple files (apply/files):
 *          If the policy corresponding to the document has already been applied for, it will return code: 4109, msg: "current file does not need to apply"
 * @category Data User(Bob) Request Data
 * @param {BigNumber | string} orderId - A unique string composed of numbers.
 * @param {string} dataId - A file ID to apply for usage permission.
 * @param {Account} account - The account that applies for the permission（Bob）.
 * @param {string} txHash - Bob pay transaction hash for the subscription fee.
//  * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @param {number} usageDays - (Optional) The validity period of the application, in days. Default is 30.
 * @returns {Promise<any>} - If successful, return the application ID information. If failed, return the error message.
 */
export const applyForSubscriberVisiblePermission = async (
  orderId: BigNumber,
  dataId: string,
  account: Account,
  txHash: string,
  //payCheckUrl: string, //no need now for pre backend
  usageDays = 30
) => {
  if (usageDays <= 0) {
    throw Error("The application file/data's validity period must be greater than 0 days");
  }

  const sendData: any = {
    order_id: orderId.toString(),
    file_id: dataId,
    proposer_id: account.id,
    account_id: account.id, //new for backend signature
    days: usageDays,
    //pay_check_url: payCheckUrl, //no need now for pre backend
    tx_hash: isBlank(txHash) ? '' : txHash
  };

  /*   console.log(
      `usageDays: ${usageDays}, startMs: ${startMs}, endMs: ${endMs}, endMs-startMs:${
        (endMs - startMs) / (1000.0 * 60 * 60 * 24)
      }`,
    ); */

  // console.log("apply data user account", account);
  // console.log("apply data file_ids", dataIds);

  const settingsData = await getSettingsData();
  sendData['chain_id'] = settingsData.chainId;

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData);

  const data = await serverPost('/apply/subscribe', sendData);

  return data;
};

/**
 * Approve user subscription request to backend task queue. If it is successful, it will be inserted into the task queue for processing. The backend service usually takes 5 to 10 minutes to process and take effect.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @category Data Publisher(Alice) Approval (Multi)
 * @param {Account} publisher - Account the current account object
 * @param {string[]} applyIds - Application Record ID list
 * @param {string} refundUrl - Refund information notification url: if the approval is rejected, a refund will be initiated
 * @param {BigNumber} gasFeeInWei - (Optional) by call 'getPolicysGasFee', must be the token of the chain (e.g. bnb), not be the nlk
 * @param {BigNumber} gasPrice - (Optional) the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
 * @returns {void} - This function has no return value; it will throw an exception on failure.. You can use the `getDataByStatus` interface to query the application status.
 */
export const approveUserSubscription = async (
  publisher: Account,
  applyIds: string[] // Application Record ID
) => {
  // let gasPrice: BigNumber = BigNumber.from('0'); //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time

  // {"approvedApplyIds": [], "underViewApplyIds": []}
  const { approvedApplyIds, underViewApplyIds }: any = await checkMultiDataApprovalStatusIsApprovedOrApproving(
    applyIds
  );

  if (approvedApplyIds.length > 0) {
    throw new PolicyHasBeenActivedOnChain(`Policys ${approvedApplyIds} are approved, no need apply again`);
  }

  if (underViewApplyIds.length > 0) {
    throw new PolicyApproving(`Policys ${underViewApplyIds} are under review, please wait for the review to complete`);
  }

  let applyInfoList = await getMultiApplyDetails(applyIds);
  if (isBlank(applyInfoList)) {
    throw new ApplyNotExist(`one of the apply: ${applyIds} does not exist`);
  }

  applyInfoList = applyInfoList as object[];

  const userAccountIds: string[] = applyInfoList.map((applyInfo) => applyInfo['proposer_id']);
  //applyInfo["start_at"] is second,
  //new Date(startMs) //  start_at is seconds, but Date needs milliseconds
  const startDates: Date[] = applyInfoList.map((applyInfo) => new Date(Number(applyInfo['start_at']) * 1000));
  const endDates: Date[] = applyInfoList.map((applyInfo) => new Date(Number(applyInfo['end_at']) * 1000));
  const ursulaShares: number[] = Array(applyInfoList.length).fill(3);
  const ursulaThresholds: number[] = Array(applyInfoList.length).fill(1);
  const porterUri = '';

  const resultInfo = await getBlockchainPolicys(
    publisher,
    userAccountIds,
    applyIds,
    ursulaShares,
    ursulaThresholds,
    startDates, //policy usage start date
    endDates, //policy usage start date
    porterUri
  );

  //Since Alice's set persona can be a web2 user, she does not need to pay gas fees or any service fees.

  //Requirement: The need to support user-friendly approval, without requiring any fees. In this case, when Alice approves, she needs to call a backend API to complete the approval process.
  //so: Here, the change from enact to generatePreEnactedPolicy is to shift the transaction initiation from the front-end to the back-end, with the front-end only responsible for constructing the transaction parameters
  const preEnacted: MultiPreEnactedPolicy =
    await resultInfo.deDuplicationInfo.multiBlockchainPolicy.generatePreEnactedPolicy(
      resultInfo.deDuplicationInfo.ursulasArray
    );

  if (isBlank(preEnacted)) {
    console.log(`Failed to construct on-chain transaction parameters!`, resultInfo.deDuplicationInfo);
    throw new TransactionError(`Failed to construct on-chain transaction parameters!`);
  }

  const encryptedTreasureMapBytesArray: Uint8Array[] = preEnacted.encryptedTreasureMaps.map((encryptedTreasureMap) =>
    encryptedTreasureMap.toBytes()
  );

  const encryptedTreasureMapIPFSs: string[] = [];

  //For the sake of efficiency, local upload
  //2. upload multiple encrypt files to IPFS
  const cids: string[] = await StorageManager.setData(encryptedTreasureMapBytesArray, publisher);
  encryptedTreasureMapIPFSs.push(...cids);

  //3. call center server to save policy info
  const policy_list: object[] = [];
  const crossChainHracs: CrossChainHRAC[] = preEnacted.ids;

  for (let index = 0; index < crossChainHracs.length; index++) {
    const crossChainHrac: CrossChainHRAC = crossChainHracs[index];
    const startTimeDate: Date = preEnacted.startTimestamps[index];
    const endTimeDate: Date = preEnacted.endTimestamps[index];
    const bobAccountId = resultInfo.deDuplicationInfo.bobAccountIds[index];
    // const bobAccountAddress = resultInfo.deDuplicationInfo.bobAddresses[index];
    const policyLabelId = resultInfo.deDuplicationInfo.policyLabelIds[index];
    //Note: Since all applyIds may have duplicates, and applyIds should correspond one-to-one with policies, pass all duplicate policy information to the backend (deduplicating based on HRAC on the backend).
    policy_list.push({
      hrac: hexlify(crossChainHrac.toBytes() /* Uint8Array[]*/), //fromBytesByEncoding(crossChainHrac.toBytes(), 'binary'),
      end_timestamp: (endTimeDate.getTime() / 1000) | 0,
      start_timestamp: (startTimeDate.getTime() / 1000) | 0,
      encrypted_address: encryptedTreasureMapIPFSs[index],
      encrypted_pk: resultInfo.strategys[index].strategyKeyPair._publicKey, //policy_encrypted_pk
      apply_id: Number(applyIds[index]),
      // bob_address: bobAccountAddress, //policy_bob_address
      // bob_pk: resultInfo.policyParameters.bobs[index].verifyingKey,
      bob_account_id: bobAccountId, //
      policy_label_id: policyLabelId,
      size: preEnacted.sizes[index]
    });
  }

  const sendData: any = {
    account_id: publisher.id,
    apply_ids: applyIds.map((applyId) => Number(applyId)),
    remark: '',
    policy_list: policy_list
  };
  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData);

  //Note: Notified the backend service: Send the transaction hash to the backend.
  //Previously, the under view state background thought that it must be chained, now it can't be: The under view may be unsuccessful or successful.
  // This status needs to be determined by the backend, because while waiting for the transaction to be connected,
  // the user may get impatient and close the page, so the /apply/batch-approve interface will never be called.
  //If the link is successfully connected after this transaction, the status of the page will not change,
  //and the button still displays Review request, which can still be approved again, and the Policy is active

  console.log('before send request: subscribe/batch-approve');

  //V1->V2: The background approve logic changes to: store tx_hash to a table , and then execute approve operator after listening for an on-chain event
  const data = (await serverPost('/subscribe/batch-approve', sendData)) as object;

  console.log('sended the request: /subscribe/batch-approve');

  // const txHash = data['tx_hash'];

  //

  //let receipt: any = null;
  //
  //let retryTimes = 130;
  //do {
  //  try {
  //    receipt = await web3.eth.getTransactionReceipt(txHash);
  //    //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
  //  } catch (error) {
  //    console.log(
  //      `getTransactionReceipt createPolicy txHash: ${txHash} retrying ..., current error: `,
  //      error
  //    );
  //  }
  //
  //  if (isBlank(receipt)) {
  //    if (retryTimes % 3 == 0) {
  //      // Message.info(
  //      console.log('Transaction is being confirmed on the blockchain. Please wait patiently', 'info');
  //    }
  //
  //    await sleep(3000);
  //  }
  //  retryTimes--;
  //} while (isBlank(receipt) && retryTimes > 0);
  //
  //const txReceipt = receipt as TransactionReceipt;
  //
  ////const transaction = await web3.eth.getTransaction(txHash);
  ////  //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
  //if (isBlank(txReceipt)) {
  //  const transaction = await web3.eth.getTransaction(txHash);
  //  //console.log("transaction.input:", transaction.input);
  //  console.log('transaction:', transaction);
  //  console.log(
  //    `getTransactionReceipt error: transaction Hash is ${txHash}, transaction receipt is null. The current status is "Underview". Please be patient and wait for the backend to confirm the transaction (it should be completed within approximately one hour)!`
  //  );
  //
  //  throw new GetTransactionReceiptError(
  //    `getTransactionReceipt error: transaction Hash is ${txHash}, transaction receipt is null. The current status is "Underview". Please be patient and wait for the backend to confirm the transaction (it should be completed within approximately one hour)!`
  //  );
  //} else {
  //  //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
  //  if (!txReceipt.status) {
  //    //The transaction failed. Users can manually re-approve it. We need to notify the backend API to reset the status.
  //    const _sendData: any = {
  //      account_id: publisher.id,
  //      policy_tx_hash: txHash
  //    };
  //    _sendData['signature'] = await signUpdateServerDataMessage(publisher, _sendData);
  //
  //    const _data = await serverPost('/apply/reset', sendData);
  //
  //    console.log('called apply reset, now Users can manually re-approve it');
  //
  //    console.log(
  //      `Approve apply Failed: transaction Hash is ${txHash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
  //    );
  //    throw new TransactionError(
  //      `Approve apply Failed: transaction Hash is ${txHash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
  //    );
  //  }
  //}

  return Object.assign({ /* txHash: txHash,  */ from: publisher.address }, data || { info: 'succeed' });
};

/**
 * Rejects user subscription request. This account acts as the publisher (Alice). The batch version of the function refusalApplicationForUseData.
 * @category Data Publisher(Alice) Approval (Multi)
 * @param {Account} publisher - The account of the publisher (Alice).
 * @param {string[]} applyIds - The application apply ID to reject.
 * @returns {Promise<void>} - This function has no return value; it will throw an exception on failure.
 */
export const refusalUserSubscription = async (
  publisher: Account,
  applyIds: string[] // Application Record ID
) => {
  //https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E6%8B%92%E7%BB%9D%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E7%94%B3%E8%AF%B7
  const sendData: any = {
    account_id: publisher.id,
    apply_ids: applyIds.map((applyId) => Number(applyId)),
    remark: ''
  };

  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData);
  const data = await serverPost('/apply/batch-reject', sendData);
  return data;
};

/**
 * Set Project ID, which requires application to Nulink official
 * @param {string} clientId -  Project ID, differentiate the sources of data from different applications
 * @returns {Promise<void>}
 */

/**
 * cancel user subscription, user can manually withdraw the refund
 * @category Data User(Bob) Request Data
 * @param {Account} account - Refund account（Bob）.
 * @param {string} applyId - The application apply ID to reject.
 * @param {BigNumber | string} orderId - A unique string composed of numbers.
 * @param {string} refundUrl - Refund information notification url: if the approval is rejected, a refund will be initiated
 * @param {BigNumber} gasPrice - (Optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice().
 * @param {BigNumber} gasLimit - (Optional) set gas limit
 * @returns {Promise<void>}
 */
export const cancelUserSubscription = async (
  account: Account,
  applyId: string, // Application Record ID
  orderId: BigNumber | string, // orderId
  refundUrl: string, //Refund information notification url: if the approval is rejected, a refund will be initiated
  gasLimit: BigNumber = BigNumber.from('0'), // Note that using gasUsedAmount ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  gasPrice: BigNumber = BigNumber.from('0') // Note that using gasPrice ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
) => {
  const clientId = await getClientId(true);

  if (typeof orderId === 'string') {
    if (!isNumeric(orderId)) {
      throw new Error('Each digit in the orderId must be composed of numbers');
    }
    orderId = BigNumber.from(orderId);
  }

  const provider: Web3Provider = (await getWeb3Provider(account as any)) as Web3Provider;
  //1. check if refund has already been processed

  //call contact function: payInfo(clientid,payid).payStatus is => enum payStatus{PayNull,PaySucc,PayCancel,SettlementSucc}
  const payInfo = await AppPayAgent.getPayInfo(provider, orderId);

  console.log(`cancelUserSubscription pay status: ${payInfo.paySts}`);

  //enum payStatus{PayNull,PaySucc,PayCancel,SettlementSucc} PayNull：0， PaySucc：1， PayCancel：2， SettlementSucc：3
  if ((!isBlank(payInfo) && payInfo.paySts == 2) || payInfo.paySts == 0) {
    return;
  }

  //Settled payments cannot be refunded.
  if (!isBlank(payInfo) && payInfo.paySts == 3) {
    throw new Error('Settled payments cannot be refunded');
  }

  //enum payStatus{PayNull,PaySucc,PayCancel,SettlementSucc} PayNull：0， PaySucc：1， PayCancel：2， SettlementSucc：3

  //if the status is PayNull, PayCancel, SettlementSucc: a refund cannot be initiated, only paySuccess status allows for a refund
  if (isBlank(payInfo) || (!isBlank(payInfo) && payInfo.paySts != 1)) {
    console.log(
      `only paySuccess status allows for a refund, current pay status is: ${
        !isBlank(payInfo) ? payInfo.paySts : 'can not get pay info orderId: ' + orderId + ' clientId: ' + clientId
      }`
    );
    throw new Error(
      `only paySuccess status allows for a refund, current pay status is: ${
        !isBlank(payInfo) ? payInfo.paySts : 'can not get pay info orderId: ' + orderId
      }`
    );
  }

  //2. call contact refund function

  //Check if the gas fee is sufficient.
  const gasInfo: GasInfo = await AppPayAgent.estimateGasBybobPayCancel(
    _Web3Provider.fromEthersWeb3Provider(provider),
    orderId,
    gasPrice
  );

  const gasFeeInWei: BigNumber = gasInfo.gasFee;
  //Ensure that the BNB balance is greater than the GAS fee balance
  const balance: BigNumber = await getBalance(account.address);
  const chainConfigInfo = await getSettingsData();

  console.log(`the account token balance is: ${balance.toString()} wei ${chainConfigInfo.tokenSymbol}`);
  console.log(`the bob pay cancel gas fee is: ${gasFeeInWei.toString()} wei ${chainConfigInfo.tokenSymbol}`);

  if (!gasFeeInWei.lte(BigNumber.from('0')) && balance.lt(gasFeeInWei)) {
    const balanceValue = Web3.utils.fromWei(balance.toString(), 'ether');
    const gasValue = Web3.utils.fromWei(gasFeeInWei.toString(), 'ether');
    // Message.error(
    //   `The account (${account.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to pay subscription fee with a gas value of ${gasValue} ether`,
    // );
    console.log(
      `The account (${account.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to pay subscription fee with a gas value of ${gasValue} ether`
    );
    throw new InsufficientBalanceError(
      `The account (${account.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to  pay subscription fee with a gas value of ${gasValue} ether`
    );
  }

  const tx: ContractTransaction = await AppPayAgent.bobPayCancel(
    _Web3Provider.fromEthersWeb3Provider(provider),
    orderId,
    true,
    gasLimit.lte(BigNumber.from('0')) ? gasInfo.gasLimit : gasLimit,
    gasInfo.gasPrice
  );

  if (isBlank(tx) || isBlank(tx.hash)) {
    console.log(`send Bob Pay Cancel transaction failed!`);
    throw new TransactionError(`send Bob Pay Cancel transaction failed!`);
  }

  console.log(`Bob pay Cancel txHash: tx.hash`);

  //3. call pre backend API, and backend API needs to change payment status

  const sendData: any = {
    apply_id: Number(applyId),
    proposer_id: account.id,
    account_id: account.id,
    refund_url: refundUrl,
    tx_hash: tx.hash
  };

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData);
  const data = await serverPost('/refund/subscribe', sendData);

  let receipt: any = null;

  let retryTimes = 130;
  do {
    try {
      receipt = await web3.eth.getTransactionReceipt(tx.hash);
      //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
    } catch (error) {
      console.log(`getTransactionReceipt bob Pay txHash: ${tx.hash} retrying ..., current error: `);
    }

    if (isBlank(receipt)) {
      if (retryTimes % 3 == 0) {
        Message.info('Transaction is being confirmed on the blockchain. Please wait patiently');
      }

      await sleep(3000);
    }
    retryTimes--;
  } while (isBlank(receipt) && retryTimes > 0);

  const txReceipt = receipt as TransactionReceipt;

  //const transaction = await web3.eth.getTransaction(tx.hash);
  //  //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
  if (isBlank(txReceipt)) {
    const transaction = await web3.eth.getTransaction(tx.hash);
    //console.log("transaction.input:", transaction.input);
    console.log('transaction:', transaction);
    console.log(`getTransactionReceipt error: Bob pay transaction Hash is ${tx.hash}, transaction receipt is null.!`);

    throw new GetTransactionReceiptError(
      `Bob pay Cancel: getTransactionReceipt error: transaction Hash is ${tx.hash}, transaction receipt is null.!`
    );
  } else {
    //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
    if (!txReceipt.status) {
      //The transaction failed. Users can manually pay again.

      console.log(
        `Bob pay Cancel Failed: transaction Hash is ${tx.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
      );
      throw new TransactionError(
        `Bob pay Cancel Failed: transaction Hash is ${tx.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
      );
    }
  }

  const _payInfo = await AppPayAgent.getPayInfo(provider, orderId);
  console.log(`cancelUserSubscription: after send transaction, txHash is ${tx.hash}, pay status is ${_payInfo.paySts}`);

  return data;
};

/**
 * Get approved document content (downloadable) list. The file/data applicant retrieves the content of a file/data that has been approved for their usage.
 * @category Data User(Bob) Download Data
 * @param {Account} userAccount - Account the current account object
 * @param {string []} dataIds - file/data's id list
 * @returns {Promise<Dictionary<ArrayBuffer>>} - {fileId1: dataContent1, fileId2: dataContent2, ....}
 */
export const getDataContentListByDataIdAsUser = async (
  userAccount: Account,
  dataIds: string[]
): Promise<Dictionary<ArrayBuffer>> => {
  //get file/data info

  const dataDict: Dictionary<ArrayBuffer> = {};

  for (let index = 0; index < dataIds.length; index++) {
    const dataId = dataIds[index];
    const dataContent: ArrayBuffer = await getDataContentByDataIdAsUser(userAccount, dataId);
    dataDict[dataId] = dataContent;
  }

  return dataDict;
};

/**
 * Set Project ID, which requires application to Nulink official
 * @param {string} clientId -  Project ID, differentiate the sources of data from different applications
 * @returns {Promise<void>}
 */

/**
 * Bob applies to extend the subscription time (payment required in NLK or local currency). If the application is successful, it will be inserted into the task queue for processing. The backend service usually takes 5 to 10 minutes to process and take effect.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @category Data User(Bob) Request Data
 * @param {Account} account - Account the current account object
 * @param {string} applyId - Application Record ID
 * @param {number} extendedDays - Days extended for subscription.
 * @param {BigNumber | string} orderId - A unique string composed of numbers. 
 * @param {string} payTokenAddress - payment token address
 * @param {string} payAmountInWei - payment amount, unit: wei
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @param {BigNumber} gasPrice - (Optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice().
 * @param {BigNumber} gasLimit - (Optional) set gas limit

 * @returns {void} - This function has no return value; it will throw an exception on failure.. You can use the `getDataByStatus` interface to query the application status.
 */
export const extendPolicysValidity = async (
  account: Account,
  applyId: string, // Application Record ID
  extendedDays: number,
  orderId: BigNumber | string,
  payTokenAddress: string,
  payAmountInWei: BigNumber | string,
  payCheckUrl: string,
  gasLimit: BigNumber = BigNumber.from('0'), // Note that using gasUsedAmount ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  gasPrice: BigNumber = BigNumber.from('0') // Note that using gasPrice ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
) => {
  //1.check the status and params
  if (typeof orderId === 'string') {
    if (!isNumeric(orderId)) {
      throw new Error('Each digit in the orderId must be composed of numbers');
    }
    orderId = BigNumber.from(orderId);
  }

  const applyIds: string[] = [applyId];
  // const extendedDayses: number[] = [extendedDays];

  const policyData = (await getApplyDetails(applyId)) as object;
  // assert(policyData && !isBlank(policyData));
  if (!policyData || isBlank(policyData)) {
    throw new ApplyNotExist(`the apply Id: ${applyId} does not exist`);
  }

  // let applyInfoList = await getMultiApplyDetails(applyIds);

  // if (isBlank(applyInfoList)) {
  //   throw new ApplyNotExist(`one of the apply Id: ${applyIds} does not exist`);
  // }

  //applyInfoList = applyInfoList as object[];

  const endTimestamps: number[] = [];

  const crossChainHRACList: CrossChainHRAC[] = [];

  const applyInfo = policyData;
  if (applyInfo['status'] != 5) {
    //status: "apply status: 1 - In progress, 2 - Approved, 3 - Rejected, 4 - Under review, 5 - Expired"
    throw new PolicyNotExpired(
      `apply: ${applyId} is not Expired, status is ${convertApplyIdStatusToString(applyInfo['status'])}`
    );
  }

  const proposerAccountId: string = applyInfo['proposer_id'];

  if (proposerAccountId.toLowerCase() != account.id.toLowerCase()) {
    throw new Error(
      `The applicant(account id) ${proposerAccountId} corresponding to the application ID ${applyId} is not yourself (account id ${account.id}). `
    );
  }

  if (applyInfo['status'] != 5) {
    //status: "apply status: 1 - In progress, 2 - Approved, 3 - Rejected, 4 - Under review, 5 - Expired"
    throw new PolicyNotExpired(
      `apply: ${applyId} is not Expired, status is ${convertApplyIdStatusToString(applyInfo['status'])}`
    );
  }

  // const alice_verify_pk = applyInfo['alice_verify_pk'];
  // const bob_verify_pk = applyInfo['bob_verify_pk'];
  // const label = applyInfo['policy_label_id'];

  // console.log(
  //   ` applyInfo \n alice_verify_pk: ${alice_verify_pk} bytes: ${toBytes(
  //     alice_verify_pk
  //   )}, \n bob_verify_pk: ${bob_verify_pk} bytes: ${toBytes(bob_verify_pk)}\n label: ${label}`
  // );

  // const publisherVerifyingKey = NucypherCore.PublicKey.fromBytes(toBytes(alice_verify_pk));
  // const bobVerifyingKey = NucypherCore.PublicKey.fromBytes(toBytes(bob_verify_pk));

  // const _hrac = new HRAC(publisherVerifyingKey, bobVerifyingKey, toBytes(label));

  // const config = await getConfigData();
  // console.log('chainId: ', config.chainId);

  // const hrac = new CrossChainHRAC(_hrac, config.chainId);
  // crossChainHRACList.push(hrac);

  //Extend backwards from the current time as a reference

  //toEpoch: date to seconds
  const endTimestamp = toEpoch(new Date()) + extendedDays * 86400;
  endTimestamps.push(endTimestamp);

  const aliceAddress = applyInfo['alice_address'];

  //check the pay status by payCheckUrl
  const payStatus: string = await getBobPayStatus(orderId, payCheckUrl);
  //NOT_PAID (not paid or Insufficient payment), PENDING, UNDER_REVIEW, APPROVED, REJECTED, EXPRIED

  let payInfo: any = null;
  if (payStatus === 'NOT_PAID' || payStatus === 'EXPRIED' || payStatus === 'REJECTED') {
    //这里有问题，支付这里的订阅时间是和createPolicy的endtimes的时间一样，通过Bob延长有效期时指定时间。
    //必须先调用extendPolicyTimeMulti才行，这个是管理员调用的，必须Bob先延长有效期续费才行。矛盾了 (链上修改了endTimetamps, 感觉这里需要新增一个延长策略有效期的付款函数)。
    //其实也不影响，付费不管有有效期，但是payCheckUrl去检查这个。

    //2.Bob pays the subscription fee.

    // Note: Wait for the payment to succeed before notifying the backend;
    //        otherwise, even if the backend is notified, the application will be rejected
    //query bob's payment status and pay:
    //{ status: payStatus }
    payInfo = await bobPaySubscriptionFee2(
      account,
      orderId,
      aliceAddress,
      payTokenAddress,
      payAmountInWei,
      extendedDays,
      payCheckUrl,
      gasLimit,
      gasPrice,
      false //Notify the backend first, then wait for it to be on-chain to prevent the user from closing the dialog prematurely
    );
  }

  //3. send message to backend service

  const sendData: any = {
    account_id: account.id,
    applyIds: applyIds,
    //policy_ids: crossChainHRACList.map((hracId) => hracId.toBytes()),
    end_ats: endTimestamps,
    tx_hash: isBlank(payInfo) ? '' : payInfo?.hash
  };
  sendData['signature'] = await signUpdateServerDataMessage(account, sendData);

  //Note: Notified the backend service: Send the transaction hash to the backend.
  //Previously, the under view state background thought that it must be chained, now it can't be: The under view may be unsuccessful or successful.
  // This status needs to be determined by the backend, because while waiting for the transaction to be connected,
  // the user may get impatient and close the page, so the /apply/batch-approve interface will never be called.
  //If the link is successfully connected after this transaction, the status of the page will not change,
  //and the button still displays Review request, which can still be approved again, and the Policy is active

  console.log('before send request: /policy/extend-times');

  //V1->V2: The background approve logic changes to: store tx_hash to a table , and then execute approve operator after listening for an on-chain event
  const data = (await serverPost('/policy/extend-times', sendData)) as object;

  console.log('sended the request: /policy/extend-times');

  if (!isBlank(payInfo) && !isBlank(payInfo?.hash)) {
    //wait for receipt
    let receipt: any = null;

    let retryTimes = 130;
    do {
      try {
        receipt = await web3.eth.getTransactionReceipt(payInfo.hash);
        //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
      } catch (error) {
        console.log(
          `applyForSubscriptionAccess getTransactionReceipt bob Pay txHash: ${payInfo.hash} retrying ..., current error: `
        );
      }

      if (isBlank(receipt)) {
        if (retryTimes % 3 == 0) {
          Message.info('Bob pay transaction is being confirmed on the blockchain. Please wait patiently');
        }

        await sleep(3000);
      }
      retryTimes--;
    } while (isBlank(receipt) && retryTimes > 0);

    const txReceipt = receipt as TransactionReceipt;

    //const transaction = await web3.eth.getTransaction(tx.hash);
    //  //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
    if (isBlank(txReceipt)) {
      const transaction = await web3.eth.getTransaction(payInfo.hash);
      //console.log("transaction.input:", transaction.input);
      console.log('applyForSubscriptionAccess transaction:', transaction);
      console.log(
        `applyForSubscriptionAccess getTransactionReceipt error: Bob pay transaction Hash is ${payInfo.hash}, transaction receipt is null.!`
      );

      throw new GetTransactionReceiptError(
        `Bob pay: getTransactionReceipt error: transaction Hash is ${payInfo.hash}, transaction receipt is null.!`
      );
    } else {
      //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
      if (!txReceipt.status) {
        //The transaction failed. Users can manually pay again.

        console.log(
          `applyForSubscriptionAccess Bob pay Failed: transaction Hash is ${payInfo.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
        );
        throw new TransactionError(
          `Bob pay Failed: transaction Hash is ${payInfo.hash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
        );
      }
    }
  }
};
