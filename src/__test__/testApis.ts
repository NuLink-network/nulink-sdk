// First define a concept:
//  Alice: as the publisher of the file (file uploader).
//  Bob: as the user of the file (file requester)
import { NuLinkHDWallet, Account, Strategy, AccountManager } from '..'

import assert from 'assert-ts'
import {
  createWallet,
  loadWallet,
  verifyPassword,
  existDefaultAccount,
  getWalletDefaultAccount,
  getMnemonic,
  logoutWallet,
  getDefaultAccountPrivateKey
} from '../api/wallet'

import { BigNumber, ethers } from 'ethers'
import { isBlank } from '../core/utils'
import { nanoid } from 'nanoid'
import Web3 from 'web3'
import { type FileInfo } from '..'
import { restoreWalletDataByMnemonic, getPolicyGasFee } from '..'
import * as pre from '../core/pre'
import sleep from 'await-sleep'

export const proxyReencryptionAPIsTestRun = async () => {
  // Declaring and intializing the mnemonic and password variables.
  const password: string = '1'

  //first We create Alice wallet and account by password
  const nuLinkHDWallet1: NuLinkHDWallet = await createWallet(password)

  assert(nuLinkHDWallet1)

  // after we created the wallet, we can loadWallet by password
  const nuLinkHDWallet2: NuLinkHDWallet | null = await loadWallet(password)
  assert(nuLinkHDWallet2)

  const nuLinkHDWallet = nuLinkHDWallet2 as NuLinkHDWallet

  assert(nuLinkHDWallet1 === nuLinkHDWallet)

  //also, We can verify whether the user's password is correct
  const correct: boolean = (await verifyPassword(password)) as boolean

  assert(correct)

  // We can also determine if the user has created an account locally
  const hasAnAccountInLocal: boolean = await existDefaultAccount()
  assert(hasAnAccountInLocal)

  // we can get the account by user password that we have created
  const accountAlice: Account = (await getWalletDefaultAccount(password)) as Account
  assert(accountAlice)

  // Note: We only support one account currently.

  //Now we can encrypt and upload a file for others to apply for download

  //1. read a file
  const plainText =
    '# encoding=utf-8\n\nimport requests\nimport json\nfrom config.web3_provider import W3\n\n\'\'\'\n    Aaveçå¬åçº¦ååºçäºä»¶å¹¶æ¥æ¾å¯æ¸ ç®è´¦æ·\n\'\'\'\n\n\nclass ListenEvent:\n    def __init__(self, chain_type, scan_address):\n        self.web3 = W3(chain_type=chain_type, num=3)\n        self.chain_type = chain_type\n        self.scan_address = scan_address\n        self.event_topic = "0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b"\n        self.api = "https://api.aurorascan.dev/api"\n        self.pool_contract = self.web3.load_contract("AAVEPool", self.scan_address)\n        self.variable_debt_token_list = [\n            ["variable-debt-usdc", "0x8b225BF698eFd7fA4A9E3FB10424711739304ACa"],\n            ["variable-debt-usdt", "0xc0D1Be1C87B56b72Db03800726AAB7e61AE9AaC7"],\n            ["variable-debt-wnear", "0xaa0E01C05a6361fe8aD037A4b142f633e418B251"],\n            ["variable-debt-weth", "0x541996252ECcF5047671302CaaFf25b4312d482e"],\n            ["variable-debt-dai", "0x1c2E8486e2aF6B168a7985Dcec3309780bEb5F25"],\n            ["variable-debt-wbtc", "0x90eCe2301214b2B86cB77326232e2b6D4b373d7B"]\n        ]\n        self.collateral_token_list = [\n            ["aUsdc", "0x0a88079323d2cCf5f83014a5351058553439499C"],\n            ["aUsdt", "0xD55f46Df9C67297619CD6b254167F5Ed1F34998e"],\n            ["aWnear", "0x6f610C3Ff9e64625ae29C2DA7663Ec100A9433bE"],\n            ["aWeth", "0x935ef78719d55b3a8a53d0ac9494a94658843953"],\n            ["aDai", "0xf4d853d5b100A739B03584b0C2840D136b16DDB8"],\n            ["aWbtc", "0x8047CC5397Fdc885ab2EE1DaEE277237ceB4AE50"]\n        ]\n        self.LIQUIDATION_CLOSE_FACTOR_PERCENT = 5000\n\n    def listen_event(self, from_block, to_block):\n        print("from_block %s, to_block %s" % (from_block, to_block))\n        params = {\n            "module": "logs",\n            "action": "getLogs",\n            "fromBlock": from_block,\n            "toBlock": to_block,\n            "address": self.scan_address,\n            "topic0": self.event_topic\n        }\n        res = requests.get(url=self.api, params=params)\n        if res.status_code == 200:\n            content = json.loads(res.content)\n            if content["status"] == "1":\n                log_info_list = content["result"]\n                for log in log_info_list:\n                    topics = log["topics"]\n                    tx_hash = log["transactionHash"]\n                    log_data = log["data"]\n                    reserve = "0x" + topics[1][26:]\n                    user = "0x" + self.web3.get_data_params(log_data, 0)[24:]\n                    user_data = self.pool_contract.functions.getUserAccountData(\n                        self.web3.w3.toChecksumAddress(user)).call()\n                    health = int(user_data[-1]) / (10 ** 18)\n                    need_liquidation = True if health < 1 else False\n                    amount = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 1))\n                    borrow_rate_mode = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 2))\n                    borrow_rate = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 3))\n                    on_behalf_of = "0x" + topics[2][26:]\n                    print("-> tx_hash", tx_hash)\n                    print("     -> reserve", reserve)\n                    print("     -> user", user)\n                    print("     -> onBehalfOf", on_behalf_of)\n                    print("     -> amount", amount)\n                    print("     -> borrowRateMode", borrow_rate_mode)\n                    print("     -> borrowRate", borrow_rate)\n                    print("     -> borrowRate", borrow_rate)\n                    print("     -> health", health)\n                    print("     -> needLiquidation", need_liquidation)\n\n    def get_user_liquidation_info(self, user):\n        print("***** user debt info *****")\n        for debt_token_info in self.variable_debt_token_list:\n            debt_token_name, debt_token = debt_token_info\n            debt_token_contract = self.web3.get_erc20_contract(self.web3.w3.toChecksumAddress(debt_token))\n            token_amount = debt_token_contract.functions.balanceOf(\n                self.web3.w3.toChecksumAddress(user)\n            ).call()\n            max_liquidatable_debt = (token_amount * self.LIQUIDATION_CLOSE_FACTOR_PERCENT + 1e4/2) / 1e4 if token_amount > 0 else 0\n            print(debt_token_name, token_amount, max_liquidatable_debt)\n        print("***** user collateral info *****")\n        for collateral_token_info in self.collateral_token_list:\n            collateral_token_name, collateral_token = collateral_token_info\n            collateral_token_contract = self.web3.get_erc20_contract(self.web3.w3.toChecksumAddress(collateral_token))\n            token_amount = collateral_token_contract.functions.balanceOf(\n                self.web3.w3.toChecksumAddress(user)\n            ).call()\n            print(collateral_token_name, token_amount)\n\n\n\nif __name__ == "__main__":\n    listen_event = ListenEvent("AURORA", "0xa0bC830Ad82D2EAe0bCFd1D6987664A3D9264aFA")\n    # to_block = listen_event.web3.get_latest_block_num()\n    # listen_event.listen_event("62001019", to_block)\n    listen_event.get_user_liquidation_info("0xee0eb9eff81e70b06e8fe181b4a0db924816bc54")\n\n'
  const enc = new TextEncoder() // always utf-8
  const historyContent: Uint8Array = enc.encode(plainText)

  //1.Alice upload file
  const fileList: FileInfo[] = [
    {
      name: `history-${nanoid()}.pdf`,
      fileBinaryArrayBuffer: historyContent.buffer
    }
  ]

  debugger;
  //2. Alice encrypt and update a file to the ipfs network
  await pre.uploadFilesByCreatePolicy(accountAlice, pre.FileCategory.History, fileList)

  //3. We can get the file just uploaded
  const resultList = (await pre.getUploadedFiles(accountAlice, undefined, 1, 1000)) as object

  /*
  {
    list: [
      {file_id, file_name:, owner, owner_id, address:,thumbnail:,create_at}
      ...
    ],
    total: 300,
  }
  
  */
  console.log('resultList: ', resultList)
  console.log('resultList["total"]>0 ', resultList['total'] > 0)
  assert(resultList && resultList['total'] > 0)

  let fileIndex = -1
  for (let index = 0; index < resultList['list'].length; index++) {
    const element = resultList['list'][index]
    if (element['file_name'] === fileList[0]['name']) {
      fileIndex = index
      break
    }
  }
  assert(fileIndex >= 0)
  const uploadFileInfo = resultList['list'][fileIndex]

  /*   console.log('uploadFileInfo["file_name"] ', uploadFileInfo["file_name"]);
  console.log('fileList[0]["name"] ', fileList[0]["name"]);
  console.log('equal1: ', uploadFileInfo["file_name"] === fileList[0]["name"]);
  console.log('uploadFileInfo["owner_id"] ', uploadFileInfo["owner_id"] );
  console.log('accountAlice.id ', accountAlice.id);
  console.log('equal2: ', uploadFileInfo["owner_id"] === accountAlice.id); */

  assert(uploadFileInfo['owner_id'] === accountAlice.id)

  // ............................................
  //
  //Bob find the file on Internet
  const accountManager: AccountManager = nuLinkHDWallet.getAccountManager()
  const accountBob: Account = await accountManager.createAccount('Bob')
  // call the createAccountIfNotExist method for add user account to the center server for decouple
  await pre.createAccountIfNotExist(accountBob)

  //Bob finds the file Alice has just uploaded
  const findFileResultList = (await pre.getOtherShareFiles(
    accountBob,
    undefined,
    false,
    undefined,
    undefined,
    undefined,
    1,
    1000
  )) as object
  /*
   {
      list: [
        {file_id, file_name:, owner, owner_id, address:,thumbnail:,create_at}
        ...
      ],
      total: 300,
    }
  */

  assert(findFileResultList && findFileResultList['total'] > 0)

  let fileIndex2 = -1
  for (let index = 0; index < findFileResultList['list'].length; index++) {
    const element = findFileResultList['list'][index]
    if (element['file_name'] === fileList[0]['name']) {
      fileIndex2 = index
      break
    }
  }
  assert(fileIndex2 >= 0)

  const findFileInfo = findFileResultList['list'][fileIndex2]
  assert(findFileInfo['owner_id'] === accountAlice.id)

  const applyFileId = findFileInfo['file_id']

  //get file details
  const fileDetails = (await pre.getFileDetails(applyFileId, accountBob.id)) as object
  /*
   {
          file_id:,file_name:,thumbnail:,file_created_at:,apply_id:,status:,apply_start_at:,apply_end_at:,apply_created_at:,
          policy_id:,hrac:,creator:,creator_id:,consumer:,consumer_id:,gas:,tx_hash:,policy_created_at:,
          file_ipfs_address:,policy_encrypted_pk:,encrypted_treasure_map_ipfs_address:,alice_verify_pk
    } 
 */
  // assert(fileDetails["creator_id"] === accountAlice.id);
  assert(fileDetails['file_id'] === applyFileId)
  assert(parseInt(fileDetails['status']) === 0) //Is not to apply for

  //Bob requests permission to use the file for 7 days
  try {
    await pre.applyForFilesUsagePermission([applyFileId], accountBob, 7)
  } catch (e) {
    console.log('bob apply file failed', e)
    assert(false)
  }

  //Alice receives Bob's file usage request
  const filesNeedToApprovedResultList = await pre.getFilesPendingApprovalAsPublisher(accountAlice, 1, 1000)
  /*return data format: {
      list: [
        { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
        ...
      ],
      total: 300,
    }
  */

  let fileIndex3 = -1
  for (let index = 0; index < filesNeedToApprovedResultList['list'].length; index++) {
    const element = filesNeedToApprovedResultList['list'][index]
    if (element['file_id'] === applyFileId) {
      fileIndex3 = index
      break
    }
  }
  assert(fileIndex3 >= 0)

  assert(filesNeedToApprovedResultList && filesNeedToApprovedResultList['total'] > 0)
  const needToApprovedFileInfo = filesNeedToApprovedResultList['list'][fileIndex3]
  assert(needToApprovedFileInfo['file_owner_id'] === accountAlice.id)

  //Alice rejected the file usage request
  await pre.refusalApplicationForUseFiles(accountAlice, needToApprovedFileInfo['apply_id'])

  //Bob apply file for usage again. The application period is three days, less than the previous seven days
  try {
    await pre.applyForFilesUsagePermission([applyFileId], accountBob, 3)
  } catch (e) {
    console.log('bob reapply file failed', e)
    assert(false)
  }

  //Alice receives Bob's file usage request again
  const filesNeedToApprovedResultList2 = await pre.getFilesPendingApprovalAsPublisher(accountAlice, 1, 1000)
  /*return data format: {
    list: [
      { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, days,  created_at }
      ...
    ],
    total: 300,
  }
  */

  assert(filesNeedToApprovedResultList2 && filesNeedToApprovedResultList2['total'] > 0)

  let fileIndex4 = -1
  for (let index = 0; index < filesNeedToApprovedResultList2['list'].length; index++) {
    const element = filesNeedToApprovedResultList2['list'][index]
    if (element['file_id'] === applyFileId) {
      fileIndex4 = index
      break
    }
  }
  assert(fileIndex4 >= 0)

  const needToApprovedFileInfo2 = filesNeedToApprovedResultList2['list'][fileIndex4]
  assert(needToApprovedFileInfo2['file_owner_id'] === accountAlice.id)

  //At this point Alice approves Bob's file usage request, Due to on-chain approval of Bob's request, we first evaluate gas and service fees

  console.log(`accountAlice address ${accountAlice.address}`)

  //1. Alice calc server fee (wei): the nulink token tnlk/nlk
  const startDate: Date = new Date()
  const startMs: number = Date.parse(startDate.toString())
  const endMs: number = startMs + (needToApprovedFileInfo2['days'] as number) * 24 * 60 * 60 * 1000
  const endDate: Date = new Date(endMs) //  start_at is seconds, but Date needs milliseconds

  const serverFeeNLKInWei: BigNumber = await pre.getPolicyTokenCost(accountAlice, startDate, endDate, 2)

  const serverValue = Web3.utils.fromWei(serverFeeNLKInWei.toString(), 'ether')
  console.log('server nlk fee  ether is:', serverValue)

  //2. Alice calc gas fee (wei): the chain of bsc test token
  const gasFeeWei = await getPolicyGasFee(
    accountBob.id,
    needToApprovedFileInfo2['apply_id'],
    2,
    1,
    startMs / 1000,
    endMs / 1000,
    BigNumber.from(serverFeeNLKInWei)
  )

  //Note: Please make sure that the account has sufficient tnlk and bsc testnet tokens before this, otherwise the approval will fail
  //Alice approves Bob's application for file usage. Whenever Alice approves a file request, an on-chain policy is created
  await pre.approvalApplicationForUseFiles(
    accountAlice,
    accountBob.id,
    needToApprovedFileInfo2['apply_id'],
    2,
    1,
    startDate,
    endDate,
    '', //remark
    '', //porterUri
    BigNumber.from(gasFeeWei)
  )

  //You need to wait for a while for the on-chain transaction to be confirmed and for the backend to listen for the "approve" event.
  await sleep(20000) //20 seconds

  //Alice, as the publisher of the file, obtains the list of files that she has successfully approved
  const aliceApprovedfilesList = await pre.getApprovedFilesAsPublisher(accountAlice, 1, 1000)
  /*return data format: {
  list: [
    { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
    ...
  ],
  total: 300,
}
*/

  assert(aliceApprovedfilesList && aliceApprovedfilesList['total'] > 0)

  let fileIndex5 = -1
  for (let index = 0; index < aliceApprovedfilesList['list'].length; index++) {
    const element = aliceApprovedfilesList['list'][index]
    if (element['file_id'] === applyFileId) {
      fileIndex5 = index
      break
    }
  }
  assert(fileIndex5 >= 0)
  const aliceApprovedFileInfo = aliceApprovedfilesList['list'][fileIndex5]
  assert(aliceApprovedFileInfo['file_owner_id'] === accountAlice.id)
  const policyId = aliceApprovedFileInfo['policy_id']
  console.log('file policy Id:', policyId)

  //Bob finds out that his application has been approved by Alice. Bob now has permission to view the contents of the file
  const bobBeApprovedfilesList = await pre.getApprovedFilesAsUser(accountBob, 1, 1000)
  /*return data format: {
  list: [
    { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
    ...
  ],
  total: 300,
}
*/

  assert(bobBeApprovedfilesList && bobBeApprovedfilesList['total'] > 0)

  let fileIndex6 = -1
  for (let index = 0; index < bobBeApprovedfilesList['list'].length; index++) {
    const element = bobBeApprovedfilesList['list'][index]
    if (element['file_id'] === applyFileId) {
      fileIndex6 = index
      break
    }
  }
  assert(fileIndex6 >= 0)

  const bobBeApprovedfilesInfo = bobBeApprovedfilesList['list'][fileIndex6]
  assert(bobBeApprovedfilesInfo['file_owner_id'] === accountAlice.id)
  const policyId2 = bobBeApprovedfilesInfo['policy_id']
  assert(policyId2 === policyId)

  //Finally, Bob gets the contents of the file
  const arrayBuffer: ArrayBuffer = await pre.getFileContentByFileIdAsUser(accountBob, bobBeApprovedfilesInfo['file_id'])
  const fileContent: string = Buffer.from(arrayBuffer).toString()
  console.log('fileContent: ', fileContent)
  console.log('plainText: ', plainText)
  assert(fileContent === plainText)

  //finish

  // Whenever Alice approves a file request, an on-chain policy is created
  // Alice can also obtain the on-chain policy information published by herself
  const dataPolicys = await pre.getPublishedPoliciesInfo(accountAlice, 1, 1000)
  /*
    return data format: {
    list: [
      {hrac, label:, policy_label_id, creator, creator_id:, consumer:, consumer_id:, status, gas, tx_hash, created_at, start_at, end_at, policy_id}
      ...
    ],
    total: 300,
  }*/
  assert(!isBlank(dataPolicys))

  //Alice also can encrypt and update a file to the ipfs network by select an existing on-chain policy
  const plainText2 = 'This is a philosophy book content'
  const historyContent2: Uint8Array = enc.encode(plainText2)

  //1.upload file
  const fileList2: FileInfo[] = [
    {
      name: `philosophy-${nanoid()}.pdf`,
      fileBinaryArrayBuffer: historyContent2.buffer
    }
  ]

  //Files uploaded by using published policies do not need approval. Bob can use the files directly, so there is no approval record
  const fileIds = await pre.uploadFilesBySelectPolicy(accountAlice, pre.FileCategory.Philosophy, fileList2, policyId)

  //Bob can directly download Alice's associated policy upload file without waiting for Alice's approval,
  //because the associated policy has already been created and does not need repeated approval. Note: This publish policy value is available for Bob
  //Bob get new upload file content
  const arrayBuffer2: ArrayBuffer = await pre.getFileContentByFileIdAsUser(accountBob, fileIds[0])
  const fileContent2: string = Buffer.from(arrayBuffer2).toString()
  console.log('fileContent2: ', fileContent2)
  console.log('plainText2: ', plainText2)
  assert(fileContent2 === plainText2)

  //you can get all status files for mine apply: The files I applied for
  //status 0: all status, include:  applying，approved, rejected
  const data = (await pre.getFilesByStatus(undefined, accountBob.id, undefined, undefined, 0, 1, 1000)) as object
  /*
    return data format: {
      list: [
        { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, days, created_at, status }
        ...
      ],
      total: 300,
    }
  */

  assert(data && !isBlank(data) && data['total'] > 0)

  //

  // we also can restore wallet by mnemonic

  //get mnemonic from current wallet
  const mnemonic: string = (await getMnemonic(password)) as string

  //You can also use the mnemonic word exported by metamask to restore the nulink wallet account
  const newpassword = '111'
  // restore an wallet to Browser localstorage/indexdb  by mnemonic, and we can set an new password when we restore an wallet
  const nuLinkHDWalletRestore: NuLinkHDWallet = await restoreWalletDataByMnemonic(newpassword, mnemonic)
  assert(nuLinkHDWallet != nuLinkHDWalletRestore)

  //You can also export the private key of the nulink wallet account through the user password to import it into the metamask wallet
  let privatekeyString = await getDefaultAccountPrivateKey(newpassword)
  assert(privatekeyString != null)
  privatekeyString = privatekeyString as string

  //When you are done using it, you can clear the browser's wallet cache data, and use the mnemonic to re-import it the next time you use it
  await logoutWallet()
}
