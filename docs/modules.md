[NuLink SDK - v0.5.7](README.md) / Modules

# NuLink SDK - v0.5.7

## Table of contents

### Enumerations

- [DataType](enums/DataType.md)
- [DataCategory](enums/DataCategory.md)

### Classes

- [Strategy](classes/Strategy.md)
- [Account](classes/Account.md)
- [AccountManager](classes/AccountManager.md)
- [NuLinkHDWallet](classes/NuLinkHDWallet.md)

### Type Aliases

- [DataInfo](types/DataInfo.md)

### Data Apply Details Functions

- [getApplyDetails](functions/getApplyDetails.md)
- [getMultiApplyDetails](functions/getMultiApplyDetails.md)

### Data Publisher(Alice) Approval Functions

- [getPolicyServerFee](functions/getPolicyServerFee.md)
- [getPolicyGasFee](functions/getPolicyGasFee.md)
- [ApprovalUseDatas](functions/ApprovalUseDatas.md)
- [getPolicyTokenCost](functions/getPolicyTokenCost.md)
- [estimatePolicyGas](functions/estimatePolicyGas.md)
- [approvalApplicationForUseDatas](functions/approvalApplicationForUseDatas.md)
- [refusalApplicationForUseDatas](functions/refusalApplicationForUseDatas.md)

### Data Publisher(Alice) Approval (Multi) Functions

- [getPolicysServerFee](functions/getPolicysServerFee.md)
- [getPolicysGasFee](functions/getPolicysGasFee.md)
- [ApprovalMultiUseDatas](functions/ApprovalMultiUseDatas.md)
- [getPolicysTokenCost](functions/getPolicysTokenCost.md)
- [estimatePolicysGas](functions/estimatePolicysGas.md)
- [approvalApplicationsForUseDatas](functions/approvalApplicationsForUseDatas.md)
- [refusalApplicationsForUseDatas](functions/refusalApplicationsForUseDatas.md)

### Data Publisher(Alice) Approval Details Functions

- [getDatasForApprovedAsPublisher](functions/getDatasForApprovedAsPublisher.md)
- [getDatasForAllStatusAsPublisher](functions/getDatasForAllStatusAsPublisher.md)
- [getDatasByStatusForAllApplyAsPublisher](functions/getDatasByStatusForAllApplyAsPublisher.md)
- [getDatasAllStatusAsPublisher](functions/getDatasAllStatusAsPublisher.md)
- [getDatasByApplyStatusAsPublisher](functions/getDatasByApplyStatusAsPublisher.md)
- [getDatasPendingApprovalAsPublisher](functions/getDatasPendingApprovalAsPublisher.md)
- [getApprovedDatasAsPublisher](functions/getApprovedDatasAsPublisher.md)
- [getDatasForRefusedAsPublisher](functions/getDatasForRefusedAsPublisher.md)
- [getDatasByStatus](functions/getDatasByStatus.md)

### Data Publisher(Alice) Data Details Functions

- [checkDataApprovalStatusIsUnderReviewOrApproved](functions/checkDataApprovalStatusIsUnderReviewOrApproved.md)
- [getDatasInfoByStatus](functions/getDatasInfoByStatus.md)
- [getUploadedDatas](functions/getUploadedDatas.md)
- [getDataInfosByAccount](functions/getDataInfosByAccount.md)
- [deleteUploadedDatas](functions/deleteUploadedDatas.md)
- [checkDataApprovalStatusIsApprovedOrApproving](functions/checkDataApprovalStatusIsApprovedOrApproving.md)
- [checkMultiDataApprovalStatusIsApprovedOrApproving](functions/checkMultiDataApprovalStatusIsApprovedOrApproving.md)
- [getDataInfosByPolicyId](functions/getDataInfosByPolicyId.md)
- [getDataDetails](functions/getDataDetails.md)

### Data Publisher(Alice) Download Data Functions

- [getDataContentAsPublisher](functions/getDataContentAsPublisher.md)
- [getDataContentByDataIdAsPublisher](functions/getDataContentByDataIdAsPublisher.md)

### Data Publisher(Alice) Policys Functions

- [getPublishedPolicyInfos](functions/getPublishedPolicyInfos.md)
- [getDatasInfoOfPolicy](functions/getDatasInfoOfPolicy.md)
- [getAllDatasInfoOfPolicy](functions/getAllDatasInfoOfPolicy.md)
- [getPublishedPoliciesInfo](functions/getPublishedPoliciesInfo.md)
- [getPoliciesInfo](functions/getPoliciesInfo.md)

### Data Publisher(Alice) Upload Data Functions

- [uploadDatasByCreatePolicy](functions/uploadDatasByCreatePolicy.md)
- [uploadDatasBySelectPolicy](functions/uploadDatasBySelectPolicy.md)

### Data User(Bob) Approval Details Functions

- [getDatasAllStatusAsUser](functions/getDatasAllStatusAsUser.md)
- [getDatasByApplyStatusAsUser](functions/getDatasByApplyStatusAsUser.md)
- [getDatasPendingApprovalAsUser](functions/getDatasPendingApprovalAsUser.md)
- [getApprovedDatasAsUser](functions/getApprovedDatasAsUser.md)
- [getUnapprovedDatasAsUser](functions/getUnapprovedDatasAsUser.md)
- [getDatasByStatus](functions/getDatasByStatus.md)

### Data User(Bob) Data Details Functions

- [checkDataApprovalStatusIsUnderReviewOrApproved](functions/checkDataApprovalStatusIsUnderReviewOrApproved.md)
- [getDatasApprovedForApplicantAsUser](functions/getDatasApprovedForApplicantAsUser.md)
- [getDatasByStatusForAllApplyAsUser](functions/getDatasByStatusForAllApplyAsUser.md)
- [getDatasInfoByStatus](functions/getDatasInfoByStatus.md)
- [getOtherShareDatas](functions/getOtherShareDatas.md)
- [checkDataApprovalStatusIsApprovedOrApproving](functions/checkDataApprovalStatusIsApprovedOrApproving.md)
- [checkMultiDataApprovalStatusIsApprovedOrApproving](functions/checkMultiDataApprovalStatusIsApprovedOrApproving.md)
- [getDataDetails](functions/getDataDetails.md)

### Data User(Bob) Download Data Functions

- [getDatasForApprovedAsUser](functions/getDatasForApprovedAsUser.md)
- [getApprovedFileContentUrl](functions/getApprovedFileContentUrl.md)
- [getApprovedDataContent](functions/getApprovedDataContent.md)
- [getDataContentAsUser](functions/getDataContentAsUser.md)
- [getDataContentByDataIdAsUser](functions/getDataContentByDataIdAsUser.md)

### Data User(Bob) Policys Functions

- [getPolicyInfosAsUser](functions/getPolicyInfosAsUser.md)
- [getDatasInfoOfPolicy](functions/getDatasInfoOfPolicy.md)
- [getAllDatasInfoOfPolicy](functions/getAllDatasInfoOfPolicy.md)
- [getInUsePoliciesInfo](functions/getInUsePoliciesInfo.md)
- [getPoliciesInfo](functions/getPoliciesInfo.md)

### Data User(Bob) Request Data Functions

- [applyForDatasUsagePermission](functions/applyForDatasUsagePermission.md)
- [revokePermissionApplicationOfDatas](functions/revokePermissionApplicationOfDatas.md)

### Send Raw Transaction Functions

- [sendCustomTransaction](functions/sendCustomTransaction.md)
- [estimateCustomTransactionGas](functions/estimateCustomTransactionGas.md)

### Wallet Account Functions

- [getLoginedUserInfo](functions/getLoginedUserInfo.md)
- [isUserLogined](functions/isUserLogined.md)
- [getUserDetails](functions/getUserDetails.md)
- [getUserByAccountId](functions/getUserByAccountId.md)
- [updateUserInfo](functions/updateUserInfo.md)
- [restoreWalletDataByRootExtendedPrivateKey](functions/restoreWalletDataByRootExtendedPrivateKey.md)
- [restoreWalletDataByMnemonic](functions/restoreWalletDataByMnemonic.md)
- [restoreWalletData](functions/restoreWalletData.md)
- [exportWalletData](functions/exportWalletData.md)
- [createWallet](functions/createWallet.md)
- [loadWallet](functions/loadWallet.md)
- [verifyPassword](functions/verifyPassword.md)
- [existDefaultAccount](functions/existDefaultAccount.md)
- [logoutWallet](functions/logoutWallet.md)
- [getWalletDefaultAccount](functions/getWalletDefaultAccount.md)
- [unlockWallet](functions/unlockWallet.md)
- [getMnemonic](functions/getMnemonic.md)
- [getDefaultAccountPrivateKey](functions/getDefaultAccountPrivateKey.md)
- [createAccountIfNotExist](functions/createAccountIfNotExist.md)
- [IsExistAccount](functions/IsExistAccount.md)
- [createAccount](functions/createAccount.md)
- [getAccountInfo](functions/getAccountInfo.md)
- [getAccountInfos](functions/getAccountInfos.md)
- [updateAccountInfo](functions/updateAccountInfo.md)
