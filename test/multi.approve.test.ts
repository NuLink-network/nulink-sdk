// First define a concept:
//  Alice: as the publisher of the data/file (data/file uploader).
//  Bob: as the user of the data/file (data/file requester)
import { NuLinkHDWallet, Account, Strategy, AccountManager, GasInfo } from '../src'

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
} from '../src/api/wallet'

import { BigNumber, ethers } from 'ethers'
import {
  isBlank,
  StorageManager,
  DataCallback,
  setIPFSData,
  getIPFSData,
  setBEData,
  getBEData
} from '../src/core/utils'
import { nanoid } from 'nanoid'
import Web3 from 'web3'
import { type DataInfo } from '../src'
import { restoreWalletDataByMnemonic, getPolicysGasFee } from '../src'
import * as pre from '../src/core/pre'
import sleep from 'await-sleep'

export const run = async () => {

  const dataCallback: DataCallback = { setData: setIPFSData, getData: getIPFSData }
  //Set the external storage used by the Pre process to IPFS (for example, encrypted data/files uploaded by users will be stored in this storage, and users can customize the storage).
  StorageManager.setDataCallback(dataCallback)
  // // eslint-disable-next-line no-debugger
  // debugger
  // const dataCallback2: DataCallback = { setData: setBEData, getData: getBEData }
  // //Set the external storage used by the Pre process to IPFS (for example, encrypted data/files uploaded by users will be stored in this storage, and users can customize the storage).
  // StorageManager.setDataCallback(dataCallback2)

  // eslint-disable-next-line no-debugger
  debugger

  // Declaring and intializing the mnemonic and password variables.
  const password: string = '1'

  let nuLinkHDWallet: any = null
  try {
    // after we created the wallet, we can loadWallet by password
    nuLinkHDWallet /* : NuLinkHDWallet | null */ = await loadWallet(password)
  } catch (error) {
    //first We create Alice wallet and account by password
    nuLinkHDWallet /* : NuLinkHDWallet */ = await createWallet(password)
    // assert(nuLinkHDWallet1)
  }

  assert(nuLinkHDWallet)
  nuLinkHDWallet = nuLinkHDWallet as NuLinkHDWallet

  // assert(nuLinkHDWallet1 === nuLinkHDWallet)

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

  //Now we can encrypt and upload a data/file for others to apply for download

  //1. read a data/file
  const plainText =
    '# encoding=utf-8\n\nimport requests\nimport json\nfrom config.web3_provider import W3\n\n\'\'\'\n    Aaveçå¬åçº¦ååºçäºä»¶å¹¶æ¥æ¾å¯æ¸ ç®è´¦æ·\n\'\'\'\n\n\nclass ListenEvent:\n    def __init__(self, chain_type, scan_address):\n        self.web3 = W3(chain_type=chain_type, num=3)\n        self.chain_type = chain_type\n        self.scan_address = scan_address\n        self.event_topic = "0xc6a898309e823ee50bac64e45ca8adba6690e99e7841c45d754e2a38e9019d9b"\n        self.api = "https://api.aurorascan.dev/api"\n        self.pool_contract = self.web3.load_contract("AAVEPool", self.scan_address)\n        self.variable_debt_token_list = [\n            ["variable-debt-usdc", "0x8b225BF698eFd7fA4A9E3FB10424711739304ACa"],\n            ["variable-debt-usdt", "0xc0D1Be1C87B56b72Db03800726AAB7e61AE9AaC7"],\n            ["variable-debt-wnear", "0xaa0E01C05a6361fe8aD037A4b142f633e418B251"],\n            ["variable-debt-weth", "0x541996252ECcF5047671302CaaFf25b4312d482e"],\n            ["variable-debt-dai", "0x1c2E8486e2aF6B168a7985Dcec3309780bEb5F25"],\n            ["variable-debt-wbtc", "0x90eCe2301214b2B86cB77326232e2b6D4b373d7B"]\n        ]\n        self.collateral_token_list = [\n            ["aUsdc", "0x0a88079323d2cCf5f83014a5351058553439499C"],\n            ["aUsdt", "0xD55f46Df9C67297619CD6b254167F5Ed1F34998e"],\n            ["aWnear", "0x6f610C3Ff9e64625ae29C2DA7663Ec100A9433bE"],\n            ["aWeth", "0x935ef78719d55b3a8a53d0ac9494a94658843953"],\n            ["aDai", "0xf4d853d5b100A739B03584b0C2840D136b16DDB8"],\n            ["aWbtc", "0x8047CC5397Fdc885ab2EE1DaEE277237ceB4AE50"]\n        ]\n        self.LIQUIDATION_CLOSE_FACTOR_PERCENT = 5000\n\n    def listen_event(self, from_block, to_block):\n        print("from_block %s, to_block %s" % (from_block, to_block))\n        params = {\n            "module": "logs",\n            "action": "getLogs",\n            "fromBlock": from_block,\n            "toBlock": to_block,\n            "address": self.scan_address,\n            "topic0": self.event_topic\n        }\n        res = requests.get(url=self.api, params=params)\n        if res.status_code == 200:\n            content = json.loads(res.content)\n            if content["status"] == "1":\n                log_info_list = content["result"]\n                for log in log_info_list:\n                    topics = log["topics"]\n                    tx_hash = log["transactionHash"]\n                    log_data = log["data"]\n                    reserve = "0x" + topics[1][26:]\n                    user = "0x" + self.web3.get_data_params(log_data, 0)[24:]\n                    user_data = self.pool_contract.functions.getUserAccountData(\n                        self.web3.w3.toChecksumAddress(user)).call()\n                    health = int(user_data[-1]) / (10 ** 18)\n                    need_liquidation = True if health < 1 else False\n                    amount = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 1))\n                    borrow_rate_mode = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 2))\n                    borrow_rate = self.web3.w3.toInt(hexstr=self.web3.get_data_params(log_data, 3))\n                    on_behalf_of = "0x" + topics[2][26:]\n                    print("-> tx_hash", tx_hash)\n                    print("     -> reserve", reserve)\n                    print("     -> user", user)\n                    print("     -> onBehalfOf", on_behalf_of)\n                    print("     -> amount", amount)\n                    print("     -> borrowRateMode", borrow_rate_mode)\n                    print("     -> borrowRate", borrow_rate)\n                    print("     -> borrowRate", borrow_rate)\n                    print("     -> health", health)\n                    print("     -> needLiquidation", need_liquidation)\n\n    def get_user_liquidation_info(self, user):\n        print("***** user debt info *****")\n        for debt_token_info in self.variable_debt_token_list:\n            debt_token_name, debt_token = debt_token_info\n            debt_token_contract = self.web3.get_erc20_contract(self.web3.w3.toChecksumAddress(debt_token))\n            token_amount = debt_token_contract.functions.balanceOf(\n                self.web3.w3.toChecksumAddress(user)\n            ).call()\n            max_liquidatable_debt = (token_amount * self.LIQUIDATION_CLOSE_FACTOR_PERCENT + 1e4/2) / 1e4 if token_amount > 0 else 0\n            print(debt_token_name, token_amount, max_liquidatable_debt)\n        print("***** user collateral info *****")\n        for collateral_token_info in self.collateral_token_list:\n            collateral_token_name, collateral_token = collateral_token_info\n            collateral_token_contract = self.web3.get_erc20_contract(self.web3.w3.toChecksumAddress(collateral_token))\n            token_amount = collateral_token_contract.functions.balanceOf(\n                self.web3.w3.toChecksumAddress(user)\n            ).call()\n            print(collateral_token_name, token_amount)\n\n\n\nif __name__ == "__main__":\n    listen_event = ListenEvent("AURORA", "0xa0bC830Ad82D2EAe0bCFd1D6987664A3D9264aFA")\n    # to_block = listen_event.web3.get_latest_block_num()\n    # listen_event.listen_event("62001019", to_block)\n    listen_event.get_user_liquidation_info("0xee0eb9eff81e70b06e8fe181b4a0db924816bc54")\n\n'
  const enc = new TextEncoder() // always utf-8
  const historyContent: Uint8Array = enc.encode(plainText)

  //1.Alice upload data/file
  const dataList: DataInfo[] = [
    {
      label: `history-${nanoid()}.pdf`,
      dataArrayBuffer: historyContent.buffer
    },
    {
      label: `history-${nanoid()}.pdf`,
      dataArrayBuffer: historyContent.buffer
    },
    {
      label: `history-${nanoid()}.pdf`,
      dataArrayBuffer: historyContent.buffer
    },
    {
      label: `history-${nanoid()}.pdf`,
      dataArrayBuffer: historyContent.buffer
    },
    {
      label: `history-${nanoid()}.pdf`,
      dataArrayBuffer: historyContent.buffer
    }
  ]

  // eslint-disable-next-line no-debugger
  debugger

  //2. Alice encrypt and update a data/file to the ipfs network
  await pre.uploadDataByCreatePolicy(accountAlice, pre.DataCategory.History, dataList)

  //3. We can get the data/file just uploaded
  const resultList = (await pre.getUploadedData(accountAlice, undefined, 1, 1000)) as object

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

  let dataIndex = -1
  for (let index = 0; index < resultList['list'].length; index++) {
    const element = resultList['list'][index]
    if (element['file_name'] === dataList[0]['label']) {
      dataIndex = index
      break
    }
  }
  assert(dataIndex >= 0)
  const uploadDataInfo = resultList['list'][dataIndex]

  /*   console.log('uploadDataInfo["file_name"] ', uploadDataInfo["file_name"]);
  console.log('fileList[0]["name"] ', fileList[0]["name"]);
  console.log('equal1: ', uploadDataInfo["file_name"] === fileList[0]["name"]);
  console.log('uploadDataInfo["owner_id"] ', uploadDataInfo["owner_id"] );
  console.log('accountAlice.id ', accountAlice.id);
  console.log('equal2: ', uploadDataInfo["owner_id"] === accountAlice.id); */

  assert(uploadDataInfo['owner_id'] === accountAlice.id)

  const numReqData = 10
  // ............................................
  //
  //Bob find the data/file on Internet
  const bobAccountId2AccountMap = {}
  const accountBobs: Account[] = []
  const accountManager: AccountManager = nuLinkHDWallet.getAccountManager()
  for (let index = 0; index < numReqData; index++) {
    const accountBob: Account = await accountManager.createAccount(`Bob_${index}`)
    // call the createAccountIfNotExist method for add user account to the center server for decouple
    await pre.createAccountIfNotExist(accountBob)
    accountBobs.push(accountBob)
    bobAccountId2AccountMap[accountBob.id] = accountBob
  }

  let applyDataId: string = ''
  for (let index = 0; index < accountBobs.length; index++) {
    const accountBob = accountBobs[index]

    //Bob finds the data/file Alice has just uploaded
    const findDataResultList = (await pre.getOtherShareData(
      accountBob,
      undefined,
      false,
      undefined,
      undefined,
      undefined,
      1,
      100
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

    assert(findDataResultList && findDataResultList['total'] > 0)

    let dataIndex2 = -1
    for (let index = 0; index < findDataResultList['list'].length; index++) {
      const element = findDataResultList['list'][index]
      if (element['file_name'] === dataList[0]['label']) {
        dataIndex2 = index
        break
      }
    }
    assert(dataIndex2 >= 0)

    const findDataInfo = findDataResultList['list'][dataIndex2]
    assert(findDataInfo['owner_id'] === accountAlice.id)

    applyDataId = findDataInfo['file_id']

    //get data/file details
    const dataDetails = (await pre.getDataDetails(applyDataId, accountBob.id)) as object
    /*
    {
            file_id:,file_name:,thumbnail:,file_created_at:,apply_id:,status:,apply_start_at:,apply_end_at:,apply_created_at:,
            policy_id:,hrac:,creator:,creator_id:,consumer:,consumer_id:,gas:,tx_hash:,policy_created_at:,
            file_ipfs_address:,policy_encrypted_pk:,encrypted_treasure_map_ipfs_address:,alice_verify_pk
      } 
  */
    // assert(dataDetails["creator_id"] === accountAlice.id);
    assert(dataDetails['file_id'] === applyDataId)
    assert(parseInt(dataDetails['status']) === 0) //Is not to apply for

    //Bob requests permission to use the data/file for 7 days
    try {
      await pre.applyForDataUsagePermission(applyDataId, accountBob, 7)
    } catch (e) {
      console.log(`bob_${index} apply data/file failed`, e)
      assert(false)
    }
  }

  //Alice receives Bob's data/file usage request
  const dataNeedToApprovedResultList2 = await pre.getDataPendingApprovalAsPublisher(accountAlice, 1, 1000)
  /*return data format: {
    list: [
      { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, days,  created_at }
      ...
    ],
    total: 300,
  }
  */

  assert(dataNeedToApprovedResultList2 && dataNeedToApprovedResultList2['total'] > 0)

  const dataIndexs: number[] = [] //Array(numReqData).fill(-1);
  for (let index = 0; index < dataNeedToApprovedResultList2['list'].length; index++) {
    const element = dataNeedToApprovedResultList2['list'][index]
    if (element['file_id'] === applyDataId) {
      dataIndexs.push(index)
      assert(element['file_owner_id'] === accountAlice.id)
    }
  }
  assert(dataIndexs.length >= 0 && dataIndexs.length == numReqData)

  //At this point Alice approves Bob's data/file usage request, Due to on-chain approval of Bob's request, we first evaluate gas and service fees
  const startDates: Date[] = []
  const endDates: Date[] = []
  const startMss: number[] = []
  const endMss: number[] = []
  const ursulaShares: number[] = []
  const ursulaThresholds: number[] = []
  const accountBobIds: string[] = []
  const applyIds: string[] = []
  for (let index = 0; index < dataIndexs.length; index++) {
    const dataIndex = dataIndexs[index]
    const needToApprovedDataInfo = dataNeedToApprovedResultList2['list'][dataIndex]
    //1. Alice calc server fee (wei): 
    //    For the main chain TBSC/BSC, the token is TNLK/NLK. 
    //    For the side chains, they use the native currency of the respective chain (e.g., Mumbai uses TMATIC/MATIC, OKX X1 Chain uses TOKB/OKB).

    const startMs: number = (Math.floor(new Date().getTime() / 1000) - new Date().getTimezoneOffset() * 60) * 1000
    const startDate: Date = new Date(startMs) //  start_at is seconds, but Date needs milliseconds

    const endMs: number = startMs + (needToApprovedDataInfo['days'] as number) * 24 * 60 * 60 * 1000
    const endDate: Date = new Date(endMs) //  start_at is seconds, but Date needs milliseconds
    const bobAccountId = needToApprovedDataInfo['proposer_id']
    accountBobIds.push(bobAccountId)
    startDates.push(startDate)
    endDates.push(endDate)
    startMss.push(startMs)
    endMss.push(endMs)
    ursulaShares.push(2)
    ursulaThresholds.push(1)
    applyIds.push(needToApprovedDataInfo['apply_id'])
  }

  const serverFeeNLKInWei: BigNumber = await pre.getPolicysTokenCost(accountAlice, startDates, endDates, ursulaShares)

  const serverValue = Web3.utils.fromWei(serverFeeNLKInWei.toString(), 'ether')
  console.log('server nlk fee  ether is:', serverValue)

  //2. Alice calc gas fee (wei): the chain of bsc test token
  const gasInfo: GasInfo = await getPolicysGasFee(
    accountBobIds,
    applyIds,
    ursulaShares,
    ursulaThresholds,
    startMss.map((startMs) => startMs / 1000),
    endMss.map((endMs) => endMs / 1000),
    BigNumber.from(serverFeeNLKInWei)
  )

  const aliceApprovedDataListLast = await pre.getApprovedDataAsPublisher(accountAlice, 1, 1000)

  //Note: Please make sure that the account has sufficient tnlk and bsc testnet tokens before this, otherwise the approval will fail
  //Alice approves Bob's application for data/file usage. Whenever Alice approves a data/file request, an on-chain policy is created
  await pre.approvalApplicationsForUseData(
    accountAlice,
    accountBobIds,
    applyIds,
    ursulaShares,
    ursulaThresholds,
    startDates,
    endDates,
    '', //remark
    '', //porterUri
    gasInfo.gasFee
  )

  // eslint-disable-next-line no-debugger
  debugger

  //You need to wait for a while for the on-chain transaction to be confirmed and for the backend to listen for the "approve" event.
  await sleep(20000) //20 seconds

  let aliceApprovedDataList: any = null
  do {
    await sleep(10000) //10 seconds
    //Alice, as the publisher of the data/file, obtains the list of data/files that she has successfully approved
    aliceApprovedDataList = await pre.getApprovedDataAsPublisher(accountAlice, 1, 1000)
    /*return data format: {
      list: [
        { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
        ...
      ],
      total: 300,
    }
  */
  } while (!aliceApprovedDataList || aliceApprovedDataList['total'] <= aliceApprovedDataListLast['total'])

  // eslint-disable-next-line no-debugger
  debugger

  assert(aliceApprovedDataList && aliceApprovedDataList['total'] > 0)

  const dataIndex2s: number[] = [] //Array(numReqData).fill(-1);
  for (let index = 0; index < aliceApprovedDataList['list'].length; index++) {
    const element = aliceApprovedDataList['list'][index]
    if (element['file_id'] === applyDataId) {
      dataIndex2s.push(index)
      assert(element['file_owner_id'] === accountAlice.id)
      const policyId = element['policy_id']
      //console.log(`index_${index} data/file policy Id: ${policyId}`)
      const accountBobId = element['proposer_id']
      const accountBob = bobAccountId2AccountMap[accountBobId]
      //Bob finds out that his application has been approved by Alice. Bob now has permission to view the contents of the file
      const bobBeApprovedDataList = await pre.getApprovedDataAsUser(accountBob, 1, 1000)
      /*return data format: {
                              list: [
                                { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, created_at }
                                ...
                              ],
                              total: 300,
                            }
      */

      assert(bobBeApprovedDataList && bobBeApprovedDataList['total'] > 0)

      let dataIndex6 = -1
      for (let index = 0; index < bobBeApprovedDataList['list'].length; index++) {
        const element = bobBeApprovedDataList['list'][index]
        if (element['file_id'] === applyDataId) {
          dataIndex6 = index
          break
        }
      }
      assert(dataIndex6 >= 0)

      const bobBeApprovedDataInfo = bobBeApprovedDataList['list'][dataIndex6]
      assert(bobBeApprovedDataInfo['file_owner_id'] === accountAlice.id)
      const policyId2 = bobBeApprovedDataInfo['policy_id']
      assert(policyId2 === policyId)

      //Finally, Bob gets the contents of the data/file
      const arrayBuffer: ArrayBuffer = await pre.getDataContentByDataIdAsUser(
        accountBob,
        bobBeApprovedDataInfo['file_id']
      )
      const dataContent: string = Buffer.from(arrayBuffer).toString()
      console.log('dataContent: ', dataContent)
      console.log('plainText: ', plainText)
      assert(dataContent === plainText)

      //finish
    }
  }

  assert(dataIndex2s.length >= 0 && dataIndex2s.length > 0)

  //  //Alice upload data/file to exist policy

  // const plainText2 = "This is a philosophy book content";
  // const historyContent2: Uint8Array = enc.encode(plainText2);

  // //1.upload data/file by create policy
  // const dataList2: DataInfo[] = [
  //   {
  //     label: `philosophy-${nanoid()}.pdf`,
  //     dataArrayBuffer: historyContent2.buffer,
  //   },
  // ];

  // const dataIds = await pre.uploadDataBySelectPolicy(
  //   accountAlice,
  //   pre.DataCategory.Philosophy,
  //   dataList2,
  //   policyId
  // );

  // //Bob get new upload data/file content
  // const arrayBuffer2: ArrayBuffer = await pre.getDataContentByDataIdAsUser(
  //   accountBob,
  //   dataIds[0]
  // );
  // const dataContent2: string = Buffer.from(arrayBuffer2).toString();
  // console.log("dataContent2: ", dataContent2);
  // console.log("plainText2: ", plainText2);
  // assert(dataContent2 === plainText2);

  // //you can get all status data/files for mine apply: The data/files I applied for
  // //status 0: all status, include:  applying，approved, rejected
  // const data = (await pre.getDataByStatus(
  //   undefined,
  //   accountBob.id,
  //   undefined,
  //   undefined,
  //   0,
  //   1,
  //   1000
  // )) as object;
  // /*
  //   return data format: {
  //     list: [
  //       { apply_id, file_id:, proposer, proposer_id, file_owner:, file_owner_id:, policy_id, hrac, start_at:, end_at, days, created_at, status }
  //       ...
  //     ],
  //     total: 300,
  //   }
  // */

  // assert(data && !isBlank(data) && data["total"] > 0);
}
