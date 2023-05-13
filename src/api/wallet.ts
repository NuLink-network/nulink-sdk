/**
 * This comment will be used as the summary for the "wallet" module
 * @packageDocumentation
 * @module wallet
 * @preferred
 */
import { createAccountIfNotExist, getPolicyLabelIdsByAccountId } from '../core/pre'
import { isBlank, UserDataCorruptedError, UserDataVersionLowError, Account, NuLinkHDWallet } from '../core'
import { decrypt as pwdDecrypt } from '../core/utils/passwordEncryption'
import * as exception from '../core/utils/exception'

/**
 * @throws {UserDataCorruptedError, UserDataVersionLowError}
 */
export const checkUserDataVersionMatch = async (dataFileBinaryString: string): Promise<boolean> => {
  if (!dataFileBinaryString) {
    return false
  }

  try {
    const dataInfo = await NuLinkHDWallet.parseUserDataVersionInfo(dataFileBinaryString)
    if (isBlank(dataInfo)) {
      //please make sure the dataFileBinaryString is not empty
      return false
    }

    const strategyIds = dataInfo['strategyIds']
    const accountIds = dataInfo['accountIds']
    // not required
    // if (isBlank(strategyIds) || isBlank(accountIds)) {
    //   //please make sure the dataFileBinaryString is not empty
    //   return false;
    // }

    //get policy label id's from backend server

    const data = (await getPolicyLabelIdsByAccountId(accountIds[0])) as object
    const serversStrategyIds: string[] = data['label_ids']

    // const serverSortedStrategyIds = serversStrategyIds.sort((strategyId1, strategyId2) =>
    //   strategyId1 < strategyId2 ? -1 : strategyId1 > strategyId2 ? 1 : 0,
    // );

    // const strategySortedIds = strategyIds.sort((strategyId1, strategyId2) =>
    //   strategyId1 < strategyId2 ? -1 : strategyId1 > strategyId2 ? 1 : 0,
    // );

    const localSet = new Set(/* strategySortedIds */ strategyIds)

    //local strategys must include all server strategys
    return /* serverSortedStrategyIds */ serversStrategyIds.filter((x) => !localSet.has(x)).length === 0 // difference set:  a - b  ==> serverSortedStrategyIds - localSet must be []
  } catch (error) {
    console.log('checkUserDataVersionMatch: ', error)
    /*     if (
      error instanceof UserDataVersionLowError ||
      error instanceof UserDataCorruptedError
    ) {
      message.error(error?.message || error);
    } else {
      message.error("check User Data Version Match failed");
    } */

    throw error
  }
}

/*  restore wallet by the strategys of account stored in the backend db. 
    In this case, the premise is that we only have one account, otherwise 
    we can't export the extended private key, we need to export the root extended private key and the index information of all accounts
*/
export const restoreWalletDataByRootExtendedPrivateKey = async (
  newPassword: string,
  rootExtendedPrivateKey: string
): Promise<NuLinkHDWallet> => {
  const wallet: NuLinkHDWallet = await NuLinkHDWallet.restoreWalletDataByRootExtendedPrivateKeyAndServerStrategyInfos(
    newPassword,
    rootExtendedPrivateKey
  )
  const defalutAccount: Account = wallet.getAccountManager().getAccount(0) as Account

  //create account to center server
  await createAccountIfNotExist(defalutAccount)

  return wallet
}

/*  restore account by the strategys of account stored in the backend db. 
    In this case, the premise is that we only have one account, otherwise 
    we can't export the extended private key, we need to export the root extended private key and the index information of all accounts
*/
export const restoreWalletDataByMnemonic = async (newPassword: string, mnemonic: string): Promise<NuLinkHDWallet> => {
  const wallet: NuLinkHDWallet = await NuLinkHDWallet.restoreWalletDataByMnemonicAndServerStrategyInfos(
    newPassword,
    mnemonic
  )
  const defalutAccount: Account = wallet.getAccountManager().getAccount(0) as Account

  //create account to center server
  await createAccountIfNotExist(defalutAccount)

  return wallet
}

/** restore account by data info include mnemonic (or rootExtendsPrivateKey) and user data (strategy infos)
 * @throws {UserDataCorruptedError, UserDataVersionLowError}
 */
export const restoreWalletData = async (newPassword: string, dataFileBinaryString: string): Promise<NuLinkHDWallet> => {
  const jsonData = dataFileBinaryString
  if (jsonData) {
    // const originPassword = state as string;

    const bVersionMath: boolean = await checkUserDataVersionMatch(jsonData)
    if (!bVersionMath) {
      // message.error(
      //   "First, export the latest data before importing any new data; otherwise, existing data may be lost irretrievably."
      // );
      throw Error(
        'First, export the latest data before importing any new data; otherwise, existing data may be lost irretrievably.'
      )
    }
  }

  const wallet: NuLinkHDWallet = await NuLinkHDWallet.restoreHDWalletByData(newPassword, jsonData)
  const defalutAccount: Account = wallet.getAccountManager().getAccount(0) as Account

  //create account to center server
  await createAccountIfNotExist(defalutAccount)

  return wallet
}

export const exportWalletData = async (password: string): Promise<any> => {
  const nuLinkHDWallet = await NuLinkHDWallet.loadHDWallet(password)
  return await nuLinkHDWallet?.exportWalletData(password)
}

export const createWallet = async (password: string, mnemonic: string = ''): Promise<NuLinkHDWallet> => {
  if (isBlank(mnemonic)) {
    mnemonic = NuLinkHDWallet.generateMnemonic()
  }

  const nuLinkHDWallet: NuLinkHDWallet = await NuLinkHDWallet.createHDWallet(mnemonic, password)

  const defalutAccount: Account = nuLinkHDWallet.getAccountManager().getAccount(0) as Account
  //create account to center server
  await createAccountIfNotExist(defalutAccount)

  // console.log(nuLinkHDWallet)
  // console.dir("Generate instance nuLinkHDWallet: ", nuLinkHDWallet);
  return nuLinkHDWallet
}

export const loadWallet = async (password?: string): Promise<NuLinkHDWallet | null> => {
  const nuLinkHDWallet: NuLinkHDWallet | null = await NuLinkHDWallet.loadHDWallet(password)
  // console.log("loadWallet  nuLinkHDWallet", nuLinkHDWallet);

  return nuLinkHDWallet
}

export const verifyPassword = async (data: string): Promise<any> => {
  try {
    const nuLinkHDWallet = await NuLinkHDWallet.loadHDWallet(data)
    // console.log("wallet manage call verifyPassword");
    return await nuLinkHDWallet?.verifyPassword(data)
  } catch (e) {
    console.error(e)
    if (e instanceof exception.PasswordDecryptError) {
      // Message.error(
      //   "Password verification failed" /* t("verify_password_error") */
      // );
      console.error('Password verification failed')
      return false
    }
    throw e
  }
}

//Determine whether there is a default account in local
export const existDefaultAccount = async (): Promise<boolean> => {
  return await NuLinkHDWallet.existDefaultAccount()
}

export const logoutWallet = async () => {
  return await NuLinkHDWallet.logout()
}

/**
 *  get the default account from wallet
 *  Note:  If no password is passed to the getWalletDefaultAccount function, it will attempt to obtain the wallet object from memory.
 *  If it cannot be obtained, null is returned. In this case, the function needs to be called again with the user's password to retrieve the wallet object.
 * @throws {PasswordDecryptError}
 * @param {string} [password='']
 * @return {*}  {(Promise<Account | null>)}
 */
export const getWalletDefaultAccount = async (password?: string): Promise<Account | null> => {
  try {
    const nuLinkHDWallet = await NuLinkHDWallet.loadHDWallet(password)

    if (isBlank(nuLinkHDWallet)) {
      return null
    }
    const accountManager = nuLinkHDWallet?.getAccountManager()
    const account = accountManager?.getDefaultAccount()
    return account as Account
  } catch (error) {
    console.log('getWalletDefaultAccount error:', (error as string).toString())
    //   if (e instanceof exception.PasswordDecryptError) {}
  }
  return null
}

export const unlockWallet = async (password: string): Promise<boolean> => {
  // console.log("params", data);
  const nuLinkHDWallet = await NuLinkHDWallet.loadHDWallet(password)
  // console.log("unlock hdwallet", nuLinkHDWallet);
  const isCorrect = await nuLinkHDWallet?.verifyPassword(password)
  console.log('unlock is correct', isCorrect)
  return !!isCorrect
}

/**
 *  get the wallet's mnemonic
 *  Note:  If no password is passed to the getWalletDefaultAccount function, it will attempt to obtain the wallet object from memory.
 *  If it cannot be obtained, null is returned. In this case, the function needs to be called again with the user's password to retrieve the wallet object.
 * @throws {PasswordDecryptError}
 * @param {string} [password='']
 * @return {*}
 */
export const getMnemonic = async (password: string): Promise<string | null> => {
  const nuLinkHDWallet = await NuLinkHDWallet.loadHDWallet(password)
  return await nuLinkHDWallet?.getMnemonic(password)
}

/**
 *  get the wallet's mnemonic
 *  Note:  If no password is passed to the getWalletDefaultAccount function, it will attempt to obtain the wallet object from memory.
 *  If it cannot be obtained, null is returned. In this case, the function needs to be called again with the user's password to retrieve the wallet object.
 * @throws {PasswordDecryptError}
 * @param {string} [password='']
 * @return {*}
 */
export const getDefaultAccountPrivateKey = async (password: string): Promise<string | null> => {
  const nuLinkHDWallet = await NuLinkHDWallet.loadHDWallet(password)
  const account = nuLinkHDWallet?.getAccountManager()?.getDefaultAccount()
  if (isBlank(account)) {
    return null
  }
  return pwdDecrypt((account as Account).encryptedKeyPair._privateKey, true)
}
