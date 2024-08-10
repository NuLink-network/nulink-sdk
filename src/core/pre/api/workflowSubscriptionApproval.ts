/**
 *  Encapsulate the entire pre file sharing process
 * Note: Anything with an Account parameter is placed in the first parameter of the function. It is convenient to unify the calling format when interacting with the browser page
 */
import sleep from 'await-sleep';
import { signMessage } from '../../utils/sign.message';

import { Account, Strategy, web3 } from '../../hdwallet/api/account';
import { GAS_LIMIT_FACTOR, GAS_PRICE_FACTOR } from '../../chainnet/config';
import { getClientId, setClientId } from '../../chainnet/api/getData';
import { DecimalToInteger } from '../../utils/math';
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

//reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
// notice: bacause the encryptedMessage.decrypt( get by MessageKit) use the SecretKey import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
// eslint-disable-next-line import/no-extraneous-dependencies
import { PublicKey, SecretKey as NucypherTsSecretKey, CrossChainHRAC } from '@nulink_network/nulink-ts-app';

import { encryptMessage } from './enrico';
import { isBlank } from '../../utils/null';
import { DataCategory, DataInfo, DataType, DecryptedDataInfo, Dictionary, GasInfo } from '../types';
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

import { BigNumber, utils } from 'ethers';
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
  PolicyHasBeenActivedOnChain,
  GetStrategyError,
  DecryptError,
  GetTransactionReceiptError,
  TransactionError,
  ApplyNotExist,
  PolicyApproving
} from '../../utils/exception';
import { getWeb3 } from '../../hdwallet/api';
import { getRandomElementsFromArray } from '../../utils';
import { NETWORK_LIST } from '../../sol';
import { getDataCategoryString } from './utils';
import {
  calcPolicysCost,
  checkMultiDataApprovalStatusIsApprovedOrApproving,
  estimatePolicysGasFee,
  getBlockchainPolicys,
  getDataContentByDataIdAsUser,
  getDataDetails,
  getMultiApplyDetails,
  getPolicysTokenCost,
  signUpdateServerDataMessage
} from './workflow';

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
   *         thumbnail: fileThumbnail,  //return only if the input parameters include the specified parameters
   *         mimtype: fileMimtype,   //return only if the input parameters include the specified parameters
   *       }
   *      ]
   * }
  
   */
export const publishDataForPaidSubscriberVisible = async (
  account: Account,
  dataInfoList: DataInfo[] //data information list //just allow upload one file
): Promise<object> => {
  console.log('uploadDataByCreatePolicy account', account);

  const strategyIndex = 0;
  let strategy: Strategy | undefined = account.getStrategy(strategyIndex);

  if (isBlank(strategy)) {
    const clientId = await getClientId();

    if (isBlank(clientId)) {
      throw new Error('clientId is not set, need invoke the function initClientId frist');
    }

    /**
     * 1. Labels cannot use random nanoid, otherwise account recovery will be difficult if the account is lost.
     * 2. Paid subscriptions can only be used within the same project, cross-project subscriptions require re-payment.
     */
    const label =
      'pair_for_subscriber_visable_' +
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

  const clientId = await getClientId();

  if (isBlank(clientId)) {
    throw new Error('clientId is not set, need invoke the function initClientId frist');
  }

  //Note: In the createStrategyWithLabelPrefixAndStrategyIndex function, the label will also add the strategy's index to the base prefix, in order to increase the uniqueness.
  const labelPrefix = 'pair_for_individual_visable_' + clientId.toLowerCase() + account.address.toLowerCase() + '_'; //'_' + strategyIndex; //nanoid();
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
      name: _data.name,
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
 * @param {string} dataId - A file ID to apply for usage permission.
 * @param {Account} account - The account that applies for the permission （Bob）.
 * @returns {Promise<number>}   0: Unpaid
                                1: Payment Pending Confirmation
                                2: Paid
                                3: Payment Failed (Reset to Payment Failed status if unable to query)
 */
export const queryBobPayStatus = async (dataId: string, account: Account): Promise<number> => {
  //get golbal time from server
  const sendData = {
    file_id: dataId,
    proposer_id: account.id
  };

  const data = (await serverGet('/pay/status', sendData)) as object;

  return data['status'] as number;
};

/**
 * Apply for subscriber user feeds, This account acts as the user(Bob).
 * Note: Different from applying for the interface with multiple files (apply/files):
 *          If the policy corresponding to the document has already been applied for, it will return code: 4109, msg: "current file does not need to apply"
 * @category Data User(Bob) Request Data
 * @param {string} dataId - A file/data ID to apply for usage permission.
 * @param {string} orderId - order id e.g. uuid.
 * @param {string} payTokenAddress - payment token address
 * @param {string} payAmountInWei - payment amount, unit: wei
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @param {Account} account - The account that applies for the permission （Bob）.
 * @param {number} usageDays - (Optional) The validity period of the application, in days. Default is 30.
 * @returns {Promise<void>}
 */
export const applyForSubscriptionAccess = async (
  account: Account,
  orderId: string,
  dataId: string,
  usageDays = 30,
  payTokenAddress: string,
  payAmountInWei: BigNumber | string,
  payCheckUrl: string
): Promise<number> => {
  /**
     * Flow:
            Query the backend method using Bob's account ID and file ID (the backend will find the corresponding strategy ID), which is equivalent to using Bob's account ID and Alice's strategy ID, to determine if the payment was successful (unpaid, payment pending confirmation, paid).
            If the status is unpaid/payment failed, you can call the payment interface. Other statuses are not allowed (payment pending confirmation status, wait for half an hour or 1 hour, if unable to query, reset to payment failed status (similar to the previous scheduled task)).
            When calling the /apply/subscribe interface, pass the tx_hash parameter, Bob's account ID, and file ID (the backend will find the corresponding strategy ID) to the backend. The backend will receive it and set the status to payment pending confirmation, and the subscription status to "under review".
            After the backend detects this payment event, it will update the payment status to "paid" and the subscription status to "approved".
    */

  //query bob's payment status

  const payStatus = await queryBobPayStatus(dataId, account);

  /*
    0: Unpaid
    1: Payment Pending Confirmation
    2: Paid
    3: Payment Failed (Reset to Payment Failed status if unable to query)
  */
  if (0 == payStatus) {
    if (!(payAmountInWei instanceof BigNumber)) {
      payAmountInWei = BigNumber.from(payAmountInWei as string);
    }
    console.log(
      `applyForSubscriptionAccess => bob address: ${account.address} bob id: ${account.id} orderId: ${orderId} dataId: ${dataId} payAmountInWei: ${payAmountInWei}, payTokenAddress: ${payTokenAddress}`
    );

    //Bob pre-paid tokens to subscribe to the user feeds
    //TODO: on chain transaction
  }

  //apply for Subscriber User Feeds Permission
  const data = await applyForSubscriberVisiblePermission(dataId, account, payCheckUrl, usageDays);

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
 * @param {string} dataId - A file ID to apply for usage permission.
 * @param {Account} account - The account that applies for the permission（Bob）.
 * @param {string} payCheckUrl - url to check if bob has paid enough for the subscription fee
 * @param {number} usageDays - (Optional) The validity period of the application, in days. Default is 30.
 * @returns {Promise<void>}
 */
export const applyForSubscriberVisiblePermission = async (
  dataId: string,
  account: Account,
  payCheckUrl: string,
  usageDays = 30
) => {
  // https://github.com/NuLink-network/nulink-node/blob/main/API.md#%E7%94%B3%E8%AF%B7%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8
  //TODO:  Consider returning the apply record ID

  if (usageDays <= 0) {
    throw Error("The application file/data's validity period must be greater than 0 days");
  }

  const sendData: any = {
    file_id: dataId,
    proposer_id: account.id,
    account_id: account.id, //new for backend signature
    days: usageDays,
    pay_check_url: payCheckUrl
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
 * Approve user subscription request, This account acts as Publisher (Alice) grant. The batch version of the function refusalApplicationForUseData.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @category Data Publisher(Alice) Approval (Multi)
 * @param {Account} publisher - Account the current account object
 * @param {string[]} applyIds - Application Record ID list
 * @param {string} refundUrl - Refund information notification url: if the approval is rejected, a refund will be initiated
 * @param {BigNumber} gasFeeInWei - (Optional) by call 'getPolicysGasFee', must be the token of the chain (e.g. bnb), not be the nlk
 * @param {BigNumber} gasPrice - (Optional) the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
 * @returns {object} - {
 *                       txHash: 'the transaction hash of the "approve" transaction',
 *                       from: 'publisher.address'
 *                     }
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
    const endTimeDate: Date = preEnacted.endTimestamps[index];
    const bobAccountId = resultInfo.deDuplicationInfo.bobAccountIds[index];
    // const bobAccountAddress = resultInfo.deDuplicationInfo.bobAddresses[index];
    const policyLabelId = resultInfo.deDuplicationInfo.policyLabelIds[index];
    //Note: Since all applyIds may have duplicates, and applyIds should correspond one-to-one with policies, pass all duplicate policy information to the backend (deduplicating based on HRAC on the backend).
    policy_list.push({
      hrac: hexlify(crossChainHrac.toBytes() /* Uint8Array[]*/), //fromBytesByEncoding(crossChainHrac.toBytes(), 'binary'),
      end_timestamp: (endTimeDate.getTime() / 1000) | 0,
      encrypted_address: encryptedTreasureMapIPFSs[index],
      encrypted_pk: resultInfo.strategys[index].strategyKeyPair._publicKey, //policy_encrypted_pk
      apply_id: Number(applyIds[index]),
      // bob_address: bobAccountAddress, //policy_bob_address
      // bob_pk: resultInfo.policyParameters.bobs[index].verifyingKey,
      bob_account_id: bobAccountId, //
      policy_label_id: policyLabelId
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

  const txHash = data['tx_hash'];

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

  return Object.assign({ txHash: txHash, from: publisher.address }, data || { info: 'succeed' });
};

/**
 * Approval of applications for use of Files/Data, This account acts as Publisher (Alice) grant. The batch version of the function refusalApplicationForUseData.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @category Data Publisher(Alice) Approval (Multi)
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
export const approvalApplicationsForUseData1 = async (
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

  const applyInfoList = await getMultiApplyDetails(applyIds);
  if (isBlank(applyInfoList)) {
    throw new ApplyNotExist(`one of the apply: ${applyIds} does not exist`);
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
  );

  //Ensure that the BNB balance is greater than the GAS fee balance
  const balance: BigNumber = await getBalance(publisher.address);
  const chainConfigInfo = await getSettingsData();

  console.log(`the account token balance is: ${balance.toString()} wei ${chainConfigInfo.tokenSymbol}`);
  console.log(`the create policy gas fee is: ${gasFeeInWei.toString()} wei ${chainConfigInfo.tokenSymbol}`);

  if (!gasFeeInWei.lte(BigNumber.from('0')) && balance.lt(gasFeeInWei)) {
    const balanceValue = Web3.utils.fromWei(balance.toString(), 'ether');
    const gasValue = Web3.utils.fromWei(gasFeeInWei.toString(), 'ether');
    // Message.error(
    //   `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`,
    // );
    console.log(
      `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`
    );
    throw new InsufficientBalanceError(
      `The account (${publisher.address}) balance of ${balanceValue} ether in [token] ${chainConfigInfo.tokenSymbol} is insufficient to publish a policy with a gas value of ${gasValue} ether`
    );
  }

  const costServerFeeWei: BigNumber = BigNumber.from('0');

  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();

  if ([NETWORK_LIST.Horus, NETWORK_LIST.HorusMainNet].includes(curNetwork)) {
    //only mainnet can get nlk balance. if not crosschain mainnet, no nlk token, no need get nlk balance

    //enPolicy service fee gas wei
    const costServerFeeWei: BigNumber = await calcPolicysCost(
      resultInfo.alice,
      resultInfo.deDuplicationInfo.policyParameters.startDates,
      resultInfo.deDuplicationInfo.policyParameters.endDates,
      resultInfo.deDuplicationInfo.policyParameters.shares
    );

    const txHashOrEmpty: string = (await approveNLK(
      publisher,
      BigNumber.from('10000000000000000000000000'),
      costServerFeeWei,
      false,
      gasPrice
    )) as string;

    // eslint-disable-next-line no-extra-boolean-cast
    console.log(
      !txHashOrEmpty
        ? `approvalApplicationForUseData no need approve nlk`
        : `approvalApplicationForUseData approveNLK txHash: ${txHashOrEmpty}`
    );

    //wei can use  BigNumber.from(), ether can use ethers.utils.parseEther(), because the BigNumber.from("1.2"), the number can't not be decimals (x.x)
    //await publisher.getNLKBalance() return ethers
    //Check whether the account balance is less than the policy creation cost
    const nlkEther = await publisher.getNLKBalance();
    const nlkBalanceWei: BigNumber = ethers.utils.parseEther(nlkEther as string);
    const costServerEther = Web3.utils.fromWei(costServerFeeWei.toString(), 'ether');

    console.log(`the account balance is: ${nlkEther} ether nlk`);
    console.log(`the create policy server fee is: ${costServerEther.toString()} ether nlk`);

    //Don't forget the mint fee (service charge), so use the method lte, not le
    if (nlkBalanceWei.lt(costServerFeeWei)) {
      // Message.error(
      //   `The account ${publisher.address} balance of ${nlkBalanceEthers} ether in [token] ${chainConfigInfo.nlkTokenSymbol} is insufficient to publish policy with a value of ${costServerGasEther} ether`,
      // );
      console.log(
        `The account ${publisher.address} balance of ${nlkEther} ether in [token] ${chainConfigInfo.nlkTokenSymbol} is insufficient to publish policy with a value of ${costServerEther} ether`
      );
      throw new InsufficientBalanceError(
        `The account ${publisher.address} balance of ${nlkEther} ether in [token] ${chainConfigInfo.nlkTokenSymbol} is insufficient to publish policy with a value of ${costServerEther} ether`
      );
    }
  } //end of if ([NETWORK_LIST.Horus, NETWORK_LIST.HorusMainNet].includes(curNetwork))

  // "@nucypher_network/nucypher-ts": "^0.7.0",  must be this version
  console.log('before multi policy enact');
  const waitReceipt = false;

  const web3: Web3 = await getWeb3();

  const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] = DecimalToInteger(GAS_PRICE_FACTOR);

  //estimatedGas * gasPrice * factor
  if (gasPrice.lte(BigNumber.from('0'))) {
    // the gasPrice is obtained in real time
    gasPrice = BigNumber.from(await web3.eth.getGasPrice());
    gasPrice = gasPrice.mul(GAS_PRICE_FACTOR_LEFT).div(GAS_PRICE_FACTOR_RIGHT);
  } else {
    //If the gasPrice is manually set, the GAS_PRICE_FACTOR is not set
  }

  const _gasPrice = gasPrice;

  let gasLimit: BigNumber = gasFeeInWei.gt(BigNumber.from('0')) ? gasFeeInWei.div(_gasPrice) : BigNumber.from('0');

  if (!gasLimit.lte(BigNumber.from('0')) && gasFeeInWei.gt(gasLimit.mul(_gasPrice))) {
    //There may be rounding issues in English, indicating no exact division and resulting in a remainder

    gasLimit = gasLimit.add(1); //.mul(2) //increase by two times
  }

  console.log('current set gasPrice: ', _gasPrice, utils.formatUnits(_gasPrice));
  console.log('current set gasLimit: ', gasLimit, utils.formatUnits(gasLimit));

  //MultiPreEnactedPolicy
  //let enMultiPolicy: MultiEnactedPolicy;
  // try {
  //   enMultiPolicy = await resultInfo.deDuplicationInfo.multiBlockchainPolicy.enact(
  //     resultInfo.deDuplicationInfo.ursulasArray,
  //     waitReceipt,
  //     gasLimit,
  //     _gasPrice
  //   )
  // } catch (error) {
  //   console.log("call enact failed error: ", error);
  //   console.log("retrying enact");
  //   enMultiPolicy = await resultInfo.deDuplicationInfo.multiBlockchainPolicy.enact(
  //     resultInfo.deDuplicationInfo.ursulasArray,
  //     waitReceipt,
  //     BigNumber.from("0"),//gasLimit,
  //     BigNumber.from("0"),//_gasPrice
  //   )
  // }

  const enMultiPolicy = await resultInfo.deDuplicationInfo.multiBlockchainPolicy.enact(
    resultInfo.deDuplicationInfo.ursulasArray,
    waitReceipt,
    gasLimit,
    gasPrice
    //BigNumber.from("0"), //gasLimit
    //BigNumber.from("0") //gasPrice
  );

  console.log('after mulit policy enact');

  if (isBlank(enMultiPolicy) || isBlank(enMultiPolicy.txHash)) {
    console.log(`send transaction Approve failed, Please refresh page first and try again!`);
    throw new TransactionError(`send transaction Approve failed, Please refresh page first and try again!`);
  }

  console.log(`enMultiPolicy txHash: ${enMultiPolicy.txHash}`);

  // // Persist side-channel
  // const aliceVerifyingKey: PublicKey = alice.verifyingKey;
  // const policyEncryptingKey: PublicKey = enPolicy.policyKey;

  const encryptedTreasureMapBytesArray: Uint8Array[] = enMultiPolicy.encryptedTreasureMaps.map((encryptedTreasureMap) =>
    encryptedTreasureMap.toBytes()
  );

  const encryptedTreasureMapIPFSs: string[] = [];

  //2. upload multiple encrypt files to IPFS
  const cids: string[] = await StorageManager.setData(encryptedTreasureMapBytesArray, publisher);
  encryptedTreasureMapIPFSs.push(...cids);

  //3. call center server to save policy info
  const policy_list: object[] = [];
  const crossChainHracs: CrossChainHRAC[] = enMultiPolicy.ids;

  for (let index = 0; index < crossChainHracs.length; index++) {
    const crossChainHrac: CrossChainHRAC = crossChainHracs[index];
    //Note: Since all applyIds may have duplicates, and applyIds should correspond one-to-one with policies, pass all duplicate policy information to the backend (deduplicating based on HRAC on the backend).
    policy_list.push({
      hrac: hexlify(crossChainHrac.toBytes() /* Uint8Array[]*/), //fromBytesByEncoding(crossChainHrac.toBytes(), 'binary'),
      gas: costServerFeeWei.toString(),
      tx_hash: enMultiPolicy.txHash,
      encrypted_address: encryptedTreasureMapIPFSs[index],
      encrypted_pk: resultInfo.strategys[index].strategyKeyPair._publicKey //policy_encrypted_pk
    });
  }

  const sendData: any = {
    account_id: publisher.id,
    apply_ids: applyIds.map((applyId) => Number(applyId)),
    remark: remark,
    policy_list: policy_list
  };
  sendData['signature'] = await signUpdateServerDataMessage(publisher, sendData);

  //Note: Notified the backend service: Send the transaction hash to the backend.
  //Previously, the under view state background thought that it must be chained, now it can't be: The under view may be unsuccessful or successful.
  // This status needs to be determined by the backend, because while waiting for the transaction to be connected,
  // the user may get impatient and close the page, so the /apply/batch-approve interface will never be called.
  //If the link is successfully connected after this transaction, the status of the page will not change,
  //and the button still displays Review request, which can still be approved again, and the Policy is active

  console.log('before send the notification: apply/batch-approve');

  //V1->V2: The background approve logic changes to: store tx_hash to a table , and then execute approve operator after listening for an on-chain event
  const data = await serverPost('/apply/batch-approve', sendData);

  console.log('sended the notification: apply/batch-approve');

  let receipt: any = null;

  let retryTimes = 130;
  do {
    try {
      receipt = await web3.eth.getTransactionReceipt(enMultiPolicy.txHash);
      //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
    } catch (error) {
      console.log(
        `getTransactionReceipt createPolicy txHash: ${enMultiPolicy.txHash} retrying ..., current error: `,
        error
      );
    }

    if (isBlank(receipt)) {
      if (retryTimes % 3 == 0) {
        // Message.info(
        console.log('Transaction is being confirmed on the blockchain. Please wait patiently', 'info');
      }

      await sleep(3000);
    }
    retryTimes--;
  } while (isBlank(receipt) && retryTimes > 0);

  const txReceipt = receipt as TransactionReceipt;

  //const transaction = await web3.eth.getTransaction(enMultiPolicy.txHash);
  //  //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
  if (isBlank(txReceipt)) {
    const transaction = await web3.eth.getTransaction(enMultiPolicy.txHash);
    //console.log("transaction.input:", transaction.input);
    console.log('transaction:', transaction);
    console.log(
      `getTransactionReceipt error: transaction Hash is ${enMultiPolicy.txHash}, transaction receipt is null. The current status is "Underview". Please be patient and wait for the backend to confirm the transaction (it should be completed within approximately one hour)!`
    );

    throw new GetTransactionReceiptError(
      `getTransactionReceipt error: transaction Hash is ${enMultiPolicy.txHash}, transaction receipt is null. The current status is "Underview". Please be patient and wait for the backend to confirm the transaction (it should be completed within approximately one hour)!`
    );
  } else {
    //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
    if (!txReceipt.status) {
      //The transaction failed. Users can manually re-approve it. We need to notify the backend API to reset the status.
      const _sendData: any = {
        account_id: publisher.id,
        policy_tx_hash: enMultiPolicy.txHash
      };
      _sendData['signature'] = await signUpdateServerDataMessage(publisher, _sendData);

      const data = await serverPost('/apply/reset', sendData);

      console.log('called apply reset, now Users can manually re-approve it');

      console.log(
        `Approve apply Failed: transaction Hash is ${enMultiPolicy.txHash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
      );
      throw new TransactionError(
        `Approve apply Failed: transaction Hash is ${enMultiPolicy.txHash}, Please refresh page first, then set a larger gaslimit and gasPrice and try again!`
      );
    }
  }

  return Object.assign({ txHash: enMultiPolicy.txHash, from: publisher.address }, data || { info: 'succeed' });
};

/**
 * Rejects user subscription request. This account acts as the publisher (Alice). The batch version of the function refusalApplicationForUseData.
 * @category Data Publisher(Alice) Approval (Multi)
 * @param {Account} publisher - The account of the publisher (Alice).
 * @param {string[]} applyIds - The application apply ID to reject.
 * @returns {Promise<void>}
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
 * @category Data Publisher(Alice) Approval (Multi)
 * @param {Account} account - Refund account（Bob）.
 * @param {string} applyId - The application apply ID to reject.
 * @param {string} refundUrl - Refund information notification url: if the approval is rejected, a refund will be initiated
 * @returns {Promise<void>}
 */
export const cancelUserSubscription = async (
  account: Account,
  applyId: string, // Application Record ID
  orderId: string, // orderId
  refundUrl: string //Refund information notification url: if the approval is rejected, a refund will be initiated
) => {
  //TODO:

  const clientId = await getClientId();

  //1. check if refund has already been processed

  //call contact function: payInfo(clientid,payid).payStatus is => enum payStatus{PayNull,PaySucc,PayCancel,SettlementSucc}

  //if the status is PayNull, PayCancel, SettlementSucc: a refund cannot be initiated, only paySuccess status allows for a refund
  //TODO:

  //2. call contact refund function
  //TODO:
  const txHash = ''; //await refund(account, orderId, refundUrl);

  //3. call pre backend API, and backend API needs to change payment status

  const sendData: any = {
    apply_id: Number(applyId),
    proposer_id: account.id,
    account_id: account.id,
    refund_url: refundUrl,
    tx_hash: txHash
  };

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData);
  const data = await serverPost('/refund/subscribe', sendData);
  return data;
};


/**
 * Get approved document content (downloadable) list. The file/data applicant retrieves the content of a file/data that has been approved for their usage.
 * @category Data User(Bob) Download Data
 * @param {Account} userAccount - Account the current account object
 * @param {string []} dataIds - file/data's id list
 * @returns {Promise<Dictionary<ArrayBuffer>>} - {fileId1: dataContent1, fileId2: dataContent2, ....}
 */
export const getDataContentListByDataIdAsUser = async (userAccount: Account, dataIds: string[]): Promise<Dictionary<ArrayBuffer>> => {
  //get file/data info

  const dataDict: Dictionary<ArrayBuffer> = {};

  for (let index = 0; index < dataIds.length; index++) {
    const dataId = dataIds[index];
    const dataContent: ArrayBuffer = await getDataContentByDataIdAsUser(userAccount, dataId);
    dataDict[dataId] = dataContent;
  }

  return dataDict;

};
