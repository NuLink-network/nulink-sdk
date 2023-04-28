// Importing the Required pakages from various sources
import { Buffer } from "buffer";
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
  getEthereumStrategyKeyPair as commonGetEthereumStrategyKeyPair,
} from "./common";
import { nanoid } from "nanoid"; //https://cloud.tencent.com/developer/article/1743958
import AwaitLock from "await-lock";
import { Keccak } from "sha3";
import assert from "assert-ts";
import { hdkey } from "ethereumjs-wallet";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sign, check } from "sign";
import * as macro from "../types";
import * as util from "../../utils/null";
import { CryptoBroker } from "./cryptography";
import * as exception from "../../utils/exception";
import { getWeb3 } from "./web3";
import Web3 from "web3";
import keccak256 from "keccak256";
// import encryptpwd from 'encrypt-with-password'
// import { generateRandomString } from 'ts-randomstring/lib'
// import { errors } from 'web3-core-helpers'

import md5 from "md5";
import {
  encrypt as pwdEncrypt,
  decrypt as pwdDecrypt,
} from "../../utils/passwordEncryption";
import { getContractInst } from "../../sol/contract";
import { CONTRACT_NAME } from "../../sol";
import { Contract, ContractOptions } from "web3-eth-contract";
import SingletonService from "singleton-service";
import { isBlank, store } from "../../utils";
import sleep from "await-sleep";
import { serverPost } from "../../servernet";

// import toBuffer from "typedarray-to-buffer";

// import { numberToArray} from "eccrypto-js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars

//https://github.com/ChainSafe/web3.js
export let web3: Web3; // eslint-disable-line

// const HDWALLET_ENCRYPT_STR = 'wallet.enc'
const HDWALLET_INSTANCE_NAME = "hdwallet";
const RESTORE_WALLET_TAG = "tag_restore_wallet_backend_db";

export const getHDWalletInstance = (): any => {
  // attention please -> Here take the data from memory, don't call loadHDWalletFromPersistence method
  return SingletonService.get<NuLinkHDWallet>(HDWALLET_INSTANCE_NAME);
};

const setHDWalletInstance = async (
  hdWallet: NuLinkHDWallet | null,
  persist = true
) => {
  if (!hdWallet) {
    console.log("setHDWallet failed cause by the NuLinkHDWallet is null");
    return;
  }
  assert(hdWallet != null);

  SingletonService.set<NuLinkHDWallet>(HDWALLET_INSTANCE_NAME, hdWallet, true);
  // if (persist) {
  //   await persistHDWallet(hdWallet)
  // }
};

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

//Restore verify keyPair and strategy data
//Only restore accounts exist, there is no final output
//If there are currently only 3 strategies (1, 2, 3) under the same account, but there are 5 strategy IDs (3, 4, 5, 6, 7) in the recovered data, the following situations exist
//Union merge result is (1,2,3,4,5,6,7)
//Cover coverage result is (3,4,5,6,7)
export enum DataStrategyRecoveryMode {
  Union,
  Cover,
}

export class Strategy extends IJson {
  accountAddressIndex: number;
  addressIndex: number; //Strategy address index
  id: string; //Mainly to correspond to the background, globally unique
  label: string;
  strategyKeyPair: KeyPair;

  constructor(
    accountAddressIndex: number,
    strategyAddressIndex: number,
    label: string,
    id = ""
  ) {
    //label's type and Id

    super();
    const keyPairDict: any = commonGetEthereumStrategyKeyPair(
      getHDWalletInstance().hdWallet,
      accountAddressIndex,
      strategyAddressIndex
    );

    this.accountAddressIndex = accountAddressIndex;
    this.addressIndex = strategyAddressIndex;

    if (!util.isBlank(id)) {
      this.id = id;
    } else {
      this.id = nanoid();
    }

    this.label = label;
    this.strategyKeyPair = new KeyPair(keyPairDict.pk, keyPairDict.sk);
    //this.serialize(this.getSaveKey());
    // Can't do it in the constructor (async), do it when the upper level is called
  }

  public getSaveKey(): string {
    return macro.strategyKey(this.accountAddressIndex, this.addressIndex);
  }

  public dump(): string {
    return JSON.stringify({
      acntAdrIndex: this.accountAddressIndex,
      sAdrIndex: this.addressIndex,
      id: this.id,
      label: this.label,
      //'strategyKeyPair': this.strategyKeyPair.dump()
      /*There is no need to dump this item, and it can be recovered through the account,
       because the mnemonic (or root extension private key), 
       account index and strategy index are determined, and the generated pk and sk must be*/
    });
  }

  public static async load(
    jsonString: string,
    _save = false
  ): Promise<Strategy | null> {
    try {
      const jsonObj = JSON.parse(jsonString);

      return new Strategy(
        jsonObj.acntAdrIndex,
        jsonObj.sAdrIndex,
        jsonObj.label,
        jsonObj.id
      );
    } catch (error) {
      console.log(`strategy load ${error}`);
      return null;
    }
  }

  public async serialize(): Promise<void> {
    const strategyString: string = this.dump();
    return await getHDWalletInstance().encryptSaveData(
      this.getSaveKey(),
      strategyString
    );
  }

  public async deserialize(): Promise<Strategy | null> {
    const strategyString = await getHDWalletInstance().decryptSavedData(
      this.getSaveKey()
    );
    return await Strategy.load(strategyString);
  }

  public async save() {
    //Store account individual policy information

    const nuLinkHDWallet = getHDWalletInstance();
    const accountDump = this.dump();
    await nuLinkHDWallet.encryptSaveData(
      macro.accountStrategyInfo(this.accountAddressIndex, this.addressIndex),
      accountDump
    );
  }

  public static async loadSaved(
    accountAddressIndex: number,
    addressIndex: number
  ) {
    //Get the storage of account individual policy information

    const strategyString = await getHDWalletInstance().decryptSavedData(
      macro.accountStrategyInfo(accountAddressIndex, addressIndex)
    );
    return await Strategy.load(strategyString);
  }

  public async erase() {
    const nuLinkHDWallet = getHDWalletInstance();
    //Remove account single policy storage information
    await nuLinkHDWallet.removeSavedData(
      macro.accountStrategyInfo(this.accountAddressIndex, this.addressIndex)
    );
  }
}

//Account class manages account information, adds policies, deletes policies, and serializes
export class Account extends IJson {
  name = "";
  address = "";
  addressIndex = -1;
  id = ""; //Mainly to correspond to the background, globally unique
  public encryptedKeyPair: KeyPair;
  public verifyKeyPair: KeyPair;
  private generateStrateAddressIndexLock = new AwaitLock(); //Generation strategy (key spanning tree path) index
  private strategyMapping = new Map<number, Strategy>(); //Strategy related information address_index: Strategy

  constructor(name: string, addressIndex: number, id = "") {
    super();
    this.name = name;
    this.addressIndex = addressIndex;

    let keyPairDict = getEthereumEncryptAccount(
      getHDWalletInstance().hdWallet,
      addressIndex
    );
    if (!util.isBlank(id)) {
      this.id = id;
    } else {
      //this.id = nanoid(); //we use the privatekey or mnemonic restore the account, the account id will lose, so the account id use the public key hash instead of nanoid()
      this.id = keccak256(keyPairDict.pk).toString("hex");
    }

    this.encryptedKeyPair = new KeyPair(keyPairDict.pk, keyPairDict.sk);
    this.address = keyPairDict.addr;
    keyPairDict = getEthereumVerifyAccount(
      getHDWalletInstance().hdWallet,
      addressIndex
    );
    this.verifyKeyPair = new KeyPair(keyPairDict.pk, keyPairDict.sk);
    //this.serialize(this.getSaveKey());
    //Can't do it in the constructor (async), do it when the upper level is called
  }

  public getSaveKey(): string {
    return macro.accountKey(this.addressIndex);
  }

  public setStrategyMapping(_strategyMapping: Map<number, Strategy>) {
    this.strategyMapping = _strategyMapping;
  }
  public async updateHDWalletAccountStrategys() {
    const nuLinkHDWallet = getHDWalletInstance();
    if (util.isBlank(nuLinkHDWallet)) {
      return false;
    }
    const accountManager = nuLinkHDWallet.getAccountManager();

    const accountMapping: Map<number, Account> = accountManager.accountMapping;

    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    const account: Account = accountMapping.get(this.addressIndex) as Account;
    account.setStrategyMapping(this.strategyMapping);

    await setHDWalletInstance(nuLinkHDWallet, true);
  }

  private async generateStrategyAddressIndex(): Promise<number> {
    //Get the policy index (maximum value) + 1 under the key spanning tree path (seventh level) of the current last policy, that is, the address_index required when creating the policy

    await this.generateStrateAddressIndexLock.acquireAsync();

    try {
      let max = -1;
      const keys = this.strategyMapping.keys();
      for (const addressIndex of Array.from(keys)) {
        // es6 no need use Array.from()
        if (addressIndex > max) {
          max = addressIndex;
        }
      }
      return max + 1;
    } finally {
      this.generateStrateAddressIndexLock.release();
    }
  }

  public getStrategyInfo(strategyId: string): Strategy | null {
    //Get the policy PK and SK by Strategy Id

    const values = this.strategyMapping.values();
    for (const strategyInfo of Array.from(values)) {
      // es6 no need use Array.from()
      if (strategyInfo.id === strategyId) {
        return strategyInfo;
      }
    }

    return null;
  }

  public async createStrategyByLabel(label: string): Promise<Strategy> {
    //label is composed of ID and incoming label common (in order to make label unique)
    const id: string = nanoid();
    return await this.createStrategy(`${label}_${id}`, id);
  }

  public async createStrategy(label: string, id = ""): Promise<Strategy> {
    //The default label should be the name of the incoming file. If it is repeated, add the policy id identifier (uuid)
    const strategyAddressIndex = await this.generateStrategyAddressIndex();
    const strategy: Strategy = new Strategy(
      this.addressIndex,
      strategyAddressIndex,
      label,
      id
    );
    this.strategyMapping.set(strategyAddressIndex, strategy);
    //Synchronize the hdWallet object
    await this.updateHDWalletAccountStrategys();
    //Because the strategy has no next-level data, the overall and decentralized storage are consistent
    await strategy.save();
    await this.saveAccountAllStrategyIndexInfo();
    console.log("createStrategy finish");
    return strategy;
  }

  //If the policy is deleted, address_index can be reused, because if the key generation tree path is certain, the public and private keys must be the same
  //But note that the ids are not the same, the resources shared in the background cannot be reused
  public async deleteStrategy(
    strategyAddressIndex: number
  ): Promise<Strategy | undefined> {
    // Note: To delete the policy, note that the policy cannot be deleted if there is a file share, and delete here is the bottom-level function.
    // Judging whether the deletion policy should be (with file sharing) should be judged by the upper-level function
    console.warn(
      "Delete policy, note that if there is a file share, the policy cannot be deleted. Here, the funcion is the Lowest level function. To determine whether the policy should be deleted (in a file share), it should be judged by the upper-level function"
    );

    let strategy: Strategy | undefined =
      this.strategyMapping.get(strategyAddressIndex);

    if (util.isBlank(strategy)) {
      return undefined;
    }

    this.strategyMapping.delete(strategyAddressIndex);

    //Synchronize the hdWallet object
    await this.updateHDWalletAccountStrategys();

    strategy = strategy as Strategy;
    await strategy.erase();
    await this.saveAccountAllStrategyIndexInfo();

    //Note to the front end, after deleting it, return it to the front end. The front end should call the backend interface to delete the backend policy id corresponding to the policy information    return strategy;
  }

  public getAllStrategy(): Strategy[] {
    const sortStrategyArray: Strategy[] = Array.from(
      this.strategyMapping.values()
    ).sort((strategy1, strategy2) =>
      strategy1.addressIndex < strategy2.addressIndex
        ? strategy1.addressIndex
        : strategy2.addressIndex
    );
    return sortStrategyArray;
  }

  public getAllStrategySortByStategyId(): Strategy[] {
    const sortStrategyArray: Strategy[] = Array.from(
      this.strategyMapping.values()
    ).sort((strategy1, strategy2) =>
      strategy1.id < strategy2.id ? -1 : strategy1.id > strategy2.id ? 1 : 0
    );
    return sortStrategyArray;
  }

  public getAccountStrategyByStategyId = (
    strategyId: string
  ): Strategy | undefined => {
    const strategys: Strategy[] = this.getAllStrategy();
    for (const strategy of strategys) {
      if (strategy.id === strategyId) {
        return strategy;
      }
    }

    return undefined;
  };

  public getStrategy(strategyAddressIndex: number): Strategy | undefined {
    return this.strategyMapping.get(strategyAddressIndex);
  }

  public getStrategyByLabel(label: string): Strategy | undefined {
    const values = this.strategyMapping.values();
    for (const strategy of Array.from(values)) {
      // Es6 does not require array.from ()
      if (strategy.label === label) {
        return strategy;
      }
    }

    return undefined;
  }

  public strategyIds(): string[] {
    const strategyIds: string[] = [];

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      strategyIds.push(strategy.id);
    }
    return strategyIds;
  }

  public dump(): string {
    const strategys: string[] = [];

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      strategys.push(strategy.dump());
    }

    return JSON.stringify({
      name: this.name,
      //'address': this.address, ////Dump is not required, the 'address' can be recovered from the account
      addressIndex: this.addressIndex,
      id: this.id,
      strategys: strategys,
      //'encryptedKeyPair': this.encryptedKeyPair.dump() //Dump is not required,，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
      //'verifyKeyPair': this.encryptedKeyPair.dump() //Dump is not required,，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
    });
  }
  
  //Get Policy Label's infos by address of account
  public static async getStrategyInfosFromServerByAddr(
    accountAddress: string
  ) {
    //accountAddress : string
    /*
    return data format: 
       [ { 'policy_label_id': '', 'policy_label':'', 'policy_label_index': '', 'policy_encrypted_pk':'', }, ...] 

       //policy_encrypted_pk: This is the encrypted_pk passed in the /file/create-policy-and-upload API interface
    
*/
    const sendData = {
      account_address: accountAddress,
    };

    const data = await serverPost("/label", sendData);
    return data;
  }

  //restore account by the strategys of account stored in the backend db.
  public static async restoreByStrategyInfos(): Promise<Account> {
    const account = new Account("", 0);

    //get strategys from backend db
    const strategyInfos: any =
      await Account.getStrategyInfosFromServerByAddr(
        account.address
      );

    for (const strategyInfo of strategyInfos) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const strategy: Strategy = new Strategy(
        Number(account.addressIndex),
        strategyInfo.policy_label_index,
        strategyInfo.policy_label,
        strategyInfo.policy_label_id
      );
      if (
        strategy.strategyKeyPair._publicKey.toLowerCase() !==
        strategyInfo.policy_encrypted_pk.toLowerCase()
      ) {
        //TODO: If the process goes this far Most likely there is a bug in the program
        //debugger;
        throw new Error(
          "There seems to be something wrong with the program, please contact the administrator"
        );
      }
      account.strategyMapping.set(Number(strategy.addressIndex), strategy);

      //await strategy.serialize(); //This operation is not done here, but is done when the account is recovered
    }

    await account.saveAccountItselfInfo();
    // await account.serialize(); //This operation is not done here, but is done when the account is recovered
    await account.saveAccountAllStrategyInfo();

    //saveAccountAllStrategyInfo : It calls, it doesn't have to be called again
    //await account.saveAccountAllStrategyIndexInfo();

    return account;
  }

  public static async load(jsonString: string, save = false): Promise<Account> {
    const jsonObj = JSON.parse(jsonString);

    const account = new Account(jsonObj.name, jsonObj.addressIndex, jsonObj.id);
    const strategys: string[] = jsonObj.strategys;
    for (const strategyString of strategys) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const strategy: Strategy | null = await Strategy.load(
        strategyString,
        save
      );
      const _strategy = strategy as Strategy;
      if (!isBlank(strategy)) {
        account.strategyMapping.set(_strategy.addressIndex, _strategy);
      }
      //await strategy.serialize(); //This operation is not done here, but is done when the account is recovered
    }

    // await account.serialize(); //This operation is not done here, but is done when the account is recovered
    if (save) {
      await account.saveAccountItselfInfo();
      await account.saveAccountAllStrategyInfo();

      //saveAccountAllStrategyInfo : It calls, it doesn't have to be called again
      //await account.saveAccountAllStrategyIndexInfo();
    }

    return account;
  }

  public static async loadSaved(addressIndex: number): Promise<Account | null> {
    const hdWalletInstance = await getHDWalletInstance();
    const accountItselfInfoString = await hdWalletInstance.decryptSavedData(
      macro.accountItselfInfo(addressIndex)
    );
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
      const accountItselfInfo = JSON.parse(accountItselfInfoString);

      const account = new Account(
        accountItselfInfo.name,
        accountItselfInfo.addressIndex,
        accountItselfInfo.id
      );

      const strategyIndexs: number[] =
        await account.getSavedAccountAllStrategyIndexInfo();

      for (const strategyIndex of strategyIndexs) {
        // We don’t escape the key '__proto__'
        // which can cause problems on older engines
        const strategy = await Strategy.loadSaved(
          account.addressIndex,
          strategyIndex
        );

        if (!isBlank(strategy)) {
          account.strategyMapping.set(
            Number(strategyIndex),
            strategy as Strategy
          );
        }
      }

      return account;
    } catch (error) {
      console.log(
        `account loadSaved  addressIndex ${addressIndex}, accountItselfInfoString:  ${accountItselfInfoString}`
      );
      console.error(error);
      // debugger;
      return null;
    }
  }

  public async serialize(): Promise<void> {
    const accountString: string = this.dump();
    return await getHDWalletInstance().encryptSaveData(
      this.getSaveKey(),
      accountString
    );
  }

  public async deserialize(): Promise<Account> {
    const accountString = await getHDWalletInstance().decryptSavedData(
      this.getSaveKey()
    );
    return await Account.load(accountString);
  }

  public async saveAccountItselfInfo() {
    //Store the current account source information, except for the policy information, all information is complete
    const cipherText: string = await getHDWalletInstance().encryptSaveData(
      macro.accountItselfInfo(this.addressIndex),
      JSON.stringify({
        name: this.name,
        addressIndex: this.addressIndex,
        id: this.id,
        //'encryptedKeyPair': this.encryptedKeyPair.dump()  //Dump is not required,，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
        //'verifyKeyPair': this.encryptedKeyPair.dump()  //Dump is not required,，It can be recovered through the account, because the mnemonic (or root extended private key), account index is determined, pk is generated, sk is certain
      })
    );

    // console.log(
    //   `saveAccountItselfInfo save accountItselfInfo addressIndex: ${this.addressIndex}, cipherText: ${cipherText}`
    // );
  }

  public async getSavedAccountItselfInfo() {
    // Get the storage of the current account source information, except for the policy information, all information is complete
    const accountItselfInfoString =
      await getHDWalletInstance().decryptSavedData(
        macro.accountItselfInfo(this.addressIndex)
      );

    // console.log(
    //   `getSavedAccountItselfInfo get accountItselfInfo addressIndex: ${this.addressIndex}, plaintext: ${accountItselfInfoString}`
    // );
    return JSON.parse(accountItselfInfoString);
  }

  public async removeSavedAccountItselfInfo() {
    const nuLinkHDWallet = getHDWalletInstance();
    // Delete the original storage information of the current account, except for the policy information, all storage information is complete
    await getHDWalletInstance().removeSavedData(
      macro.accountItselfInfo(this.addressIndex)
    );
  }

  public async saveAccountAllStrategyIndexInfo() {
    // store account index information

    console.log("save this.addressIndex: ", this.addressIndex);
    console.log(
      "save this.strategyMapping.keys(): ",
      JSON.stringify(Array.from(this.strategyMapping.keys()))
    );
    await getHDWalletInstance().encryptSaveData(
      macro.accountStrategyList(this.addressIndex),
      JSON.stringify(Array.from(this.strategyMapping.keys()))
    );
  }

  public async getSavedAccountAllStrategyIndexInfo(): Promise<number[]> {
    // store account index information
    const strategyListString = await getHDWalletInstance().decryptSavedData(
      macro.accountStrategyList(this.addressIndex)
    );
    if (util.isBlank(strategyListString)) {
      //No policy information is created for the original account
      return [];
    }
    //
    //debugger;
    console.log("getSaved this.addressIndex: ", this.addressIndex);
    console.log("getSaved strategyListString: ", strategyListString);
    return JSON.parse(strategyListString);
  }

  public async removeSavedAccountAllStrategyIndexInfo() {
    const nuLinkHDWallet = getHDWalletInstance();
    // remove account index storage information
    await nuLinkHDWallet.removeSavedData(
      macro.accountStrategyList(this.addressIndex)
    );
  }

  public async saveAccountAllStrategyInfo() {
    // Store all policy information of the current account

    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      await strategy.save();
    }

    await this.saveAccountAllStrategyIndexInfo();
  }

  public async removeSavedAccountAllStrategyInfo() {
    for (const strategy of Array.from(this.strategyMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      await strategy.erase();
    }

    // Remove all strategy index information of the current account
    await this.removeSavedAccountAllStrategyIndexInfo();
  }

  //get balance(): Promise<string> {
  public async balance(): Promise<string | any> {
    // Get account balance from Ethereum
    return await this.refreshBalance();
  }

  //   set balance(value: string) {
  //     this._balance = value;
  //   }

  public async refreshBalance(): Promise<string | any> {
    // Get account balance from Ethereum

    // const account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
    //web3.eth.accounts.wallet.add(account);
    web3 = await getWeb3();
    const address = Web3.utils.toChecksumAddress(
      this.address
      //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
    );

    let i = 0;
    while (i < 3)
      try {
        return Web3.utils.fromWei(await web3.eth.getBalance(address));
      } catch (e) {
        // if (e instanceof errors.ConnectionError) {

        // }
        i++;
        // Message.error(((e as any)?.message || e) as string);
        await sleep(1000);
        throw e;
      }
  }

  //get NLKbalance(): Promise<string> {
  public async getNLKBalance(): Promise<string | any> {
    // Get account NLK balance from Ethereum
    return await this.refreshNLKBalance();
  }

  public async refreshNLKBalance(): Promise<string | any> {
    // Get account balance from Ethereum

    // const account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
    //web3.eth.accounts.wallet.add(account);
    const contract: Contract = await getContractInst(CONTRACT_NAME.nuLinkToken);
    const address = Web3.utils.toChecksumAddress(
      this.address
      //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
    );

    let i = 0;
    while (i < 3)
      try {
        const result = await contract.methods.balanceOf(address).call(); // 29803630997051883414242659
        // Convert the value from Wei to Ether
        return Web3.utils.fromWei(result, "ether");
      } catch (e) {
        // if (e instanceof errors.ConnectionError) {

        // }
        i++;
        // Message.error(((e as any)?.message || e) as string);
        await sleep(1000);
        throw e;
      }
  }
}

// account management
export class AccountManager extends IJson {
  //accountCount: number = 0; //Number of current accounts
  private generateAccountAddressIndexLock = new AwaitLock(); //Generation strategy (key spanning tree path) index
  private accountMapping = new Map<number, Account>(); //Strategy related information address_index: Strategy
  public defaultAccountAddressIndex = 0;

  // constructor() {
  //   super();
  // }

  private async generateAddressIndex(): Promise<number> {
    //Get the policy index (maximum value) + 1 under the key spanning tree path (seventh level) of the current last policy, that is, the address_index required when creating the policy
    await this.generateAccountAddressIndexLock.acquireAsync();
    try {
      let max = -1;
      const keys = this.accountMapping.keys();
      for (const addressIndex of Array.from(keys)) {
        // es6 doesn't need Array.from()
        if (addressIndex > max) {
          max = addressIndex;
        }
      }
      return Number(max + 1);
    } finally {
      this.generateAccountAddressIndexLock.release();
    }
  }

  getAccountCount(): number {
    return this.accountMapping.size;
  }

  getAllAccount(): Account[] {
    const sortAccountArray: Account[] = Array.from(
      this.accountMapping.values()
    ).sort((account1, account2) =>
      account1.addressIndex < account2.addressIndex
        ? account1.addressIndex
        : account2.addressIndex
    );
    return sortAccountArray;
  }

  getAllAccountSortByAccountId(): Account[] {
    const sortAccountArray: Account[] = Array.from(
      this.accountMapping.values()
    ).sort((account1, account2) =>
      account1.id < account2.id ? -1 : account1.id > account2.id ? 1 : 0
    );
    return sortAccountArray;
  }

  restoreAccount(_privateKey: string, _dataFileBinaryString = "") {
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
    throw new Error("Restoring a single account is not supported");
  }

  restoreAccountByKeyStoreJson(
    _keystoreJson: string,
    _dataFileBinaryString = ""
  ) {
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
    throw new Error("Restoring a single account is not supported");
  }

  public async createAccount(name = "", defaultAccount = false) {
    const accountAddressIndex = await this.generateAddressIndex();

    if (util.isBlank(name)) {
      name = `account${accountAddressIndex + 1}`;
    }
    const account: Account = new Account(name, accountAddressIndex);

    this.accountMapping.set(accountAddressIndex, account);

    if (defaultAccount) {
      this.defaultAccountAddressIndex = accountAddressIndex;
    }

    //Synchronize the hdWallet object
    // this.updateHDWalletWhenAddOrUpdateAccount(account);
    await this.updateHDWalletAccountManager();

    //Increase the account storage of the local disk and encrypt it with the root private key
    //await account.serialize();

    // Do not store as a whole, the efficiency is too low, change to decentralized storage
    await this.saveAllAccountAddressIndex();
    await this.saveDefaultAccountAddressIndex();

    //Store account meta information in a decentralized manner
    await account.saveAccountItselfInfo();

    // attention please -------------------------
    //Decouple, move to external level with createAccount. when call the function "createAccount", TODO: You need to call the function of "createAccountIfNotExist" manually
    //create account record in center database
    //
    // await createAccountIfNotExist(account);
    //

    return account;
  }

  public async removeAccount(
    addressIndex: number
  ): Promise<Account | undefined> {
    // remove account
    //Note: To delete an account, note that if the policy in the account has a file share, the account cannot be deleted. Delete here is the bottom-level function.
    //Determine whether the account should be deleted (with file sharing), it should be judged by the upper-level function

    //Note that there is no function to delete accounts in metamask, consider whether to block this function here
    console.warn(
      "Delete an account, note that the policy in the account cannot delete the account if there is a file share. Delete here is the bottom-level function. To determine whether the account should be deleted (in a file share), it should be judged by the upper-level function"
    );

    if (addressIndex === 0) {
      //We think the 0th account is considered as the initial account and cannot be deleted (note that there is no function to delete accounts in metamask)
      //When restoring an account through a mnemonic or root extension private key, the 0th account is restored by default
      return undefined;
    }

    let account = this.accountMapping.get(addressIndex);
    if (!util.isBlank(account)) {
      this.accountMapping.delete(addressIndex);
      // delete the account storage on the local disk
      account = account as Account;

      // const nuLinkHDWallet = getHDWallet();
      // await getHDWallet().removeSavedData(account.getSaveKey());

      if (addressIndex === this.defaultAccountAddressIndex) {
        const addressIndexs: number[] = Array.from(this.accountMapping.keys());
        if (addressIndexs.length > 0) {
          this.defaultAccountAddressIndex = Number(addressIndexs[0]);
        } else {
          this.defaultAccountAddressIndex = 0; // No account anymore, 0 or -1 will do
        }
      }

      //Synchronize the hdWallet object
      // this.updateHDWalletWhenRemoveAccount(account.address);
      await this.updateHDWalletAccountManager();

      //Do not store as a whole, the efficiency is too low, change to decentralized storage
      //Save account index and account source information
      await this.saveAllAccountAddressIndex();
      await account.removeSavedAccountItselfInfo();
      // delete all policy information of the account
      await account.removeSavedAccountAllStrategyInfo();
    }

    await this.saveDefaultAccountAddressIndex();

    return account;
  }

  public async updateHDWalletAccountManager() {
    const nuLinkHDWallet = getHDWalletInstance();
    if (util.isBlank(nuLinkHDWallet)) {
      return;
    }
    nuLinkHDWallet.setAccountManager(this);
    await setHDWalletInstance(nuLinkHDWallet, true);
  }

  /*   public async updateHDWalletWhenRemoveAccount(
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
  public getAccount(index: number): Account | undefined {
    return this.accountMapping.get(index);
  }

  public getDefaultAccount(): Account | undefined {
    const index =
      Number(this.defaultAccountAddressIndex) >= 0
        ? Number(this.defaultAccountAddressIndex)
        : 0;
    return this.accountMapping.get(Number(index));
  }

  public strategyIds(): string[] {
    let strategyIds: string[] = [];

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const account of Array.from(this.accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      strategyIds = strategyIds.concat(account.strategyIds());
    }

    return strategyIds;
  }

  public accountIds(): string[] {
    const accountIds: string[] = [];

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const account of Array.from(this.accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      accountIds.push(account.id);
    }

    return accountIds;
  }

  public static async restoreDefaultAccount(): Promise<AccountManager> {
    const accountManager = new AccountManager();
    accountManager.defaultAccountAddressIndex = 0;

    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    const account: Account = await Account.restoreByStrategyInfos();
    accountManager.accountMapping.set(account.addressIndex, account);

    await accountManager.saveAllAccountAddressIndex();
    await accountManager.saveDefaultAccountAddressIndex();

    return accountManager;
  }

  public dump(): string {
    const accounts: string[] = [];

    // for (const [k, v] of Array.from(this.strategyMapping)) {
    for (const account of Array.from(this.accountMapping.values())) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      accounts.push(account.dump());
    }

    return JSON.stringify({
      default_index: this.defaultAccountAddressIndex,
      accounts: accounts,
    });
  }

  public static async load(
    jsonString: string,
    save = false
  ): Promise<AccountManager> {
    const jsonObj = JSON.parse(jsonString);

    const accountManager = new AccountManager();
    accountManager.defaultAccountAddressIndex = Number(jsonObj.default_index);

    const accounts: string[] = jsonObj.accounts;
    for (const accountString of accounts) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const account: Account = await Account.load(accountString, save);
      accountManager.accountMapping.set(account.addressIndex, account);

      //await account.serialize();//Do not do this operation here, do it when you restore the account
    }

    const addressIndexs: number[] = Array.from(
      accountManager.accountMapping.keys()
    );
    if (
      addressIndexs.length > 0 &&
      addressIndexs.includes(Number(accountManager.defaultAccountAddressIndex))
    ) {
      //Nothing to do
    } else {
      accountManager.defaultAccountAddressIndex = 0; // No account anymore, 0 or -1 will do
    }
    // await accountManager.serialize();//Do not do this operation here, do it when you restore the account

    if (save) {
      await accountManager.saveAllAccountAddressIndex();
      await accountManager.saveDefaultAccountAddressIndex();
    }

    return accountManager;
  }

  public static async loadSaved(): Promise<AccountManager> {
    const accountManager = new AccountManager();
    accountManager.defaultAccountAddressIndex = Number(
      await accountManager.getSavedDefaultAccountAddressIndex()
    );

    const nulinkHDWallet: NuLinkHDWallet = getHDWalletInstance();
    nulinkHDWallet.setAccountManager(accountManager);
    await setHDWalletInstance(nulinkHDWallet, false); //need to save for account.createStrategyByLabel() works

    const addressIndexs: number[] =
      await accountManager.getSavedAllAccountAddressIndex();
    // console.log("AccountManager loadSaved addressIndexs", addressIndexs);
    for (const accountAddrIndex of addressIndexs) {
      // We don’t escape the key '__proto__'
      // which can cause problems on older engines
      const account: Account | null = await Account.loadSaved(accountAddrIndex);

      if (isBlank(account)) {
        continue;
      }

      // Since the function call of account.createStrategyByLabel() relies on
      // updateHDWalletAccountStrategys() which uses accountManager.accountMapping,
      // the AccountMapping must be set up with all Account objects beforehand.
      accountManager.accountMapping.set(
        Number(accountAddrIndex),
        account as Account
      );
      //don't call the function of createStrategyByLabel, because the strategy has recoveryed from the localstorage or indexdb
      //await account.createStrategyByLabel('label')
    }

    if (
      addressIndexs.length > 0 &&
      addressIndexs.includes(Number(accountManager.defaultAccountAddressIndex))
    ) {
      //Nothing to do
    } else {
      accountManager.defaultAccountAddressIndex = 0; // No account anymore, 0 or -1 will do
    }

    return accountManager;
  }

  public async saveAllAccountAddressIndex() {
    await getHDWalletInstance().encryptSaveData(
      macro.accountListAddressIndex,
      JSON.stringify(Array.from(this.accountMapping.keys()))
    );
  }

  public async getSavedAllAccountAddressIndex() {
    const accountAddressIndexString =
      await getHDWalletInstance().decryptSavedData(
        macro.accountListAddressIndex
      );
    return JSON.parse(accountAddressIndexString);
  }

  public async saveDefaultAccountAddressIndex() {
    await getHDWalletInstance().encryptSaveData(
      macro.accountDefaultAddressIndex,
      Number(this.defaultAccountAddressIndex)
    );
  }

  public async getSavedDefaultAccountAddressIndex(): Promise<number> {
    return await getHDWalletInstance().decryptSavedData(
      macro.accountDefaultAddressIndex
    );
  }

  public async serialize(): Promise<void> {
    const accountManagerString: string = this.dump();
    return await getHDWalletInstance().encryptSaveData(
      this.getSaveKey(),
      accountManagerString
    );
  }

  public async deserialize(): Promise<AccountManager> {
    const strategyString = await getHDWalletInstance().decryptSavedData(
      this.getSaveKey()
    );
    return await AccountManager.load(strategyString);
  }

  public getSaveKey(): string {
    return macro.accountManagerKey;
  }
}

enum HDWalletCreateType {
  // wallet creation method
  Mnemonic, // create from mnemonic
  RootExtendedPrivateKey, // Creation of extended private key through root account
}

//Temporarily set the data storage scheme to: generate a random string, encrypt it with the user's public key, and store it on the disk. This random string is used as a symmetric key to encrypt data using
export class NuLinkHDWallet {
  private _passwordHash: string;
  private mnemonic: string;
  private rootExtendedPrivateKey: string;
  private createType: HDWalletCreateType; // wallet creation method
  private hdWallet: hdkey /*EthereumHDKey*/ | null = null;
  protected accountManager: AccountManager;
  private cryptoBroker: CryptoBroker | null = null; // Encryption and decryption middleware

  private constructor() {
    this.accountManager = new AccountManager();
    this._passwordHash = "";
    this.mnemonic = "";
    this.rootExtendedPrivateKey = "";
    this.createType = HDWalletCreateType.Mnemonic;
    this.cryptoBroker = null;
  }

  private copyConstructor(_nuLinkHDWallet: NuLinkHDWallet, password: string) {
    this.accountManager = _nuLinkHDWallet.accountManager;
    this._passwordHash = _nuLinkHDWallet._passwordHash;
    this.mnemonic = pwdEncrypt(_nuLinkHDWallet.mnemonic, null, false);
    this.rootExtendedPrivateKey = pwdEncrypt(
      _nuLinkHDWallet.rootExtendedPrivateKey,
      null,
      false
    );
    this.createType = _nuLinkHDWallet.createType;
    this.cryptoBroker = _nuLinkHDWallet.cryptoBroker;
    this.hdWallet = _nuLinkHDWallet.hdWallet;
  }
  public static generateMnemonic(): string {
    return commonGenerateMnemonic();
  }

  /**
   *  The front end loads different pages according to the status returned by this function, whether to display account information or restore the account
   *  Note:  If no password is passed to the loadHDwallet function, it will attempt to obtain the wallet object from memory.
   *  If it cannot be obtained, null is returned. In this case, the function needs to be called again with the user's password to retrieve the wallet object.
   * @throws {PasswordDecryptError}
   * @static
   * @param {string} [password='']
   * @return {*}  {(Promise<NuLinkHDWallet | null>)}
   * @memberof NuLinkHDWallet
   */
  public static async loadHDWallet(password = ""): Promise<NuLinkHDWallet> {
    // console.log("loadHDWallet in .....................");
    const nuLinkHDWallet = getHDWalletInstance();
    // console.log("loadHDWallet getHDWallet: ", nuLinkHDWallet);
    if (!util.isBlank(nuLinkHDWallet)) {
      // Unsafe, abandoned
      // if (!(await existHDWalletPersistData())) {
      //   await persistHDWallet(nuLinkHDWallet as NuLinkHDWallet)
      // }
      // console.log("loadHDWallet get persistHDWallet: ", nuLinkHDWallet);
      return nuLinkHDWallet as NuLinkHDWallet;
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
      const nulinkHDWallet = await NuLinkHDWallet.loadSaved(password);
      await setHDWalletInstance(nulinkHDWallet, true);

      // If there is no storage, getHDWallet() is empty
      return nulinkHDWallet;
    } catch (e) {
      if (e instanceof exception.PasswordDecryptError) {
        // Message.error(
        //   "Password verification failed" /* t("verify_password_error") */
        // );
        console.error("Password verification failed");
      }
      throw e;
    }
  }

  //Determine whether there is a default account in local
  public static async existDefaultAccount(): Promise<boolean> {
    const mustExistValueList: string[] = [
      macro.passwordHash,
      macro.hDWalletCreateType,
      macro.encryptedKeyIvByPassword,
      macro.accountListAddressIndex,
      macro.accountDefaultAddressIndex,
      macro.accountItselfInfo(0),
    ];
    const etherExistValueList: string[] = [
      macro.mnemonicByPassword,
      macro.rootExtendedPrivateKeyByPassword,
    ];
    for (let index = 0; index < mustExistValueList.length; index++) {
      const key = mustExistValueList[index];

      const value = await store.getItem(key);
      if (isBlank(value)) {
        return false;
      }
    }

    let exist = false;
    for (let index = 0; index < etherExistValueList.length; index++) {
      const key = etherExistValueList[index];

      const value = await store.getItem(key);
      if (!isBlank(value)) {
        exist = true;
        return true;
      }
    }

    if (!exist) {
      return false;
    }

    return true;
  }

  public static async logout(): Promise<void> {
    await store.clear();
  }

  // attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  static async createHDWallet(
    mnemonic: string,
    newPassword: string
  ): Promise<NuLinkHDWallet> {
    //To create a wallet, you need to clear the local wallet storage first, to prevent the original local storage account from being too many, and there is only one account when creating it, which will cause multiple accounts to be restored when restoring
    await NuLinkHDWallet.logout();
    return await NuLinkHDWallet.restoreHDWallet(mnemonic, newPassword);
  }

  // restore wallet by mnemonic and dataFileBinaryString or import wallet by mnemonic and create new account
  // dataFileBinaryString is a H5 fileReader.readAsArrayBuffer() return value,
  // attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  public static async restoreHDWallet(
    mnemonic: string,
    newPassword: string,
    dataFileBinaryString = ""
  ): Promise<NuLinkHDWallet> {
    const nulinkHDWallet = new NuLinkHDWallet();

    nulinkHDWallet.mnemonic = pwdEncrypt(mnemonic, null, false);
    nulinkHDWallet.createType = HDWalletCreateType.Mnemonic;

    nulinkHDWallet.hdWallet = await commonGetHDWallet(mnemonic);
    //Note that this line cannot be placed later, the wallet object getHDWallet().hdWallet needs to be used when restoring account data
    await setHDWalletInstance(nulinkHDWallet, false);
    // console.log("restoreHDWallet set _HdWallet", getHDWallet());
    if (dataFileBinaryString) {
      if (RESTORE_WALLET_TAG === dataFileBinaryString) {
        await nulinkHDWallet.restoreDataByStrategyInfos(newPassword);
      } else {
        await nulinkHDWallet.recoverUserData(newPassword, dataFileBinaryString);
      }
    } else {
      //no data so create new Account
      // Restore the public and private keys of the 0th account
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const account: Account =
        await nulinkHDWallet.accountManager.createAccount("account1", true);
      assert(!!account);
      //console.log("account", account);
      //TODO: need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
      // import { createAccount as cAccount, createAccountIfNotExist } from "@feats/pre/api/workflow";
      // await createAccountIfNotExist(account);
    }

    // need to be placed after the restore data
    await nulinkHDWallet.getCryptoBroker();
    await nulinkHDWallet.savePassword(newPassword);
    await nulinkHDWallet.saveMnemonicByPassword(newPassword);
    await nulinkHDWallet.saveHDWalletCreateType(
      newPassword,
      HDWalletCreateType[HDWalletCreateType.Mnemonic]
    );
    await nulinkHDWallet.saveEncryptedKeyIv(newPassword);

    await setHDWalletInstance(nulinkHDWallet, true);

    return nulinkHDWallet;
  }

  // restore wallet by rootExtendedPrivateKey and dataFileBinaryString or import wallet by rootExtendedPrivateKey and create new account
  // dataFileBinaryString is a H5 fileReader.readAsArrayBuffer() return value,
  // attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  public static async restoreHDWalletByRootExtendedPrivateKey(
    privateKeyString: string,
    newPassword: string,
    dataFileBinaryString = ""
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
    if (!privateKeyString.startsWith("xprv")) {
      throw new exception.InvalidRootExtendedPrivateKeyError(
        "The Private Key must be a BIP32 Root Extended Private Key (e.g., xprv...)"
      );
    }

    const nulinkHDWallet = new NuLinkHDWallet();
    nulinkHDWallet.mnemonic = "";
    nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(
      privateKeyString,
      null,
      false
    );
    nulinkHDWallet.createType = HDWalletCreateType.RootExtendedPrivateKey;

    try {
      nulinkHDWallet.hdWallet =
        commonGetHDWalletByRootExtendedPrivateKey(privateKeyString);
    } catch (error) {
      throw new exception.InvalidRootExtendedPrivateKeyError(
        "Invalid Root Extended Private Key"
      );
    }

    //Note that this line cannot be placed later, the wallet object getHDWallet().hdWallet needs to be used when restoring account data
    await setHDWalletInstance(nulinkHDWallet, false);
    // console.log("restoreHDWallet set _HdWallet", getHDWallet());
    if (dataFileBinaryString) {
      if (RESTORE_WALLET_TAG === dataFileBinaryString) {
        await nulinkHDWallet.restoreDataByStrategyInfos(newPassword);
      } else {
        await nulinkHDWallet.recoverUserData(newPassword, dataFileBinaryString);
      }
    } else {
      //no data so create new Account
      // Restore the public and private keys of the 0th account
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const account: Account =
        await nulinkHDWallet.accountManager.createAccount("", true);

      //TODO: need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
      // import { createAccount as cAccount, createAccountIfNotExist } from "@feats/pre/api/workflow";
      // await createAccountIfNotExist(account);
    }

    // need to be placed after the restore data
    await nulinkHDWallet.getCryptoBroker();
    await nulinkHDWallet.savePassword(newPassword);
    // wallet root private key recovery account
    await nulinkHDWallet.saveRootExtendedPrivateKeyByPassword(newPassword);
    await nulinkHDWallet.saveHDWalletCreateType(
      newPassword,
      HDWalletCreateType[HDWalletCreateType.RootExtendedPrivateKey]
    );
    await nulinkHDWallet.saveEncryptedKeyIv(newPassword);

    await setHDWalletInstance(nulinkHDWallet, true);

    return nulinkHDWallet;
  }

  /*
    restore account by the strategys of account stored in the backend db. 
    In this case, the premise is that we only have one account, otherwise 
    we can't export the extended private key, we need to export the root extended private key and the index information of all accounts
*/
  // attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  public static async restoreWalletDataByRootExtendedPrivateKeyAndServerStrategyInfos(
    newPassword: string,
    rootExtendedPrivateKey: string
  ): Promise<NuLinkHDWallet> {
    const privateKeyString = pwdDecrypt(rootExtendedPrivateKey, true);
    return this.restoreHDWalletByRootExtendedPrivateKey(
      privateKeyString,
      newPassword,
      RESTORE_WALLET_TAG
    );
  }

  /*
    restore account by the strategys of account stored in the backend db. 
    In this case, the premise is that we only have one account, otherwise 
    we can't export the extended private key, we need to export the root extended private key and the index information of all accounts
*/
  // attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  public static async restoreWalletDataByMnemonicAndServerStrategyInfos(
    newPassword: string,
    mnemonic: string
  ): Promise<NuLinkHDWallet> {
    const _mnemonic = pwdDecrypt(mnemonic, true);
    return this.restoreHDWallet(_mnemonic, newPassword, RESTORE_WALLET_TAG);
  }

  // restore account by data info
  // dataFileBinaryString is a H5 fileReader.readAsArrayBuffer() return value
  // attention please: you need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  public static async restoreHDWalletByData(
    newPassword: string,
    dataFileBinaryString: string
  ): Promise<NuLinkHDWallet> {
    let dataJson: any = null;
    try {
      dataJson = JSON.parse(dataFileBinaryString);
    } catch (error) {
      console.log("parseWalletData error: ", error);
      throw new exception.UserDataCorruptedError(
        "Existing data appears to be corrupted or tampered with by external parties!"
      );
    }

    if (dataJson.pcode) {
      const rootExtendedPrivateKey = pwdDecrypt(dataJson.pcode, true);
      return this.restoreHDWalletByRootExtendedPrivateKey(
        rootExtendedPrivateKey,
        newPassword,
        dataFileBinaryString
      );
    } else if (dataJson.mcode) {
      const mnemonic = pwdDecrypt(dataJson.mcode, true);
      return this.restoreHDWallet(mnemonic, newPassword, dataFileBinaryString);
    } else {
      console.log("parseWalletData error: Wallet Wallet data missing");
      throw new exception.UserDataCorruptedError(
        " Existing data is missing; possible tampering or destruction has occurred!"
      );
    }
  }

  private wallet(): EthWallet {
    assert(!util.isBlank(this.hdWallet));
    return (this.hdWallet as hdkey).getWallet();
  }

  private getRootAccountKeyPair(): KeyPair {
    const wallet = this.wallet();

    return new KeyPair(
      wallet.getPublicKeyString(),
      wallet.getPrivateKeyString()
    );
  }

  private async getCryptoBroker(
    encryptedSymmetricKeyIv = "",
    reCreate = false,
    save = true
  ): Promise<CryptoBroker> {
    //Restore the object through encryptedSymmetricKeyIv

    if (!util.isBlank(this.cryptoBroker)) {
      this.cryptoBroker = this.cryptoBroker as CryptoBroker;
      if (reCreate) {
        if (!util.isBlank(encryptedSymmetricKeyIv)) {
          //Note that after the load, since the key and iv are updated, allstr the data encrypted and saved by the key and iv need to be re-encrypted
          await this.cryptoBroker.load(encryptedSymmetricKeyIv, save);
        }
      } else {
        // console.debug("user old cryptoBroker", this.cryptoBroker);
      }
      return this.cryptoBroker;
    }

    const rootAccountKeyPair: KeyPair = this.getRootAccountKeyPair();
    this.cryptoBroker = await CryptoBroker.cryptoBrokerFactoryByEncryptedKeyIV(
      rootAccountKeyPair,
      encryptedSymmetricKeyIv,
      save
    );
    // console.debug("getCryptoBroker cryptoBroker", this.cryptoBroker);
    return this.cryptoBroker as CryptoBroker;
  }

  //restore wallet by the strategys of account stored in the backend db.
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
      await setHDWalletInstance(this, false); //need to save for AccountManager.loadSaved() works

      this.accountManager = await AccountManager.restoreDefaultAccount();

      this.savePassword(newPassword);
      this.saveEncryptedKeyIv(newPassword);
    } catch (error) {
      console.error(error);
      throw new Error("Data recovery has failed"); // data recovery failed
    }

    //Note: The method of calling this function needs to save the account-related data after the call (decentralized storage)
  }

  public async recoverUserData(
    newPassword: string,
    dataFileBinaryString = "",
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
      const dataJson = JSON.parse(dataFileBinaryString);

      const encryptedSymmetricKeyIv: string = dataJson.seed;
      // console.log(`recoverUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedSymmetricKeyIv)}`);

      const cryptoBroker = await this.getCryptoBroker(
        encryptedSymmetricKeyIv,
        true
      );
      const nulinkHDWallet = await NuLinkHDWallet.load(
        await cryptoBroker.decryptData(dataJson.data),
        true,
        false
      );
      nulinkHDWallet.savePassword(newPassword);
      // update the current object
      this.copyConstructor(nulinkHDWallet, newPassword);

      this.saveEncryptedKeyIv(newPassword);
    } catch (error) {
      console.error(error);
      throw new Error("Data recovery has failed"); // data recovery failed
    }

    //Note: The method of calling this function needs to save the account-related data after the call (decentralized storage)
  }

  public async exportUserData(password: string): Promise<string> {
    //Export user data, return the file stream, the front end needs to be downloaded directly to the local
    //The logic here should be to export the data of all accounts to 1 file

    //The beginning of the exported json file should be the key and iv of the symmetric key encrypted by the private key, followed by data
    // { seed: encryptedstring({ key: ekey, iv: iv}), data: encrypteddata}

    //First verify that the password is correct
    if (!(await this.verifyPassword(password))) {
      throw new Error("Incorrect password");
    }
    // console.log("persistHDWallet HDWALLET_ENCRYPT_STR", HDWALLET_ENCRYPT_STR);
    // console.log("persistHDWallet password", password);

    const strategyIdJsonString = pwdEncrypt(
      JSON.stringify({ strategyIds: this.strategyIds() }),
      null,
      false
    );
    const accountIdsJsonString = pwdEncrypt(
      JSON.stringify({ accountIds: this.accountIds() }),
      null,
      false
    );

    //Ensure key, iv have value
    const cryptoBroker = await this.getCryptoBroker();
    const encryptedKeyIv: string = await cryptoBroker.dump();
    // console.log("exportUserData before seed");
    const jsonData = {
      seed: encryptedKeyIv,
      data: await cryptoBroker.encryptData(await this.dump()),
      strategyIds: strategyIdJsonString, //the data not so important, Just for the convenience of deciding the version
      accountIds: accountIdsJsonString, //the data not so important, Just for the convenience of deciding the version
    };
    // console.log(`exportUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedKeyIv)}`);

    return JSON.stringify(jsonData);
  }

  public async exportWalletData(password: string): Promise<string> {
    //Export all the data of the wallet,  include user data and mnemonic or private key

    //First verify that the password is correct
    if (!(await this.verifyPassword(password))) {
      throw new Error("Incorrect password");
    }
    // console.log("persistHDWallet HDWALLET_ENCRYPT_STR", HDWALLET_ENCRYPT_STR);
    // console.log("persistHDWallet password", password);

    const strategyIdJsonString = pwdEncrypt(
      JSON.stringify({ strategyIds: this.strategyIds() }),
      null,
      false
    );
    const accountIdsJsonString = pwdEncrypt(
      JSON.stringify({ accountIds: this.accountIds() }),
      null,
      false
    );

    //Ensure key, iv have value
    const cryptoBroker = await this.getCryptoBroker();
    const encryptedKeyIv: string = await cryptoBroker.dump();
    // console.log("exportUserData before seed");

    const jsonData = {
      seed: encryptedKeyIv,
      data: await cryptoBroker.encryptData(await this.dump()),
      strategyIds: strategyIdJsonString, //the data not so important, Just for the convenience of deciding the version
      accountIds: accountIdsJsonString, //the data not so important, Just for the convenience of deciding the version
    };

    // console.log(`exportUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedKeyIv)}`);
    const mnemonic = await this.getMnemonic(password);

    if (mnemonic) {
      jsonData["mcode"] = pwdEncrypt(mnemonic, null, false);
    } else {
      const rootExtendedPrivateKey = await this.getRootExtendedPrivateKey(
        password
      );
      jsonData["pcode"] = pwdEncrypt(
        rootExtendedPrivateKey as string,
        null,
        false
      );
    }

    return JSON.stringify(jsonData);
  }

  //The master account mnemonic and extended private key are not exported, but obtained through the function
  public async getMnemonic(password: string): Promise<string | null> {
    if (await this.verifyPassword(password)) {
      //this must be plainText
      const mnemonic = pwdDecrypt(this.mnemonic, true);
      return mnemonic;
    }

    return null;
  }

  //The master account mnemonic and extended private key are not exported, but obtained through the function
  public async getRootExtendedPrivateKey(
    password: string
  ): Promise<string | null> {
    assert(!!this.hdWallet);

    if (await this.verifyPassword(password)) {
      const buffer: Buffer = this.hdWallet.privateExtendedKey();
      return buffer.toString();
    }

    return null;
  }

  private async calcPasswordHash(password: string, salt: string) {
    //The length of the salt we use here is 21 (nanoid())
    assert(!util.isBlank(this.hdWallet));

    const sk: string = this.wallet().getPrivateKeyString();
    // console.log("calcPasswordHash before sign",password + salt, sk);
    //sign will raise exception Failed to execute 'sign' on 'SubtleCrypto': parameter 2 is not of type 'CryptoKey'.
    // const signed = await sign(password + salt, sk);
    const signed = md5(password + salt + sk, { encoding: "string" });
    const hash = new Keccak(256);
    hash.update(signed);
    return hash.digest("hex") + salt;
    // return password;
  }

  public async verifyPassword(password: string): Promise<boolean> {
    assert(!util.isBlank(this.hdWallet));

    // Compare local storage for the same
    if (util.isBlank(this._passwordHash)) {
      this._passwordHash = await this.decryptSavedData(macro.passwordHash);
      if (!this._passwordHash) {
        //debugger;
      }
    }

    assert(!util.isBlank(this._passwordHash));

    const salt = this._passwordHash.slice(-21);

    const toBeVerifiedPasswordHash = await this.calcPasswordHash(
      password,
      salt
    );

    return toBeVerifiedPasswordHash === this._passwordHash;
  }

  public getAccountManager() {
    return this.accountManager;
  }

  public setAccountManager(_accountManager: AccountManager) {
    this.accountManager = _accountManager;
  }

  private async savePassword(password: string): Promise<string> {
    //return password hash
    assert(this.hdWallet != null);
    const salt = nanoid();
    this._passwordHash = await this.calcPasswordHash(password, salt);
    if (!this._passwordHash) {
      //debugger;
    }
    console.log(
      "NuLinkHDWallet savePassword _passwordHash",
      this._passwordHash
    );
    // store to local
    await this.savePasswordHash(this._passwordHash);

    return this._passwordHash;
  }

  private async savePasswordHash(passwordHash: string) {
    // store to local
    await this.encryptSaveData(macro.passwordHash, passwordHash);
    // console.log("savePasswordHash  passwordHash: ", passwordHash);
  }

  private async getSavedPasswordHash(): Promise<string> {
    //return password hash
    return await this.decryptSavedData(macro.passwordHash);
  }

  private async saveMnemonic() {
    // Save the mnemonic to the local via the symmetric key
    //this must be plainText
    const mnemonic = pwdDecrypt(this.mnemonic, true);

    await this.encryptSaveData(macro.mnemonicKey, mnemonic);
  }

  private async getSavedMnemonic() {
    // Get the locally saved mnemonic through the symmetric key
    return await this.decryptSavedData(macro.mnemonicKey);
  }

  private async saveMnemonicByPassword(password: string) {
    // Save the mnemonic to the local with the password
    if (util.isBlank(this.mnemonic)) {
      return;
    }
    const mnemonic = pwdDecrypt(this.mnemonic, true);
    await CryptoBroker.encryptWithPasswordSave(
      mnemonic,
      password,
      macro.mnemonicByPassword
    );
  }

  private async getSavedMnemonicByPassword(password: string) {
    // Get the local mnemonic by password

    return await CryptoBroker.decryptWithPasswordSaved(
      password,
      macro.mnemonicByPassword
    );
  }

  private async saveRootExtendedPrivateKey() {
    // Save the mnemonic to the local via the symmetric key
    const rootExtendedPrivateKey = pwdDecrypt(
      this.rootExtendedPrivateKey,
      true
    );
    await this.encryptSaveData(
      macro.rootExtendedPrivateKey,
      rootExtendedPrivateKey
    );
  }

  private async getSavedRootExtendedPrivateKey() {
    // Get the locally saved mnemonic through the symmetric key
    return await this.decryptSavedData(macro.rootExtendedPrivateKey);
  }

  private async saveRootExtendedPrivateKeyByPassword(password: string) {
    // Save the wallet root private key to the local with the password
    let rootExtendedPrivateKey: string = commonGetRootExtendedPrivateKey(
      getHDWalletInstance().hdWallet
    ).toString();

    rootExtendedPrivateKey = pwdDecrypt(rootExtendedPrivateKey, true);

    await CryptoBroker.encryptWithPasswordSave(
      rootExtendedPrivateKey,
      password,
      macro.rootExtendedPrivateKeyByPassword
    );
  }

  private async getSavedRootExtendedPrivateKeyByPassword(
    password: string
  ): Promise<string> {
    //Get the local (wallet) root private key through the password
    return await CryptoBroker.decryptWithPasswordSaved(
      password,
      macro.rootExtendedPrivateKeyByPassword
    );
  }

  private async saveHDWalletCreateType(
    password: string,
    hDWalletCreateType: string
  ) {
    // Save the wallet create(restore) type : Mnemonic or RootExtendedPrivateKey
    await CryptoBroker.encryptWithPasswordSave(
      hDWalletCreateType,
      password,
      macro.hDWalletCreateType
    );
  }

  private async getSavedHDWalletCreateType(password: string): Promise<string> {
    //Get the local (wallet) root private key through the password
    return await CryptoBroker.decryptWithPasswordSaved(
      password,
      macro.hDWalletCreateType
    );
  }

  private async saveEncryptedKeyIv(password: string) {
    //Save the encrypted symmetric key key,iv to the local by password
    const cryptoBroker = await this.getCryptoBroker();
    const encryptedKeyIv: string = await cryptoBroker.dump();

    // console.log("saveEncryptedKeyIv encryptedKeyIv: ", encryptedKeyIv);
    await CryptoBroker.encryptWithPasswordSave(
      encryptedKeyIv,
      password,
      macro.encryptedKeyIvByPassword
    );
  }

  private async getSavedEncryptedKeyIv(password: string): Promise<string> {
    //Get the local encrypted symmetric key key,iv through the password
    const encryptedKeyIv: string = await CryptoBroker.decryptWithPasswordSaved(
      password,
      macro.encryptedKeyIvByPassword
    );
    // console.log("getSavedEncryptedKeyIv encryptedKeyIv: ", encryptedKeyIv);

    return encryptedKeyIv;
  }

  private async encryptSaveData(
    saveKey: string,
    plainText: string
  ): Promise<string> {
    const cryptoBroker = await this.getCryptoBroker();
    const result = await cryptoBroker.encryptSaveData(saveKey, plainText);
    //this the is very important for sync the HDWallet object to background
    await setHDWalletInstance(this, true);
    return result;
  }

  private async decryptSavedData(savedKey: string): Promise<string> {
    const cryptoBroker = await this.getCryptoBroker();
    // console.log("decryptSavedData cryptoBroker", cryptoBroker);
    // console.log("decryptSavedData savedKey", savedKey);
    return await cryptoBroker.decryptSavedData(savedKey);
  }

  private async removeSavedData(savedKey: string) {
    //Try not to call this function. If you delete a key without logic, it will destroy the overall storage interface.
    //Unless you know the consequences of deleting a key (such as load failure), don't do this lightly.
    const cryptoBroker = await this.getCryptoBroker();
    const result = await cryptoBroker.decryptSavedData(savedKey);
    await setHDWalletInstance(this, true);
    return result;
  }

  public strategyIds(): string[] {
    return this.accountManager.strategyIds();
  }

  public accountIds(): string[] {
    return this.accountManager.accountIds();
  }

  public async dump(): Promise<string> {
    if (!this._passwordHash) {
      this._passwordHash = await this.getSavedPasswordHash();
      // debugger;
    }
    // console.log("NuLinkHDWallet dump _passwordHash", this._passwordHash);
    //encrypt mnemonic
    const mnemonic = pwdEncrypt(this.mnemonic, null, false);

    let rootExtendedPrivateKey =
      this.rootExtendedPrivateKey ||
      commonGetRootExtendedPrivateKey(
        getHDWalletInstance().hdWallet
      ).toString();

    rootExtendedPrivateKey = pwdEncrypt(rootExtendedPrivateKey, null, false);
    if (!this._passwordHash) {
      //debugger;
    }
    return JSON.stringify({
      pwdHash: this._passwordHash,
      mnemonic: mnemonic,
      rootExtendedPrivateKey: rootExtendedPrivateKey,
      createType: this.createType,
      acntManager: this.accountManager.dump(),
      encryptedKeyIv: await (await this.getCryptoBroker()).dump(),
      //hdWallet can be recovered by mnemonic
      //cryptoBroker can be recovered through hdWallet, note that key and iv must be exported
    });
  }

  public static async parseUserDataVersionInfo(
    dataFileBinaryString: string
  ): Promise<any | undefined> {
    //return sorted strategyId list

    if (!dataFileBinaryString) {
      return undefined;
    }

    const jsonObj = JSON.parse(dataFileBinaryString);

    if (!jsonObj?.strategyIds) {
      throw new exception.UserDataVersionLowError(
        `Your user data version is outdated. Please import the latest data to utilize this function`
      );
    }

    try {
      const strategyIdJsonString = pwdDecrypt(jsonObj.strategyIds, true);
      const accountIdsJsonString = pwdDecrypt(jsonObj.accountIds, true);
      const strategyIdsJsonObject = JSON.parse(strategyIdJsonString);
      const accountIdsJsonObject = JSON.parse(accountIdsJsonString);

      if (
        util.isBlank(strategyIdsJsonObject?.strategyIds) ||
        util.isBlank(accountIdsJsonObject?.accountIds)
      ) {
        //please make sure the dataFileBinaryString is not empty
        throw new exception.UserDataCorruptedError(
          "Data corrupted or tampered with by others !!"
        );
      }

      if (accountIdsJsonObject?.accountIds.length < 1) {
        //accounts length is null
        throw new exception.UserDataCorruptedError(
          "Data is abnormal. Please attempt to re-export the data and subsequently re-import it."
        );
      }

      return {
        strategyIds: strategyIdsJsonObject?.strategyIds,
        accountIds: accountIdsJsonObject?.accountIds,
      };
    } catch (error) {
      console.log("parseUserDataAllStrategys error: ", error);
      throw new exception.UserDataCorruptedError(
        "Data appears to be corrupted or tampered with by external parties!"
      );
    }

    // const strategyIds: string[] = [];
    // const encryptedSymmetricKeyIv: string = jsonObj.seed;
    // // console.log(`recoverUserData: seed encryptedSymmetricKeyIv: ${toBuffer(encryptedSymmetricKeyIv)}`);
    // const save: boolean = false; //must be false, don't save, otherwise, the current data is overwritten
    // const cryptoBroker = await this.getCryptoBroker(encryptedSymmetricKeyIv, true, save);
    // dataFileBinaryString = await cryptoBroker.decryptData(jsonObj.data);

    // jsonObj = JSON.parse(dataFileBinaryString);

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

  public static async load(
    jsonString: string,
    save = false,
    recoverPassword = true
  ): Promise<NuLinkHDWallet> {
    const jsonObj = JSON.parse(jsonString);

    const nulinkHDWallet = new NuLinkHDWallet();

    nulinkHDWallet.mnemonic = pwdEncrypt(jsonObj.mnemonic, null, false);
    nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(
      jsonObj.rootExtendedPrivateKey,
      null,
      false
    );
    nulinkHDWallet.createType = jsonObj.createType;

    if (!util.isBlank(jsonObj.mnemonic)) {
      jsonObj.mnemonic = pwdDecrypt(jsonObj.mnemonic, true);
      nulinkHDWallet.hdWallet = await commonGetHDWallet(jsonObj.mnemonic);
    } else if (!util.isBlank(jsonObj.rootExtendedPrivateKey)) {
      jsonObj.rootExtendedPrivateKey = pwdDecrypt(
        jsonObj.rootExtendedPrivateKey,
        true
      );
      nulinkHDWallet.hdWallet = commonGetHDWalletByRootExtendedPrivateKey(
        jsonObj.rootExtendedPrivateKey
      );
    } else {
      throw new Error(
        "NuLinkHDWallet failed to load due to empty mnemonic or rootExtendedPrivateKey"
      );
    }

    //Note that reCreate must be set to true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cryptoBroker = await nulinkHDWallet.getCryptoBroker(
      jsonObj.encryptedKeyIv,
      true
    );

    //note if not recoverPassword, You must set the password after calling this function
    if (recoverPassword) {
      if (!jsonObj.pwdHash) {
        nulinkHDWallet._passwordHash =
          await nulinkHDWallet.getSavedPasswordHash();
        // debugger;
      } else {
        nulinkHDWallet._passwordHash = jsonObj.pwdHash;
      }

      // console.log("NuLinkHDWallet load recoverPassword pwdHash", jsonObj.pwdHash);
    } else {
      //load origin password, when call the setHDWallet, Prevent password overwriting
      nulinkHDWallet._passwordHash =
        await nulinkHDWallet.getSavedPasswordHash();
      console.log(
        "NuLinkHDWallet load _passwordHash",
        nulinkHDWallet._passwordHash
      );
    }

    await setHDWalletInstance(nulinkHDWallet, false); //need to save for AccountManager.loadSaved() works
    //await cryptoBroker.load(jsonObj.encryptedKeyIv)

    nulinkHDWallet.accountManager = await AccountManager.load(
      jsonObj.acntManager,
      save
    );

    if (save) {
      if (recoverPassword) {
        if (!jsonObj.pwdHash) {
          //debugger;
        }
        if (!jsonObj || !jsonObj.pwdHash) {
          console.log(
            "NuLinkHDWallet load savePasswordHash _passwordHash",
            jsonObj.pwdHash
          );
        }

        await nulinkHDWallet.savePasswordHash(jsonObj.pwdHash);
      }
      //await nulinkHDWallet.saveEncryptedKeyIv(password); //Set this value when nulinkhdWallet.load is called
      if (!util.isBlank(jsonObj.mnemonic)) {
        await nulinkHDWallet.saveMnemonic();
      } else if (!util.isBlank(jsonObj.rootExtendedPrivateKey)) {
        await nulinkHDWallet.saveRootExtendedPrivateKey();
      }
    }

    await setHDWalletInstance(nulinkHDWallet, true);

    return nulinkHDWallet;
  }

  /**
   *
   * @throws {PasswordDecryptError}
   * @private
   * @static
   * @param {string} password
   * @return {*}  {(Promise<NuLinkHDWallet | null>)}
   * @memberof NuLinkHDWallet
   */
  private static async loadSaved(password: string): Promise<NuLinkHDWallet> {
    // Load wallet from storage with password

    if (isBlank(password)) {
      throw new exception.PasswordDecryptError("password not be null");
    }

    const nulinkHDWallet = new NuLinkHDWallet();

    //Get the local encrypted symmetric key key through the password, iv: decrypt and get the encrypted save data later
    const encryptedKeyIv: string = await nulinkHDWallet.getSavedEncryptedKeyIv(
      password
    );

    const walletCreateType: string =
      await nulinkHDWallet.getSavedHDWalletCreateType(password);
    if (walletCreateType === HDWalletCreateType[HDWalletCreateType.Mnemonic]) {
      // Attempt to load wallet with mnemonic
      const mnemonic: string = await nulinkHDWallet.getSavedMnemonicByPassword(
        password
      );
      // console.log("mnemonic: ", mnemonic);
      if (util.isBlank(mnemonic)) {
        throw new exception.PasswordDecryptError(
          "load hdWallet failure, password error or the data is lost or incomplete"
        ); // data recovery failed
      }

      // console.log("loadSaved: 1");
      nulinkHDWallet.createType = HDWalletCreateType.Mnemonic;
      nulinkHDWallet.hdWallet = await commonGetHDWallet(mnemonic);
      nulinkHDWallet.mnemonic = pwdEncrypt(mnemonic, null, false);

      try {
        await setHDWalletInstance(nulinkHDWallet, false); //need to save for commonGetRootExtendedPrivateKey(getHDWallet().hdWallet) works
        nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(
          commonGetRootExtendedPrivateKey(
            getHDWalletInstance().hdWallet
          ).toString(),
          null,
          false
        );
      } catch (error) {}

      // console.log("loadSaved: nulinkHDWallet.hdWallet", nulinkHDWallet.hdWallet);
    } else {
      let rootExtendedPrivateKey = "";

      // The mnemonic is empty, try to load the wallet with the wallet root private key
      rootExtendedPrivateKey =
        await nulinkHDWallet.getSavedRootExtendedPrivateKeyByPassword(password);
      // console.log("rootExtendedPrivateKey: ", rootExtendedPrivateKey);
      if (util.isBlank(rootExtendedPrivateKey)) {
        throw new exception.PasswordDecryptError(
          "load hdWallet failure, password error or the data is lost or incomplete"
        ); // data recovery failed
      }
      // console.log("loadSaved: 2");
      nulinkHDWallet.createType = HDWalletCreateType.RootExtendedPrivateKey;
      nulinkHDWallet.hdWallet = commonGetHDWalletByRootExtendedPrivateKey(
        rootExtendedPrivateKey
      );
      nulinkHDWallet.mnemonic = "";
      nulinkHDWallet.rootExtendedPrivateKey = pwdEncrypt(
        rootExtendedPrivateKey,
        null,
        false
      );
      // console.log("loadSaved: nulinkHDWallet.hdWallet", nulinkHDWallet.hdWallet);
    }
    //Note that reCreate must be set to true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    nulinkHDWallet.cryptoBroker = null;
    const cryptoBroker = await nulinkHDWallet.getCryptoBroker(
      encryptedKeyIv,
      true
    );
    // console.log("loadSaved cryptoBroker: ", cryptoBroker);
    await setHDWalletInstance(nulinkHDWallet, false); //need to save for AccountManager.loadSaved() works
    nulinkHDWallet.accountManager = await AccountManager.loadSaved();
    // console.log("loadSaved: nulinkHDWallet.accountManager", nulinkHDWallet.accountManager);
    // console.log("loadSaved: nulinkHDWallet", nulinkHDWallet);

    //load origin password, when call the setHDWallet, Prevent password overwriting
    nulinkHDWallet._passwordHash = await nulinkHDWallet.getSavedPasswordHash();

    await setHDWalletInstance(nulinkHDWallet, true);

    return nulinkHDWallet;
  }

  // Increase each key scattered storage (disk), and scattered loading (otherwise every modification needs to re-call hdwallet's serialize). The original serialize, deserialize can be used for import and export

  private async serialize(): Promise<void> {
    const nuLinkHDWalletEncStr: string = await this.dump();
    await this.encryptSaveData(this.getSaveKey(), nuLinkHDWalletEncStr);
  }

  private async deserialize(): Promise<NuLinkHDWallet> {
    const nuLinkHDWalletEncStr = await this.decryptSavedData(this.getSaveKey());
    return await NuLinkHDWallet.load(nuLinkHDWalletEncStr, true, true);
  }

  private getSaveKey(): string {
    return macro.hdWalletManagerKey;
  }

  // decrypt the mnemonic phrase or root extended private key using the user's password, denoted as S1. Then, use S1 to generate a password to encrypt the data
  public async verifyPasswordAndEncrypt(
    plaintext: string,
    password: string /*userpassword*/
  ): Promise<string> {
    //First verify that the password is correct
    if (!(await this.verifyPassword(password))) {
      throw new Error("Incorrect password");
    }
    let secretKey: string | null = "";
    if (this.createType === HDWalletCreateType.Mnemonic) {
      const mnemonic = await this.getMnemonic(password);
      const hdWallet: hdkey = await commonGetHDWallet(mnemonic as string);
      const rootExtendedPrivateKey = hdWallet.privateExtendedKey().toString();
      secretKey = rootExtendedPrivateKey;
    } else {
      //HDWalletCreateType.RootExtendedPrivateKey;
      const rootExtendedPrivateKey = await this.getRootExtendedPrivateKey(
        password
      );
      secretKey = rootExtendedPrivateKey;
    }

    assert(secretKey != null);

    //calc secretKey hash
    const hash = new Keccak(256);
    hash.update(secretKey);
    const salt = nanoid(); //21
    const passwordHash = hash.digest("hex") + salt;
    return CryptoBroker.encryptWithPassword(plaintext, passwordHash) + salt;
  }

  // Use the mnemonic phrase or root extended private key to generate a password to encrypt the data
  public async encrypt(plaintext: string): Promise<string> {
    let secretKey: string | null = "";
    if (this.createType === HDWalletCreateType.Mnemonic) {
      const mnemonic = await pwdDecrypt(this.mnemonic, true);
      const hdWallet: hdkey = await commonGetHDWallet(mnemonic as string);
      const rootExtendedPrivateKey = hdWallet.privateExtendedKey().toString();
      secretKey = rootExtendedPrivateKey;
    } else {
      //HDWalletCreateType.RootExtendedPrivateKey;
      const rootExtendedPrivateKey = pwdDecrypt(
        this.rootExtendedPrivateKey,
        true
      );
      secretKey = rootExtendedPrivateKey;
    }

    assert(secretKey != null);

    //calc secretKey hash
    const hash = new Keccak(256);
    hash.update(secretKey);
    const salt = nanoid(); //21
    const passwordHash = hash.digest("hex") + salt;
    return CryptoBroker.encryptWithPassword(plaintext, passwordHash) + salt;
  }

  public static async decrypt(
    ciphertext: string,
    walletSecret: macro.walletSecretKeyType
  ) {
    let secretKey: string = "";
    if (!isBlank(walletSecret.mnemonic)) {
      try {
        const hdWallet: hdkey = await commonGetHDWallet(
          walletSecret.mnemonic as string
        );
        const rootExtendedPrivateKey = hdWallet.privateExtendedKey().toString();
        secretKey = rootExtendedPrivateKey;
      } catch (error) {
        throw new exception.MnemonicError("mnemonic Error");
      }
    } else {
      if (!isBlank(walletSecret.rootExtendedPrivateKey)) {
        throw new exception.RootExtendedPrivateKeyError(
          "RootExtendedPrivateKey Error"
        );
      }
      secretKey = walletSecret.rootExtendedPrivateKey as string;
    }
    //calc secretKey hash
    const hash = new Keccak(256);
    hash.update(secretKey);
    const salt = ciphertext.slice(-21); // const salt = nanoid() //21
    const passwordHash = hash.digest("hex") + salt;

    return CryptoBroker.decryptWithPassword(
      ciphertext.slice(0, -21),
      passwordHash
    );
  }
}
