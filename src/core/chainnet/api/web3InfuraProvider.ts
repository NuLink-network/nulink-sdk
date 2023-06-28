/**
 *  nulink ts parameter need Web3Provider object
 */

import { ethers } from 'ethers'
import { getSettingsData } from './getData'
import { registerOnChangeCallBackFunction } from './saveData'
import { isBlank } from '../../utils/null'
import SingletonService from 'singleton-service'
// Remove interdependence
// import { Account } from "../../hdwallet/api/account";
import { Wallet } from '@ethersproject/wallet'
import md5 from 'md5'
// import { InfuraProvider } from '@ethersproject/providers';
import toWeb3Provider from 'ethers-to-web3'
import { decrypt as pwdDecrypt } from '../../utils/passwordEncryption'

const INFURA_WEB3PROVIDER_INSTANCE_NAME_PREFIX = 'infuraWeb3provider'
const PRIVODER_NAME = (account: 'Account', ethUrl?: string) =>
  `${INFURA_WEB3PROVIDER_INSTANCE_NAME_PREFIX}_${(account as any).address}_${md5(ethUrl ?? '', { encoding: 'string' })}`
const INFURAPROVIDER_INSTANCE_NAME = (ethUrl?: string) => `infuraprovider_${md5(ethUrl ?? '', { encoding: 'string' })}`

export const getWeb3Provider = async (account: 'Account', ethUrl?: string): Promise<ethers.providers.Web3Provider> => {
  // for get instance with saved key
  let web3Provider = SingletonService.get<ethers.providers.Web3Provider>(PRIVODER_NAME(account, ethUrl))
  if (isBlank(web3Provider)) {
    web3Provider = await setWeb3Provider(account, ethUrl)
  }
  return web3Provider
}

export const setWeb3Provider = async (account: 'Account', ethUrl?: string): Promise<ethers.providers.Web3Provider> => {
  const infuraProvider = await getInfuraProvider(ethUrl)
  const web3Provider = infuraUrl2Web3Provider(infuraProvider, account)
  SingletonService.set<ethers.providers.Web3Provider>(PRIVODER_NAME(account, ethUrl), web3Provider, true)
  return web3Provider
}

export const getInfuraProvider = async (ethUrl?: string): Promise<ethers.providers.InfuraProvider> => {
  // for get instance with saved key
  let infuraProvider = SingletonService.get<ethers.providers.InfuraProvider>(INFURAPROVIDER_INSTANCE_NAME(ethUrl))
  if (isBlank(infuraProvider)) {
    infuraProvider = await initInfuraProvider(ethUrl)
  }
  return infuraProvider
}

export const initInfuraProvider = async (ethUrl?: string): Promise<ethers.providers.InfuraProvider> => {
  if (isBlank(ethUrl)) {
    const data = await getSettingsData()
    ethUrl = data.web3RpcUrl
  }
  const infuraProvider = await setInfuraProvider(ethUrl as string)

  registerOnChangeCallBackFunction('web3RpcUrl', onInfuraProviderChanged)
  return infuraProvider
}

export const onInfuraProviderChanged = async (infuraUrl: string): Promise<ethers.providers.InfuraProvider> => {
  //Clear all web3Provider objects and obtain them again
  const keys = Array.from(SingletonService._container.keys())
  for (const key of keys) {
    const _key = key as string
    if (_key.startsWith(INFURA_WEB3PROVIDER_INSTANCE_NAME_PREFIX)) {
      SingletonService.delete(_key)
    }
  }

  return await setInfuraProvider(infuraUrl)
}

export const setInfuraProvider = async (infuraUrl: string): Promise<ethers.providers.InfuraProvider> => {
  const re = /(http|https):\/\/([A-z0-9]*)\..*/
  const matchs = re.exec(infuraUrl) || []
  if (matchs.length === 0) {
    // Message.error(`The current ether url must be nulink infura url: ${infuraUrl}`);
    throw new Error(`The current ether url must be nulink infura url: ${infuraUrl}`)
  }
  const ethNet = matchs[2] // rinkeby
  const infuraProjectID = infuraUrl.slice(infuraUrl.lastIndexOf('/') + 1) //f4cee6462e744290a9d4f84e84c9b810
  const infuraProvider = new ethers.providers.InfuraProvider(ethNet, infuraProjectID) //https://docs.ethers.io/v5/api/providers/api-providers/#InfuraProvider

  SingletonService.set<ethers.providers.InfuraProvider>(INFURAPROVIDER_INSTANCE_NAME(infuraUrl), infuraProvider, true)
  return infuraProvider
}

export const infuraUrl2Web3Provider = (
  infuraProvider: ethers.providers.InfuraProvider,
  account: 'Account'
): ethers.providers.Web3Provider => {
  //current account

  const signer = new Wallet(pwdDecrypt((account as any).encryptedKeyPair._privateKey, true)).connect(infuraProvider)

  //https://npm.io/package/ethers-to-web3
  //https://github.com/raymondpulver/ethers-to-web3
  const web3Provider = new ethers.providers.Web3Provider(toWeb3Provider(signer))
  return web3Provider
}
