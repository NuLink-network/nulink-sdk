/**
 * This comment will be used as the summary for the "thing2" module
 * @packageDocumentation
 * @module pre
 * @preferred
 */
import { getPolicyTokenCost, getPolicysTokenCost, estimatePolicyGas as gasFee, estimatePolicysGas as getBatchCreatePolicyGasFee } from '../core/pre'
import { PolicyHasBeenActivedOnChain } from '../core'
import { BigNumber } from 'ethers'
import { Account, NuLinkHDWallet } from '../core/hdwallet/api/account'
import { getWalletDefaultAccount } from './wallet'
import { getSettingsData as getConfigData } from '../core/chainnet'
import * as pre from '../core/pre'
import { isBlank } from '../core/utils'
import * as exception from '../core/utils/exception'
import {UnauthorizedError} from '../core/utils/exception' //for comment

export type { BigNumber } from 'ethers'

/**
 * get service fees (NLK/TNLK) for sharing files
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @param {number} startSeconds - Start time of file usage application in seconds
 * @param {number} endSeconds - End time of file usage application in seconds
 * @param {number} ursulaShares - Number of service shares
 * @returns {string} - the amount of NLK/TNLK in wei
 */
export const getPolicyServerGasFee = async (startSeconds: number, endSeconds: number, ursulaShares: number) => {
  const account = await getWalletDefaultAccount()
  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  console.log(account, startSeconds, endSeconds, ursulaShares)

  const startDate: Date = new Date(startSeconds * 1000) //  start_at is seconds, but Date needs milliseconds
  const endDate: Date = new Date(endSeconds * 1000) //  end_at is seconds, but Date needs milliseconds

  const gasWei = await getPolicyTokenCost(account as Account, startDate, endDate, ursulaShares)
  // const gasValue = Web3.utils.fromWei(gasWei.toString(), "ether");
  return gasWei.toString()
}


/**
 * Retrieving the total of the service fees (NLK/TNLK) in bulk for file sharing purposes.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @param {number[]} startSeconds - An array of the start time of file usage application in seconds
 * @param {number[]} endSeconds - An array of the end time of file usage application in seconds
 * @param {number[]} ursulaShares - An array of the number of service shares
 * @returns {string} - the amount of NLK/TNLK in wei
 */
 export const getPolicysServerGasFee = async (startSeconds: number [], endSeconds: number [], ursulaShares: number []) => {
  const account = await getWalletDefaultAccount()
  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  console.log(account);
  const startDates : Date [] = [];
  const endDates : Date [] = [];
  for (let index = 0; index < startSeconds.length; index++) {
    const _startSeconds = startSeconds[index];
    const _endSeconds = endSeconds[index];
    const startDate: Date = new Date(_startSeconds * 1000) //  start_at is seconds, but Date needs milliseconds
    const endDate: Date = new Date(_endSeconds * 1000) //  end_at is seconds, but Date needs milliseconds
    startDates.push(startDate);
    endDates.push(endDate);

    console.log("getPolicysServerGasFee: ", index, _startSeconds, _endSeconds, ursulaShares[index]);
  }


  const gasWei = await getPolicysTokenCost(account as Account, startDates, endDates, ursulaShares)
  // const gasValue = Web3.utils.fromWei(gasWei.toString(), "ether");
  return gasWei.toString()
}

/**
 * estimate service gas fees for sharing files
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @throws {@link PolicyHasBeenActivedOnChain} Policy has been actived(created) on chain (policy is currently active)
 * @param {string} userAccountId - the account Id of the file applicant (Bob)
 * @param {string} applyId - The application ID returned to the user by the interface when applying to use a specific file
 * @param {number} ursulaShares - Number of service shares
 * @param {number} ursulaThreshold - The file user can download the file after obtaining the specified number of service data shares
 * @param {number} startSeconds - Start time of file usage application in seconds
 * @param {number} endSeconds - End time of file usage application in seconds
 * @param {BigNumber} serverFee - server fees by call function of `getPolicyServerGasFee`
 * @returns {Promise<String>} - the amount of bnb/tbnb in wei
 */
export const getPolicyGasFee = async (
  userAccountId: string,
  applyId: string,
  ursulaShares: number,
  ursulaThreshold: number,
  startSeconds: number, //policy usage start
  endSeconds: number, //policy usage start
  serverFee: BigNumber // nlk fee in wei
): Promise<string> => {
  try {
    const account = await getWalletDefaultAccount()
    if (isBlank(account)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    // console.log(account, applyId, ursulaShares, ursulaThreshold);

    const startDate: Date = new Date(Number(startSeconds) * 1000) //  start_at is seconds, but Date needs milliseconds
    const endDate: Date = new Date(Number(endSeconds) * 1000) //  end_at is seconds, but Date needs milliseconds

    const gasWei = await gasFee(
      account as Account,
      userAccountId,
      applyId,
      ursulaShares,
      ursulaThreshold,
      startDate,
      endDate,
      serverFee
    )
    // const gasValue = Web3.utils.fromWei(gasWei.toString(), "ether");
    return gasWei.toString()
  } catch (error: any) {
    const error_info: string = error?.message || error

    if (typeof error_info === 'string' && error_info?.toLowerCase()?.includes('policy is currently active')) {
      //The policy has been created successfully, and there is no need to created again
      throw new PolicyHasBeenActivedOnChain('Policy is currently active')
    }

    console.error(error_info, error)
    // Message.error(`Failed to get gas fee!! reason: ${error_info}`);
    throw error
  }
}

/**
 * estimate service gas fees for sharing files. The batch version of the getPolicyGasFee function.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @throws {@link PolicyHasBeenActivedOnChain} Policy has been actived(created) on chain (policy is currently active)
 * @param {string[]} userAccountIds - the account Id of the file applicant (Bob)
 * @param {string[]} applyIds - The application ID returned to the user by the interface when applying to use a specific file
 * @param {number[]} ursulaShares - Number of service shares
 * @param {number[]} ursulaThreshold - The file user can download the file after obtaining the specified number of service data shares
 * @param {number[]} startSeconds - Start time of file usage application in seconds
 * @param {number[]} endSeconds - End time of file usage application in seconds
 * @param {BigNumber} serverFee - server fees by call function of `getPolicyServerGasFee`
 * @returns {Promise<String>} - the amount of bnb/tbnb in wei
 */
export const getPolicysGasFee = async (
  userAccountIds: string[],
  applyIds: string[],
  ursulaShares: number[],
  ursulaThresholds: number[],
  startSeconds: number[], //policy usage start
  endSeconds: number[], //policy usage start
  serverFee: BigNumber // nlk fee in wei
): Promise<string> => {
  try {
    const account = await getWalletDefaultAccount()
    if (isBlank(account)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    // console.log(account, applyId, ursulaShares, ursulaThreshold);

    console.log(account);
    const startDates : Date [] = [];
    const endDates : Date [] = [];
    for (let index = 0; index < startSeconds.length; index++) {
      const _startSeconds = startSeconds[index];
      const _endSeconds = endSeconds[index];
      const startDate: Date = new Date(_startSeconds * 1000) //  start_at is seconds, but Date needs milliseconds
      const endDate: Date = new Date(_endSeconds * 1000) //  end_at is seconds, but Date needs milliseconds
      startDates.push(startDate);
      endDates.push(endDate);
  
      console.log("getPolicysGasFee: ", index, _startSeconds, _endSeconds, ursulaShares[index]);
    }

    const gasWei = await getBatchCreatePolicyGasFee(
      account as Account,
      userAccountIds,
      applyIds,
      ursulaShares,
      ursulaThresholds,
      startDates,
      endDates,
      serverFee
    )
    // const gasValue = Web3.utils.fromWei(gasWei.toString(), "ether");
    return gasWei.toString()
  } catch (error: any) {
    const error_info: string = error?.message || error

    if (typeof error_info === 'string' && error_info?.toLowerCase()?.includes('policy is currently active')) {
      //The policy has been created successfully, and there is no need to created again
      throw new PolicyHasBeenActivedOnChain('Policy is currently active')
    }

    console.error(error_info, error)
    // Message.error(`Failed to get gas fee!! reason: ${error_info}`);
    throw error
  }
}

/**
 * get information of the logged-in user
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @returns {Promise<object>} - The object containing the user information: {"name": , "address": "account address", "id": "account id", "ipfs": "IPFS",  "service": "service URL"}
 */
export const getLoginedUserInfo = async () => {
  //Web page Checks whether the user has logged in or get logined UserInfo. If so, the current login user name is returned
  const account = await getWalletDefaultAccount()
  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  const config = await getConfigData()
  return {
    name: account?.name,
    address: account?.address,
    id: account?.id,
    ipfs: config.ipfs,
    service: config.service, //pre backend service url
    chainId: config.chainId,
    chainName: config.chainName,
  }
}

/**
 * Retrieve if the default account is logged in
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @returns {Promise<Boolean>}
 */
export const isUserLogined = async (): Promise<boolean> => {
  const account = await getWalletDefaultAccount()
  return !!account
}

/**
 * Retrieve user information details
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @returns {Promise<object>} - User information details:
 *                {
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
export const getUserDetails = async () => {
  const account = await getWalletDefaultAccount()
  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getAccountInfo((account as Account).id)
}

/**
 * Retrieve user information details by user account Id
 * @param {Object} data - Object be must be have the property of "accountId",  null otherwise
 * @param {string} data.accountId - account's Id
 * @returns {Promise<object>} - User information details:
 *                {
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
export const getUserByAccountId = async (data: { accountId: string }) => {
  if (Object.prototype.hasOwnProperty.call(data, 'accountId')) {
    return await pre.getAccountInfo(data['accountId'])
  }
  return null
}

/** update info of current user account
 * @param {Object} data - the Object of update data. The input data must be one or more fields in the "data" section
 * @param {string} data.avatar - (Optional) the photo of current account
 * @param {string} data.nickname - (Optional) the nickname of current account
 * @param {string} data.userSite - (Optional) the user site of current account
 * @param {string} data.twitter - (Optional) the twitter of current account
 * @param {string} data.instagram - (Optional) the instagram of current account
 * @param {string} data.facebook - (Optional) the facebook of current account
 * @param {string} data.personalProfile - (Optional) the personal profile of current account
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @returns {Promise<void>}
 */
export const updateUserInfo = async (data: {
  avatar?: string
  nickname?: string
  userSite?: string
  twitter?: string
  instagram?: string
  facebook?: string
  personalProfile?: string
}) => {
  const account = await getWalletDefaultAccount()

  return await pre.updateAccountInfo(account as Account, data as Record<string, string>)
}

/**
 * Check if the application status is "under review" or "approved"
 * @param {Object} data - Object be must be have the property of "applyId",  return null otherwise
 * @param {string} data.applyId - The ID of the file application.
 * @returns  {Promise<boolean> || null}  param data Object be must be have the property of "applyId",  return null otherwise.
 *           Return true if the status is "under review" or "approved", false otherwise
 */
export const checkFileApprovalStatusIsUnderReviewOrApproved = async (data: { applyId: string }) => {
  if (Object.prototype.hasOwnProperty.call(data, 'applyId')) {
    return await pre.checkFileApprovalStatusIsApprovedOrApproving(data['applyId'])
  }
  return null
}

/**
 * Approve the user's file usage request
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @param {Object} data - the Object of update data. Object be must be have the properties: "userAccountId" and "applyId", return null otherwise
 *              The input data must include the following fields in the "data" section:
 * @param {string} data.userAccountId
 * @param {string} data.applyId
 * @param {number} data.startSeconds
 * @param {number} data.endSeconds
 * @param {number} data.ursulaShares
 * @param {number} data.ursulaThreshold
 * @param {BigNumber} data.gasFeeInWei - by call 'getPolicyGasFee'
 * @param {string} data.remark - (Optional) remark
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @returns {Object || null} - If the "userAccountId" and "applyId" properties are not included in the "data" parameter, return null.
 *          Otherwise, return the object of
 *          {
 *            txHash: 'the transaction hash of the "approve" transaction',
 *            from: 'publisher.address'
 *          }
 */
export const ApprovalUseFiles = async (data: {
  userAccountId: string
  applyId: string
  startSeconds: number
  endSeconds: number
  ursulaShares: number
  ursulaThreshold: number
  gasFeeInWei?: BigNumber
  remark?: string
}) => {
  if (
    data &&
    Object.prototype.hasOwnProperty.call(data, 'userAccountId') &&
    Object.prototype.hasOwnProperty.call(data, 'applyId')
  ) {
    const publisher = await getWalletDefaultAccount()

    if (isBlank(publisher)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    const startDate: Date = new Date(Number(data['startSeconds']) * 1000) //  start_at is seconds, but Date needs milliseconds
    const endDate: Date = new Date(Number(data['endSeconds']) * 1000) //  end_at is seconds, but Date needs milliseconds

    return await pre.approvalApplicationForUseFiles(
      publisher as Account,
      data['userAccountId'],
      data['applyId'],
      data['ursulaShares'],
      data['ursulaThreshold'],
      startDate,
      endDate,
      data && Object.prototype.hasOwnProperty.call(data, 'remark') ? data['remark'] : '',
      '',
      data && Object.prototype.hasOwnProperty.call(data, 'gasFeeInWei') ? data['gasFeeInWei'] : BigNumber.from('-1')
    )
  }

  return null
}


/**
 * Approve the user's multi file usage request. The batch version of the ApprovalUseFiles function.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @param {Object} data - the Object of update data. Object be must be have the properties: "userAccountIds" and "applyIds", return null otherwise
 *              The input data must include the following fields in the "data" section:
 * @param {string[]} data.userAccountIds
 * @param {string[]} data.applyIds
 * @param {number[]} data.startSeconds
 * @param {number[]} data.endSeconds
 * @param {number[]} data.ursulaShares
 * @param {number[]} data.ursulaThresholds
 * @param {BigNumber} data.gasFeeInWei - by call 'getPolicysGasFee'
 * @param {string} data.remark - (Optional) remark
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @returns {Object || null} - If the "userAccountIds" and "applyIds" properties are not included in the "data" parameter, return null.
 *          Otherwise, return the object of
 *          {
 *            txHash: 'the transaction hash of the "approve" transaction',
 *            from: 'publisher.address'
 *          }
 */
export const ApprovalMultiUseFiles = async (data: {
  userAccountIds: string []
  applyIds: string []
  startSecondsArray: number []
  endSecondsArray: number []
  ursulaShares: number []
  ursulaThresholds: number []
  gasFeeInWei?: BigNumber
  remark?: string
}) => {
  if (
    data &&
    Object.prototype.hasOwnProperty.call(data, 'userAccountIds') &&
    Object.prototype.hasOwnProperty.call(data, 'applyIds')
  ) {
    const publisher = await getWalletDefaultAccount()

    if (isBlank(publisher)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    const startDates: Date [] =data['startSecondsArray'].map((startSeconds) => new Date(Number(startSeconds) * 1000) )  // start_at is seconds, but Date needs milliseconds
    const endDates: Date [] =data['endSecondsArray'].map((endSeconds) => new Date(Number(endSeconds) * 1000) )  // end_at is seconds, but Date needs milliseconds

    return await pre.approvalApplicationsForUseFiles(
      publisher as Account,
      data['userAccountIds'],
      data['applyIds'],
      data['ursulaShares'],
      data['ursulaThresholds'],
      startDates,
      endDates,
      data && Object.prototype.hasOwnProperty.call(data, 'remark') ? data['remark'] : '',
      '',
      data && Object.prototype.hasOwnProperty.call(data, 'gasFeeInWei') ? data['gasFeeInWei'] : BigNumber.from('-1')
    )
  }

  return null
}

/**
 * The file publisher retrieves a list of files that have been approved for use by others.
 * @category File Publisher(Alice) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first  
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getFilesForApprovedAsPublisher = async (data: { pageIndex?: number; pageSize?: number }) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getApprovedFilesAsPublisher(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * The file applicant retrieves a list of files that have been approved for their own use.
 * @category File User(Bob) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first  
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getFilesForApprovedAsUser = async (data: { pageIndex?: number; pageSize?: number }) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getApprovedFilesAsUser(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * The file publisher retrieves a list of files in all states that need to be approved for use by others.
 * @category File Publisher(Alice) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first  
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getFilesForAllStatusAsPublisher = async (data: { pageIndex?: number; pageSize?: number }) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getFilesAllStatusAsPublisher(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * Retrieve a list of files that have been approved for the file applicant's own use.
 * @category File User(Bob) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first  
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getFilesApprovedForApplicantAsUser = async (data: { pageIndex?: number; pageSize?: number }) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getApprovedFilesAsUser(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * Retrieve a list of files in a specified state that need to be approved for use by others, for the file publisher.
 * @category File Publisher(Alice) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first  
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.status - (Optional) default 0: All state 1: Under review, 2: Approved, 3: Rejected, 4: Under approval, 5: Expired
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getFilesByStatusForAllApplyAsPublisher = async (data: {
  pageIndex?: number
  pageSize?: number
  status?: string | number
}) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getFilesByApplyStatusAsPublisher(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'status') ? Number(data['status']) : 0,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * The file applicant retrieves a list of files in a specified state that need to be approved by others.
 * @category File User(Bob) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first  
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.status - (Optional) default 0: All state 1: Under review, 2: Approved, 3: Rejected, 4: Under approval, 5: Expired
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getFilesByStatusForAllApplyAsUser = async (data: {
  pageIndex?: number
  pageSize?: number
  status?: string | number
}) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getFilesByApplyStatusAsUser(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'status') ? Number(data['status']) : 0,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * The file applicant retrieves the content of a file that has been approved for their usage.
 * @category File User(Bob) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @throws {@link ParameterError} The input parameter must have the "fileId" field
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {string} data.fileId
 * @param {string} data.fileName
 * @returns {Promise<object>} - { url: "file content url", fileName: "file name" }
 */
export const getApprovedFileContentUrl = async (data: { fileId: string; fileName: string }) => {
  if (data && Object.prototype.hasOwnProperty.call(data, 'fileId')) {
    const account = await getWalletDefaultAccount()

    if (isBlank(account)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    const arraybuffer: ArrayBuffer = await pre.getFileContentByFileIdAsUser(account as Account, data['fileId'])
    // console.log("getApprovedFileContentUrl downloadFile arrayBuffer:", arraybuffer);
    const blob = new Blob([arraybuffer], { type: 'arraybuffer' })
    const url = window.URL.createObjectURL(blob)
    // console.log("blob: ", blob);
    // console.log("getApprovedFileContentUrl url: ",url);
    // chrome.runtime.sendMessage({ method: "downloadFile", data: { url: url, fileName: data["fileName"] } });

    return { url: url, fileName: data['fileName'] }
  } else {
    throw new exception.ParameterError(`The input parameter must have the "fileId" ,"fileName" fields`)
  }
}

/**
 * The file applicant retrieves the content of a file that has been approved for their usage.
 * @category File User(Bob) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @throws {@link ParameterError} The input parameter must have the "fileId" field
 * @param {string} fileId - file's id
 * @returns {Promise<ArrayBuffer>}
 */
export const getApprovedFileContent = async (fileId): Promise<ArrayBuffer> => {
  if (!isBlank(fileId)) {
    const account = await getWalletDefaultAccount()

    if (isBlank(account)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    const arraybuffer: ArrayBuffer = await pre.getFileContentByFileIdAsUser(account as Account, fileId)
    return arraybuffer
  } else {
    throw new exception.ParameterError(`The input parameter must have the "fileId" field`)
  }
}

/**
 * The file publisher obtains the content of the file
 * @category File Publisher(Alice) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @throws {@link ParameterError} The input parameter must have the "fileId" field
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {string} data.fileId
 * @param {string} data.fileName
 * @returns {Promise<object>} - { url: "file content url", fileName: "file name" }
 */
export const getFileContentAsPublisher = async (data: { fileId: string; fileName: string }) => {
  if (data && Object.prototype.hasOwnProperty.call(data, 'fileId')) {
    const account = await getWalletDefaultAccount()

    if (isBlank(account)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    const arraybuffer: ArrayBuffer = await pre.getFileContentByFileIdAsPublisher(account as Account, data['fileId'])
    // console.log("getApprovedFileContentUrl downloadFile arrayBuffer:", arraybuffer);
    const blob = new Blob([arraybuffer], { type: 'arraybuffer' })
    const url = window.URL.createObjectURL(blob)
    // console.log("blob: ", blob);
    // console.log("getApprovedFileContentUrl url: ",url);
    // chrome.runtime.sendMessage({ method: "downloadFile", data: { url: url, fileName: data["fileName"] } });

    return { url: url, fileName: data['fileName'] }
  } else {
    throw new exception.ParameterError(`The input parameter must have the "fileId" ,"fileName" fields`)
  }
}

/**
 * Retrieves a list of files in a specified state.
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.status - (Optional) default 0: All state 1: Under review, 2: Approved, 3: Rejected, 4: Under approval, 5: Expired
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
 * @param {string} data.fileId - (Optional) filter fileId
 * @param {string} data.proposerId - (Optional) The applicant of the file
 * @param {string} data.fileOwnerId - (Optional) The publisher of the file
 * @param {string} data.applyId - (Optional) The id of the file application
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
export const getFilesInfoByStatus = async (data: {
  pageIndex?: number
  pageSize?: number
  status?: string | number
  fileId?: string
  proposerId?: string
  fileOwnerId?: string
  applyId?: string
}) => {
  return await pre.getFilesByStatus(
    data && Object.prototype.hasOwnProperty.call(data, 'fileId') ? data['fileId'] : undefined,
    data && Object.prototype.hasOwnProperty.call(data, 'proposerId') ? data['proposerId'] : undefined,
    data && Object.prototype.hasOwnProperty.call(data, 'fileOwnerId') ? data['fileOwnerId'] : undefined,
    data && Object.prototype.hasOwnProperty.call(data, 'applyId') ? data['applyId'] : undefined,
    data && Object.prototype.hasOwnProperty.call(data, 'status') ? Number(data['status']) : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * The publisher of the file obtains a list of the information of the policies.
 * @category File Publisher(Alice) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getPublishedPolicyInfos = async (data: { pageIndex?: number; pageSize?: number }) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getPublishedPoliciesInfo(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
/**
 * The applicant of the file obtains a list of the policy information.
 * @category File User(Bob) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getPolicyInfosAsUser = async (data: { pageIndex?: number; pageSize?: number }) => {
  const account = await getWalletDefaultAccount()

  if (isBlank(account)) {
    throw new exception.UnauthorizedError(
      'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
    )
  }

  return await pre.getInUsePoliciesInfo(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
    data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
  )
}

/**
 * Obtain a list of files associated with the published policy information.
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {@link UnauthorizedError} get logined account failed, must be login account first
 * @throws {@link ParameterError} The input parameter must have the "policyId" field
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {string} data.policyId - policyId
 * @param {boolean} data.asPublisher - (Optional) default true
 *                             true: acting as the role of file publisher. 
 *                             false: acting as the role of file applicant
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getFilesInfoOfPolicy = async (data: {
  pageIndex?: number
  pageSize?: number
  policyId: string
  asPublisher?: boolean
}) => {
  if (data && Object.prototype.hasOwnProperty.call(data, 'policyId')) {
    const bPublisher: boolean =
      data && Object.prototype.hasOwnProperty.call(data, 'asPublisher') ? Boolean(data['asPublisher']) : true
    const pageIndex = data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1
    const pageSize = data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
    const account = await getWalletDefaultAccount()

    if (isBlank(account)) {
      throw new exception.UnauthorizedError(
        'Please unlock account with your password first by call getWalletDefaultAccount(userpassword)'
      )
    }

    const accountId = (account as Account).id
    if (bPublisher) {
      return await pre.getFilesByPolicyId(data['policyId'], accountId, undefined, pageIndex, pageSize)
    } else {
      return await pre.getFilesByPolicyId(data['policyId'], undefined, accountId, pageIndex, pageSize)
    }
  } else {
    throw new exception.ParameterError(`The input parameter must have the "policyId" fields`)
  }
}

/**
 * Obtain a list of files associated with the policy (including the files of both the file publisher and the file applicant).
 * @throws {@link ParameterError} The input parameter must have the "policyId" field
 * @param {Object} data - Object must be include the following fields in the "data" section:
 * @param {string} data.policyId - policyId
 * @param {number} data.pageIndex - (Optional) number default 1
 * @param {number} data.pageSize - (Optional) number default 10
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
export const getAllFilesInfoOfPolicy = async (data: { pageIndex?: number; pageSize?: number; policyId: string }) => {
  if (data && Object.prototype.hasOwnProperty.call(data, 'policyId')) {
    return await pre.getFilesByPolicyId(
      data['policyId'],
      undefined,
      undefined,
      data && Object.prototype.hasOwnProperty.call(data, 'pageIndex') ? data['pageIndex'] : 1,
      data && Object.prototype.hasOwnProperty.call(data, 'pageSize') ? data['pageSize'] : 10
    )
  } else {
    throw new exception.ParameterError(`The input parameter must have the "policyId" fields`)
  }
}
