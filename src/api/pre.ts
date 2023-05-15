/**
 * This comment will be used as the summary for the "thing2" module
 * @packageDocumentation
 * @module pre
 * @preferred
 */
import {
  getPolicyTokenCost,
  estimatePolicyGas as gasFee,
} from "../core/pre";
import { PolicyHasBeenActivedOnChain } from "../core";
import { BigNumber } from "ethers";
import { Account, NuLinkHDWallet } from "../core/hdwallet/api/account";
import { getWalletDefaultAccount } from "./wallet";
import { getSettingsData as getConfigData } from "../core/chainnet";
import * as pre from "../core/pre";
import { isBlank } from "../core/utils";
import * as exception from '../core/utils/exception'

export type { BigNumber } from "ethers";

/**
 *  get service fees (NLK/TNLK) for sharing files 
 * @param startSeconds Start time of file usage application in seconds
 * @param endSeconds End time of file usage application in seconds
 * @param ursulaShares Number of service shares
 * @returns the amount of NLK/TNLK in wei
 */
export const getPolicyServerGasFee = async (
  startSeconds: number,
  endSeconds: number,
  ursulaShares: number
) => {
  const nuLinkHDWallet: any = await NuLinkHDWallet.loadHDWallet();
  const account = nuLinkHDWallet.getAccountManager().getDefaultAccount();

  console.log(account, startSeconds, endSeconds, ursulaShares);

  const startDate: Date = new Date(startSeconds * 1000); //  start_at is seconds, but Date needs milliseconds
  const endDate: Date = new Date(endSeconds * 1000); //  end_at is seconds, but Date needs milliseconds

  const gasWei = await getPolicyTokenCost(account, startDate, endDate, ursulaShares);
  // const gasValue = Web3.utils.fromWei(gasWei.toString(), "ether");
  return gasWei.toString();
};
/**
 * get service gas fees for sharing files 
 * @param userAccountId the account Id of the file applicant (Bob)
 * @param applyId The application ID returned to the user by the interface when applying to use a specific file
 * @param ursulaShares Number of service shares
 * @param ursulaThreshold The file user can download the file after obtaining the specified number of service data shares
 * @param startSeconds Start time of file usage application in seconds
 * @param endSeconds End time of file usage application in seconds
 * @param serverFee server fees by call function of `getPolicyServerGasFee`
 * @returns the amount of bnb/tbnb in wei
 */
export const getPolicyGasFee = async (
  userAccountId: string,
  applyId: string,
  ursulaShares: number,
  ursulaThreshold: number,
  startSeconds: number, //policy usage start
  endSeconds: number, //policy usage start
  serverFee: BigNumber // nlk fee in wei
) => {
  try {
    const nuLinkHDWallet: any = await NuLinkHDWallet.loadHDWallet();
    const account = nuLinkHDWallet.getAccountManager().getDefaultAccount();

    // console.log(account, applyId, ursulaShares, ursulaThreshold);

    const startDate: Date = new Date(Number(startSeconds) * 1000); //  start_at is seconds, but Date needs milliseconds
    const endDate: Date = new Date(Number(endSeconds) * 1000); //  end_at is seconds, but Date needs milliseconds

    const gasWei = await gasFee(
      account,
      userAccountId,
      applyId,
      ursulaShares,
      ursulaThreshold,
      startDate,
      endDate,
      serverFee
    );
    // const gasValue = Web3.utils.fromWei(gasWei.toString(), "ether");
    return gasWei.toString();
  } catch (error: any) {
    const error_info: string = error?.message || error;

    if (error_info?.toLowerCase()?.includes("policy is currently active")) {
      //The policy has been created successfully, and there is no need to created again
      throw new PolicyHasBeenActivedOnChain("Policy is currently active");
    }

    console.error(error_info, error);
    // Message.error(`Failed to get gas fee!! reason: ${error_info}`);
    throw error;
  }
};

/**
 * get information of the logged-in user
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 * @returns void
 */
export const getLoginedUserInfo = async () => {
  //Web page Checks whether the user has logged in or get logined UserInfo. If so, the current login user name is returned
  const account = await getWalletDefaultAccount();
  if(isBlank(account))
  {
    throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
  }

  const config = await getConfigData();
  return {
    name: account?.name,
    address: account?.address,
    id: account?.id,
    ipfs: config.ipfs,
    service: config.service, //pre backend service url
  };
};

/**
 * Retrieve if the default account is logged in
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 * @returns void
 */
export const isUserLogined = async (): Promise<boolean> => {
  const account = await getWalletDefaultAccount();
  return !!account;
};

/**
 * Retrieve user information details
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 * @returns User information details
 */
export const getUserDetails = async () => {
  const account = await getWalletDefaultAccount();
  if(isBlank(account))
  {
    throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
  }

  return await pre.getAccountInfo((account as Account).id);
};

/**
 * Retrieve user information details by user account Id
 * @param data Object be must be have the property of "accountId",  null otherwise
 * @returns User information details
 */
export const getUserByAccountId = async (data) => {
  if (Object.prototype.hasOwnProperty.call(data, "accountId")) {
    return await pre.getAccountInfo(data["accountId"]);
  }
  return null;
};

/** update info of current user account
 * @param data the Object of update data. The input data must be one or more fields in the "data" section:
 *            "avatar"
 *            "nickname"
 *            "userSite"
 *            "twitter"
 *            "instagram"
 *            "facebook"
 *            "personalProfile"                                               
 *                                      
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 * @returns void
 */
export const updateUserInfo = async (data) => {
  const account = await getWalletDefaultAccount();
  
  return await pre.updateAccountInfo(account as Account, data as Record<string, string>);
};

/**
 * Check if the application status is "under review" or "approved"
 * @param data Object be must be have the property of "applyId",  return null otherwise
 * @returns  param data Object be must be have the property of "applyId",  return null otherwise. 
 *           Return true if the status is "under review" or "approved", false otherwise
 */
export const checkFileApprovalStatusIsUnderReviewOrApproved = async (data) => {
  if (Object.prototype.hasOwnProperty.call(data, "applyId")) {
    return await pre.checkFileApprovalStatusIsApprovedOrApproving(data["applyId"]);
  }
  return null;
};

/**
 * Approve the user's file usage request
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @param data the Object of update data. The input data must be one or more fields in the "data" section:
 *            "avatar"
 *            "nickname"
 *            "userSite"
 *            "twitter"
 *            "instagram"
 *            "facebook"
 *            "personalProfile"                                               
 * 
 * @throws {UnauthorizedError}               
 * @returns 
 */
export const ApprovalUseFiles = async (data) => {
  if (
    data &&
    Object.prototype.hasOwnProperty.call(data, "userAccountId") &&
    Object.prototype.hasOwnProperty.call(data, "applyId")
  ) {
    
    const publisher = await getWalletDefaultAccount();
    
    if(isBlank(publisher))
    {
      throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
    }

    const startDate: Date = new Date(Number(data["startSeconds"]) * 1000); //  start_at is seconds, but Date needs milliseconds
    const endDate: Date = new Date(Number(data["endSeconds"]) * 1000); //  end_at is seconds, but Date needs milliseconds

    return await pre.approvalApplicationForUseFiles(
      publisher as Account,
      data["userAccountId"],
      data["applyId"],
      data["ursulaShares"],
      data["ursulaThreshold"],
      startDate,
      endDate,
      data && Object.prototype.hasOwnProperty.call(data, "remark") ? data["remark"] : "",
      "",
      data && Object.prototype.hasOwnProperty.call(data, "gasFeeInWei") ? data["gasFeeInWei"] : ""
    );
  }

  return null;
};

/**
 * @category File Publisher(Alice) Interface
 * 
 * @param data 
 * @returns 
 */
export const getFilesForApprovedAsPublisher = async (data) => {
  return await pre.getApprovedFilesAsPublisher(
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

export const getFilesForApprovedAsUser = async (data) => {
  return await pre.getApprovedFilesAsUser(
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

/**
 * @category File Publisher(Alice) Interface
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getFilesForAllStatusAsPublisher = async (data) => {
  const account = await getWalletDefaultAccount();

  if(isBlank(account))
  {
    throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
  }

  return await pre.getFilesAllStatusAsPublisher(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

export const getFilesForAllApplyAsUser = async (data) => {
  return await pre.getApprovedFilesAsUser(
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

/**
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getFilesByStatusForAllApplyAsPublisher = async (data) => {
  const account = await getWalletDefaultAccount();
                
  if(isBlank(account))
  {
    throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
  }

  return await pre.getFilesByApplyStatusAsPublisher(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, "status") ? parseInt(data["status"]) : 0,
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

/**
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getFilesByStatusForAllApplyAsUser = async (data) => {
  const account = await getWalletDefaultAccount();

  if(isBlank(account))
  {
    throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
  }

  return await pre.getFilesByApplyStatusAsUser(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, "status") ? parseInt(data["status"]) : 0,
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

/**
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getApprovedFileContentByFileId = async (data) => {
  if (data && Object.prototype.hasOwnProperty.call(data, "fileId")) {
    const account = await getWalletDefaultAccount();

    if(isBlank(account))
    {
      throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
    }

    const arraybuffer: ArrayBuffer = await pre.getFileContentByFileIdAsUser(
      account as Account,
      data["fileId"]
    );
    // console.log("getApprovedFileContentByFileId downloadFile arrayBuffer:", arraybuffer);
    const blob = new Blob([arraybuffer], { type: "arraybuffer" });
    const url = window.URL.createObjectURL(blob);
    // console.log("blob: ", blob);
    // console.log("getApprovedFileContentByFileId url: ",url);
    // chrome.runtime.sendMessage({ method: "downloadFile", data: { url: url, fileName: data["fileName"] } });

    return { url: url, fileName: data["fileName"] };
  }
};

/** 
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getApprovedFileContent = async (fileId) => {
  if (!isBlank(fileId)) {
    const account = await getWalletDefaultAccount();

    if(isBlank(account))
    {
      throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
    }

    const arraybuffer: ArrayBuffer = await pre.getFileContentByFileIdAsUser(
      account as Account,
      fileId
    );
    return arraybuffer;
  }
};

/**
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getContentAsUploaderByFileId = async (data) => {
  if (data && Object.prototype.hasOwnProperty.call(data, "fileId")) {
    const account = await getWalletDefaultAccount();

    if(isBlank(account))
    {
      throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
    }

    const arraybuffer: ArrayBuffer = await pre.getFileContentByFileIdAsPublisher(
      account as Account,
      data["fileId"]
    );
    // console.log("getApprovedFileContentByFileId downloadFile arrayBuffer:", arraybuffer);
    const blob = new Blob([arraybuffer], { type: "arraybuffer" });
    const url = window.URL.createObjectURL(blob);
    // console.log("blob: ", blob);
    // console.log("getApprovedFileContentByFileId url: ",url);
    // chrome.runtime.sendMessage({ method: "downloadFile", data: { url: url, fileName: data["fileName"] } });

    return { url: url, fileName: data["fileName"] };
  }
  return null;
};

export const getFilesInfoByStatus = async (data) => {
  return await pre.getFilesByStatus(
    data && Object.prototype.hasOwnProperty.call(data, "fileId") ? data["fileId"] : undefined,
    data && Object.prototype.hasOwnProperty.call(data, "proposerId") ? data["proposerId"] : undefined,
    data && Object.prototype.hasOwnProperty.call(data, "fileOwnerId")
      ? data["fileOwnerId"]
      : undefined,
    data && Object.prototype.hasOwnProperty.call(data, "applyId") ? data["applyId"] : undefined,
    data && Object.prototype.hasOwnProperty.call(data, "status") ? data["status"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

/**
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getPublishedPolicyInfos = async (data) => {
  const account = await getWalletDefaultAccount();

  if(isBlank(account))
  {
    throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
  }

  return await pre.getPublishedPoliciesInfo(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

/**
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getPolicyInfosAsUser = async (data) => {
  const account = (await getWalletDefaultAccount()) ;

  if(isBlank(account))
  {
    throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
  }

  return await pre.getInUsePoliciesInfo(
    account as Account,
    data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
    data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
  );
};

/**
 * Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.
 * @throws {UnauthorizedError} 
 */
export const getFilesInfoOfPolicy = async (data) => {
  const policyId = data && Object.prototype.hasOwnProperty.call(data, "policyId");
  if (policyId) {
    const asPublisher: boolean =
      data && Object.prototype.hasOwnProperty.call(data, "asPublisher") ? data["asPublisher"] : true;
    const pageIndex =
      data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1;
    const pageSize =
      data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10;
    const account = await getWalletDefaultAccount() ;

    if(isBlank(account))
    {
      throw new exception.UnauthorizedError("Please unlock account with your password first by call getWalletDefaultAccount(userpassword)")
    }

    const accountId = (account as Account).id;
    if (asPublisher) {
      return await pre.getFilesByPolicyId(
        policyId,
        accountId,
        undefined,
        pageIndex,
        pageSize
      );
    } else {
      return await pre.getFilesByPolicyId(
        policyId,
        undefined,
        accountId,
        pageIndex,
        pageSize
      );
    }
  }
  return null;
};

export const getAllFilesInfoOfPolicy = async (data) => {
  if (data && Object.prototype.hasOwnProperty.call(data, "policyId")) {
    return await pre.getFilesByPolicyId(
      data["policyId"],
      undefined,
      undefined,
      data && Object.prototype.hasOwnProperty.call(data, "pageIndex") ? data["pageIndex"] : 1,
      data && Object.prototype.hasOwnProperty.call(data, "pageSize") ? data["pageSize"] : 10
    );
  }
  return null;
};
