// The following code is about importing the required packages from the different kind of sources.
import {
  AccountManager,
  NuLinkHDWallet,
  Account,
  Strategy,
} from "../../hdwallet";

import assert from "assert-ts";

import { BigNumber, ethers } from "ethers";
import * as pre from "../../pre/api";
import type { FileInfo } from "../../pre/types";
import { isBlank } from "../../utils/null";
import { nanoid } from "nanoid";
import Web3 from "web3";
import { restoreWalletDataByMnemonic, getPolicyGasFee } from "../../../";

export const proxyReencryptionTestRun = async () => {
  // Declaring and intializing the mnemonic and password variables.
  const mnemonic: string = NuLinkHDWallet.generateMnemonic();
  const password: string = "1";

  // // Here the wallet will be created by using NuLinkHDWallet.createHDWallet() function.
  // //The await keyword used for the waiting the code statement for execution.
  // let nuLinkHDWallet: NuLinkHDWallet = await NuLinkHDWallet.createHDWallet(
  //   mnemonic,
  //   password
  // );
  // const defalutAccount: Account = nuLinkHDWallet
  //   .getAccountManager()
  //   .getAccount(0) as Account;

  // //create account to center server
  // await pre.createAccountIfNotExist(defalutAccount);

  // Here is the wallet is getting loaded by using the password
  const nuLinkHDWallet2 = await NuLinkHDWallet.loadHDWallet(password);
  const nuLinkHDWallet = nuLinkHDWallet2 as NuLinkHDWallet;
  /*   assert(nuLinkHDWallet === nuLinkHDWallet2); */
  // Creating variable and storing the password is correct or not.
  const correct: boolean = await nuLinkHDWallet.verifyPassword(password);

  assert(correct);
  // if correct
  // Creating variable and storing the account manager in accountManager type variable.
  const accountManager: AccountManager = nuLinkHDWallet.getAccountManager();
  // Similarly getting account
  const accountAlice: Account = accountManager.getAccount(0) as Account;

  // const plainText = "This is a history book content";
  const plainText =
    '# encoding=utf-8\n\nimport requests\nimport json\nfrom config.web3_provider import W3\n\n\'\'\'\n    Aaveçå¬åçº¦ååºçäºä»¶å¹¶æ¥æ¾å¯æ¸ ç®è´¦æ·\n\'\'\'\n\n\nclass ListenEvent:\n    def __init__(self, chain_type, scan_address):\n        self.web3 = W3(chain_type=chain_type, num=3)\n        self.chain_type = chain_type\n        self.scan_address = scan_address\n        self.event_topic = "0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b"\n        self.api = "https://api.aurorascan.dev/api"\n        self.pool_contract = self.web3.load_contract("AAVEPool", self.scan_address)\n        self.variable_debt_token_list = [\n            ["variable-debt-usdc", "0x8b225BF698eFd7fA4A9E3FB10424711739304ACa"],\n            ["variable-debt-usdt", "0xc0D1Be1C87B56b72Db03800726AAB7e61AE9AaC7"],\n            ["variable-debt-wnear", "0xaa0E01C05a6361fe8aD037A4b142f633e418B251"],\n            ["variable-debt-weth", "0x541996252ECcF5047671302CaaFf25b4312d482e"],\n            ["variable-debt-dai", "0x1c2E8486e2aF6B168a7985Dcec3309780bEb5F25"],\n            ["variable-debt-wbtc", "0x90eCe2301214b2B86cB77326232e2b6D4b373d7B"]\n        ]\n        self.collateral_token_list = [\n            ["aUsdc", "0x0a88079323d2cCf5f83014a5351058553439499C"],\n            ["aUsdt", "0xD55f46Df9C67297619CD6b254167F5Ed1F34998e"],\n            ["aWnear", "0x6f610C3Ff9e64625ae29C2DA7663Ec100A9433bE"],\n            ["aWeth", "0x935ef78719d55b3a8a53d0ac9494a94658843953"],\n            ["aDai", "0xf4d853d5b100A739B03584b0C2840D136b16DDB8"],\n            ["aWbtc", "0x8047CC5397Fdc885ab2EE1DaEE277237ceB4AE50"]\n        ]\n        self.LIQUIDATION_CLOSE_FACTOR_PERCENT = 5000\n\n    def listen_event(self, from_block, to_block):\n        print("from_block %s, to_block %s" % (from_block, to_block))\n        params = {\n            "module": "logs",\n            "action": "getLogs",\n            "fromBlock": from_block,\n            "toBlock": to_block,\n            "address": self.scan_address,\n            "topic0": self.event_topic\n        }\n        res = requests.get(url=self.api, params=params)\n        if res.status_code == 200:\n            content = json.loads(res.content)\n            if content["status"] == "1":\n                log_info_list = content["result"]\n                for log in log_info_list:\n                    topics = log["topics"]\n                    tx_hash = log["transactionHash"]\n                    log_data = log["data"]\n                    reserve = "0x" + topics[1][26:]\n                    user = "0x" + self.web3.get_data_params(log_data, 0)[24:]\n                    user_data = self.pool_contract.functions.getUserAccountData(\n                        self.web3.w3.toChecksumAddress(user)).call()\n                    health = int(user_data[-1]) / (10 ** 18)\n                    need_liquidation = True if health < 1 else False\n                    amount = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 1))\n                    borrow_rate_mode = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 2))\n                    borrow_rate = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 3))\n                    on_behalf_of = "0x" + topics[2][26:]\n                    print("-> tx_hash", tx_hash)\n                    print("     -> reserve", reserve)\n                    print("     -> user", user)\n                    print("     -> onBehalfOf", on_behalf_of)\n                    print("     -> amount", amount)\n                    print("     -> borrowRateMode", borrow_rate_mode)\n                    print("     -> borrowRate", borrow_rate)\n                    print("     -> borrowRate", borrow_rate)\n                    print("     -> health", health)\n                    print("     -> needLiquidation", need_liquidation)\n\n    def get_user_liquidation_info(self, user):\n        print("***** user debt info *****")\n        for debt_token_info in self.variable_debt_token_list:\n            debt_token_name, debt_token = debt_token_info\n            debt_token_contract = self.web3.get_erc20_contract(self.web3.w3.toChecksumAddress(debt_token))\n            token_amount = debt_token_contract.functions.balanceOf(\n                self.web3.w3.toChecksumAddress(user)\n            ).call()\n            max_liquidatable_debt = (token_amount * self.LIQUIDATION_CLOSE_FACTOR_PERCENT + 1e4/2) / 1e4 if token_amount > 0 else 0\n            print(debt_token_name, token_amount, max_liquidatable_debt)\n        print("***** user collateral info *****")\n        for collateral_token_info in self.collateral_token_list:\n            collateral_token_name, collateral_token = collateral_token_info\n            collateral_token_contract = self.web3.get_erc20_contract(self.web3.w3.toChecksumAddress(collateral_token))\n            token_amount = collateral_token_contract.functions.balanceOf(\n                self.web3.w3.toChecksumAddress(user)\n            ).call()\n            print(collateral_token_name, token_amount)\n\n\n\nif __name__ == "__main__":\n    listen_event = ListenEvent("AURORA", "0xa0bC830Ad82D2EAe0bCFd1D6987664A3D9264aFA")\n    # to_block = listen_event.web3.get_latest_block_num()\n    # listen_event.listen_event("62001019", to_block)\n    listen_event.get_user_liquidation_info("0xee0eb9eff81e70b06e8fe181b4a0db924816bc54")\n\n';
  const enc = new TextEncoder(); // always utf-8
  const historyContent: Uint8Array = enc.encode(plainText);

  //1.upload file by create policy
  const fileList: FileInfo[] = [
    {
      name: `history-${nanoid()}.pdf`,
      fileBinaryArrayBuffer: historyContent.buffer,
    },
  ];
  const _pre = pre;
  const crStrategyInfo: Strategy = await pre.uploadFilesByCreatePolicy(
    accountAlice,
    pre.FileCategory.History,
    fileList
  );
  console.log("account Alice Info:", accountAlice.dump());
  console.log(
    "crStrategyInfo Id:",
    crStrategyInfo.id,
    "crStrategyInfo label:",
    crStrategyInfo.label
  );

  // eslint-disable-next-line no-debugger
  debugger
  const mnemonic1: string = await nuLinkHDWallet.getMnemonic(password) as string;
  
  const nuLinkHDWalletRestore: NuLinkHDWallet =await restoreWalletDataByMnemonic("1", mnemonic1);
  
  // eslint-disable-next-line no-debugger
  debugger
  
  //Get the Files uploaded by the account itself
  const resultList = (await pre.getUploadedFiles(
    accountAlice,
    undefined,
    1,
    1000
  )) as object;
  /*
{
  list: [
    {file_id, file_name:, owner, owner_id, address:,thumbnail:,create_at}
    ...
  ],
  total: 300,
}
*/
  console.log("resultList: ", resultList);
  console.log('resultList["total"]>0 ', resultList["total"] > 0);
  assert(resultList && resultList["total"] > 0);

  let fileIndex = -1;
  for (let index = 0; index < resultList["list"].length; index++) {
    const element = resultList["list"][index];
    if (element["file_name"] === fileList[0]["name"]) {
      fileIndex = index;
      break;
    }
  }
  assert(fileIndex >= 0);
  const uploadFileInfo = resultList["list"][fileIndex];

  /*   console.log('uploadFileInfo["file_name"] ', uploadFileInfo["file_name"]);
  console.log('fileList[0]["name"] ', fileList[0]["name"]);
  console.log('equal1: ', uploadFileInfo["file_name"] === fileList[0]["name"]);
  console.log('uploadFileInfo["owner_id"] ', uploadFileInfo["owner_id"] );
  console.log('accountAlice.id ', accountAlice.id);
  console.log('equal2: ', uploadFileInfo["owner_id"] === accountAlice.id); */

  assert(uploadFileInfo["owner_id"] === accountAlice.id);

  //Bob find the file on Internet
  const accountBob: Account = await accountManager.createAccount("Bob");
  // call the createAccountIfNotExist method for add user account to the center server for decouple
  await pre.createAccountIfNotExist(accountBob);

  console.log("account Bob Info:", accountBob.dump());

  const findFileResultList = (await pre.getOtherShareFiles(
    accountBob,
    undefined,
    false,
    undefined,
    undefined,
    undefined,
    1,
    1000
  )) as object;
  /*
   {
      list: [
        {file_id, file_name:, owner, owner_id, address:,thumbnail:,create_at}
        ...
      ],
      total: 300,
    }
  */

  assert(findFileResultList && findFileResultList["total"] > 0);

  let fileIndex2 = -1;
  for (let index = 0; index < findFileResultList["list"].length; index++) {
    const element = findFileResultList["list"][index];
    if (element["file_name"] === fileList[0]["name"]) {
      fileIndex2 = index;
      break;
    }
  }
  assert(fileIndex2 >= 0);

  const findFileInfo = findFileResultList["list"][fileIndex2];
  assert(findFileInfo["owner_id"] === accountAlice.id);

  const applyFileId = findFileInfo["file_id"];

  //get file details
  const fileDetails = (await pre.getFileDetails(
    applyFileId,
    accountBob.id
  )) as object;
  /*
   {
          file_id:,file_name:,thumbnail:,file_created_at:,apply_id:,status:,apply_start_at:,apply_end_at:,apply_created_at:,
          policy_id:,hrac:,creator:,creator_id:,consumer:,consumer_id:,gas:,tx_hash:,policy_created_at:,
          file_ipfs_address:,policy_encrypted_pk:,encrypted_treasure_map_ipfs_address:,alice_verify_pk
    } 
 */
  // assert(fileDetails["creator_id"] === accountAlice.id);
  assert(fileDetails["file_id"] === applyFileId);
  assert(parseInt(fileDetails["status"]) === 0); //Is not to apply for

  //apply file for usage
  try {
    await pre.applyForFilesUsagePermission([applyFileId], accountBob, 7);
  } catch (e) {
    console.log("bob apply file failed", e);
    assert(false);
  }

  //Alice looks at the documents she needs to approve
  const filesNeedToApprovedResultList =
    await pre.getFilesPendingApprovalAsPublisher(accountAlice, 1, 1000);
  /*return data format: {
      list: [
        { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
        ...
      ],
      total: 300,
    }
  */

  let fileIndex3 = -1;
  for (
    let index = 0;
    index < filesNeedToApprovedResultList["list"].length;
    index++
  ) {
    const element = filesNeedToApprovedResultList["list"][index];
    if (element["file_id"] === applyFileId) {
      fileIndex3 = index;
      break;
    }
  }
  assert(fileIndex3 >= 0);

  assert(
    filesNeedToApprovedResultList && filesNeedToApprovedResultList["total"] > 0
  );
  const needToApprovedFileInfo =
    filesNeedToApprovedResultList["list"][fileIndex3];
  assert(needToApprovedFileInfo["file_owner_id"] === accountAlice.id);

  //Alice rejected the file usage request
  await pre.refusalApplicationForUseFiles(
    accountAlice,
    needToApprovedFileInfo["apply_id"]
  );

  //Bob apply file for usage again. The application period is three days, less than the previous seven days
  try {
    await pre.applyForFilesUsagePermission([applyFileId], accountBob, 3);
  } catch (e) {
    console.log("bob reapply file failed", e);
    assert(false);
  }

  //Alice looks at the documents she needs to approve
  const filesNeedToApprovedResultList2 =
    await pre.getFilesPendingApprovalAsPublisher(accountAlice, 1, 1000);
  /*return data format: {
    list: [
      { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, days,  created_at }
      ...
    ],
    total: 300,
  }
  */

  assert(
    filesNeedToApprovedResultList2 &&
      filesNeedToApprovedResultList2["total"] > 0
  );

  let fileIndex4 = -1;
  for (
    let index = 0;
    index < filesNeedToApprovedResultList2["list"].length;
    index++
  ) {
    const element = filesNeedToApprovedResultList2["list"][index];
    if (element["file_id"] === applyFileId) {
      fileIndex4 = index;
      break;
    }
  }
  assert(fileIndex4 >= 0);

  const needToApprovedFileInfo2 =
    filesNeedToApprovedResultList2["list"][fileIndex4];
  assert(needToApprovedFileInfo2["file_owner_id"] === accountAlice.id);

  //Alice calc gas fee (wei)

  const startDate: Date = new Date();
  const startMs: number = Date.parse(startDate.toString());
  const endMs: number =
    startMs + (needToApprovedFileInfo2["days"] as number) * 24 * 60 * 60 * 1000;
  const endDate: Date = new Date(endMs); //  start_at is seconds, but Date needs milliseconds

  const serverFeeNLKInWei: BigNumber = await pre.getPolicyTokenCost(
    accountAlice,
    startDate,
    endDate,
    2
  );

  const serverValue = Web3.utils.fromWei(serverFeeNLKInWei.toString(), "ether");
  console.log("server nlk fee  ether is:", serverValue);

  const gasFeeWei = await getPolicyGasFee(
    accountBob.id,
    needToApprovedFileInfo2["apply_id"],
    2,
    1,
    startMs,
    endMs,
    BigNumber.from(serverFeeNLKInWei)
  );

  //Alice approved the file for Bob usage
  await pre.approvalApplicationForUseFiles(
    accountAlice,
    accountBob.id,
    needToApprovedFileInfo2["apply_id"],
    2,
    1,
    startDate,
    endDate,
    "", //remark
    "", //porterUri
    BigNumber.from(gasFeeWei)
  );

  const aliceApprovedfilesList = await pre.getApprovedFilesAsPublisher(
    accountAlice,
    1,
    1000
  );
  /*return data format: {
  list: [
    { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
    ...
  ],
  total: 300,
}
*/

  assert(aliceApprovedfilesList && aliceApprovedfilesList["total"] > 0);

  let fileIndex5 = -1;
  for (let index = 0; index < aliceApprovedfilesList["list"].length; index++) {
    const element = aliceApprovedfilesList["list"][index];
    if (element["file_id"] === applyFileId) {
      fileIndex5 = index;
      break;
    }
  }
  assert(fileIndex5 >= 0);
  const aliceApprovedFileInfo = aliceApprovedfilesList["list"][fileIndex5];
  assert(aliceApprovedFileInfo["file_owner_id"] === accountAlice.id);
  const policyId = aliceApprovedFileInfo["policy_id"];
  console.log("file policy Id:", policyId);

  //Bob looks at the file he requested
  const bobBeApprovedfilesList = await pre.getApprovedFilesAsUser(
    accountBob,
    1,
    1000
  );
  /*return data format: {
  list: [
    { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
    ...
  ],
  total: 300,
}
*/

  assert(bobBeApprovedfilesList && bobBeApprovedfilesList["total"] > 0);

  let fileIndex6 = -1;
  for (let index = 0; index < bobBeApprovedfilesList["list"].length; index++) {
    const element = bobBeApprovedfilesList["list"][index];
    if (element["file_id"] === applyFileId) {
      fileIndex6 = index;
      break;
    }
  }
  assert(fileIndex6 >= 0);

  const bobBeApprovedfilesInfo = bobBeApprovedfilesList["list"][fileIndex6];
  assert(bobBeApprovedfilesInfo["file_owner_id"] === accountAlice.id);
  const policyId2 = bobBeApprovedfilesInfo["policy_id"];
  assert(policyId2 === policyId);

  //Bob get file content
  const arrayBuffer: ArrayBuffer = await pre.getFileContentByFileIdAsUser(
    accountBob,
    bobBeApprovedfilesInfo["file_id"]
  );
  const fileContent: string = Buffer.from(arrayBuffer).toString();
  console.log("fileContent: ", fileContent);
  console.log("plainText: ", plainText);
  assert(fileContent === plainText);

  const dataPolicys = await pre.getPublishedPoliciesInfo(accountAlice, 1, 1000);
  /*
    return data format: {
    list: [
      {hrac, label:, policy_label_id, creator, creator_id:, consumer:, consumer_id:, status, gas, tx_hash, created_at, start_at, end_at, policy_id}
      ...
    ],
    total: 300,
  }*/
  assert(!isBlank(dataPolicys));

  //Alice upload file to exist policy

  const plainText2 = "This is a philosophy book content";
  const historyContent2: Uint8Array = enc.encode(plainText2);

  //1.upload file by create policy
  const fileList2: FileInfo[] = [
    {
      name: `philosophy-${nanoid()}.pdf`,
      fileBinaryArrayBuffer: historyContent2.buffer,
    },
  ];

  const fileIds = await pre.uploadFilesBySelectPolicy(
    accountAlice,
    pre.FileCategory.Philosophy,
    fileList2,
    policyId
  );

  //Files uploaded by using published policies do not need approval. Bob can use the files directly, so there is no approval record
  //   // ---------------------------------------------- start --------------------------------------------------------------------------
  //   //Bob looks at the file he requested
  //   const bobBeApprovedfilesList2 = await pre.getApprovedFilesAsUser(accountBob, 1, 10);
  //   /*return data format: {
  //   list: [
  //     { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
  //     ...
  //   ],
  //   total: 300,
  // }
  // */
  //   console.log("applyFileId file id", applyFileId);

  //   assert(bobBeApprovedfilesList2 && bobBeApprovedfilesList2["total"] > 0);

  //   let new_uploaded_file_id: string = "";
  //   for (const bobBeApprovedfile of bobBeApprovedfilesList["list"]) {
  //     console.log("bobBeApprovedfile file id", bobBeApprovedfile["file_id"]);
  //     if (bobBeApprovedfile["file_id"] !== applyFileId) {
  //       new_uploaded_file_id = bobBeApprovedfile["file_id"];
  //     }
  //   }
  //   // ---------------------------------------------- end --------------------------------------------------------------------------

  //Bob get new upload file content
  const arrayBuffer2: ArrayBuffer = await pre.getFileContentByFileIdAsUser(
    accountBob,
    fileIds[0]
  );
  const fileContent2: string = Buffer.from(arrayBuffer2).toString();
  console.log("fileContent2: ", fileContent2);
  console.log("plainText2: ", plainText2);
  assert(fileContent2 === plainText2);

  //you can get all status files for mine apply: The files I applied for
  //status 0: all status, include:  applying，approved, rejected
  const data = (await pre.getFilesByStatus(
    undefined,
    accountBob.id,
    undefined,
    undefined,
    0,
    1,
    1000
  )) as object;
  /*
    return data format: {
      list: [
        { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, days, created_at, status }
        ...
      ],
      total: 300,
    }
  */

  assert(data && !isBlank(data) && data["total"] > 0);
};
