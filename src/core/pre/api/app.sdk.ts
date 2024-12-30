/**
 * Android/iOS app side message function area.
 *
 * Note:
 *  Before using this function,
 *      you must first load the init-sdk.html under the js-demo directory to initialize the JS side message listener, allowing you to receive messages pushed from the app side.
 *
 *  Therefore, this function is accessed through message communication and cannot be called directly, so it does not need to be exported.
 */

import { getIPFSData, isBlank, registerOnAppMessageHandler, setIPFSData } from '../../../core/utils';
import {
  applyForSubscriptionAccess,
  approveUserSubscription,
  cancelUserSubscription,
  extendPolicysValidity,
  getDataContentListByDataIdAsPublisher,
  getDataContentListByDataIdAsUser,
  initClientId,
  publishDataForIndividualPaid,
  publishDataForPaidSubscriberVisible,
  uploadChunkedDataStartForPaidSubscriberVisible,
  refusalUserSubscription,
  uploadChunkedDataForPaidSubscriberVisible,
  uploadChunkedDataOverForPaidSubscriberVisible,
  uploadChunkedDataStartForIndividualPaid,
  uploadChunkedDataForIndividualPaid,
  uploadChunkedDataOverForIndividualPaid
} from './workflow.subscription.approval';
// import { GetStorageDataError, StorageManager } from '../../utils/external-storage';
import {
  createWallet,
  existDefaultAccount,
  getDefaultAccountPrivateKey,
  getMnemonic,
  getWalletDefaultAccount,
  loadWallet,
  restoreWalletDataByMnemonic
} from '../../../api/wallet';
import { generateMnemonic } from '../../../core/hdwallet/api/common';
import { Account, NuLinkHDWallet } from '../../../core/hdwallet/api';
import { setCurrentNetworkWeb3RpcUrl } from '../../../core/chainnet/api/saveData';
import { ChunkDataInfo, ChunkDataTaskInfo, ChunkStartMetaInfo, DataInfo } from '../types';
import { arrayBuffer2HexString, hexString2ArrayBuffer } from '../../../core/utils/hexstring.arraybuffer';
import {
  getChunkDataContentByDataIdAsPublisher,
  getChunkDataContentByDataIdAsUser,
  getDataByStatus,
  getDataContentByDataIdAsPublisher,
  getDataContentByDataIdAsUser,
  IsExistAccount
} from './workflow';
import { getDataTaskInfo, getUploadedChunkInfo } from './piece.upload';

/**
 * @internal
 * All messages for communication with the Android/iOS app are registered here.
 * Note that all registered functions must return a JSON object.
 */
export const registerMessageHandler = async () => {
  await registerOnAppMessageHandler('test', test);

  await registerOnAppMessageHandler('init', sdkInit);
  await registerOnAppMessageHandler('existWallet', _existDefaultAccount);
  await registerOnAppMessageHandler('generateMnemonic', _generateMnemonic);
  await registerOnAppMessageHandler('createWallet', _createWallet);
  await registerOnAppMessageHandler('getAccountInfo', _loadWallet);
  await registerOnAppMessageHandler('restoreWallet', _restoreWallet);
  await registerOnAppMessageHandler('verifyPassword', _verifyPassword);
  await registerOnAppMessageHandler('setRpcUrl', _setRpcUrl);
  await registerOnAppMessageHandler('getMnemonic', _getMnemonic);
  await registerOnAppMessageHandler('getPrivateKey', _getPrivateKey);
  await registerOnAppMessageHandler('getPublicKey', _getPublicKey);
  await registerOnAppMessageHandler('getRootExtendedPrivateKey', _getRootExtendedPrivateKey);
  await registerOnAppMessageHandler('publishDataForPaidSubscriberVisible', _publishDataForPaidSubscriberVisible);
  await registerOnAppMessageHandler('publishDataForIndividualPaid', _publishDataForIndividualPaid);
  await registerOnAppMessageHandler('uploadChunkedDataStartForPaidSubscriberVisible', _uploadChunkedDataStartForPaidSubscriberVisible);
  await registerOnAppMessageHandler('uploadChunkedDataForPaidSubscriberVisible', _uploadChunkedDataForPaidSubscriberVisible);
  await registerOnAppMessageHandler('uploadChunkedDataOverForPaidSubscriberVisible', _uploadChunkedDataOverForPaidSubscriberVisible);
  await registerOnAppMessageHandler('uploadChunkedDataStartForIndividualPaid', _uploadChunkedDataStartForIndividualPaid);
  await registerOnAppMessageHandler('uploadChunkedDataForIndividualPaid', _uploadChunkedDataForIndividualPaid);
  await registerOnAppMessageHandler('uploadChunkedDataOverForIndividualPaid', _uploadChunkedDataOverForIndividualPaid);
  await registerOnAppMessageHandler('getChunkDataContentByDataIdAsUser', _getChunkDataContentByDataIdAsUser);
  await registerOnAppMessageHandler('getChunkDataContentByDataIdAsPublisher', _getChunkDataContentByDataIdAsPublisher);
  await registerOnAppMessageHandler('getChunkDataTaskInfo', _getChunkDataTaskInfo);
  await registerOnAppMessageHandler('getUploadedChunkInfo', _getUploadedChunkInfo);
  await registerOnAppMessageHandler('applyForSubscriptionAccess', _applyForSubscriptionAccess);
  await registerOnAppMessageHandler('approveUserSubscription', _approveUserSubscription);
  await registerOnAppMessageHandler('refusalUserSubscription', _refusalUserSubscription);
  await registerOnAppMessageHandler('cancelUserSubscription', _cancelUserSubscription);
  await registerOnAppMessageHandler('getDataContentListByDataIdAsUser', _getDataContentListByDataIdAsUser);
  await registerOnAppMessageHandler('getDataContentByDataIdAsUser', _getDataContentByDataIdAsUser);
  await registerOnAppMessageHandler('getDataContentListByDataIdAsPublisher', _getDataContentListByDataIdAsPublisher);
  await registerOnAppMessageHandler('getDataContentByDataIdAsPublisher', _getDataContentByDataIdAsPublisher);
  await registerOnAppMessageHandler('extendPolicysValidity', _extendPoliciesValidity);
  await registerOnAppMessageHandler('getApplyListAsUser', _getApplyListAsUser);
  await registerOnAppMessageHandler('getApplyListAsPublisher', _getApplyListAsPublisher);

  //TODO: Add messages that can be actively called by Android here.
};

/**
 * @internal
 */
const test = async (data: any) => {
  const message: string = data['message'];
  console.log('Test receiving messages actively pushed from the app.: ', message);

  //Note that all registered functions must return a JSON object.
  return { msg: 'success' };
};

/**
 * @internal
 */
const sdkInit = async (data: any) => {
  const clientId: string = data['clientId'];
  await initClientId(clientId);
  //Note: If it can reach here, it means the `__jMessage` message handler has been initialized, and there is no need to initialize the `__jMessage` handler again.

  //  Store that it has already been initialized in `init-sdk.html`.
  //   const dataCallback = {
  //     setData: setIPFSData,
  //     getData: getIPFSData
  //   };

  //   //Set the external storage used by the Pre process to IPFS (for example, encrypted files uploaded by users will be stored in this storage, and users can customize the storage).
  //   StorageManager.setDataCallback(dataCallback);

  //Note that all registered functions must return a JSON object.
  return {};
};

/**
 * @internal
 */
const _existDefaultAccount = async (unUsedData: any) => {
  const bExistAccount = await existDefaultAccount();

  // if(!bExistAccount)
  // {
  //   return { exist: bExistAccount };
  // }

  // const exist: boolean = await IsExistAccount(account);
  //   if (!exist) {
  //     return false;
  //   }
  //Note that all registered functions must return a JSON object.
  // return { exist: exist };
  return { exist: bExistAccount };
};

/**
 * @internal
 */
const _generateMnemonic = async (unUsedData: any) => {
  const mnemonic: string = generateMnemonic();

  //Note that all registered functions must return a JSON object.
  return { mnemonic: mnemonic };
};

/**
 * @internal
 */
const _createWallet = async (data: any) => {
  const password: string = data['password'];
  const mnemonic: string = data['mnemonic'];
  const nuLinkHDWallet: NuLinkHDWallet = await createWallet(password, mnemonic);

  if (isBlank(nuLinkHDWallet)) {
    //Note that all registered functions must return a JSON object.
    return { code: -3, msg: 'create wallet failed.' };
  }

  console.log('create wallet success nuLinkHDWallet: ', nuLinkHDWallet);

  const rootExtendedPrivateKey = await nuLinkHDWallet.getRootExtendedPrivateKey(password);
  console.log('rootExtendedPrivateKey: ', rootExtendedPrivateKey);

  const privateKey = await getDefaultAccountPrivateKey(password);
  console.log('privateKey: ', privateKey);

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;
  console.log('account: ', account);

  const publicKey = account.encryptedKeyPair._publicKey;
  console.log('publicKey: ', publicKey);

  console.log('strategy Mapping: ', (account as any).strategyMapping);

  //Note that all registered functions must return a JSON object.
  return {
    address: account.address,
    accountId: account.id,
    privateKey: privateKey,
    publicKey: publicKey,
    rootExtendedPrivateKey: rootExtendedPrivateKey
  };
};

/**
 * @internal
 */
const _loadWallet = async (data: any) => {
  const password: string = data['password'];

  let nuLinkHDWallet: NuLinkHDWallet | null = await loadWallet(password);

  if (isBlank(nuLinkHDWallet)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'loadWallet error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'loadWallet error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  console.log('load wallet success nuLinkHDWallet: ', nuLinkHDWallet);

  nuLinkHDWallet = nuLinkHDWallet as NuLinkHDWallet;
  const rootExtendedPrivateKey = await nuLinkHDWallet.getRootExtendedPrivateKey(password);
  console.log('rootExtendedPrivateKey: ', rootExtendedPrivateKey);

  const privateKey = await getDefaultAccountPrivateKey(password);
  console.log('privateKey: ', privateKey);

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;
  console.log('account: ', account);

  const publicKey = account.encryptedKeyPair._publicKey;
  console.log('publicKey: ', publicKey);

  console.log('strategy Mapping: ', (account as any).strategyMapping);

  //Note that all registered functions must return a JSON object.
  return {
    address: account.address,
    accountId: account.id,
    privateKey: privateKey,
    publicKey: publicKey,
    rootExtendedPrivateKey: rootExtendedPrivateKey
  };
};

/**
 * @internal
 */
const _restoreWallet = async (data: any) => {
  const newPassword: string = data['newPassword'];
  const mnemonic: string = data['mnemonic'];

  if (isBlank(newPassword)) {
    return { code: -8, msg: 'restoreWallet error: New password is empty' };
  }

  if (isBlank(mnemonic)) {
    return { code: -9, msg: 'restoreWallet error: Mnemonic is empty' };
  }

  let nuLinkHDWallet = await restoreWalletDataByMnemonic(newPassword, mnemonic);

  if (isBlank(nuLinkHDWallet)) {
    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'restoreWallet error: The wallet restore failed. Please check whether the password is empty or mnemonic is entered correctly or retry it.'
    };
  }

  console.log('The wallet restore success nuLinkHDWallet: ', nuLinkHDWallet);

  nuLinkHDWallet = nuLinkHDWallet as NuLinkHDWallet;

  const rootExtendedPrivateKey = await nuLinkHDWallet.getRootExtendedPrivateKey(newPassword);
  console.log('rootExtendedPrivateKey: ', rootExtendedPrivateKey);

  const privateKey = await getDefaultAccountPrivateKey(newPassword);
  console.log('privateKey: ', privateKey);

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(newPassword)) as Account;
  console.log('account: ', account);

  const publicKey = account.encryptedKeyPair._publicKey;
  console.log('publicKey: ', publicKey);

  console.log('strategy Mapping: ', (account as any).strategyMapping);

  //Note that all registered functions must return a JSON object.
  return {
    address: account.address,
    accountId: account.id,
    privateKey: privateKey,
    publicKey: publicKey,
    rootExtendedPrivateKey: rootExtendedPrivateKey
  };
};

/**
 * @internal
 */
const _verifyPassword = async (data: any) => {
  const password: string = data['password'];

  let nuLinkHDWallet: NuLinkHDWallet | null = await loadWallet(password);

  if (isBlank(nuLinkHDWallet)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'verifyPassword error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'verifyPassword error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  nuLinkHDWallet = nuLinkHDWallet as NuLinkHDWallet;
  const correct = await nuLinkHDWallet.verifyPassword(password);

  //Note that all registered functions must return a JSON object.
  return { correct: correct };
};

/**
 * @internal
 */
const _setRpcUrl = async (data: any) => {
  const rpcUrl: string = data['rpcUrl'];

  await setCurrentNetworkWeb3RpcUrl(rpcUrl);

  //Note that all registered functions must return a JSON object.
  return {};
};

/**
 * @internal
 */
const _getMnemonic = async (data: any) => {
  const password: string = data['password'];

  const mnemonic: string | null | undefined = await getMnemonic(password);

  if (isBlank(mnemonic) && isBlank(password)) {
    return { code: -8, msg: 'getMnemonic error: Password is empty' };
  }

  //Note that all registered functions must return a JSON object.
  return { mnemonic: mnemonic };
};

/**
 * @internal
 */
const _getPrivateKey = async (data: any) => {
  const password: string = data['password'];

  const privateKey = await getDefaultAccountPrivateKey(password);

  if (isBlank(privateKey)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getPrivateKey error: Password is empty' };
    }

    return { code: -1, msg: 'getPrivateKey error' };
  }

  //Note that all registered functions must return a JSON object.
  return { privateKey: privateKey };
};

/**
 * @internal
 */
const _getPublicKey = async (data: any) => {
  const password: string = data['password'];

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getPublicKey error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getPublicKey error: getWalletDefaultAccount failed! Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  console.log('account: ', account);

  const publicKey = account.encryptedKeyPair._publicKey;
  console.log('publicKey: ', publicKey);

  //Note that all registered functions must return a JSON object.
  return { publicKey: publicKey };
};

/**
 * @internal
 */
const _getRootExtendedPrivateKey = async (data: any) => {
  const password: string = data['password'];

  let nuLinkHDWallet: NuLinkHDWallet | null = await loadWallet(password);

  if (isBlank(nuLinkHDWallet)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getRootExtendedPrivateKey error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getRootExtendedPrivateKey error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  console.log('load wallet success nuLinkHDWallet: ', nuLinkHDWallet);

  nuLinkHDWallet = nuLinkHDWallet as NuLinkHDWallet;
  const rootExtendedPrivateKey = await nuLinkHDWallet.getRootExtendedPrivateKey(password);
  console.log('rootExtendedPrivateKey: ', rootExtendedPrivateKey);

  //Note that all registered functions must return a JSON object.
  return { rootExtendedPrivateKey: rootExtendedPrivateKey };
};

type AndroidDataInfo = {
  label: string; //data label (name or unique string, e.g. uuid)
  //android首先把文件转换为 byte []类型，然后把byte类型转为16进制字符串，然后传递给typescript端:  把16进制字符串转换为 Uint8Array, 然后转换为 arrayBuffer类型
  dataHexString: string; //    The binary representation of the contents of files/data By invoke 'FileReader.ReadAsArrayBuffer(file)' callback return the value: e.target.result
  category?: string; //logical categories, e.g. music, art, sports
  mimetype?: string; //to convert binary data to a specific file type (e.g. image, video, text)
  thumbnail?: string; //unique identifier for thumbnails, can be understood as a unique file name or url link, note that this is not the data itself, but an identifier that can be used to locate the corresponding stored content.
};

type AndroidChunkDataInfoForPaidSubscriberVisible = {
  taskId: number; //the id of this task
  chunkIndex: number; //Chunk index, starting from 0, with the maximum index being file_chunk_count - 1.
  chunkDataHexString: string; //The binary representation of the contents of files/data By invoke 'FileReader.ReadAsArrayBuffer(file)' callback return the value: e.target.result
};

export type AndroidChunkDataInfoForIndividualPaid = AndroidChunkDataInfoForPaidSubscriberVisible & {
  strategyIndex: number; // the strategy index
};

/**
 * @internal
 * Upload dynamic content that subscribed users can view.
 */
const _publishDataForPaidSubscriberVisible = async (data: any) => {
  const password: string = data['password'];
  const _dataInfoList: AndroidDataInfo[] = data['dataInfoList'];

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'publishDataForPaidSubscriberVisible error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'publishDataForPaidSubscriberVisible error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const dataInfos: DataInfo[] = [];

  for (let i = 0; i < _dataInfoList.length; i++) {
    const dataInfo: DataInfo = {
      label: _dataInfoList[i].label,
      dataArrayBuffer: hexString2ArrayBuffer(_dataInfoList[i].dataHexString) //new Uint8Array(Buffer.from(_dataInfoList[i].dataHexString, 'hex')).buffer
    };

    if (!isBlank(_dataInfoList[i]?.category)) {
      dataInfo['category'] = _dataInfoList[i]?.category;
    }

    if (!isBlank(_dataInfoList[i]?.mimetype)) {
      dataInfo['mimetype'] = _dataInfoList[i]?.mimetype;
    }

    if (!isBlank(_dataInfoList[i]?.thumbnail)) {
      dataInfo['thumbnail'] = _dataInfoList[i]?.thumbnail;
    }

    dataInfos.push(dataInfo);
  }

  const uploadFileInfos = await publishDataForPaidSubscriberVisible(account, dataInfos);

  //Note that all registered functions must return a JSON object.
  return { uploadFileInfos: uploadFileInfos };
};

/**
 * @internal
 * Start Chunked Upload For Large content that subscribed users can view.
 * Only one large file can be uploaded."
 * @returns {Promise<object>} - Returns account, strategy info and taskId
 * {    address: accountAddress,
 *      strategyId: strategyId,
 *      pk: accountPublicKey,
 *      taskId: task id,
 *      strategyIndex: strategyIndex,
 * }
 */
const _uploadChunkedDataStartForPaidSubscriberVisible = async (data: any) => {
  const password: string = data['password'];
  const _dataInfo: ChunkStartMetaInfo = data['dataInfo'];

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'uploadChunkedDataStartForPaidSubscriberVisible error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'uploadChunkedDataStartForPaidSubscriberVisible error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const dataInfo: ChunkStartMetaInfo = {
    label: _dataInfo.label,
    md5: _dataInfo.md5,
    chunkSizeInByte: _dataInfo.chunkSizeInByte,
    chunkCount: _dataInfo.chunkCount
  };

  if (!isBlank(_dataInfo?.category)) {
    dataInfo['category'] = _dataInfo?.category;
  }

  if (!isBlank(_dataInfo?.mimetype)) {
    dataInfo['mimetype'] = _dataInfo?.mimetype;
  }

  if (!isBlank(_dataInfo?.thumbnail)) {
    dataInfo['thumbnail'] = _dataInfo?.thumbnail;
  }

  const dataOverview = await uploadChunkedDataStartForPaidSubscriberVisible(account, dataInfo);

  //Note that all registered functions must return a JSON object.
  return dataOverview || {};
};

/**
 * @internal
 * Upload Chunked Data For Large content that subscribed users can view.
 * @returns {Promise<object>} - Returns the chunk ipfs address
 * {
 *   chunk_address: the chunk ipfs address
 * }
 */

const _uploadChunkedDataForPaidSubscriberVisible = async (data: any) => {
  const password: string = data['password'];
  const androidChunkDataInfo: AndroidChunkDataInfoForPaidSubscriberVisible = data['dataInfo'];

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: '_uploadChunkedDataForPaidSubscriberVisible error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: '_uploadChunkedDataForPaidSubscriberVisible error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const chunkDataInfo: ChunkDataInfo = {
    taskId: androidChunkDataInfo.taskId,
    chunkIndex: androidChunkDataInfo.chunkIndex,
    chunkDataArrayBuffer: hexString2ArrayBuffer(androidChunkDataInfo.chunkDataHexString),
    strategyIndex: 0
  };

  const chunk_address: string = await uploadChunkedDataForPaidSubscriberVisible(account, chunkDataInfo);
  return {chunk_address: chunk_address};
};

/**
 * @internal
 * Upload all chunked Data finish for Large content that subscribed users can view.
 *  @returns {Promise<object>} - Returns
 *  {
 *    "chunk_missing_indexes": [0, 1, 8], // If the number of uploaded chunks is insufficient, return a list of the missing chunk indexes.
 *    "file_label": "",
 *    "file_md5": "",
 *    "file_category": "",
 *    "file_thumbnail": "",
 *    "file_mimetype": "",
 *    "file_chunk_size": 0,
 *    "file_chunk_count": 0,
 *    "file_id": the id of this file,
 *  }
 */

const _uploadChunkedDataOverForPaidSubscriberVisible = async (data: any) => {
  const password: string = data['password'];
  const taskId: number = Number(data['taskId']);

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: '_uploadChunkedDataForPaidSubscriberVisible error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: '_uploadChunkedDataForPaidSubscriberVisible error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  return await uploadChunkedDataOverForPaidSubscriberVisible(account, taskId);
};

/**
 * @internal
 * Start Chunked Upload For Large content that subscribed users can view.
 * Only one large file can be uploaded."
 * @returns {Promise<object>} - Returns account, strategy id and taskId
 * {    address: accountAddress,
 *      strategyId: strategyId,
 *      pk: accountPublicKey,
 *      taskId: data?.task_id,
 *      strategyIndex: strategyIndex,
 * }
 */
const _uploadChunkedDataStartForIndividualPaid = async (data: any) => {
  const password: string = data['password'];
  const _dataInfo: ChunkStartMetaInfo = data['dataInfo'];

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'uploadChunkedDataStartForIndividualPaid error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'uploadChunkedDataStartForIndividualPaid error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const dataInfo: ChunkStartMetaInfo = {
    label: _dataInfo.label,
    md5: _dataInfo.md5,
    chunkSizeInByte: _dataInfo.chunkSizeInByte,
    chunkCount: _dataInfo.chunkCount
  };

  if (!isBlank(_dataInfo?.category)) {
    dataInfo['category'] = _dataInfo?.category;
  }

  if (!isBlank(_dataInfo?.mimetype)) {
    dataInfo['mimetype'] = _dataInfo?.mimetype;
  }

  if (!isBlank(_dataInfo?.thumbnail)) {
    dataInfo['thumbnail'] = _dataInfo?.thumbnail;
  }

  const dataOverview = await uploadChunkedDataStartForIndividualPaid(account, dataInfo);

  //Note that all registered functions must return a JSON object.
  return { dataOverview: dataOverview };
};

/**
 * @internal
 * Upload Chunked Data For Large content that subscribed users can view.
 * @returns {Promise<object>} - Returns the chunk ipfs address
 * {
 *   chunk_address: the chunk ipfs address
 * }
 */

const _uploadChunkedDataForIndividualPaid = async (data: any) => {
  const password: string = data['password'];
  const androidChunkDataInfo: AndroidChunkDataInfoForIndividualPaid = data['dataInfo'];

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: '_uploadChunkedDataForIndividualPaid error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: '_uploadChunkedDataForIndividualPaid error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const chunkDataInfo: ChunkDataInfo = {
    taskId: androidChunkDataInfo.taskId,
    chunkIndex: androidChunkDataInfo.chunkIndex,
    chunkDataArrayBuffer: hexString2ArrayBuffer(androidChunkDataInfo.chunkDataHexString),
    strategyIndex: androidChunkDataInfo.strategyIndex
  };

  const chunk_address: string = await uploadChunkedDataForIndividualPaid(account, chunkDataInfo);
  return {chunk_address: chunk_address};
};

/**
 * @internal
 * Upload all chunked Data finish for Large content that subscribed users can view.
 * @returns {Promise<object>} - Returns
 *  {
 *    "chunk_missing_indexes": [0, 1, 8], // If the number of uploaded chunks is insufficient, return a list of the missing chunk indexes.
 *    "file_label": "",
 *    "file_md5": "",
 *    "file_category": "",
 *    "file_thumbnail": "",
 *    "file_mimetype": "",
 *    "file_chunk_size": 0,
 *    "file_chunk_count": 0
 *    "file_id": the id of this file
 *  }
 */

const _uploadChunkedDataOverForIndividualPaid = async (data: any) => {
  const password: string = data['password'];
  const taskId: number = Number(data['taskId']);
  const strategyIndex: number = Number(data['strategyIndex']);

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: '_uploadChunkedDataForIndividualPaid error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: '_uploadChunkedDataForIndividualPaid error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  return await uploadChunkedDataOverForIndividualPaid(account, taskId, strategyIndex);
};

/**
 * @internal
 * Upload dynamic content that requires a separate fee for each submission.
 */
const _publishDataForIndividualPaid = async (data: any) => {
  const password: string = data['password'];
  const _dataInfoList: AndroidDataInfo[] = data['dataInfoList'];

  // we can get the account by user password that we have created
  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'publishDataForIndividualPaid error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'publishDataForIndividualPaid error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const dataInfos: DataInfo[] = [];

  for (let i = 0; i < _dataInfoList.length; i++) {
    const dataInfo: DataInfo = {
      label: _dataInfoList[i].label,
      dataArrayBuffer: hexString2ArrayBuffer(_dataInfoList[i].dataHexString) //new Uint8Array(Buffer.from(_dataInfoList[i].dataHexString, 'hex')).buffer
    };

    if (!isBlank(_dataInfoList[i]?.category)) {
      dataInfo['category'] = _dataInfoList[i]?.category;
    }

    if (!isBlank(_dataInfoList[i]?.mimetype)) {
      dataInfo['mimetype'] = _dataInfoList[i]?.mimetype;
    }

    if (!isBlank(_dataInfoList[i]?.thumbnail)) {
      dataInfo['thumbnail'] = _dataInfoList[i]?.thumbnail;
    }

    dataInfos.push(dataInfo);
  }

  const uploadFileInfos = await publishDataForIndividualPaid(account, dataInfos);

  //Note that all registered functions must return a JSON object.
  return { uploadFileInfos: uploadFileInfos };
};

/**
 * @internal
 * Bob subscribes to Alice's dynamic content
 *
 *    account: Current logged-in account
 *    orderId: Order ID generated by the backend
 *    fileId: The file ID for the subscription request, obtained from the app backend
 *    usageDays: Subscription duration: 30, 90, 120
 *    payTokenAddress: Payment token address
 *    payAmountInWei: Payment amount (in wei), needs to be converted to a string
 *    payCheckUrl: URL provided by the app backend for the pre-backend to check if Bob has sufficient payment for this subscription.
 *      (The pre-backend does not store any payment-related information; all is stored in the app backend. Additionally, this URL cannot be predetermined, because the pre-backend needs to interface with multiple project parties, so it cannot be hardcoded and must be passed dynamically.)
 */
const _applyForSubscriptionAccess = async (data: any) => {
  const password: string = data['password'];
  const orderId: string = data['orderId'];
  const dataId: string = data['fileId'];
  const usageDays: number = Number(data['usageDays']);
  const payTokenAddress: string = data['payTokenAddress'];
  const payAmountInWei: string = data['payAmountInWei'];
  const payCheckUrl: string = data['payCheckUrl'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'applyForSubscriptionAccess error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'applyForSubscriptionAccess error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const applyId = await applyForSubscriptionAccess(
    account,
    orderId,
    dataId,
    usageDays,
    payTokenAddress,
    payAmountInWei,
    payCheckUrl
  );

  //Note that all registered functions must return a JSON object.
  return { applyId: applyId };
};

/**
 * @internal
 * Alice bulk approves subscription requests.
 */
const _approveUserSubscription = async (data: any) => {
  const password: string = data['password'];
  let applyIds: string[] = data['applyIds'];

  if (!Array.isArray(applyIds)) {
    applyIds = [applyIds];
  }

  if (isBlank(applyIds) || applyIds.length > 100 || applyIds.length === 0) {
    throw new Error('approveUserSubscription: applyIds length must be >0 and <=100');
  }

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'approveUserSubscription error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'approveUserSubscription error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  await approveUserSubscription(account, applyIds);

  //Note that all registered functions must return a JSON object.
  return {};
};

/**
 * @internal
 * Alice bulk rejects subscription requests; users need to request refunds themselves.
 */
const _refusalUserSubscription = async (data: any) => {
  const password: string = data['password'];
  const applyIds: string[] = data['applyIds'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'refusalUserSubscription error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'refusalUserSubscription error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  await refusalUserSubscription(account, applyIds);

  //Note that all registered functions must return a JSON object.
  return {};
};

/**
 * @internal
 * Alice bulk rejects subscription requests; users need to request refunds themselves.
 */
const _cancelUserSubscription = async (data: any) => {
  const password: string = data['password'];
  const applyId: string = data['applyId'];
  const orderId: string = data['orderId'];
  const refundUrl: string = data['refundUrl'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'cancelUserSubscription error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'cancelUserSubscription error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  await cancelUserSubscription(account, applyId, orderId, refundUrl);

  //Note that all registered functions must return a JSON object.
  return {};
};

/**
 * @internal
 * Bob bulk decrypts data files.
 */
const _getDataContentListByDataIdAsUser = async (data: any) => {
  const password: string = data['password'];
  const dataIds: string[] = data['fileIds'] || data['dataIds'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getDataContentListByDataIdAsUser error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getDataContentListByDataIdAsUser error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  //format: {fileId1: dataContent1, fileId2: dataContent2, ....}
  //dataContent is the type of ArrayBuffer
  const dataDict = await getDataContentListByDataIdAsUser(account, dataIds);

  const dataDictReturn = {};

  Object.keys(dataDict).forEach((dataId) => {
    const dataContent: ArrayBuffer = dataDict[dataId];

    dataDictReturn[dataId] = arrayBuffer2HexString(dataContent);
  });

  //Note that all registered functions must return a JSON object.
  return Object.assign({}, dataDictReturn);
};

/**
 * @internal
 * Bob decrypts a single data file.
 */
const _getDataContentByDataIdAsUser = async (data: any) => {
  const password: string = data['password'];
  const dataId: string = data['fileId'] || data['dataId'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getDataContentByDataIdAsUser error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getDataContentByDataIdAsUser error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  //format: {fileId1: dataContent1, fileId2: dataContent2, ....}
  //dataContent is the type of ArrayBuffer

  const dataContent: ArrayBuffer = await getDataContentByDataIdAsUser(account, dataId);
  const dataHexString = arrayBuffer2HexString(dataContent);

  //Note that all registered functions must return a JSON object.
  //return { [dataId]: dataHexString };
  return { dataId: dataHexString };
};

/**
 * @internal
 * Alice batch decrypts the files she uploaded
 */
const _getDataContentListByDataIdAsPublisher = async (data: any) => {
  const password: string = data['password'];
  const dataIds: string[] = data['fileIds'] || data['dataIds'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getDataContentListByDataIdAsPublisher error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getDataContentListByDataIdAsPublisher error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  //format: {fileId1: dataContent1, fileId2: dataContent2, ....}
  //dataContent is the type of ArrayBuffer
  const dataDict = await getDataContentListByDataIdAsPublisher(account, dataIds);

  const dataDictReturn = {};

  Object.keys(dataDict).forEach((dataId) => {
    const dataContent: ArrayBuffer = dataDict[dataId];

    dataDictReturn[dataId] = arrayBuffer2HexString(dataContent);
  });

  //Note that all registered functions must return a JSON object.
  return Object.assign({}, dataDictReturn);
};

/**
 * @internal
 * Alice batch decrypt a single file she uploaded
 */
const _getDataContentByDataIdAsPublisher = async (data: any) => {
  const password: string = data['password'];
  const dataId: string = data['fileId'] || data['dataId'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getDataContentByDataIdAsPublisher error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getDataContentByDataIdAsPublisher error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  //format: {fileId1: dataContent1, fileId2: dataContent2, ....}
  //dataContent is the type of ArrayBuffer

  const dataContent: ArrayBuffer = await getDataContentByDataIdAsPublisher(account, dataId);
  const dataHexString = arrayBuffer2HexString(dataContent);

  //Note that all registered functions must return a JSON object.
  //return { [dataId]: dataHexString };
  return { dataId: dataHexString };
};

/**
 * @internal
 * Alice batch decrypt a chunk file she uploaded
 * @param {string} password - the password of account
 * @param {string} dataId - file/data's id
 * @param {string} chunkAddress -(Optional) the (ipfs) address of the chunk data/file
 *                               Note: If this parameter is not provided, the content of the index file will be retrieved (which records the addresses of all chunk files). If this parameter is provided, the content of a single chunk file will be retrieved
 * @returns {Promise<ArrayBuffer>}
 */
const _getChunkDataContentByDataIdAsPublisher = async (data: any) => {
  const password: string = data['password'];
  const dataId: string = data['dataId'];
  const chunkAddress: string | undefined = data?.chunkAddress || undefined;

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getChunkDataContentByDataIdAsPublisher error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getChunkDataContentByDataIdAsPublisher error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  //format: {fileId1: dataContent1, fileId2: dataContent2, ....}
  //dataContent is the type of ArrayBuffer

  const dataContent: ArrayBuffer = await getChunkDataContentByDataIdAsPublisher(account, dataId, chunkAddress);
  const dataHexString = arrayBuffer2HexString(dataContent);

  //Note that all registered functions must return a JSON object.
  // return { [dataId]: dataHexString };
  return { dataId: dataHexString };
};

/**
 * @internal
 * Get chunk data of approved document content (downloadable). The file/data applicant retrieves the content of a file/data that has been approved for their usage.
 * @param {string} password - the password of account
 * @param {string} dataId - file/data's id
 * @param {string} chunkAddress -(Optional) the (ipfs) address of the chunk data/file
 *                               Note: If this parameter is not provided, the content of the index file will be retrieved (which records the addresses of all chunk files). If this parameter is provided, the content of a single chunk file will be retrieved
 * @returns {Promise<ArrayBuffer>}
 */
const _getChunkDataContentByDataIdAsUser = async (data: any) => {
  const password: string = data['password'];
  const dataId: string = data['fileId'] || data['dataId'];
  const chunkAddress: string | undefined = data?.chunkAddress || undefined;

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getChunkDataContentByDataIdAsUser error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getChunkDataContentByDataIdAsUser error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  //format: {fileId1: dataContent1, fileId2: dataContent2, ....}
  //dataContent is the type of ArrayBuffer

  const dataContent: ArrayBuffer = await getChunkDataContentByDataIdAsUser(account, dataId, chunkAddress);
  const dataHexString = arrayBuffer2HexString(dataContent);

  //Note that all registered functions must return a JSON object.
  // return { [dataId]: dataHexString };
  return { dataId: dataHexString };
};

/**
 * @internal
 * After Bob's subscribed content expires, he reaffirms payment to request an extension for the dynamic content published by the subscribed user Alice.
 */
const _extendPoliciesValidity = async (data: any) => {
  const password: string = data['password'];
  const applyId: string = data['applyId'];
  const extendedDays: number = Number(data['extendedDays']);
  const orderId: string = data['orderId'];
  const payTokenAddress: string = data['payTokenAddress'];
  const payAmountInWei: string = data['payAmountInWei'];
  const payCheckUrl: string = data['payCheckUrl'];

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'extendPolicysValidity error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'extendPolicysValidity error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  //format: {fileId1: dataContent1, fileId2: dataContent2, ....}
  //dataContent is the type of ArrayBuffer

  await extendPolicysValidity(account, applyId, extendedDays, orderId, payTokenAddress, payAmountInWei, payCheckUrl);

  //Note that all registered functions must return a JSON object.
  return {};
};

/**
 * @internal
 * get apply list as user
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file/data ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file/data type category",
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
const _getApplyListAsUser = async (data: any) => {
  const password: string = data['password'];
  //const proposerAccountId: string = data['proposerAccountId'];

  const dataId: string | undefined = data['dataId'] || undefined;
  const dataOwnerAccountId: string | undefined = data['dataOwnerAccountId'] || undefined;
  const applyId: string | undefined = data['applyId'] || undefined;
  const status: number | undefined = Number(data['status']) || undefined;
  const pageIndex: number = Number(data['pageIndex'] || 1);
  const pageSize: number = Number(data['pageSize'] || 10);

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getApplyListAsUser error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getApplyListAsUser error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const proposerAccountId: string = account.id;

  const returnData = await getDataByStatus(
    dataId,
    proposerAccountId,
    dataOwnerAccountId,
    applyId,
    status,
    pageIndex,
    pageSize
  );

  //Note that all registered functions must return a JSON object.
  return returnData || {};
};

/**
 * @internal
 * get apply list as publisher
 * @returns {Promise<object>} - {
                "list": [
                  {
                    "file_id": "8feS-wp5lYhGOCtOLTKZH",
                    "file_name": "1.jpg",
                    "address": " file/data ipfs address: QmV16aK1Ayn5XELdw9oBKK9YEoEDPb9mraPNnJL8XGbZAz",
                    "category": "file/data type category",
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
const _getApplyListAsPublisher = async (data: any) => {
  const password: string = data['password'];
  const proposerAccountId: string | undefined = data['proposerAccountId'] || undefined;
  const dataId: string | undefined = data['dataId'] || undefined;
  //const dataOwnerAccountId: string  = data['dataOwnerAccountId'] ;
  const applyId: string | undefined = data['applyId'] || undefined;
  const status: number | undefined = Number(data['status']) || undefined;
  const pageIndex: number = Number(data['pageIndex'] || 1);
  const pageSize: number = Number(data['pageSize'] || 10);

  const account: Account = (await getWalletDefaultAccount(password, true)) as Account;

  if (isBlank(account)) {
    if (isBlank(password)) {
      return { code: -8, msg: 'getApplyListAsPublisher error: Password is empty' };
    }

    //Note that all registered functions must return a JSON object.
    return {
      code: -1,
      msg: 'getApplyListAsPublisher error: Password error or the wallet does not exist. Please check whether the password is entered correctly or import or create a new wallet.'
    };
  }

  const dataOwnerAccountId: string = account.id;

  const returnData = await getDataByStatus(
    dataId,
    proposerAccountId,
    dataOwnerAccountId,
    applyId,
    status,
    pageIndex,
    pageSize
  );

  //Note that all registered functions must return a JSON object.
  return returnData || {};
};

/**
 * @internal
 * Query the uploaded data metadata based on task id.
 * @category upload chunked data 
 * @param {number} taskId
 * @returns Returns 
    * {
          "account_id":
          "policy_label_id": 
          "policy_label": 
          "policy_label_index": 
          "file_label": 
          "file_md5":
          "file_category": 
          "file_thumbnail": 
          "file_mimetype": 
          "file_chunk_count": 
          "file_chunk_size":
          "upload_finished": true //Indicates whether to upload all pieces
      }
      on success, throws an exception on failure (The code does not return 2000; it returns 3xxx or 4xxx.)
 *
 */
const _getChunkDataTaskInfo = async (data: any) => {
  const taskId: number = Number(data['taskId']);

  const returnData = await getDataTaskInfo(taskId);

  //Note that all registered functions must return a JSON object.
  return returnData || {};
};

/**
 * @internal
 * Get all uploaded chunk information for task id.
 * @category upload chunked data 
 * @param {number} taskId
 * @param {number} chunkIndex - (Optional) If this parameter is not passed, it is the information that gets all the uploaded chunk of task id. If the transfer is to get a single uploaded chunk information
 * @returns Returns 
 * 
 *    If the chunk_index parameter has a value, return:
 * 
 *    {
        chunk_address: The ipfs address of the file
        chunk_index: The chunk index, starting from 0, with the maximum index being file_chunk_count - 1."
      }

      Otherwise, return:

      {
				uploaded_chunk_list:  [  //All uploaded chunk information, sorted in ascending order by chunk_index. If the queried chunk index has not been uploaded, return an empty list
                                {
                                  chunk_address: The ipfs address of the file
                                  chunk_index: The chunk index, starting from 0, with the maximum index being file_chunk_count - 1."
                                }
                              ]
        account_id
        policy_label_id
        policy_label
        policy_label_index
        file_label:
        file_md5
        file_category
        file_thumbnail
        file_mimetype
        file_chunk_size
        file_chunk_count
			}
      on success, throws an exception on failure (The code does not return 2000; it returns 3xxx or 4xxx.)
 *
 */
const _getUploadedChunkInfo = async (data: any) => {
  const taskId: number = Number(data['taskId']);

  //chunkIndex is Optional
  let chunkIndex: number = -1;
  try {
    chunkIndex = Number(data['chunkIndex']);
  } catch (error) {}

  const returnData = await getUploadedChunkInfo(taskId, chunkIndex);

  //Note that all registered functions must return a JSON object.
  return returnData || {};
};