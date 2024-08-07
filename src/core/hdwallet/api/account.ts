/**
 * message distribution
 * This comment will be used as the summary for the "nulinkWallet" module
 * @packageDocumentation
 * @module nulinkWallet
 * @preferred
 */
// Importing the Required pakages from various sources
import { Buffer } from 'buffer'
import {
  IJson,
  KeyPair,
  getEthereumEncryptAccount,
  getEthereumVerifyAccount,
  generateMnemonic as commonGenerateMnemonic,
  getHDWallet as commonGetHDWallet,
  getHDWalletByRootExtendedPrivateKey as commonGetHDWalletByRootExtendedPrivateKey,
  getRootExtendedPrivateKey as commonGetRootExtendedPrivateKey,
  EthWallet,
  getEthereumStrategyKeyPair as commonGetEthereumStrategyKeyPair
} from './common'
import { nanoid } from 'nanoid' //https://cloud.tencent.com/developer/article/1743958
import AwaitLock from 'await-lock'
import { Keccak } from 'sha3'
import assert from 'assert-ts'
import { hdkey } from 'ethereumjs-wallet'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sign, check } from 'sign'
import * as macro from '../types'
import * as util from '../../utils/null'
import { CryptoBroker } from './cryptography'
import * as exception from '../../utils/exception'
import { getWeb3 } from './web3'
import Web3 from 'web3'
import keccak256 from 'keccak256'
// import encryptpwd from 'encrypt-with-password'
// import { generateRandomString } from 'ts-randomstring/lib'
// import { errors } from 'web3-core-helpers'

import md5 from 'md5'
import { encrypt as pwdEncrypt, decrypt as pwdDecrypt } from '../../utils/password.encryption'
import { getContractInst } from '../../sol/contract'
import { CONTRACT_NAME } from '../../sol'
import { Contract, ContractOptions } from 'web3-eth-contract'
import SingletonService from 'singleton-service'
import { isBlank, store } from '../../utils'
import sleep from 'await-sleep'
import { serverPost } from '../../servernet'

// import toBuffer from "typedarray-to-buffer";

// import { numberToArray} from "eccrypto-js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars

//https://github.com/ChainSafe/web3.js
/**
 * @internal
 */
export let web3: Web3 // eslint-disable-line

// const HDWALLET_ENCRYPT_STR = 'wallet.enc'
const HDWALLET_INSTANCE_NAME = 'hdwallet'
const RESTORE_WALLET_TAG = 'tag_restore_wallet_backend_db'

/**
 * @internal
 */
export const getHDWalletInstance = (): any => {
  // attention please -> Here take the data from memory, don't call loadHDWalletFromPersistence method
  return SingletonService.get<NuLinkHDWallet>(HDWALLET_INSTANCE_NAME)
}

/**
 * @internal
 */
const setHDWalletInstance = async (hdWallet: NuLinkHDWallet | null, persist = true) => {
  if (!hdWallet) {
    console.log('setHDWallet failed cause by the NuLinkHDWallet is null')
    return
  }
  assert(hdWallet != null)

  SingletonService.set<NuLinkHDWallet>(HDWALLET_INSTANCE_NAME, hdWallet, true)
  // if (persist) {
  //   await persistHDWallet(hdWallet)
  // }
}

// Unsafe, abandoned
// export const existHDWalletPersistData = async (): Promise<boolean> => {
//   const data = await store.getItem(HDWALLET_ENCRYPT_STR)

//   return !!data
// }

// export const persistHDWallet = async (hdWallet: NuLinkHDWallet) => {
//   console.log(`persist hdWallet data ...`)
//   const walletData = await hdWallet.dump()
//   // console.log("persistHDWallet walletData", walletData);
//   // console.log("persistHDWallet password", password);
//   const data = pwdEncrypt(walletData, null, false)

//   await store.setItem(HDWALLET_ENCRYPT_STR, data)
// }

// export const loadHDWalletFromPersistence = async (): Promise<NuLinkHDWallet | null> => {
//   console.log(`loadHDWalletFromPersistence dump string start`)

//   const data: string = (await store.getItem(HDWALLET_ENCRYPT_STR)) as string

//   let nuLinkHDWallet: NuLinkHDWallet | null = null
//   if (data) {
//     //console.log("loadHDWalletFromPersistence decrypt before HDWALLET_ENCRYPT_STR data: ", data);

//     const srcData = pwdDecrypt(data, true)
//     // console.log("loadHDWalletFromPersistence after encryptpwd.decrypt srcData: ", srcData);
//     nuLinkHDWallet = await NuLinkHDWallet.load(srcData, true, true)
//   }

//   // console.log(`loadHDWalletFromPersistence dump string end`, nuLinkHDWallet);

//   return nuLinkHDWallet
// }

//Restore verify keyPair and policy data
//Only restore accounts exist, there is no final output
//If there are currently only 3 strategies (1, 2, 3) under the same account, but there are 5 policy IDs (3, 4, 5, 6, 7) in the recovered data, the following situations exist
//Union merge result is (1,2,3,4,5,6,7)
//Cover coverage result is (3,4,5,6,7)
/**
 * @internal
 */
export enum DataStrategyRecoveryMode {
  Union,
  Cover
}

/**
 *  Account class manages policies information, adds policies, deletes policies, and serializes
 * @class Strategy
 * @extends {IJson}
 */
export class Strategy extends IJson {
  accountAddressIndex: number
  addressIndex: number //policy address index
  id: string //Mainly to correspond to the background, globally unique
  label: string
  strategyKeyPair: KeyPair

  /**
   * Creates a new policy object with the specified account and policy address indices, label, and ID.
   * @param {number} accountAddressIndex - The index of the Ethereum account address.
   * @param {number} strategyAddressIndex - The index of the Ethereum policy address.
   * @param {string} label - Generate a label name for a local policy.
   * @param {string} [id=''] - policy id or generate a policy id if the parameter is not passed.
   */
  constructor(accountAddressIndex: number, strategyAddressIndex: number, label: string, id = '') {
    //label's type and Id

    super()
    const keyPairDict: any = commonGetEthereumStrategyKeyPair(
      getHDWalletInstance().hdWallet,
      accountAddressIndex,
      strategyAddressIndex
    )

    this.accountAddressIndex = accountAddressIndex
    this.addressIndex = strategyAddressIndex

    if (!util.isBlank(id)) {
      this.id = id
    } else {
      //this.id = nanoid()
      /** 
       * When multiple browser tabs are opened simultaneously, the frontend is unable to lock them, 
       * resulting in overlapping indexes during generation. 
       * As a result, when two files are approved separately, one might not find the corresponding strategy. 
       * To address this situation, we ensure that the policy IDs for strategies generated in simultaneously opened tabs are the same. 
       * This, combined with backend restrictions on the same HRAC application, can resolve the problem.
       */
      //this.id = md5(`${accountAddressIndex}_${strategyAddressIndex}_${label}`, { encoding: 'string' });
      this.id = keccak256(keyPairDict.pk).toString('hex');//Same as the Account
    }

    this.label = label
    this.strategyKeyPair = new KeyPair(keyPairDict.pk, keyPairDict.sk)
    //this.serialize(this.getSaveKey());
    // Can't do it in the constructor (async), do it when the upper level is called
  }

  /**
   * @internal
   */
  public getSaveKey(): string {
    return macro.strategyKey(this.accountAddressIndex, this.addressIndex)
  }

  /**
   * Returns a JSON string representation of the account local policy object for encrypted upload data/files.
   * @returns {string} - Returns a JSON string representation of the account local policy object for encrypted upload data/files.
   * @memberof Strategy
   */
  public dump(): string {
    return JSON.stringify({
      acntAdrIndex: this.accountAddressIndex,
      sAdrIndex: this.addressIndex,
      id: this.id,
      label: this.label
      //'strategyKeyPair': this.strategyKeyPair.dump()
      /*There is no need to dump this item, and it can be recovered through the account,
       because the mnemonic (or root extension private key), 
       account index and strategy index are determined, and the generated pk and sk must be*/
    })
  }

  /**
   * Loads a policy object from a JSON string.
   * @param {string} jsonString - The JSON string to parse and load.
   * @param {boolean} [_save=false] - This parameter is deprecated. Whether to save the loaded object to local storage.
   * @returns {Promise<Strategy|null>} - Returns a Promise that resolves with the loaded policy object or null if there was an error.
   * @static
   * @memberof Strategy
   */
  public static async load(jsonString: string, _save = false): Promise<Strategy | null> {
    try {
      const jsonObj = JSON.parse(jsonString)

      return new Strategy(jsonObj.acntAdrIndex, jsonObj.sAdrIndex, jsonObj.label, jsonObj.id)
    } catch (error) {
      console.log(`strategy load ${error}`)
      return null
    }
  }

  /**
   * Serializes the policy object and encrypts it to 'Browser-local storage'.
   * @returns {Promise<void>}
   * @memberof Strategy
   */
  public async serialize(): Promise<void> {
    const strategyString: string = this.dump()
    return await getHDWalletInstance().encryptSaveData(this.getSaveKey(), strategyString)
  }

  /**
   * Deserializes a policy object from 'Browser-local storage' by decrypting it and creating a policy object in memory.
   * @returns {Promise<Strategy|null>} - Returns a Promise that resolves with the deserialized policy object or null if there was an error.
   * @memberof Strategy
   */
  public async deserialize(): Promise<Strategy | null> {
    const strategyString = await getHDWalletInstance().decryptSavedData(this.getSaveKey())
    return await Strategy.load(strategyString)
  }

  /**
   * @internal
   * Serializes the policy object and encrypts it to 'Browser-local storage' by individual policy information.
   * @returns {Promise<void>}
   * @memberof Strategy
   */
  public async save() {
    //Store account individual policy information

    const nuLinkHDWallet = getHDWalletInstance()
    const accountDump = this.dump()
    await nuLinkHDWallet.encryptSaveData(
      macro.accountStrategyInfo(this.accountAddressIndex, this.addressIndex),
      accountDump
    )
  }

  /**
   * Deserializes a policy object from 'Browser-local storage' by decrypting it and creating a policy object in memory.
   * @returns {Promise<Strategy|null>} - Returns a Promise that resolves with the deserialized policy object or null if there was an error.
   * @memberof Strategy
   * @static
   */
  public static async loadSaved(accountAddressIndex: number, addressIndex: number) {
    //Get the storage of account individual policy information

    const strategyString = await getHDWalletInstance().decryptSavedData(
      macro.accountStrategyInfo(accountAddressIndex, addressIndex)
    )
    return await Strategy.load(strategyString)
  }

  /**
   * clear a policy object from 'Browser-local storage'
   * @returns {Promise<void>}
   * @memberof Strategy
   * @static
   */
  public async erase() {
    const nuLinkHDWallet = getHDWalletInstance()
    //Remove account single policy storage information
    await nuLinkHDWallet.removeSavedData(macro.accountStrategyInfo(this.accountAddressIndex, this.addressIndex))
  }
}

/**
 *
 * Account class manages account information, include pk/sk key pair info, policy info and so on
 * @class Account
 * @extends {IJson}
 */
export class Account extends IJson {
  name = ''
  address = ''
  addressIndex = -1
  id = '' //Mainly to correspond to the background, globally unique
  public encryptedKeyPair: KeyPair
  public verifyKeyPair: KeyPair
  private generateStrateAddressIndexLock = new AwaitLock() //Generation strategy (key spanning tree path) index
  private strategyMapping = new Map<number, Strategy>() //Strategy related information address_index: Strategy

  /**
   * Constructs a new policy object with the specified name, address index, and optional ID.
   * @param {string} name - The name of the account.
   * @param {number} addressIndex - The index of the Ethereum address associated with the account. Generate by generateAddressIndex() function
   * @param {string} [id=''] - The optional ID of the account.  Generate a account id if the parameter is not passed.
   */
  constructor(name: string, addressIndex: number, id = '') {
    super()
    this.name = name
    this.addressIndex = addressIndex

    let keyPairDict = getEthereumEncryptAccount(getHDWalletInstance().hdWallet, addressIndex)
    if (!util.isBlank(id)) {
      this.id = id
    } else {
      //this.id = nanoid(); //we use the privatekey or mnemonic restore the account, the account id will lose, so the account id use the public key hash instead of nanoid()
      this.id = keccak256(keyPairDict.pk).toString('hex')
    }

    this.encryptedKeyPair = new KeyPair(keyPairDict.pk, keyPairDict.sk)
    this.address = keyPairDict.addr
    keyPairDict = getEthereumVerifyAccount(getHDWalletInstance().hdWallet, addressIndex)
    this.verifyKeyPair = new KeyPair(keyPairDict.pk, keyPairDict.sk)
    //this.serialize(this.getSaveKey());
    //Can't do it in the constructor (async), do it when the upper level is called
  }

  /**
   * @internal
   */
  public getSaveKey(): string {
    return macro.accountKey(this.addressIndex)
  }

  /**
   * Sets the policy mapping for this object for save the policy info to this account
   * @param {Map<number, Strategy>} _strategyMapping - The new policy mapping. key: policy index, value: Policy object
   * @memberof Account
   */
  public setStrategyMapping(_strategyMapping: Map<number, Strategy>) {
    this.strategyMapping = _strategyMapping
  }
  /**
   * @internal
   */
  public async updateHDWalletAccountStrategys() {
    const nuLinkHDWallet = getHDWalletInstance()
    if (util.isBlank(nuLinkHDWallet)) {
      return false
    }
    const accountManager = nuLinkHDWallet.getAccountManager()

    const accountMapping: Map<number, Account> = accountManager.accountMapping

    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    const account: Account = accountMapping.get(this.addressIndex) as Account
    account.setStrategyMapping(this.strategyMapping)

    await setHDWalletInstance(nuLinkHDWallet, true)
  }

  /**
   * @internal
   * Generates a new address index for a policy object to add it to the policy map. The index is the maximum value of the address indices in the current policy mapping + 1.
   * @returns {Promise<number>} - Returns a Promise that resolves with the new address index.
   * @memberof Account
   */
  private async generateStrategyAddressIndex(): Promise<number> {
    //Get the policy index (maximum value) + 1 under the key spanning tree path (seventh level) of the current last policy, that is, the address_index required when creating the policy

    await this.generateStrateAddressIndexLock.acquireAsync()

    let max = -1
    try {
      const keys = this.strategyMapping.keys()
      for (const addressIndex of Array.from(keys)) {
        // es6 no need use Array.from()
        if (addressIndex > max) {
          max = addressIndex
        }
      }
      // IMPORTANT: Do not return a promise from here because the finally clause
      // may run before the promise settles, and the catch clause will not run if
      // the promise is rejected
      //return max + 1
    } finally {
      this.generateStrateAddressIndexLock.release()
    }

    return max + 1
  }
  /**
   * Gets the policy object associated with the specified ID from the policy mapping.
   * @param {string} strategyId - The ID of the policy object to retrieve.
   * @returns {Strategy|null} - Returns the policy object associated with the specified ID, or null if the ID is not found in the policy mapping.
   * @memberof Account
   */
  public getStrategyInfo(strategyId: string): Strategy | null {
    //Get the policy PK and SK by Strategy Id

    const values = this.strategyMapping.values()
    for (const strategyInfo of Array.from(values)) {
      // es6 no need use Array.from()
      if (strategyInfo.id === strategyId) {
        return strategyInfo
      }
    }

    return null
  }
  /**
   * Creates a new policy object with the specified label and a generated ID. The policy object is used to encrypt data/files uploaded by the user.
   * @param {string} label - The label to use for the new policy.
   * @returns {Promise<Strategy>} - Returns a Promise that resolves with the new policy object.
   * @memberof Account
   */
  public async createStrategyByLabel(label: string): Promise<Strategy> {
    //label is composed of ID and incoming label common (in order to make label unique)
    //const id: string = nanoid()
    
    /** 
     * When multiple browser tabs are opened simultaneously, the frontend is unable to lock them, 
     * resulting in overlapping indexes during generation. 
     * As a result, when two files are approved separately, one might not find the corresponding strategy. 
     * To address this situation, we ensure that the policy IDs for strategies generated in simultaneously opened tabs are the same. 
     * This, combined with backend restrictions on the same HRAC application, can resolve the problem.
    */
    return await this.createStrategy(`${label}`, '')
    //return await this.createStrategy(`${label}_${id}`, id)
  }

  /**
   * Creates a new policy object with the specified label and ID, and adds it to the policy mapping. The policy object is used to encrypt data/files uploaded by the user.
   * @param {string} label - The label to use for the new policy.
   * @param {string} [id=''] - The optional ID to use for the new policy, If the ID parameter is not passed,
   *                          it will automatically call the generateStrategyAddressIndex function to generate a new address index for the policy object.
   * @returns {Promise<Strategy>} - Returns a Promise that resolves with the new policy object.
   * @memberof Account
   */
  public async createStrategy(label: string, id = ''): Promise<Strategy> {
    //The default label should be the name of the incoming data/file. If it is repeated, add the policy id identifier (uuid)
    const strategyAddressIndex = await this.generateStrategyAddressIndex()
    console.log(`createStrategy strategyAddressIndex: ${strategyAddressIndex}`)
    const strategy: Strategy = new Strategy(this.addressIndex, strategyAddressIndex, label, id)
    this.strategyMapping.set(strategyAddressIndex, strategy)
    //Synchronize the hdWallet object
    await this.updateHDWalletAccountStrategys()
    //Because the strategy has no next-level data, the overall and decentralized storage are consistent
    await strategy.save()
    await this.saveAccountAllStrategyIndexInfo()
    console.log('createStrategy finish')
    return strategy
  }

    /**
   * Creates a new policy object with the specified label and ID, and adds it to the policy mapping. The policy object is used to encrypt data/files uploaded by the user.
   * @internal
   */
    public async createStrategyWithLabelPrefixAndStrategyIndex(labelPrefix: string, id = ''): Promise<Strategy> {
      //The default label should be the name of the incoming data/file. If it is repeated, add the policy id identifier (uuid)
      const strategyAddressIndex = await this.generateStrategyAddressIndex()
      console.log(`createStrategy strategyAddressIndex: ${strategyAddressIndex}`)
      const strategy: Strategy = new Strategy(this.addressIndex, strategyAddressIndex, labelPrefix + "_" + strategyAddressIndex, id)
      this.strategyMapping.set(strategyAddressIndex, strategy)
      //Synchronize the hdWallet object
      await this.updateHDWalletAccountStrategys()
      //Because the strategy has no next-level data, the overall and decentralized storage are consistent
      await strategy.save()
      await this.saveAccountAllStrategyIndexInfo()
      console.log('createStrategy finish')
      return strategy
    }

  /**
   * Deletes the policy object associated with the specified address index from the policy mapping.
   * attention please: If the policy is deleted, address_index can be reused, because if the key generation tree path is certain, the public and private keys must be the same.
   *                   But note that the ids are not the same, the resources shared in the background cannot be reused
   * @param {number} strategyAddressIndex - The address index of the policy object to delete.
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async deleteStrategy(strategyAddressIndex: number): Promise<void> {
    // Note: To delete the policy, note that the policy cannot be deleted if there is a data/file share, and delete here is the bottom-level function.
    // Judging whether the deletion policy should be (with data/file sharing) should be judged by the upper-level function
    console.warn(
      'Delete policy, note that if there is a data share, the policy cannot be deleted. Here, the funcion is the Lowest level function. To determine whether the policy should be deleted (in a data/file share), it should be judged by the upper-level function'
    )

    let strategy: Strategy | undefined = this.strategyMapping.get(strategyAddressIndex)

    if (util.isBlank(strategy)) {
      return
    }

    this.strategyMapping.delete(strategyAddressIndex)

    //Synchronize the hdWallet object
    await this.updateHDWalletAccountStrategys()

    strategy = strategy as Strategy
    await strategy.erase()
    await this.saveAccountAllStrategyIndexInfo()

    //Note to the front end, after deleting it, return it to the front end. The front end should call the backend interface to delete the backend policy id corresponding to the policy information    return strategy;
  }

  /**
   * Gets an array of all policy objects in the policy mapping, sorted by their address indices in ascending order.
   * @returns {Strategy[]} - Returns an array of all policy objects in the policy mapping.
   * @memberof Account
   */
  public getAllStrategy(): Strategy[] {
    const sortStrategyArray: Strategy[] = Array.from(this.strategyMapping.values()).sort((strategy1, strategy2) =>
      strategy1.addressIndex < strategy2.addressIndex ? strategy1.addressIndex : strategy2.addressIndex
    )
    return sortStrategyArray
  }

  /**
   * Gets an array of all policy objects in the policy mapping, sorted by their IDs in ascending order.
   * @returns {Strategy[]} - Returns an array of all policy objects in the policy mapping.
   * @memberof Account
   */
  public getAllStrategySortByStategyId(): Strategy[] {
    const sortStrategyArray: Strategy[] = Array.from(this.strategyMapping.values()).sort((strategy1, strategy2) =>
      strategy1.id < strategy2.id ? -1 : strategy1.id > strategy2.id ? 1 : 0
    )
    return sortStrategyArray
  }

  /**
   * Get all policy object associated with the specified account's policy id.
   * @param {string} strategyId - The policy ID of a specified account.
   * @returns {Strategy|undefined} - Returns the policy object associated with the specified ID, or undefined if the ID is not found in the policy mapping.
   * @memberof Account
   */
  public getAccountStrategyByStategyId = (strategyId: string): Strategy | undefined => {
    const strategys: Strategy[] = this.getAllStrategy()
    for (const strategy of strategys) {
      if (strategy.id === strategyId) {
        return strategy
      }
    }

    return undefined
  }

  /**
   * Retrieves a policy by its address index.
   * @param strategyAddressIndex - The index of the policy address.
   * @returns {Strategy | undefined} The corresponding policy object, or undefined if no such policy exists.
   * @memberof Account
   */
  public getStrategy(strategyAddressIndex: number): Strategy | undefined {
    return this.strategyMapping.get(strategyAddressIndex)
  }

  /**
   * Returns the policy object with the given label.
   * @param label - The label of the policy to fetch.
   * @returns {Strategy | undefined} - The policy object if found, otherwise undefined.
   * @memberof Account
   */
  public getStrategyByLabel(label: string): Strategy | undefined {
    const values = this.strategyMapping.values()
    for (const strategy of Array.from(values)) {
      // Es6 does not require array.from ()
      if (strategy.label === label) {
        return strategy
      }
    }

    return undefined
  }

  /**
   * Retrieves an array of all policy IDs in the mapping.
   * @returns {string[]} - An array of policy IDs.
   * @memberof Account
   */
  public strategyIds(): string[] {
    const strategyIds: string[] = []

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      strategyIds.push(strategy.id)
    }
    return strategyIds
  }

  /**
   * Returns a JSON string representation of the current account object.
   * @returns {string} - Returns a JSON string representation of the current account object.
   * @memberof Account
   */
  public dump(): string {
    const strategys: string[] = []

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      strategys.push(strategy.dump())
    }

    return JSON.stringify({
      name: this.name,
      //'address': this.address, ////Dump is not required, the 'address' can be recovered from the account
      addressIndex: this.addressIndex,
      id: this.id,
      strategys: strategys
      //'encryptedKeyPair': this.encryptedKeyPair.dump() //Dump is not required,，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
      //'verifyKeyPair': this.encryptedKeyPair.dump() //Dump is not required,，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
    })
  }

  /**
  * @internal
  * Gets information about policy label's infos associated with the specified account address.
  * @param {string} accountAddress - The address of the account.
  * @returns {Promise<[object]>} - Returns an array of objects containing information about the policy labels associated with the account.
                          [
                            { 
                              'policy_label_id': '', 
                              'policy_label':'', 
                              'policy_label_index': '', 
                              'policy_encrypted_pk':'This is the encrypted_pk passed in the /file/create-policy-and-upload API interface', 
                            },
                            ...
                          ]
  * @static
  * @memberof Account               
*/
  public static async getStrategyInfosFromServerByAddr(accountAddress: string) {
    const sendData = {
      account_address: accountAddress
    }

    const data = await serverPost('/label', sendData)
    return data
  }

  /**
   * Restores an account using the strategies stored in the backend database.
   * @returns {Promise<Account>} - A Promise that resolves to an `Account` object.
   * @static
   * @memberof Account
   */
  public static async restoreByStrategyInfos(): Promise<Account> {
    const account = new Account('', 0)

    //get strategys from backend db
    const strategyInfos: any = await Account.getStrategyInfosFromServerByAddr(account.address)

    for (const strategyInfo of strategyInfos) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const strategy: Strategy = new Strategy(
        Number(account.addressIndex),
        strategyInfo.policy_label_index,
        strategyInfo.policy_label,
        strategyInfo.policy_label_id
      )
      if (strategy.strategyKeyPair._publicKey.toLowerCase() !== strategyInfo.policy_encrypted_pk.toLowerCase()) {
        //TODO: If the process goes this far Most likely there is a bug in the program
        //debugger;
        throw new Error('There seems to be something wrong with the program, please contact the administrator')
      }
      account.strategyMapping.set(Number(strategy.addressIndex), strategy)

      //await strategy.serialize(); //This operation is not done here, but is done when the account is recovered
    }

    await account.saveAccountItselfInfo()
    // await account.serialize(); //This operation is not done here, but is done when the account is recovered
    await account.saveAccountAllStrategyInfo()

    //saveAccountAllStrategyInfo : It calls, it doesn't have to be called again
    //await account.saveAccountAllStrategyIndexInfo();

    return account
  }

  /**
   * Loads a account object from a JSON string.
   * @param {string} jsonString - The JSON string to parse and load.
   * @param {boolean} [_save=false] - Whether to save the loaded object to browser's local storage.
   * @returns {Promise<Account>} - Returns a Promise that resolves with the loaded account object.
   * @static
   * @memberof Account
   */
  public static async load(jsonString: string, save = false): Promise<Account> {
    const jsonObj = JSON.parse(jsonString)

    const account = new Account(jsonObj.name, jsonObj.addressIndex, jsonObj.id)
    const strategys: string[] = jsonObj.strategys
    for (const strategyString of strategys) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const strategy: Strategy | null = await Strategy.load(strategyString, save)
      const _strategy = strategy as Strategy
      if (!isBlank(strategy)) {
        account.strategyMapping.set(Number(_strategy.addressIndex), _strategy)
      }
      //await strategy.serialize(); //This operation is not done here, but is done when the account is recovered
    }

    // await account.serialize(); //This operation is not done here, but is done when the account is recovered
    if (save) {
      await account.saveAccountItselfInfo()
      await account.saveAccountAllStrategyInfo()

      //saveAccountAllStrategyInfo : It calls, it doesn't have to be called again
      //await account.saveAccountAllStrategyIndexInfo();
    }

    return account
  }
  /**
   * Deserializes a account object from 'Browser-local storage' by decrypting it and creating a account object in memory.
   * @returns {Promise<Account|null>} - Returns a Promise that resolves with the deserialized account object or null if there was an error.
   * @static
   * @memberof Account
   */
  public static async loadSaved(addressIndex: number): Promise<Account | null> {
    const hdWalletInstance = await getHDWalletInstance()
    const accountItselfInfoString = await hdWalletInstance.decryptSavedData(macro.accountItselfInfo(addressIndex))
    // console.log(
    //   `loadSaved get accountItselfInfo addressIndex: ${addressIndex}, plaintext: ${accountItselfInfoString}`
    // );
    /*
    {
        name: this.name,
        addressIndex: this.addressIndex,
        id: this.id,
    }
    */
    try {
      const accountItselfInfo = JSON.parse(accountItselfInfoString)

      const account = new Account(accountItselfInfo.name, accountItselfInfo.addressIndex, accountItselfInfo.id)

      const strategyIndexs: number[] = await account.getSavedAccountAllStrategyIndexInfo()

      for (const strategyIndex of strategyIndexs) {
        // We don’t escape the key '__proto__'
        // which can cause problems on older engines
        const strategy = await Strategy.loadSaved(account.addressIndex, strategyIndex)

        if (!isBlank(strategy)) {
          account.strategyMapping.set(Number(strategyIndex), strategy as Strategy)
        }
      }

      return account
    } catch (error) {
      console.log(
        `account loadSaved  addressIndex ${addressIndex}, accountItselfInfoString:  ${accountItselfInfoString}`
      )
      console.error(error)
      // debugger;
      return null
    }
  }

  /**
   * Serializes the account object and encrypts it to 'Browser-local storage'.
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async serialize(): Promise<void> {
    const accountString: string = this.dump()
    return await getHDWalletInstance().encryptSaveData(this.getSaveKey(), accountString)
  }

  /**
   * Deserializes a account object from 'Browser-local storage' by decrypting it and creating a account object in memory.
   * @returns {Promise<Account>} - Returns a Promise that resolves with the deserialized account object or null if there was an error.
   * @memberof Account
   */
  public async deserialize(): Promise<Account> {
    const accountString = await getHDWalletInstance().decryptSavedData(this.getSaveKey())
    return await Account.load(accountString)
  }

  /**
   * Encrypts and stores the account's own information (excluding policy information) to the browser's local storage
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async saveAccountItselfInfo() {
    //Store the current account source information, except for the policy information, all information is complete
    const cipherText: string = await getHDWalletInstance().encryptSaveData(
      macro.accountItselfInfo(this.addressIndex),
      JSON.stringify({
        name: this.name,
        addressIndex: this.addressIndex,
        id: this.id
        //'encryptedKeyPair': this.encryptedKeyPair.dump()  //Dump is not required，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
        //'verifyKeyPair': this.encryptedKeyPair.dump()  //Dump is not required，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
      })
    )

    // console.log(
    //   `saveAccountItselfInfo save accountItselfInfo addressIndex: ${this.addressIndex}, cipherText: ${cipherText}`
    // );
  }

  /**
   * Deserializes a account object (excluding policy information) from 'Browser-local storage' by decrypting it and creating a account object in memory.
   * @returns {Promise<Account>} - Returns a Promise that resolves with the deserialized account object (excluding policy information) .
   * @memberof Account
   */
  public async getSavedAccountItselfInfo() {
    // Get the storage of the current account source information, except for the policy information, all information is complete
    const accountItselfInfoString = await getHDWalletInstance().decryptSavedData(
      macro.accountItselfInfo(this.addressIndex)
    )

    // console.log(
    //   `getSavedAccountItselfInfo get accountItselfInfo addressIndex: ${this.addressIndex}, plaintext: ${accountItselfInfoString}`
    // );
    return JSON.parse(accountItselfInfoString)
  }

  /**
   * Clears the account object (excluding policy information) from the browser's local storage.
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async removeSavedAccountItselfInfo() {
    const nuLinkHDWallet = getHDWalletInstance()
    // Delete the original storage information of the current account, except for the policy information, all storage information is complete
    await getHDWalletInstance().removeSavedData(macro.accountItselfInfo(this.addressIndex))
  }

  /**
   * Serializes all strategy indices of the account to the browser's local storage.
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async saveAccountAllStrategyIndexInfo() {
    // store account index information

    console.log('save this.addressIndex: ', this.addressIndex)
    console.log('save this.strategyMapping.keys(): ', JSON.stringify(Array.from(this.strategyMapping.keys())))
    await getHDWalletInstance().encryptSaveData(
      macro.accountStrategyList(this.addressIndex),
      JSON.stringify(Array.from(this.strategyMapping.keys()))
    )
  }

  /**
   * Deserializes all strategy indices of the account from the browser's local storage.
   * @returns {Promise<number[]>} - An array containing all the strategy indices stored in the browser's local storage.
   * @memberof Account
   */
  public async getSavedAccountAllStrategyIndexInfo(): Promise<number[]> {
    // store account index information
    const strategyListString = await getHDWalletInstance().decryptSavedData(
      macro.accountStrategyList(this.addressIndex)
    )
    if (util.isBlank(strategyListString)) {
      //No policy information is created for the original account
      return []
    }
    //
    //debugger;
    console.log('getSaved this.addressIndex: ', this.addressIndex)
    console.log('getSaved strategyListString: ', strategyListString)
    return JSON.parse(strategyListString)
  }

  /**
   * Clears all strategy indices of the account from the browser's local storage.
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async removeSavedAccountAllStrategyIndexInfo() {
    const nuLinkHDWallet = getHDWalletInstance()
    // remove account index storage information
    await nuLinkHDWallet.removeSavedData(macro.accountStrategyList(this.addressIndex))
  }

  /**
   * Serializes all strategy information of the account to the browser's local storage.
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async saveAccountAllStrategyInfo() {
    // Store all policy information of the current account

    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      await strategy.save()
    }

    await this.saveAccountAllStrategyIndexInfo()
  }

  /**
   * Clears all strategy information of the account from the browser's local storage.
   * @returns {Promise<void>}
   * @memberof Account
   */
  public async removeSavedAccountAllStrategyInfo() {
    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      await strategy.erase()
    }

    // Remove all strategy index information of the current account
    await this.removeSavedAccountAllStrategyIndexInfo()
  }

  /**
   * get the account balance of (bnb/tbnb) from the Ethereum blockchain using web3.
   * @returns {Promise<string | undefined>} - A Promise that resolves to the account balance in ether as a string, or undefined if the balance could not be retrieved.
   * @memberof Account
   */
  public async balance(): Promise<string | undefined> {
    // Get account balance from Ethereum
    return await this.refreshBalance()
  }

  /**
   * Refreshes the account balance of (bnb/tbnb) from the Ethereum blockchain using web3.
   * @returns{Promise<string | undefined>} - A Promise that resolves to the account balance in ether as a string, or undefined if the balance could not be retrieved.
   * @memberof Account
   */
  public async refreshBalance(): Promise<string | undefined> {
    // Get account balance from Ethereum

    // const account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
    //web3.eth.accounts.wallet.add(account);
    web3 = await getWeb3()
    const address = Web3.utils.toChecksumAddress(
      this.address
      //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
    )

    let i = 0
    while (i < 3)
      try {
        return Web3.utils.fromWei(await web3.eth.getBalance(address))
      } catch (e) {
        // if (e instanceof errors.ConnectionError) {

        // }
        i++
        // Message.error(((e as any)?.message || e) as string);
        await sleep(1000)
        throw e
      }
  }

  /**
   * get the account balance of nlk from the Ethereum blockchain using web3.
   * @returns {Promise<string | undefined>} - A Promise that resolves to the account balance in ether as a string, or undefined if the balance could not be retrieved.
   * @memberof Account
   */
  public async getNLKBalance(): Promise<string | undefined> {
    // Get account NLK balance from Ethereum
    return await this.refreshNLKBalance()
  }

  /**
   * Refreshes the account balance of nlk from the Ethereum blockchain using web3.
   * @returns{Promise<string | undefined>} - A Promise that resolves to the account balance in ether as a string, or undefined if the balance could not be retrieved.
   * @memberof Account
   */
  public async refreshNLKBalance(): Promise<string | undefined> {
    // Get account balance from Ethereum

    // const account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
    //web3.eth.accounts.wallet.add(account);
    const contract: Contract = await getContractInst(CONTRACT_NAME.nuLinkToken)
    const address = Web3.utils.toChecksumAddress(
      this.address
      //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
    )

    let i = 0
    while (i < 3)
      try {
        const result = await contract.methods.balanceOf(address).call() // 29803630997051883414242659
        // Convert the value from Wei to Ether
        return Web3.utils.fromWei(result, 'ether')
      } catch (e) {
        // if (e instanceof errors.ConnectionError) {

        // }
        i++
        // Message.error(((e as any)?.message || e) as string);
        await sleep(1000)
        throw e
      }
  }
}

/**
 *
 * An account management object that stores all account information.
 * @class AccountManager
 * @extends {IJson}
 */
export class AccountManager extends IJson {
  //accountCount: number = 0; //Number of current accounts
  private generateAccountAddressIndexLock = new AwaitLock() //Generation account (key spanning tree path) index
  private accountMapping = new Map<number, Account>() //Strategy related information address_index: Strategy
  public defaultAccountAddressIndex = 0

  // constructor() {
  //   super();
  // }

  /**
   * Generates the address index to be used for creating a new account.
   * The address index is the maximum value under the key spanning tree path (seventh level) of the current last policy + 1.
   * @returns {Promise<number>} - A Promise that resolves to the generated address index as a number.
   * @memberof AccountManager
   */
  private async generateAddressIndex(): Promise<number> {
    //Get the policy index (maximum value) + 1 under the key spanning tree path (seventh level) of the current last policy, that is, the address_index required when creating the policy
    await this.generateAccountAddressIndexLock.acquireAsync()
    try {
      let max = -1
      const keys = this.accountMapping.keys()
      for (const addressIndex of Array.from(keys)) {
        // es6 doesn't need Array.from()
        if (addressIndex > max) {
          max = addressIndex
        }
      }
      return Number(max + 1)
    } finally {
      this.generateAccountAddressIndexLock.release()
    }
  }
  /**
   * Returns the number of accounts in the account mapping data structure.
   * @returns {number} - The number of accounts as a number.
   * @memberof AccountManager
   */
  getAccountCount(): number {
    return this.accountMapping.size
  }

  /**
   * Returns an array of all the accounts in the account mapping data structure, sorted by address index in ascending order.
   * @returns {Account[]} - An array of Account objects.
   * @memberof AccountManager
   */
  getAllAccount(): Account[] {
    const sortAccountArray: Account[] = Array.from(this.accountMapping.values()).sort((account1, account2) =>
      account1.addressIndex < account2.addressIndex ? account1.addressIndex : account2.addressIndex
    )
    return sortAccountArray
  }
  /**
   * Returns an array of all the accounts in the account mapping data structure, sorted by account ID in ascending order.
   * @returns {Account[]} - An array of Account objects.
   * @memberof AccountManager
   */
  getAllAccountSortByAccountId(): Account[] {
    const sortAccountArray: Account[] = Array.from(this.accountMapping.values()).sort((account1, account2) =>
      account1.id < account2.id ? -1 : account1.id > account2.id ? 1 : 0
    )
    return sortAccountArray
  }

  /**
   * @internal
   * Not currently implemented
   * @param _privateKey
   * @param _dataBinaryString
   * @memberof AccountManager
   */
  restoreAccount(_privateKey: string, _dataBinaryString = '') {
    /* Recovery of a single account (Wallet) is not supported, because a single account cannot be derived from the private key
     The extended private key (ExtendedPrivatekey) of BIP32, the sub-account is generated through the wallet root private key (ExtendedPrivatekey), the sub-account of the tree structure is deduced,
     So a single account cannot derive HDWallet.
     Our business is to derive the seventh-level strategy public and private keys and the sixth-level Verify public and private keys
     So there is no such function. So exporting the private key must be exporting the wallet root private key
     This is different from the traditional metamask function, metamask can only restore a single account (Wallet, ordinary wallet) through the private key,
     Not HDWallet.

     So if you want to support a single account skin care wallet, you must have the wallet root private key, so this function mentions NuLinkHDWallet
     Restore the wallet in the wallet class (through the wallet root private key)
     */
    throw new Error('Restoring a single account is not supported')
  }

  /**
   * @internal
   * Not currently implemented
   * @param _keystoreJson
   * @param _dataBinaryString
   * @memberof AccountManager
   */
  restoreAccountByKeyStoreJson(_keystoreJson: string, _dataBinaryString = '') {
    /* Recovery of a single account (Wallet) is not supported, because a single account cannot be derived from the private key
     The extended private key (ExtendedPrivatekey) of BIP32, the sub-account is generated through the wallet root private key (ExtendedPrivatekey), the sub-account of the tree structure is deduced,
     So a single account cannot derive HDWallet.
     Our business is to derive the seventh-level strategy public and private keys and the sixth-level Verify public and private keys
     So there is no such function. Therefore, the export of the private key must be to export the extended private key of the root account, so it should not support keystore import.
     This is different from the traditional metamask function, metamask can only restore a single account (Wallet, ordinary wallet) through the private key,
     Not HDWallet
    
      So if you want to support a single account skin care wallet, you must have the extended private key of the root account, so this function mentions NuLinkHDWallet
     Restoring the wallet in the wallet class (via the extended private key of the root account (call it the wallet))
     */
    throw new Error('Restoring a single account is not supported')
  }

  /**
   * Creates a new account and returns it.
   * @param name {string} - (optional) The name of the account .
   * @param defaultAccount {boolean} - (optional) Whether to set the new account as the default account (optional, defaults to false).
   * @returns {Account} - A Promise that resolves to the newly created Account object.
   * @memberof AccountManager
   */
  public async createAccount(name = '', defaultAccount = false) {
    const accountAddressIndex = await this.generateAddressIndex()

    if (util.isBlank(name)) {
      name = `account${accountAddressIndex + 1}`
    }
    const account: Account = new Account(name, accountAddressIndex)

    this.accountMapping.set(accountAddressIndex, account)

    if (defaultAccount) {
      this.defaultAccountAddressIndex = accountAddressIndex
    }

    //Synchronize the hdWallet object
    // this.updateHDWalletWhenAddOrUpdateAccount(account);
    await this.updateHDWalletAccountManager()

    //Increase the account storage of the local disk and encrypt it with the root private key
    //await account.serialize();

    // Do not store as a whole, the efficiency is too low, change to decentralized storage
    await this.saveAllAccountAddressIndex()
    await this.saveDefaultAccountAddressIndex()

    //Store account meta information in a decentralized manner
    await account.saveAccountItselfInfo()

    // attention please -------------------------
    //Decouple, move to external level with createAccount. when call the function "createAccount", TODO: You need to call the function of "createAccountIfNotExist" manually
    //create account record in center database
    //
    // await createAccountIfNotExist(account);
    //

    return account
  }

  /**
   * Removes an account with the specified address index and returns it.
   * @param addressIndex {number} - The address index of the account to be removed.
   * @returns {Promise<Account | undefined>} - A Promise that resolves to the removed Account object, or undefined if the account does not exist or cannot be removed.
   * @memberof AccountManager
   */
  public async removeAccount(addressIndex: number): Promise<Account | undefined> {
    // remove account
    //Note: To delete an account, note that if the policy in the account has a data/file share, the account cannot be deleted. Delete here is the bottom-level function.
    //Determine whether the account should be deleted (with data/file sharing), it should be judged by the upper-level function

    //Note that there is no function to delete accounts in metamask, consider whether to block this function here
    console.warn(
      'Delete an account, note that the policy in the account cannot delete the account if there is a data/file share. Delete here is the bottom-level function. To determine whether the account should be deleted (in a data/file share), it should be judged by the upper-level function'
    )

    if (addressIndex === 0) {
      //We think the 0th account is considered as the initial account and cannot be deleted (note that there is no function to delete accounts in metamask)
      //When restoring an account through a mnemonic or root extension private key, the 0th account is restored by default
      return undefined
    }

    let account = this.accountMapping.get(addressIndex)
    if (!util.isBlank(account)) {
      this.accountMapping.delete(addressIndex)
      // delete the account storage on the local disk
      account = account as Account

      // const nuLinkHDWallet = getHDWallet();
      // await getHDWallet().removeSavedData(account.getSaveKey());

      if (addressIndex === this.defaultAccountAddressIndex) {
        const addressIndexs: number[] = Array.from(this.accountMapping.keys())
        if (addressIndexs.length > 0) {
          this.defaultAccountAddressIndex = Number(addressIndexs[0])
        } else {
          this.defaultAccountAddressIndex = 0 // No account anymore, 0 or -1 will do
        }
      }

      //Synchronize the hdWallet object
      // this.updateHDWalletWhenRemoveAccount(account.address);
      await this.updateHDWalletAccountManager()

      //Do not store as a whole, the efficiency is too low, change to decentralized storage
      //Save account index and account source information
      await this.saveAllAccountAddressIndex()
      await account.removeSavedAccountItselfInfo()
      // delete all policy information of the account
      await account.removeSavedAccountAllStrategyInfo()
    }

    await this.saveDefaultAccountAddressIndex()

    return account
  }

  /**
   * @internal
   * Updates the HD wallet account manager with the nulink wallet instance.
   * @returns {void}
   * @memberof AccountManager
   */
  public async updateHDWalletAccountManager() {
    const nuLinkHDWallet = getHDWalletInstance()
    if (util.isBlank(nuLinkHDWallet)) {
      return
    }
    nuLinkHDWallet.setAccountManager(this)
    await setHDWalletInstance(nuLinkHDWallet, true)
  }

  /*   
  public async updateHDWalletWhenRemoveAccount(
    accountAddress: string
  ): Promise<boolean> {
    // remove account
    const nuLinkHDWallet = getHDWallet();
    if(util.isBlank(nuLinkHDWallet))
    {
      return false;
    }
    const accountManager  = nuLinkHDWallet.getAccountManager();
    
    const accountMapping:Map<number, Account> = accountManager.accountMapping;

    for (const account of Array.from(accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      if(account.address.toLowerCase() === accountAddress.toLowerCase()){
        accountMapping.delete(account.addressIndex);
        if (account.addressIndex === this.defaultAccountAddressIndex) {
          const addressIndexs: number[] = Array.from(accountMapping.keys());
          if (addressIndexs.length > 0) {
            this.defaultAccountAddressIndex = Number(addressIndexs[0]);
          } else {
            this.defaultAccountAddressIndex = 0; // No account anymore, 0 or -1 will do
          }
        }
        await setHDWallet(nuLinkHDWallet, true);
        return true;
      }
    }

    return false;
  }

  public async updateHDWalletWhenAddOrUpdateAccount(
    accountToAddOrUpdate: Account
  ): Promise<number> {
    const nuLinkHDWallet = getHDWallet();
    if(util.isBlank(nuLinkHDWallet))
    {
      return 0;
    }
    const accountManager  = nuLinkHDWallet.getAccountManager();
    
    const accountMapping:Map<number, Account> = accountManager.accountMapping;

    for (const account of Array.from(accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      if(account.address.toLowerCase() === accountToAddOrUpdate.address.toLowerCase()){
        //to update
        //accountToAddOrUpdate's addressIndex can't changed,  => const keyPairDict = common.getEthereumEncryptAccount(getHDWallet().hdWallet,addressIndex)
        accountMapping.set(account.addressIndex, accountToAddOrUpdate);
        await setHDWallet(nuLinkHDWallet, true);
        return 1;
      }
    }

    //not exist, to add account, accountToAddOrUpdate's addressIndex can't changed,  => const keyPairDict = common.getEthereumEncryptAccount(getHDWallet().hdWallet,addressIndex)
    const accountAddressIndex = await accountManager.generateAddressIndex();
    accountMapping.set(accountAddressIndex, accountToAddOrUpdate);
    await setHDWallet(nuLinkHDWallet, true);

    return 2;
  }
 */
  /**
   * Returns the Account object with the specified address index, or undefined if the account does not exist.
   * @param index {number} - The address index of the account to be retrieved.
   * @returns {Account | undefined} - The Account object with the specified address index, or undefined if the account does not exist.
   * @memberof AccountManager
   */
  public getAccount(index: number): Account | undefined {
    return this.accountMapping.get(index)
  }

  /**
   * Returns the Account object with the specified address, or undefined if the account does not exist.
   * @param address {string} - The address index of the account to be retrieved.
   * @returns {Account | undefined} - The Account object with the specified address, or undefined if the account does not exist.
   * @memberof AccountManager
   */
  public getAccountByAddress(address: string): Account | undefined {
    for (const account of Array.from(this.accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      if (account.address.toLowerCase().trim() === address.toLowerCase().trim()) {
        return account
      }
    }

    return undefined
  }

  /**
   * Retrieves the default account associated with the NuLinkHDWallet.
   * If no default account is set, the account with index 0 will be returned.
   * @returns {Account|undefined} - Returns the default account or undefined if it does not exist.
   * @memberof AccountManager
   */
  public getDefaultAccount(): Account | undefined {
    const index = Number(this.defaultAccountAddressIndex) >= 0 ? Number(this.defaultAccountAddressIndex) : 0
    return this.accountMapping.get(Number(index))
  }

  /**
   * Returns an array of strategy IDs associated with all accounts of the current HD wallet instance.
   * @returns {string []} - An array of strategy IDs as strings.
   * @memberof AccountManager
   */
  public strategyIds(): string[] {
    let strategyIds: string[] = []

    for (const account of Array.from(this.accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      strategyIds = strategyIds.concat(account.strategyIds())
    }

    return strategyIds
  }

  /**
   * Returns an array of account IDs associated with all accounts of the current HD wallet instance.
   * @returns {string []} - An array of account IDs as strings.
   * @memberof AccountManager
   */
  public accountIds(): string[] {
    const accountIds: string[] = []

    for (const account of Array.from(this.accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      accountIds.push(account.id)
    }

    return accountIds
  }

  /**
   * Restores the default account using the strategies stored in the backend database and returns a new AccountManager object.
   * @returns ｛Promise<AccountManager>｝- A Promise that resolves to a new AccountManager object with the default account restored.
   * @memberof AccountManager
   * @static
   */
  public static async restoreDefaultAccount(): Promise<AccountManager> {
    const accountManager = new AccountManager()
    accountManager.defaultAccountAddressIndex = 0

    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    const account: Account = await Account.restoreByStrategyInfos()
    accountManager.accountMapping.set(account.addressIndex, account)

    await accountManager.saveAllAccountAddressIndex()
    await accountManager.saveDefaultAccountAddressIndex()

    return accountManager
  }

  /**
   * Returns a JSON string representation of the AccountManager object.
   * @returns {string} - Returns a JSON string representation of the AccountManager object.
   * @memberof AccountManager
   */
  public dump(): string {
    const accounts: string[] = []

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const account of Array.from(this.accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      accounts.push(account.dump())
    }

    return JSON.stringify({
      default_index: this.defaultAccountAddressIndex,
      accounts: accounts
    })
  }

  /**
   * Loads a accountManager object from a JSON string.
   * @param {string} jsonString - The JSON string to parse and load.
   * @param {boolean} [_save=false] - Whether to save the loaded object to browser local storage.
   * @returns {Promise<AccountManager>} - Returns a Promise that resolves with the accountManager object.
   * @static
   * @memberof AccountManager
   */
  public static async load(jsonString: string, save = false): Promise<AccountManager> {
    const jsonObj = JSON.parse(jsonString)

    const accountManager = new AccountManager()
    accountManager.defaultAccountAddressIndex = Number(jsonObj.default_index)

    const accounts: string[] = jsonObj.accounts
    for (const accountString of accounts) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const account: Account = await Account.load(accountString, save)
      accountManager.accountMapping.set(account.addressIndex, account)

      //await account.serialize();//Do not do this operation here, do it when you restore the account
    }

    const addressIndexs: number[] = Array.from(accountManager.accountMapping.keys())
    if (addressIndexs.length > 0 && addressIndexs.includes(Number(accountManager.defaultAccountAddressIndex))) {
      //Nothing to do
    } else {
      accountManager.defaultAccountAddressIndex = 0 // No account anymore, 0 or -1 will do
    }
    // await accountManager.serialize();//Do not do this operation here, do it when you restore the account

    if (save) {
      await accountManager.saveAllAccountAddressIndex()
      await accountManager.saveDefaultAccountAddressIndex()
    }

    return accountManager
  }

  /**
   * @static
   * Loads the saved account information from browser local storage and returns a AccountManager object.
   * @returns {Promise<AccountManager>} - A Promise that resolves to a AccountManager object with the saved account information loaded.
   * @memberof AccountManager
   */
  public static async loadSaved(): Promise<AccountManager> {
    const accountManager = new AccountManager()
    accountManager.defaultAccountAddressIndex = Number(await accountManager.getSavedDefaultAccountAddressIndex())

    const nulinkHDWallet: NuLinkHDWallet = getHDWalletInstance()
    nulinkHDWallet.setAccountManager(accountManager)
    await setHDWalletInstance(nulinkHDWallet, false) //need to save for account.createStrategyByLabel() works

    const addressIndexs: number[] = await accountManager.getSavedAllAccountAddressIndex()
    // console.log("AccountManager loadSaved addressIndexs", addressIndexs);
    for (const accountAddrIndex of addressIndexs) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const account: Account | null = await Account.loadSaved(accountAddrIndex)

      if (isBlank(account)) {
        continue
      }

      // Since the function call of account.createStrategyByLabel() relies on
      // updateHDWalletAccountStrategys() which uses accountManager.accountMapping,
      // the AccountMapping must be set up with all Account objects beforehand.
      accountManager.accountMapping.set(Number(accountAddrIndex), account as Account)
      //don't call the function of createStrategyByLabel, because the strategy has recoveryed from the localstorage or indexdb
      //await account.createStrategyByLabel('label')
    }

    if (addressIndexs.length > 0 && addressIndexs.includes(Number(accountManager.defaultAccountAddressIndex))) {
      //Nothing to do
    } else {
      accountManager.defaultAccountAddressIndex = 0 // No account anymore, 0 or -1 will do
    }

    return accountManager
  }

  /**
   * @internal
   * Saves all account address indices to browser local storage.
   * @return {Promise<void>}
   * @memberof AccountManager
   */
  public async saveAllAccountAddressIndex() {
    await getHDWalletInstance().encryptSaveData(
      macro.accountListAddressIndex,
      JSON.stringify(Array.from(this.accountMapping.keys()))
    )
  }

  /**
   * @internal
   * Retrieves all saved account address indices from browser local storage.
   * @returns {Promise<[] number>} - A Promise that resolves to an array of all saved account address indices.
   * @memberof AccountManager
   */
  public async getSavedAllAccountAddressIndex() {
    const accountAddressIndexString = await getHDWalletInstance().decryptSavedData(macro.accountListAddressIndex)
    return JSON.parse(accountAddressIndexString)
  }

  /**
   * @internal
   * Saves default account address index to browser local storage.
   * @return {Promise<void>}
   * @memberof AccountManager
   */
  public async saveDefaultAccountAddressIndex() {
    await getHDWalletInstance().encryptSaveData(
      macro.accountDefaultAddressIndex,
      Number(this.defaultAccountAddressIndex)
    )
  }

  /**
   * @internal
   * Retrieves saved default account address index from browser local storage.
   * @returns {Promise<number>} - A Promise that resolves to number of default account address index.
   * @memberof AccountManager
   */
  public async getSavedDefaultAccountAddressIndex(): Promise<number> {
    return await getHDWalletInstance().decryptSavedData(macro.accountDefaultAddressIndex)
  }

  /**
   * Serializes the accountManager object and encrypts it to 'Browser-local storage'.
   * @returns {Promise<void>}
   * @memberof AccountManager
   */
  public async serialize(): Promise<void> {
    const accountManagerString: string = this.dump()
    return await getHDWalletInstance().encryptSaveData(this.getSaveKey(), accountManagerString)
  }

  /**
   * Deserializes a accountManager object from 'Browser-local storage' by decrypting it and creating a account object in memory.
   * @returns {Promise<AccountManager>} - Returns a Promise that resolves with the deserialized accountManager object.
   * @memberof AccountManager
   */
  public async deserialize(): Promise<AccountManager> {
    const strategyString = await getHDWalletInstance().decryptSavedData(this.getSaveKey())
    return await AccountManager.load(strategyString)
  }

  /**
   * @internal
   * Returns the marco of nuink Wallet account Manager Key .
   * @returns {string} - The save key as a string.
   * @memberof AccountManager
   */
  public getSaveKey(): string {
    return macro.accountManagerKey
  }
}

/**
 * An enum representing the types of HD wallet creation methods.
 */
enum HDWalletCreateType {
  /**
   * Create an HD wallet from a mnemonic phrase.
   */
  Mnemonic,
  /**
   * Create an HD wallet from a root extended private key.
   */
  RootExtendedPrivateKey
}

/**
 *  nulink wallet object
 * @class NuLinkHDWallet
 */
export class NuLinkHDWallet {
  private _passwordHash: string
  private mnemonic: string
  private rootExtendedPrivateKey: string
  private createType: HDWalletCreateType // wallet creation method
  private hdWallet: hdkey /*EthereumHDKey*/ | null = null
  protected accountManager: AccountManager
  private cryptoBroker: CryptoBroker | null = null // Encryption and decryption middleware

  /**
   * Constructs an HDWallet object.
   *
   * @remarks
   * This constructor creates a new instance of the HDWallet class. It sets the properties of the object, including
   * the account manager, password hash, mnemonic, root extended private key, create type, and so on.
   *
   * The constructor is private so that the class can use static methods to create instances.
   * @private
   */
  private constructor() {
    this.accountManager = new AccountManager()
    this._passwordHash = ''
    this.mnemonic = ''
    this.rootExtendedPrivateKey = ''
    this.createType = HDWalletCreateType.Mnemonic
    this.cryptoBroker = null
  }

  /**
   * Constructs a new HDWallet object by copying an existing one.
   *
   * @remarks
   * This constructor creates a new instance of the HDWallet class by copying another instance's properties, including
   * the account manager, password hash, mnemonic, root extended private key, create type, and crypto broker. It encrypts
   * the mnemonic and root extended private key using the provided password.
   *
   * The constructor is private so that the class can use static methods to create instances.
   *
   * @param _nuLinkHDWallet {NuLinkHDWallet} - The existing HDWallet object to copy.
   * @param password {string}- This parameter is not used now.
   */
  private copyConstructor(_nuLinkHDWallet: NuLinkHDWallet, password: string) {
    this.accountManager = _nuLinkHDWallet.accountManager
    this._passwordHash = _nuLinkHDWallet._passwordHash
    this.mnemonic = pwdEncrypt(_nuLinkHDWallet.mnemonic, null, false)
    this.rootExtendedPrivateKey = pwdEncrypt(_nuLinkHDWallet.rootExtendedPrivateKey, null, false)
    this.createType = _nuLinkHDWallet.createType
    this.cryptoBroker = _nuLinkHDWallet.cryptoBroker
    this.hdWallet = _nuLinkHDWallet.hdWallet
  }

  /**
   * Generates a new BIP39 mnemonic phrase.
   * @static
   * @returns {string} - The generated mnemonic phrase as a string.
   * @memberof NuLinkHDWallet
   */
  public static generateMnemonic(): string {
    return commonGenerateMnemonic()
  }

  /**
   *  The front end loads different pages according to the status returned by this function, whether to display account information or restore the account
   *  Note:  If no password is passed to the loadHDwallet function, it will attempt to obtain the wallet object from memory.
   *  If it cannot be obtained, null is returned. In this case, the function needs to be called again with the user's password to retrieve the wallet object.
   * @static
   * @throws {@link PasswordDecryptError}
   * @param {string} password - (Optional) If no password is passed to the loadHDwallet function, it will attempt to obtain the wallet object from memory.
                                        If it cannot be obtained, null is returned. In this case, the function needs to be called again with the user's password to retrieve the wallet object.
   * @return {(Promise<NuLinkHDWallet | null>)}
   * @memberof NuLinkHDWallet
   */
  public static async loadHDWallet(password = ''): Promise<NuLinkHDWallet | null> {
    // console.log("loadHDWallet in .....................");
    const nuLinkHDWallet = getHDWalletInstance()
    // console.log("loadHDWallet getHDWallet: ", nuLinkHDWallet);
    if (!util.isBlank(nuLinkHDWallet)) {
      // Unsafe, abandoned
      // if (!(await existHDWalletPersistData())) {
      //   await persistHDWallet(nuLinkHDWallet as NuLinkHDWallet)
      // }
      // console.log("loadHDWallet get persistHDWallet: ", nuLinkHDWallet);
      return nuLinkHDWallet as NuLinkHDWallet
    }

    // // Unsafe, abandoned
    // // If there is no memory, be sure to enter the password at this time
    // if (util.isBlank(password)) {
    //   console.log('loadHDWallet loadHDWalletFromPersistence start')
    //   const nuLinkHDWallet: NuLinkHDWallet | null = await loadHDWalletFromPersistence()

    //   if (nuLinkHDWallet) {
    //     await setHDWalletInstance(nuLinkHDWallet, true)
    //   }
    //   return nuLinkHDWallet
    // }

    // console.log("loadHDWallet loadSaved by password");
    //Load the account from the storage, if there is no more in the storage, return to empty => At this time, there are two ways to restore the account through the mnemonic phrase or restore the account through the private key
    try {
      const nulinkHDWallet = await NuLinkHDWallet.loadSaved(password)
      await setHDWalletInstance(nulinkHDWallet, true)

      // If there is no storage, getHDWallet() is empty
      console.log('Password verification success')
      return nulinkHDWallet
    } catch (e) {
      if (e instanceof exception.PasswordDecryptError) {
        // Message.error(
        //   "Password verification failed" /* t("verify_password_error") */
        // );
        console.error('Password verification failed')
      }
      throw e
    }
  }

  /**
   * Determines whether there is a default account in local storage.
   * @static
   * @returns {Promise<boolean>} - Returns true if a default account exists, false otherwise.
   * @memberof NuLinkHDWallet
   */
  public static async existDefaultAccount(): Promise<boolean> {
    const mustExistValueList: string[] = [
      macro.passwordHash,
      macro.hDWalletCreateType,
      macro.encryptedKeyIvByPassword,
      macro.accountListAddressIndex,
      macro.accountDefaultAddressIndex,
      macro.accountItselfInfo(0)
    ]
    const etherExistValueList: string[] = [macro.mnemonicByPassword, macro.rootExtendedPrivateKeyByPassword]
    for (let index = 0; index < mustExistValueList.length; index++) {
      const key = mustExistValueList[index]

      const value = await store.getItem(key)
      if (isBlank(value)) {
        return false
      }
    }

    let exist = false
    for (let index = 0; index < etherExistValueList.length; index++) {
      const key = etherExistValueList[index]

      const value = await store.getItem(key)
      if (!isBlank(value)) {
        exist = true
        return true
      }
    }

    if (!exist) {
      return false
    }

    return true
  }

  /**
   * Logs out the user by clearing the local storage.
   * @returns {Promise<void>}
   * @static
   * @memberof NuLinkHDWallet
   */
  public static async logout(): Promise<void> {
    await store.clear()
  }

  /**
   * Creates a new wallet with the specified password and optional mnemonic phrase.
   * If no mnemonic phrase is provided, one will be generated automatically.
   * attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
   * @param {string} mnemonic - (Optional) The optional mnemonic phrase used to generate the wallet or generate a mnemonic phrase automatically
   * @param {string} newPassword - The password used to encrypt the wallet.
   * @returns {Promise<NuLinkHDWallet>} - Returns a new NuLinkHDWallet object.
   * @static
   * @memberof NuLinkHDWallet
   */
  static async createHDWallet(mnemonic: string, newPassword: string): Promise<NuLinkHDWallet> {
    //To create a wallet, you need to clear the local wallet storage first, to prevent the original local storage account from being too many, and there is only one account when creating it, which will cause multiple accounts to be restored when restoring
    await NuLinkHDWallet.logout()
    return await NuLinkHDWallet.restoreHDWallet(mnemonic, newPassword)
  }

  /**
   *
   * Restores a NuLinkHDWallet using a mnemonic phrase and optional data/file binary string.
   * attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
   * @param {string} mnemonic - The mnemonic phrase used to restore the wallet.
   * @param {string} newPassword - The password used to encrypt the wallet.
   * @param {string} [dataBinaryString=''] - The optional binary string of a data/file to restore the wallet from. The dataBinaryString is returned by the exportWalletData function
   * If a data/file binary string is provided, the wallet's account data will be restored from it. Otherwise, a new account will be created.
   * @returns {Promise<NuLinkHDWallet>} - Returns a new NuLinkHDWallet object.
   * @throws {Error} - Throws an error if the restore wallet tag is missing or if the wallet could not be restored from the data/file.
   * @static
   * @memberof NuLinkHDWallet
   */
  public static async restoreHDWallet(
    mnemonic: string,
    newPassword: string,
    dataBinaryString = ''
  ): Promise<NuLinkHDWallet> {
    const nulinkHDWallet = new NuLinkHDWallet()

    nulinkHDWallet.mnemonic = pwdEncrypt(mnemonic, null, false)
    nulinkHDWallet.createType = HDWalletCreateType.Mnemonic

    nulinkHDWallet.hdWallet = await commonGetHDWallet(mnemonic)
    //Note that this line cannot be placed later, the wallet object getHDWallet().hdWallet needs to be used when restoring account data
    await setHDWalletInstance(nulinkHDWallet, false)
    // console.log("restoreHDWallet set _HdWallet", getHDWallet());
    if (dataBinaryString) {
      if (RESTORE_WALLET_TAG === dataBinaryString) {
        await nulinkHDWallet.restoreDataByStrategyInfos(newPassword)
      } else {
        await nulinkHDWallet.recoverUserData(newPassword, dataBinaryString)
      }
    } else {
      //no data so create new Account
      // Restore the public and private keys of the 0th account
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const account: Account = await nulinkHDWallet.accountManager.createAccount('account1', true)
      assert(!!account)
      //console.log("account", account);
      //TODO: need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
      // import { createAccount as cAccount, createAccountIfNotExist } from "@feats/pre/api/workflow";
      // await createAccountIfNotExist(account);
    }

    // need to be placed after the restore data
    await nulinkHDWallet.getCryptoBroker()
    await nulinkHDWallet.savePassword(newPassword)
    await nulinkHDWallet.saveMnemonicByPassword(newPassword)
    await nulinkHDWallet.saveHDWalletCreateType(newPassword, HDWalletCreateType[HDWalletCreateType.Mnemonic])
    await nulinkHDWallet.saveEncryptedKeyIv(newPassword)

    await setHDWalletInstance(nulinkHDWallet, true)

    return nulinkHDWallet
  }

  /**
   * Restores an HDWallet object using a root extended private key and optional user data.
   *
   * @remarks
   * This static method restores an HDWallet object by using a provided root extended private key and optional user data.
   * If user data is provided, the function attempts to restore accounts and other data associated with the wallet. If no user data is provided,
   * the function creates a new account. The restored or new HDWallet object is encrypted with the provided password and returned.
   *
   * attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
   *
   * @param {string} privateKeyString - The root extended private key used to generate sub-accounts and access funds.
   * @param {string} newPassword - The password used to encrypt the HDWallet object.
   * @param {string} [dataBinaryString=''] - Optional parameter that contains user data, such as account information, in binary form.
   * @returns {Promise<NuLinkHDWallet>} - An encrypted HDWallet object containing account and user data.
   * @throws {Error}  Throws an InvalidRootExtendedPrivateKeyError if the provided private key does not follow the BIP32 standard.
   * @static
   * @memberof NuLinkHDWallet
   */
  public static async restoreHDWalletByRootExtendedPrivateKey(
    privateKeyString: string,
    newPassword: string,
    dataBinaryString = ''
  ) {
    /*
    According to the logical private key of metamask, only a single account can be recovered, but the wallet cannot be recovered. The recovery wallet is recovered through the mnemonic phrase.
    The recovery of the account is after the wallet is recovered (that is to say, there is a root private key, after at least one account), and the new account is based on address_index
    to restore a sub-account
    The current design is to only support a single account, so the task address_index must be


    Recovery of a single account (Wallet) is not supported, because a single account cannot be derived from the private key
    The extended private key (ExtendedPrivatekey) of BIP32, the sub-account is generated through the wallet root private key (ExtendedPrivatekey), the sub-account of the tree structure is deduced,
    So a single account cannot derive HDWallet.
    Our business is to derive the seventh-level strategy public and private keys and the sixth-level Verify public and private keys
    So there is no such function. Therefore, the export of the private key must be to export the extended private key of the root account, so it should not support keystore import.
    This is different from the traditional metamask function, metamask can only restore a single account (Wallet, ordinary wallet) through the private key,
    Not HDWallet
    */

    //xprv9s21ZrPH763K3ZHEEqE97kFhJaEQVguihMQzRAZRPk2GmotFdwBHroBecMAyj3Q7UM5ejQMVYYvrTriUf6uUHdrNBnFdsvPXShCU4eNAvGc
    if (!privateKeyString.startsWith('xprv')) {
      throw new exception.InvalidRootExtendedPrivateKeyError(
        'The Private Key must be a BIP32 Root Extended Private Key (e.g., xprv...)'
      )
    }

    const nulinkHDWallet = new NuLinkHDWallet()
    nulinkHDWallet.mnemonic = ''
    nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(privateKeyString, null, false)
    nulinkHDWallet.createType = HDWalletCreateType.RootExtendedPrivateKey

    try {
      nulinkHDWallet.hdWallet = commonGetHDWalletByRootExtendedPrivateKey(privateKeyString)
    } catch (error) {
      throw new exception.InvalidRootExtendedPrivateKeyError('Invalid Root Extended Private Key')
    }

    //Note that this line cannot be placed later, the wallet object getHDWallet().hdWallet needs to be used when restoring account data
    await setHDWalletInstance(nulinkHDWallet, false)
    // console.log("restoreHDWallet set _HdWallet", getHDWallet());
    if (dataBinaryString) {
      if (RESTORE_WALLET_TAG === dataBinaryString) {
        await nulinkHDWallet.restoreDataByStrategyInfos(newPassword)
      } else {
        await nulinkHDWallet.recoverUserData(newPassword, dataBinaryString)
      }
    } else {
      //no data so create new Account
      // Restore the public and private keys of the 0th account
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const account: Account = await nulinkHDWallet.accountManager.createAccount('', true)

      //TODO: need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
      // import { createAccount as cAccount, createAccountIfNotExist } from "@feats/pre/api/workflow";
      // await createAccountIfNotExist(account);
    }

    // need to be placed after the restore data
    await nulinkHDWallet.getCryptoBroker()
    await nulinkHDWallet.savePassword(newPassword)
    // wallet root private key recovery account
    await nulinkHDWallet.saveRootExtendedPrivateKeyByPassword(newPassword)
    await nulinkHDWallet.saveHDWalletCreateType(
      newPassword,
      HDWalletCreateType[HDWalletCreateType.RootExtendedPrivateKey]
    )
    await nulinkHDWallet.saveEncryptedKeyIv(newPassword)

    await setHDWalletInstance(nulinkHDWallet, true)

    return nulinkHDWallet
  }

  /**
   * restore wallet by the strategys of account stored in the backend db.
   * attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
   * @param {string} newPassword - new password
   * @param {string} rootExtendedPrivateKey - BIP32 root Extended PrivateKey. base58Key format：be startwith 'xprv'
   * @returns {Promise<NuLinkHDWallet>} - Returns a new NuLinkHDWallet object with the restored account.
   * @static
   * @memberof NuLinkHDWallet
   */
  public static async restoreWalletDataByRootExtendedPrivateKeyAndServerStrategyInfos(
    newPassword: string,
    rootExtendedPrivateKey: string
  ): Promise<NuLinkHDWallet> {
    const privateKeyString = pwdDecrypt(rootExtendedPrivateKey, true)
    return this.restoreHDWalletByRootExtendedPrivateKey(privateKeyString, newPassword, RESTORE_WALLET_TAG)
  }

  /**
   * Restores an account by the strategies of the account stored in the backend database.
   * attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
   * @param {string} newPassword - The password for the new wallet.
   * @param {string} mnemonic - The mnemonic phrase used to restore the wallet.
   * @returns {Promise<NuLinkHDWallet>} - Returns a new NuLinkHDWallet object with the restored account.
   * @static
   * @memberof NuLinkHDWallet
   */
  public static async restoreWalletDataByMnemonicAndServerStrategyInfos(
    newPassword: string,
    mnemonic: string
  ): Promise<NuLinkHDWallet> {
    const _mnemonic = pwdDecrypt(mnemonic, true)
    return this.restoreHDWallet(_mnemonic, newPassword, RESTORE_WALLET_TAG)
  }

  // restore account by data info
  // dataBinaryString is a H5 fileReader.readAsArrayBuffer() return value
  // attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  /**
   * Restores an account by data info (including the mnemonic (or root extended private key) and user data (strategy infos)).
   * @throws {@link UserDataCorruptedError}
   * @param {string} newPassword - The password for the new wallet.
   * @param {string} dataBinaryString - The binary string data/file used to restore the wallet. The dataBinaryString is returned by the exportWalletData function.
   * @returns {Promise<NuLinkHDWallet>} - Returns a new NuLinkHDWallet object with the restored account.
   * @static
   * @memberof NuLinkHDWallet
   */
  public static async restoreHDWalletByData(
    newPassword: string,
    dataBinaryString: string
  ): Promise<NuLinkHDWallet> {
    let dataJson: any = null
    try {
      dataJson = JSON.parse(dataBinaryString)
    } catch (error) {
      console.log('parseWalletData error: ', error)
      throw new exception.UserDataCorruptedError(
        'Existing data appears to be corrupted or tampered with by external parties!'
      )
    }

    if (dataJson.pcode) {
      const rootExtendedPrivateKey = pwdDecrypt(dataJson.pcode, true)
      return this.restoreHDWalletByRootExtendedPrivateKey(rootExtendedPrivateKey, newPassword, dataBinaryString)
    } else if (dataJson.mcode) {
      const mnemonic = pwdDecrypt(dataJson.mcode, true)
      return this.restoreHDWallet(mnemonic, newPassword, dataBinaryString)
    } else {
      console.log('parseWalletData error: Wallet Wallet data missing')
      throw new exception.UserDataCorruptedError(
        ' Existing data is missing; possible tampering or destruction has occurred!'
      )
    }
  }

  /**
   * Get the Ethereum wallet
   * @return {EthWallet} - Ethereum wallet
   * @memberof NuLinkHDWallet
   */
  private wallet(): EthWallet {
    assert(!util.isBlank(this.hdWallet))
    return (this.hdWallet as hdkey).getWallet()
  }

  /**
   * Get the root account key pair
   * @return {KeyPair} - Key pair of the root account
   * @memberof NuLinkHDWallet
   */
  private getRootAccountKeyPair(): KeyPair {
    const wallet = this.wallet()

    return new KeyPair(wallet.getPublicKeyString(), wallet.getPrivateKeyString())
  }

  /**
   * @internal
   * Get the CryptoBroker object
   * @param {string} encryptedSymmetricKeyIv - Encrypted symmetric key and IV
   * @param {boolean} reCreate - Whether to recreate the CryptoBroker object
   * @param {boolean} save - Whether to save the CryptoBroker object
   * @return {Promise<CryptoBroker>} - Promise object representing the CryptoBroker object
   * @memberof NuLinkHDWallet
   */
  private async getCryptoBroker(encryptedSymmetricKeyIv = '', reCreate = false, save = true): Promise<CryptoBroker> {
    //Restore the object through encryptedSymmetricKeyIv

    if (!util.isBlank(this.cryptoBroker)) {
      this.cryptoBroker = this.cryptoBroker as CryptoBroker
      if (reCreate) {
        if (!util.isBlank(encryptedSymmetricKeyIv)) {
          //Note that after the load, since the key and iv are updated, allstr the data encrypted and saved by the key and iv need to be re-encrypted
          await this.cryptoBroker.load(encryptedSymmetricKeyIv, save)
        }
      } else {
        // console.debug("user old cryptoBroker", this.cryptoBroker);
      }
      return this.cryptoBroker
    }

    const rootAccountKeyPair: KeyPair = this.getRootAccountKeyPair()
    this.cryptoBroker = await CryptoBroker.cryptoBrokerFactoryByEncryptedKeyIV(
      rootAccountKeyPair,
      encryptedSymmetricKeyIv,
      save
    )
    // console.debug("getCryptoBroker cryptoBroker", this.cryptoBroker);
    return this.cryptoBroker as CryptoBroker
  }

  /**
   * Restore data using the strategies of the accounts stored in the backend database.
   * @param {string} newPassword - New password for encryption
   * @param {DataStrategyRecoveryMode} _mode - Recovery mode for restoring data strategies
   * @return {Promise<void>} - Promise object representing the completion of restoring data
   * @memberof NuLinkHDWallet
   */
  public async restoreDataByStrategyInfos(
    newPassword: string,
    _mode: DataStrategyRecoveryMode = DataStrategyRecoveryMode.Union
  ) {
    //1. Data to be restored when restoring the account:
    //Restore the verify keyPair and strategy data of the master account and
    //All sub-account data (encrypted KeyPair, verify keyPair and strategy data) (ie import data)
    //Only restore the last output if the account address exists and does not exist

    //2. There are two situations in restoring account data
    //1️⃣.Restore data at the same time when restoring the account
    // At this point, the program can control the process to restore the data first (key, iv is determined), and then restore the account
    //
    //2️⃣. First restore the account, then restore the data
    // When restoring the account, key, iv are randomly generated
    //Restore the data: because the encryption key key, iv is restored to another value, so you need to re-save key, iv
    //And and locally stored data (because the original data is the last key, iv saved data)

    //Specific implementation, first restore the wallet (mnemonic or root extended private key) => restorekHDWallet

    //The logic here should be the data of all imported accounts

    try {
      await setHDWalletInstance(this, false) //need to save for AccountManager.loadSaved() works

      this.accountManager = await AccountManager.restoreDefaultAccount()

      this.savePassword(newPassword)
      this.saveEncryptedKeyIv(newPassword)
    } catch (error) {
      console.error(error)
      throw new Error('Data recovery has failed') // data recovery failed
    }

    //Note: The method of calling this function needs to save the account-related data after the call (decentralized storage)
  }

  /**
   * Recover user data to current NuLinkHDWallet object using the provided encrypted data/file.
   * @param {string} newPassword - New password for encryption
   * @param {string} dataBinaryString - Encrypted data/file as a binary string
   * @param {DataStrategyRecoveryMode} _mode - Recovery mode for restoring data strategies
   * @return {Promise<void>} - Promise object representing the completion of recovering user data
   * @memberof NuLinkHDWallet
   */
  public async recoverUserData(
    newPassword: string,
    dataBinaryString = '',
    _mode: DataStrategyRecoveryMode = DataStrategyRecoveryMode.Union
  ) {
    //1. Data to be restored when restoring the account:
    //Restore the verify keyPair and strategy data of the master account and
    //All sub-account data (encrypted KeyPair, verify keyPair and strategy data) (ie import data)
    //Only restore the last output if the account address exists and does not exist

    //2. There are two situations in restoring account data
    //1️⃣.Restore data at the same time when restoring the account
    // At this point, the program can control the process to restore the data first (key, iv is determined), and then restore the account
    //
    //2️⃣. First restore the account, then restore the data
    // When restoring the account, key, iv are randomly generated
    //Restore the data: because the encryption key key, iv is restored to another value, so you need to re-save key, iv
    //And and locally stored data (because the original data is the last key, iv saved data)

    //Specific implementation, first restore the wallet (mnemonic or root extended private key) => restorekHDWallet

    //The logic here should be the data of all imported accounts

    try {
      const dataJson = JSON.parse(dataBinaryString)

      const encryptedSymmetricKeyIv: string = dataJson.seed
      // console.log(`recoverUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedSymmetricKeyIv)}`);

      const cryptoBroker = await this.getCryptoBroker(encryptedSymmetricKeyIv, true)
      const nulinkHDWallet = await NuLinkHDWallet.load(await cryptoBroker.decryptData(dataJson.data), true, false)
      nulinkHDWallet.savePassword(newPassword)
      // update the current object
      this.copyConstructor(nulinkHDWallet, newPassword)

      this.saveEncryptedKeyIv(newPassword)
    } catch (error) {
      console.error(error)
      throw new Error('Data recovery has failed') // data recovery failed
    }

    //Note: The method of calling this function needs to save the account-related data after the call (decentralized storage)
  }

  /**
   * Export user data as an encrypted data/file.
   * @param {string} password - Password for decrypt nulink wallet
   * @return {Promise<string>} - Promise object representing the encrypted data/file as a string
   * @memberof NuLinkHDWallet
   */
  public async exportUserData(password: string): Promise<string> {
    //Export user data, return the data/file stream, the front end needs to be downloaded directly to the local
    //The logic here should be to export the data of all accounts to file

    //The beginning of the exported json file should be the key and iv of the symmetric key encrypted by the private key, followed by data
    // { seed: encryptedstring({ key: ekey, iv: iv}), data: encrypteddata}

    //First verify that the password is correct
    if (!(await this.verifyPassword(password))) {
      throw new Error('Incorrect password')
    }
    // console.log("persistHDWallet HDWALLET_ENCRYPT_STR", HDWALLET_ENCRYPT_STR);
    // console.log("persistHDWallet password", password);

    const strategyIdJsonString = pwdEncrypt(JSON.stringify({ strategyIds: this.strategyIds() }), null, false)
    const accountIdsJsonString = pwdEncrypt(JSON.stringify({ accountIds: this.accountIds() }), null, false)

    //Ensure key, iv have value
    const cryptoBroker = await this.getCryptoBroker()
    const encryptedKeyIv: string = await cryptoBroker.dump()
    // console.log("exportUserData before seed");
    const jsonData = {
      seed: encryptedKeyIv,
      data: await cryptoBroker.encryptData(await this.dump()),
      strategyIds: strategyIdJsonString, //the data not so important, Just for the convenience of deciding the version
      accountIds: accountIdsJsonString //the data not so important, Just for the convenience of deciding the version
    }
    // console.log(`exportUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedKeyIv)}`);

    return JSON.stringify(jsonData)
  }

  /**
   * Exports the wallet data (include user data and mnemonic or private key) as a binary string.
   * @param {string} password - The password used to decrypt the wallet.
   * @returns {Promise<string>} - Returns a binary string of the exported wallet data.
   * @memberof NuLinkHDWallet
   */
  public async exportWalletData(password: string): Promise<string> {
    //First verify that the password is correct
    if (!(await this.verifyPassword(password))) {
      throw new Error('Incorrect password')
    }
    // console.log("persistHDWallet HDWALLET_ENCRYPT_STR", HDWALLET_ENCRYPT_STR);
    // console.log("persistHDWallet password", password);

    const strategyIdJsonString = pwdEncrypt(JSON.stringify({ strategyIds: this.strategyIds() }), null, false)
    const accountIdsJsonString = pwdEncrypt(JSON.stringify({ accountIds: this.accountIds() }), null, false)

    //Ensure key, iv have value
    const cryptoBroker = await this.getCryptoBroker()
    const encryptedKeyIv: string = await cryptoBroker.dump()
    // console.log("exportUserData before seed");

    const jsonData = {
      seed: encryptedKeyIv,
      data: await cryptoBroker.encryptData(await this.dump()),
      strategyIds: strategyIdJsonString, //the data not so important, Just for the convenience of deciding the version
      accountIds: accountIdsJsonString //the data not so important, Just for the convenience of deciding the version
    }

    // console.log(`exportUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedKeyIv)}`);
    const mnemonic = await this.getMnemonic(password)

    if (mnemonic) {
      jsonData['mcode'] = pwdEncrypt(mnemonic, null, false)
    } else {
      const rootExtendedPrivateKey = await this.getRootExtendedPrivateKey(password)
      jsonData['pcode'] = pwdEncrypt(rootExtendedPrivateKey as string, null, false)
    }

    return JSON.stringify(jsonData)
  }

  /**
   * Get the mnemonic phrase for the master account.
   * @param {string} password - Password for decryption
   * @return {Promise<string|null>} - Promise object representing the mnemonic phrase for the master account
   * @memberof NuLinkHDWallet
   */
  public async getMnemonic(password: string): Promise<string | null> {
    if (await this.verifyPassword(password)) {
      //this must be plainText
      const mnemonic = pwdDecrypt(this.mnemonic, true)
      return mnemonic
    }

    return null
  }

  /**
   * Get the base58 root extend private key for the master account.
   * @param {string} password - Password for decryption
   * @return {Promise<string|null>} - Promise object representing the base58 root extend private key for the master account
   * @memberof NuLinkHDWallet
   */
  public async getRootExtendedPrivateKey(password: string): Promise<string | null> {
    assert(!!this.hdWallet)

    if (await this.verifyPassword(password)) {
      const buffer: Buffer = this.hdWallet.privateExtendedKey()
      return buffer.toString()
    }

    return null
  }

  /**
   * @internal
   * Calculate the password hash using Keccak-256 algorithm and a salt.
   * @param {string} password - Password string
   * @param {string} salt - Salt string
   * @return {Promise<string>} - Promise object representing the calculated password hash
   * @memberof NuLinkHDWallet
   */
  private async calcPasswordHash(password: string, salt: string): Promise<string> {
    //The length of the salt we use here is 21 (nanoid())
    assert(!util.isBlank(this.hdWallet))

    const sk: string = this.wallet().getPrivateKeyString()
    // console.log("calcPasswordHash before sign",password + salt, sk);
    //sign will raise exception Failed to execute 'sign' on 'SubtleCrypto': parameter 2 is not of type 'CryptoKey'.
    // const signed = await sign(password + salt, sk);
    const signed = md5(password + salt + sk, { encoding: 'string' })
    const hash = new Keccak(256)
    hash.update(signed)
    return hash.digest('hex') + salt
    // return password;
  }

  /**
   * Verifies a password by comparing it to the previously saved hashed password.
   * @throws {@link AssertionError} - Throws an error if the hdWallet or passwordHash is blank.
   * @param {string} password - The password to verify.
   * @returns {Promise<boolean>} - Returns true if the password is verified, false otherwise.
   * @memberof NuLinkHDWallet
   */
  public async verifyPassword(password: string): Promise<boolean> {
    assert(!util.isBlank(this.hdWallet))

    // Compare local storage for the same
    if (util.isBlank(this._passwordHash)) {
      this._passwordHash = await this.decryptSavedData(macro.passwordHash)
      if (!this._passwordHash) {
        //debugger;
      }
    }

    assert(!util.isBlank(this._passwordHash))

    const salt = this._passwordHash.slice(-21)

    const toBeVerifiedPasswordHash = await this.calcPasswordHash(password, salt)

    return toBeVerifiedPasswordHash === this._passwordHash
  }
  /**
   * Retrieves the AccountManager object associated with the NuLinkHDWallet.
   * @returns {AccountManager}
   * @memberof NuLinkHDWallet
   */
  public getAccountManager() {
    return this.accountManager
  }

  /**
   * Set the account manager for the wallet.
   * @param {AccountManager} _accountManager - Account manager object
   * @memberof NuLinkHDWallet
   */
  public setAccountManager(_accountManager: AccountManager) {
    this.accountManager = _accountManager
  }

  /**
   * @internal
   * Save the password hash to the browser's local storage.
   * @param {string} passwordHash - Password hash string
   * @return {Promise<void>} - Promise object representing the completion of saving password hash
   * @memberof NuLinkHDWallet
   */
  private async savePassword(password: string): Promise<string> {
    //return password hash
    assert(this.hdWallet != null)
    const salt = nanoid()
    this._passwordHash = await this.calcPasswordHash(password, salt)
    if (!this._passwordHash) {
      //debugger;
    }
    console.log('NuLinkHDWallet savePassword _passwordHash', this._passwordHash)
    // store to local
    await this.savePasswordHash(this._passwordHash)

    return this._passwordHash
  }

  /**
   * @internal
   * Save the password hash to the browser's local storage.
   * @param {string} passwordHash - Password hash string
   * @return {Promise<void>} - Promise object representing the completion of saving password hash
   * @memberof NuLinkHDWallet
   */
  private async savePasswordHash(passwordHash: string) {
    // store to local
    await this.encryptSaveData(macro.passwordHash, passwordHash)
    // console.log("savePasswordHash  passwordHash: ", passwordHash);
  }

  /**
   * @internal
   * Get the saved password hash from the browser's local storage.
   * @return {Promise<string>} - Promise object representing the saved password hash
   * @memberof NuLinkHDWallet
   */
  private async getSavedPasswordHash(): Promise<string> {
    //return password hash
    return await this.decryptSavedData(macro.passwordHash)
  }

  /**
   * @internal
   * Save the mnemonic phrase to the browser's local storage.
   * @return {Promise<void>} - Promise object representing the completion of saving the mnemonic phrase
   * @memberof NuLinkHDWallet
   */
  private async saveMnemonic() {
    // Save the mnemonic to the local via the symmetric key
    //this must be plainText
    const mnemonic = pwdDecrypt(this.mnemonic, true)

    await this.encryptSaveData(macro.mnemonicKey, mnemonic)
  }

  /**
   * @internal
   * Get the saved mnemonic phrase from the browser's local storage.
   * @return {Promise<string>} - Promise object representing the saved mnemonic phrase
   * @memberof NuLinkHDWallet
   */
  private async getSavedMnemonic() {
    // Get the locally saved mnemonic through the symmetric key
    return await this.decryptSavedData(macro.mnemonicKey)
  }

  /**
   * @internal
   * Save the mnemonic phrase to the browser's local storage with an additional password.
   * @param {string} password Password for encryption
   * @return {Promise<void>}- Promise object representing the completion of saving the mnemonic phrase
   * @memberof NuLinkHDWallet
   */
  private async saveMnemonicByPassword(password: string) {
    // Save the mnemonic to the local with the password
    if (util.isBlank(this.mnemonic)) {
      return
    }
    const mnemonic = pwdDecrypt(this.mnemonic, true)
    await CryptoBroker.encryptWithPasswordSave(mnemonic, password, macro.mnemonicByPassword)
  }

  /**
   * @internal
   * Get the saved mnemonic phrase from the browser's local storage with an additional password.
   * @param {string} password - Password for decryption
   * @return {Promise<string>} - Promise object representing the saved mnemonic phrase
   * @memberof NuLinkHDWallet
   */
  private async getSavedMnemonicByPassword(password: string) {
    // Get the local mnemonic by password

    return await CryptoBroker.decryptWithPasswordSaved(password, macro.mnemonicByPassword)
  }

  /**
   * @internal
   * Save the root extended private key to the browser's local storage.
   * @return {Promise<void>} - Promise object representing the completion of saving the root extended private key
   * @memberof NuLinkHDWallet
   */
  private async saveRootExtendedPrivateKey() {
    // Save the mnemonic to the local via the symmetric key
    const rootExtendedPrivateKey = pwdDecrypt(this.rootExtendedPrivateKey, true)
    await this.encryptSaveData(macro.rootExtendedPrivateKey, rootExtendedPrivateKey)
  }

  /**
   * @internal
   * Get the saved root extended private key from the browser's local storage.
   * @return {Promise<string>} - Promise object representing the saved root extended private key
   * @memberof NuLinkHDWallet
   */
  private async getSavedRootExtendedPrivateKey(): Promise<string> {
    // Get the locally saved mnemonic through the symmetric key
    return await this.decryptSavedData(macro.rootExtendedPrivateKey)
  }

  /**
   * @internal
   * Save the root extended private key to the browser's local storage with an additional password.
   * @param {string} password - Password for encryption
   * @return {Promise<void>} - Promise object representing the completion of saving the root extended private key
   * @memberof NuLinkHDWallet
   */
  private async saveRootExtendedPrivateKeyByPassword(password: string) {
    // Save the wallet root private key to the local with the password
    let rootExtendedPrivateKey: string = commonGetRootExtendedPrivateKey(getHDWalletInstance().hdWallet).toString()

    rootExtendedPrivateKey = pwdDecrypt(rootExtendedPrivateKey, true)

    await CryptoBroker.encryptWithPasswordSave(rootExtendedPrivateKey, password, macro.rootExtendedPrivateKeyByPassword)
  }

  /**
   * @internal
   * Get the saved root extended private key from the browser's local storage with an additional password.
   * @param {string} password - Password for decryption
   * @return {Promise<string>} - Promise object representing the saved root extended private key
   * @memberof NuLinkHDWallet
   */
  private async getSavedRootExtendedPrivateKeyByPassword(password: string): Promise<string> {
    //Get the local (wallet) root private key through the password
    return await CryptoBroker.decryptWithPasswordSaved(password, macro.rootExtendedPrivateKeyByPassword)
  }

  /**
   * @internal
   * Save the HD wallet creation type (mnemonic or root extended private key) to the browser's local storage with an additional password.
   * @param {string} password - Password for encryption
   * @param {string} hDWalletCreateType - HD wallet creation type
   * @return {Promise<void>} - Promise object representing the completion of saving the HD wallet creation type
   * @memberof NuLinkHDWallet
   */
  private async saveHDWalletCreateType(password: string, hDWalletCreateType: string) {
    // Save the wallet create(restore) type : Mnemonic or RootExtendedPrivateKey
    await CryptoBroker.encryptWithPasswordSave(hDWalletCreateType, password, macro.hDWalletCreateType)
  }

  /**
   * @internal
   * Retrieves the saved HD wallet create type by decrypting it with the supplied password.
   * @param password {string} - The password to use for decryption.
   * @returns {Promise<string>} - A Promise that resolves to the decrypted HD wallet create type as a string.
   * @memberof NuLinkHDWallet
   */
  private async getSavedHDWalletCreateType(password: string): Promise<string> {
    //Get the local (wallet) root private key through the password
    return await CryptoBroker.decryptWithPasswordSaved(password, macro.hDWalletCreateType)
  }

  /**
   * @internal
   * Saves the encrypted symmetric key and initialization vector (IV) to browser local storage using the supplied password.
   * @param password {string} - The password to use for encrypting and saving the key and IV.
   * @returns {Promise<void>}
   * @memberof NuLinkHDWallet
   */
  private async saveEncryptedKeyIv(password: string) {
    //Save the encrypted symmetric key key,iv to the local by password
    const cryptoBroker = await this.getCryptoBroker()
    const encryptedKeyIv: string = await cryptoBroker.dump()

    // console.log("saveEncryptedKeyIv encryptedKeyIv: ", encryptedKeyIv);
    await CryptoBroker.encryptWithPasswordSave(encryptedKeyIv, password, macro.encryptedKeyIvByPassword)
  }

  /**
   * @internal
   * Retrieves the saved encrypted symmetric key and initialization vector (IV) by decrypting it with the supplied password.
   * @param password {string} - The password to use for decryption.
   * @returns {Promise<string>} - A Promise that resolves to the decrypted encrypted key and IV as a string.
   * @memberof NuLinkHDWallet
   */
  private async getSavedEncryptedKeyIv(password: string): Promise<string> {
    //Get the local encrypted symmetric key key,iv through the password
    const encryptedKeyIv: string = await CryptoBroker.decryptWithPasswordSaved(password, macro.encryptedKeyIvByPassword)
    // console.log("getSavedEncryptedKeyIv encryptedKeyIv: ", encryptedKeyIv);

    return encryptedKeyIv
  }

  /**
   * @internal
   * Encrypts and saves the supplied plaintext data to browser local storage using the specified key.
   * @param saveKey {string} - The key to use for saving the encrypted data.
   * @param plainText {string} - The plaintext data to encrypt and save.
   * @returns {Promise<string>} - A Promise that resolves to the encrypted data as a string.
   * @memberof NuLinkHDWallet
   */
  private async encryptSaveData(saveKey: string, plainText: string): Promise<string> {
    const cryptoBroker = await this.getCryptoBroker()
    const result = await cryptoBroker.encryptSaveData(saveKey, String(plainText))
    //this the is very important for sync the HDWallet object to background
    await setHDWalletInstance(this, true)
    return result
  }
  /**
   * @internal
   * Decrypts the data that was previously saved using the specified key.
   * @param savedKey {string} -The key that was used to save the encrypted data.
   * @returns {Promise<string>} - A Promise that resolves to the decrypted data as a string.
   * @memberof NuLinkHDWallet
   */
  private async decryptSavedData(savedKey: string): Promise<string> {
    const cryptoBroker = await this.getCryptoBroker()
    // console.log("decryptSavedData cryptoBroker", cryptoBroker);
    // console.log("decryptSavedData savedKey", savedKey);
    return await cryptoBroker.decryptSavedData(savedKey)
  }

  /**
   * @internal
   * Removes the saved data associated with the specified key.
   * attention please: Use this function with caution as it may affect the overall storage interface.
   * @param savedKey {string} -The key that was used to save the data to be removed.
   * @returns {Promise<string>} - A Promise that resolves to the removed data as a string.
   * @memberof NuLinkHDWallet
   */
  private async removeSavedData(savedKey: string) {
    //Try not to call this function. If you delete a key without logic, it will destroy the overall storage interface.
    //Unless you know the consequences of deleting a key (such as load failure), don't do this lightly.
    const cryptoBroker = await this.getCryptoBroker()
    const result = await cryptoBroker.decryptSavedData(savedKey)
    await setHDWalletInstance(this, true)
    return result
  }

  /**
   * Returns an array of strategy IDs associated with all accounts of the current HD wallet instance.
   * @returns {string []} - An array of strategy IDs as strings.
   * @memberof NuLinkHDWallet
   */
  public strategyIds(): string[] {
    return this.accountManager.strategyIds()
  }

  /**
   * Returns an array of account IDs associated with all accounts of the current HD wallet instance.
   * @returns {string []} - An array of account IDs as strings.
   * @memberof NuLinkHDWallet
   */
  public accountIds(): string[] {
    return this.accountManager.accountIds()
  }

  /**
   * Returns a JSON string representation of the nulink wallet object.
   * @returns {Promise<string>} - Returns a JSON string representation of the  nulink wallet object.
   * @memberof NuLinkHDWallet
   */
  public async dump(): Promise<string> {
    if (!this._passwordHash) {
      this._passwordHash = await this.getSavedPasswordHash()
      // debugger;
    }
    // console.log("NuLinkHDWallet dump _passwordHash", this._passwordHash);
    //encrypt mnemonic
    const mnemonic = pwdEncrypt(this.mnemonic, null, false)

    let rootExtendedPrivateKey =
      this.rootExtendedPrivateKey || commonGetRootExtendedPrivateKey(getHDWalletInstance().hdWallet).toString()

    rootExtendedPrivateKey = pwdEncrypt(rootExtendedPrivateKey, null, false)
    if (!this._passwordHash) {
      //debugger;
    }
    return JSON.stringify({
      pwdHash: this._passwordHash,
      mnemonic: mnemonic,
      rootExtendedPrivateKey: rootExtendedPrivateKey,
      createType: this.createType,
      acntManager: this.accountManager.dump(),
      encryptedKeyIv: await (await this.getCryptoBroker()).dump()
      //hdWallet can be recovered by mnemonic
      //cryptoBroker can be recovered through hdWallet, note that key and iv must be exported
    })
  }

  public static async parseUserDataVersionInfo(dataBinaryString: string): Promise<any | undefined> {
    //return sorted strategyId list

    if (!dataBinaryString) {
      return undefined
    }

    const jsonObj = JSON.parse(dataBinaryString)

    if (!jsonObj?.strategyIds) {
      throw new exception.UserDataVersionLowError(
        `Your user data version is outdated. Please import the latest data to utilize this function`
      )
    }

    try {
      const strategyIdJsonString = pwdDecrypt(jsonObj.strategyIds, true)
      const accountIdsJsonString = pwdDecrypt(jsonObj.accountIds, true)
      const strategyIdsJsonObject = JSON.parse(strategyIdJsonString)
      const accountIdsJsonObject = JSON.parse(accountIdsJsonString)

      if (util.isBlank(strategyIdsJsonObject?.strategyIds) || util.isBlank(accountIdsJsonObject?.accountIds)) {
        //please make sure the dataBinaryString is not empty
        throw new exception.UserDataCorruptedError('Data corrupted or tampered with by others !!')
      }

      if (accountIdsJsonObject?.accountIds.length < 1) {
        //accounts length is null
        throw new exception.UserDataCorruptedError(
          'Data is abnormal. Please attempt to re-export the data and subsequently re-import it.'
        )
      }

      return {
        strategyIds: strategyIdsJsonObject?.strategyIds,
        accountIds: accountIdsJsonObject?.accountIds
      }
    } catch (error) {
      console.log('parseUserDataAllStrategys error: ', error)
      throw new exception.UserDataCorruptedError('Data appears to be corrupted or tampered with by external parties!')
    }

    // const strategyIds: string[] = [];
    // const encryptedSymmetricKeyIv: string = jsonObj.seed;
    // // console.log(`recoverUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedSymmetricKeyIv)}`);
    // const save: boolean = false; //must be false, don't save, otherwise, the current data is overwritten
    // const cryptoBroker = await this.getCryptoBroker(encryptedSymmetricKeyIv, true, save);
    // dataBinaryString = await cryptoBroker.decryptData(jsonObj.data);

    // jsonObj = JSON.parse(dataBinaryString);

    // const nulinkHDWallet = new NuLinkHDWallet();

    // nulinkHDWallet.mnemonic = pwdEncrypt(jsonObj.mnemonic, null, false);
    // nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(jsonObj.rootExtendedPrivateKey, null, false);
    // nulinkHDWallet.createType = jsonObj.createType;

    // if (!util.isBlank(jsonObj.mnemonic)) {
    //   jsonObj.mnemonic = pwdDecrypt(jsonObj.mnemonic, true);
    //   nulinkHDWallet.hdWallet = await common.getHDWallet(jsonObj.mnemonic);
    // } else if (!util.isBlank(jsonObj.rootExtendedPrivateKey)) {
    //   jsonObj.rootExtendedPrivateKey = pwdDecrypt(jsonObj.rootExtendedPrivateKey, true);
    //   nulinkHDWallet.hdWallet = common.getHDWalletByRootExtendedPrivateKey(jsonObj.rootExtendedPrivateKey);
    // } else {
    //   throw new Error("NuLinkHDWallet load failed, reason: mnemonic or rootExtendedPrivateKey is blank");
    // }

    // //Note that reCreate must be set to true
    // // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // cryptoBroker = await nulinkHDWallet.getCryptoBroker(jsonObj.encryptedKeyIv, true, save);

    // //load origin password, when call the setHDWallet, Prevent password overwriting
    // nulinkHDWallet._passwordHash = await nulinkHDWallet.getSavedPasswordHash();
    // console.log("NuLinkHDWallet load _passwordHash", nulinkHDWallet._passwordHash);

    // const accountManager: AccountManager = await AccountManager.load(jsonObj.acntManager, false);

    // //
    // const accounts: Account[] = accountManager.getAllAccountSortByAccountId();
    // accounts.sort((account1, account2) => {
    //   return account1.address > account2.address ? 1 : account1.address < account2.address ? -1 : 0;
    // });

    // for (const index = 0; index < accounts.length; index++) {
    //   const account: Account = accounts[index];
    //   const strategys: Strategy[] = account.getAllStrategySortByStategyId();
    //   for (const j = 0; j < strategys.length; j++) {
    //     const strategy = strategys[j];
    //     strategyIds.push(strategy.id);
    //   }
    // }
    //
    // return strategyIds;
  }

  /**
   * Loads a nulink wallet object from a JSON string.
   * @param {string} jsonString - The JSON string to parse and load.
   * @param {boolean} [_save=false] - Whether to save the loaded object to browser local storage.
   * @param {boolean} [recoverPassword=true] - A boolean indicating whether or not to recover the password used to encrypt the HD wallet instance
   * @returns {Promise<NuLinkHDWallet>} - Returns a Promise that resolves with the nulink wallet object.
   * @static
   * @memberof NuLinkHDWallet
   */
  public static async load(jsonString: string, save = false, recoverPassword = true): Promise<NuLinkHDWallet> {
    const jsonObj = JSON.parse(jsonString)

    const nulinkHDWallet = new NuLinkHDWallet()

    nulinkHDWallet.mnemonic = pwdEncrypt(jsonObj.mnemonic, null, false)
    nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(jsonObj.rootExtendedPrivateKey, null, false)
    nulinkHDWallet.createType = jsonObj.createType

    if (!util.isBlank(jsonObj.mnemonic)) {
      jsonObj.mnemonic = pwdDecrypt(jsonObj.mnemonic, true)
      nulinkHDWallet.hdWallet = await commonGetHDWallet(jsonObj.mnemonic)
    } else if (!util.isBlank(jsonObj.rootExtendedPrivateKey)) {
      jsonObj.rootExtendedPrivateKey = pwdDecrypt(jsonObj.rootExtendedPrivateKey, true)
      nulinkHDWallet.hdWallet = commonGetHDWalletByRootExtendedPrivateKey(jsonObj.rootExtendedPrivateKey)
    } else {
      throw new Error('NuLinkHDWallet failed to load due to empty mnemonic or rootExtendedPrivateKey')
    }

    //Note that reCreate must be set to true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cryptoBroker = await nulinkHDWallet.getCryptoBroker(jsonObj.encryptedKeyIv, true)

    //note if not recoverPassword, You must set the password after calling this function
    if (recoverPassword) {
      if (!jsonObj.pwdHash) {
        nulinkHDWallet._passwordHash = await nulinkHDWallet.getSavedPasswordHash()
        // debugger;
      } else {
        nulinkHDWallet._passwordHash = jsonObj.pwdHash
      }

      // console.log("NuLinkHDWallet load recoverPassword pwdHash", jsonObj.pwdHash);
    } else {
      //load origin password, when call the setHDWallet, Prevent password overwriting
      nulinkHDWallet._passwordHash = await nulinkHDWallet.getSavedPasswordHash()
      console.log('NuLinkHDWallet load _passwordHash', nulinkHDWallet._passwordHash)
    }

    await setHDWalletInstance(nulinkHDWallet, false) //need to save for AccountManager.loadSaved() works
    //await cryptoBroker.load(jsonObj.encryptedKeyIv)

    nulinkHDWallet.accountManager = await AccountManager.load(jsonObj.acntManager, save)

    if (save) {
      if (recoverPassword) {
        if (!jsonObj.pwdHash) {
          //debugger;
        }
        if (!jsonObj || !jsonObj.pwdHash) {
          console.log('NuLinkHDWallet load savePasswordHash _passwordHash', jsonObj.pwdHash)
        }

        await nulinkHDWallet.savePasswordHash(jsonObj.pwdHash)
      }
      //await nulinkHDWallet.saveEncryptedKeyIv(password); //Set this value when nulinkhdWallet.load is called
      if (!util.isBlank(jsonObj.mnemonic)) {
        await nulinkHDWallet.saveMnemonic()
      } else if (!util.isBlank(jsonObj.rootExtendedPrivateKey)) {
        await nulinkHDWallet.saveRootExtendedPrivateKey()
      }
    }

    await setHDWalletInstance(nulinkHDWallet, true)

    return nulinkHDWallet
  }

  /**
   *
   * @throws {@link PasswordDecryptError}
   * @private
   * @static
   * @param {string} password
   * @return {*}  {(Promise<NuLinkHDWallet | null>)}
   * @memberof NuLinkHDWallet
   */
  private static async loadSaved(password: string): Promise<NuLinkHDWallet> {
    // Load wallet from storage with password

    if (isBlank(password)) {
      throw new exception.PasswordDecryptError('password not be null')
    }

    const nulinkHDWallet = new NuLinkHDWallet()

    //Get the local encrypted symmetric key key through the password, iv: decrypt and get the encrypted save data later
    const encryptedKeyIv: string = await nulinkHDWallet.getSavedEncryptedKeyIv(password)

    const walletCreateType: string = await nulinkHDWallet.getSavedHDWalletCreateType(password)
    if (walletCreateType === HDWalletCreateType[HDWalletCreateType.Mnemonic]) {
      // Attempt to load wallet with mnemonic
      const mnemonic: string = await nulinkHDWallet.getSavedMnemonicByPassword(password)
      // console.log("mnemonic: ", mnemonic);
      if (util.isBlank(mnemonic)) {
        throw new exception.PasswordDecryptError(
          'load hdWallet failure, password error or the data is lost or incomplete'
        ) // data recovery failed
      }

      // console.log("loadSaved: 1");
      nulinkHDWallet.createType = HDWalletCreateType.Mnemonic
      nulinkHDWallet.hdWallet = await commonGetHDWallet(mnemonic)
      nulinkHDWallet.mnemonic = pwdEncrypt(mnemonic, null, false)

      try {
        await setHDWalletInstance(nulinkHDWallet, false) //need to save for commonGetRootExtendedPrivateKey(getHDWallet().hdWallet) works
        nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(
          commonGetRootExtendedPrivateKey(getHDWalletInstance().hdWallet).toString(),
          null,
          false
        )
      } catch (error) {}

      // console.log("loadSaved: nulinkHDWallet.hdWallet", nulinkHDWallet.hdWallet);
    } else {
      let rootExtendedPrivateKey = ''

      // The mnemonic is empty, try to load the wallet with the wallet root private key
      rootExtendedPrivateKey = await nulinkHDWallet.getSavedRootExtendedPrivateKeyByPassword(password)
      // console.log("rootExtendedPrivateKey: ", rootExtendedPrivateKey);
      if (util.isBlank(rootExtendedPrivateKey)) {
        throw new exception.PasswordDecryptError(
          'load hdWallet failure, password error or the data is lost or incomplete'
        ) // data recovery failed
      }
      // console.log("loadSaved: 2");
      nulinkHDWallet.createType = HDWalletCreateType.RootExtendedPrivateKey
      nulinkHDWallet.hdWallet = commonGetHDWalletByRootExtendedPrivateKey(rootExtendedPrivateKey)
      nulinkHDWallet.mnemonic = ''
      nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(rootExtendedPrivateKey, null, false)
      // console.log("loadSaved: nulinkHDWallet.hdWallet", nulinkHDWallet.hdWallet);
    }
    //Note that reCreate must be set to true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nulinkHDWallet.cryptoBroker = null
    const cryptoBroker = await nulinkHDWallet.getCryptoBroker(encryptedKeyIv, true)
    // console.log("loadSaved cryptoBroker: ", cryptoBroker);
    await setHDWalletInstance(nulinkHDWallet, false) //need to save for AccountManager.loadSaved() works
    nulinkHDWallet.accountManager = await AccountManager.loadSaved()
    // console.log("loadSaved: nulinkHDWallet.accountManager", nulinkHDWallet.accountManager);
    // console.log("loadSaved: nulinkHDWallet", nulinkHDWallet);

    //load origin password, when call the setHDWallet, Prevent password overwriting
    nulinkHDWallet._passwordHash = await nulinkHDWallet.getSavedPasswordHash()

    await setHDWalletInstance(nulinkHDWallet, true)

    return nulinkHDWallet
  }

  /**
   * Serializes the nulink wallet and encrypts it to 'Browser-local storage'.
   * Increase each key scattered storage (disk), and scattered loading (otherwise every modification needs to re-call hdwallet's serialize). The original serialize, deserialize can be used for import and export
   * @returns {Promise<void>}
   * @memberof NuLinkHDWallet
   */
  private async serialize(): Promise<void> {
    const nuLinkHDWalletEncStr: string = await this.dump()
    await this.encryptSaveData(this.getSaveKey(), nuLinkHDWalletEncStr)
  }

  /**
   * Deserializes the encrypted NuLinkHDWallet instance and returns the decrypted NuLinkHDWallet instance.
   * @returns {Promise<NuLinkHDWallet>} - A Promise that resolves to a new NuLinkHDWallet instance.
   * @memberof NuLinkHDWallet
   */
  private async deserialize(): Promise<NuLinkHDWallet> {
    const nuLinkHDWalletEncStr = await this.decryptSavedData(this.getSaveKey())
    return await NuLinkHDWallet.load(nuLinkHDWalletEncStr, true, true)
  }

  /**
   * @internal
   * Returns the marco suffix of nuink Wallet Manager Key .
   * @returns {string} - The save key as a string.
   * @memberof NuLinkHDWallet
   */
  private getSaveKey(): string {
    return macro.hdWalletManagerKey
  }

  /**
   * Decrypt the mnemonic phrase or root extended private key using the user's password, denoted as S1. Then, use S1 to generate a password to encrypt the data
   * @param plaintext {string} - The plaintext data to be encrypted.
   * @param password {string} - The user's password used to verify their identity and derive a password for the encryption.
   * @returns {Promise<string>} - A Promise that resolves to the encrypted data as a string.
   * @memberof NuLinkHDWallet
   */
  public async verifyPasswordAndEncrypt(plaintext: string, password: string /*userpassword*/): Promise<string> {
    //First verify that the password is correct
    if (!(await this.verifyPassword(password))) {
      throw new Error('Incorrect password')
    }
    let secretKey: string | null = ''
    if (this.createType === HDWalletCreateType.Mnemonic) {
      const mnemonic = await this.getMnemonic(password)
      const hdWallet: hdkey = await commonGetHDWallet(mnemonic as string)
      const rootExtendedPrivateKey = hdWallet.privateExtendedKey().toString()
      secretKey = rootExtendedPrivateKey
    } else {
      //HDWalletCreateType.RootExtendedPrivateKey;
      const rootExtendedPrivateKey = await this.getRootExtendedPrivateKey(password)
      secretKey = rootExtendedPrivateKey
    }

    assert(secretKey != null)

    //calc secretKey hash
    const hash = new Keccak(256)
    hash.update(secretKey)
    const salt = nanoid() //21
    const passwordHash = hash.digest('hex') + salt
    return CryptoBroker.encryptWithPassword(plaintext, passwordHash) + salt
  }

  /**
   * Use the mnemonic phrase or root extended private key to generate a password to encrypt the data
   * @param plaintext {string} - The plaintext data to be encrypted.
   * @returns {Promise<string>} - A Promise that resolves to the encrypted data as a string.
   * @memberof NuLinkHDWallet
   */
  public async encrypt(plaintext: string): Promise<string> {
    let secretKey: string | null = ''
    if (this.createType === HDWalletCreateType.Mnemonic) {
      const mnemonic = await pwdDecrypt(this.mnemonic, true)
      const hdWallet: hdkey = await commonGetHDWallet(mnemonic as string)
      const rootExtendedPrivateKey = hdWallet.privateExtendedKey().toString()
      secretKey = rootExtendedPrivateKey
    } else {
      //HDWalletCreateType.RootExtendedPrivateKey;
      const rootExtendedPrivateKey = pwdDecrypt(this.rootExtendedPrivateKey, true)
      secretKey = rootExtendedPrivateKey
    }

    assert(secretKey != null)

    //calc secretKey hash
    const hash = new Keccak(256)
    hash.update(secretKey)
    const salt = nanoid() //21
    const passwordHash = hash.digest('hex') + salt
    return CryptoBroker.encryptWithPassword(plaintext, passwordHash) + salt
  }

  /**
   * Decrypts the ciphertext using the wallet secret (mnemonic phrase or root extended private key).
   * @static
   * @param ciphertext {string} - The encrypted data to be decrypted.
   * @param walletSecret {string} - The wallet secret (mnemonic phrase or root extended private key) used to decrypt the data.
   * @returns {Promise<string>} - A Promise that resolves to the decrypted data as a string.
   * @memberof NuLinkHDWallet
   */
  public static async decrypt(ciphertext: string, walletSecret: macro.walletSecretKeyType): Promise<string> {
    let secretKey: string = ''
    if (!isBlank(walletSecret.mnemonic)) {
      try {
        const hdWallet: hdkey = await commonGetHDWallet(walletSecret.mnemonic as string)
        const rootExtendedPrivateKey = hdWallet.privateExtendedKey().toString()
        secretKey = rootExtendedPrivateKey
      } catch (error) {
        throw new exception.MnemonicError('mnemonic Error')
      }
    } else {
      if (!isBlank(walletSecret.rootExtendedPrivateKey)) {
        throw new exception.RootExtendedPrivateKeyError('RootExtendedPrivateKey Error')
      }
      secretKey = walletSecret.rootExtendedPrivateKey as string
    }
    //calc secretKey hash
    const hash = new Keccak(256)
    hash.update(secretKey)
    const salt = ciphertext.slice(-21) // const salt = nanoid() //21
    const passwordHash = hash.digest('hex') + salt

    return CryptoBroker.decryptWithPassword(ciphertext.slice(0, -21), passwordHash)
  }
}
