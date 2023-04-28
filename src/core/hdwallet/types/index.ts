//Overall storage key
const hdWalletManagerKey = `hdwallet`
const accountManagerKey = `${hdWalletManagerKey}:acntmanager`
const accountKey = (accountIndex: number) => `${accountManagerKey}:acnt:${accountIndex}`
const strategyKey = (accountIndex: number, strategyAddressIndex: number) =>
  `${accountKey(accountIndex)}:s:${strategyAddressIndex}`

//Decentralized storage key
const symmetricKeyIv = 'symkeyAndIv'
const passwordHash = 'passwordhash'
const mnemonicKey = 'mnem'
const rootExtendedPrivateKey = 'rootExtendedPrivateKey'
const accountListAddressIndex = 'accountListAddressIndex'
const accountDefaultAddressIndex = 'accountDefaultAddressIndex'
const accountItselfInfo = (accountIndex: number) => `accountItself:${accountIndex}`
const accountStrategyList = (accountIndex: number) => `accountStrategyIndexList:${accountIndex}`
const accountStrategyInfo = (accountIndex: number, strategyAddressIndex: number) =>
  `accountStrategyInfo:${accountIndex}:${strategyAddressIndex}`

//Encrypt and decrypt key by password
const mnemonicByPassword = 'mnemonicByPassword'
const rootExtendedPrivateKeyByPassword = 'rootExtSKsByPassword'
const hDWalletCreateType = 'hDWalletCreateType'

const encryptedKeyIvByPassword = 'encryptedKeyIvByPassword'

//You must choose either mnemonic or rootExtendedPrivateKey
export type walletSecretKeyType =
  | {
      mnemonic?: string
      rootExtendedPrivateKey: string
    }
  | {
      mnemonic: string
      rootExtendedPrivateKey?: string
    }

export {
  //Overall storage key
  accountKey,
  strategyKey,
  accountManagerKey,
  hdWalletManagerKey,
  //Decentralized storage key
  symmetricKeyIv,
  passwordHash,
  mnemonicKey,
  accountListAddressIndex,
  accountDefaultAddressIndex,
  accountItselfInfo,
  accountStrategyList,
  accountStrategyInfo,
  //Encrypt and decrypt key by password
  mnemonicByPassword,
  rootExtendedPrivateKey,
  rootExtendedPrivateKeyByPassword,
  hDWalletCreateType,
  encryptedKeyIvByPassword
}
