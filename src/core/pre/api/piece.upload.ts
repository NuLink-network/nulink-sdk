import { Account, Strategy } from '../../hdwallet/api/account';
import { signUpdateServerDataMessage } from './workflow';
import { ChunkDataMetaInfo, ChunkDataUploadMetaInfo, ChunkStartMetaInfo } from '../types';
import { serverGet, serverPost } from '../../servernet';
import { isBlank } from '../../utils/null';

/**
 * @internal
 * Start chunked uploading of a large file. Chunked uploading of large files must first call this interface
 * @category upload chunked data 
 * @param account {Account}
 * @param strategy {Strategy}
 * @param dataInfo {ChunkStartMetaInfo}
 * @returns Returns 
*            { task_id: the id of this task (type: number) }
            on success, throws an exception on failure (The code does not return 2000; it returns 3xxx or 4xxx.)
 * 
 */
export const uploadChunkStart = async (
  account: Account,
  strategy: Strategy,
  dataInfo: ChunkStartMetaInfo
): Promise<any> => {
  const sendData = {
    account_id: account.id,
    policy_label_id: strategy.id,
    policy_label: strategy.label,
    policy_label_index: String(strategy.addressIndex),
    file_label: dataInfo.label,
    file_md5: dataInfo.md5,
    file_chunk_count: dataInfo.chunkCount,
    file_chunk_size: dataInfo.chunkSizeInByte
  };

  if (!isBlank(dataInfo?.category)) {
    dataInfo['file_category'] = dataInfo?.category;
  }

  if (!isBlank(dataInfo?.mimetype)) {
    dataInfo['file_mimetype'] = dataInfo?.mimetype;
  }

  if (!isBlank(dataInfo?.thumbnail)) {
    dataInfo['file_thumbnail'] = dataInfo?.thumbnail;
  }

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData);

  try {
    const data = (await serverPost('chunk/upload/start', sendData)) as object;
    return data;
  } catch (error: any) {
    // if (error?.data?.code === 4006) {
    //   //"apply does not exist"

    //   return null;
    // }

    console.error(
      `chunkUploadStart error account_id ${account.id} strategy.id ${strategy.id}`,
      error?.data?.msg || error?.message || error
    );
    throw error;
  }
};

/**
 * @internal
 * Upload file chunk data.
 * If the chunk_index has already been transmitted, overwrite the original chunk index data (update). The backend service needs to record the user's uploaded chunk information (used when the frontend resumes uploading chunk files of a large file).
 * @category upload chunked data
 * @param account {Account}
 * @param dataInfo {ChunkDataMetaInfo}
 * @returns Returns {} on success, throws an exception on failure (The code does not return 2000; it returns 3xxx or 4xxx.)
 */
export const uploadChunkData = async (account: Account, chunkMetaData: ChunkDataUploadMetaInfo): Promise<any> => {
  const sendData = {
    account_id: account.id,
    task_id: chunkMetaData.task_id,
    chunk_address: chunkMetaData.chunk_address,
    chunk_index: chunkMetaData.chunk_index
  };

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData);

  try {
    const data = (await serverPost('/chunk/upload/piece', sendData)) as object;
    return data;
  } catch (error: any) {
    // if (error?.data?.code === 4006) {
    //   //"apply does not exist"

    //   return null;
    // }

    console.error(
      `uploadChunkData error account_id ${account.id}, chunk_address ${chunkMetaData.chunk_address}, chunk_index ${chunkMetaData.chunk_index}
`,
      error?.data?.msg || error?.message || error
    );
    throw error;
  }
};

/**
 * @internal
 * Start chunked uploading of a large file. Chunked uploading of large files must first call this interface
 * @category upload chunked data
 * @param account {Account}
 * @param task_id {number}
 * @param dataInfo {ChunkStartMetaInfo}
 * @returns Returns
 *      {
 *        chunk_missing_indexes: [0, 1, 8,...]  => Returns a list of missing uploaded chunk counts (if the number of uploaded chunks is insufficient)
 *        file_label:
 *        file_md5:
 *        file_category:
 *        file_thumbnail:
 *        file_mimetype:
 *        file_chunk_size:
 *        file_chunk_count:
 *      }
 *      on success, throws an exception on failure (The code does not return 2000; it returns 3xxx or 4xxx.)
 */
export const uploadChunkOver = async (account: Account, task_id: number): Promise<any> => {
  const sendData = {
    account_id: account.id,
    task_id: Number(task_id)
  };

  sendData['signature'] = await signUpdateServerDataMessage(account, sendData);

  try {
    const data = (await serverPost('/chunk/upload/over', sendData)) as object;
    return data;
  } catch (error: any) {
    // if (error?.data?.code === 4006) {
    //   //"apply does not exist"

    //   return null;
    // }

    console.error(
      `uploadChunkOver error account_id ${account.id} task id ${task_id}`,
      error?.data?.msg || error?.message || error
    );
    throw error;
  }
};

/**
 * @internal
 * Query the uploaded data metadata based on task_id.
 * @category upload chunked data 
 * @param {number} task_id
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
export const getDataTaskInfo = async (task_id: number): Promise<any> => {
  // const clientId = await getClientId(true);

  const sendData = {
    // client_id: clientId,
    task_id: Number(task_id)
  };

  //Add a random number to prevent browser caching
  const data = (await serverGet(`/chunk/task/info`, sendData)) as object;

  //return data['account_id'] as number;
  return data;
};

/**
 * @internal
 * Get all uploaded chunk information for task_id.
 * @category upload chunked data 
 * @param {number} task_id
 * @param {number} chunk_index - (Optional) If this parameter is not passed, it is the information that gets all the uploaded chunk of task_id. If the transfer is to get a single uploaded chunk information
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
				uploaded_chunk_list:[  //All uploaded chunk information, sorted in ascending order by chunk_index. If the queried chunk index has not been uploaded, return an empty list
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
export const getUploadedChunkInfo = async (task_id: number, chunk_index?: number): Promise<any> => {
  // const clientId = await getClientId(true);

  const sendData = {
    // client_id: clientId,
    task_id: Number(task_id)
  };

  if (!isBlank(chunk_index)) {
    sendData['chunk_index'] = chunk_index;
  }

  //Add a random number to prevent browser caching
  const data = (await serverGet(`/chunk/task/piece`, sendData)) as object;

  //return data['account_id'] as number;
  return data;
};
