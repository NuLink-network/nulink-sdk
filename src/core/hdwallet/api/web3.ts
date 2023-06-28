import Web3 from 'web3'
import { getSettingsData } from '../../chainnet/api/getData'
import { registerOnChangeCallBackFunction } from '../../chainnet/api/saveData'
import { isBlank } from '../../utils/null'
import { fromHexString } from '../../utils/format'
import SingletonService from 'singleton-service'
import md5 from 'md5'

const WEB3_INSTANCE_NAME = 'web3'
export const getWeb3 = async (): Promise<Web3> => {
  const data = await getSettingsData()
  const ethUrl = data.web3RpcUrl
  // for get instance with saved key
  let web3 = SingletonService.get<Web3>(`${WEB3_INSTANCE_NAME}_${md5(ethUrl ?? '', { encoding: 'string' })}`)
  if (isBlank(web3)) {
    web3 = await initWeb3()
  }
  return web3
}

export const setWeb3 = async (ethUrl: string): Promise<Web3> => {
  //https://github.com/ChainSafe/web3.js
  const web3 = new Web3(ethUrl)
  SingletonService.set<Web3>(`${WEB3_INSTANCE_NAME}_${md5(ethUrl ?? '', { encoding: 'string' })}`, web3, true)
  return web3
}

export const initWeb3 = async (ethUrl?: string): Promise<Web3> => {
  if (isBlank(ethUrl)) {
    const data = await getSettingsData()
    ethUrl = data.web3RpcUrl
  }
  const web3 = await setWeb3(ethUrl as string)
  registerOnChangeCallBackFunction('web3RpcUrl', setWeb3)
  return web3
}

export const toCanonicalAddress = (address: string): Uint8Array => {
  const ETH_ADDRESS_STRING_PREFIX = '0x'
  const nonPrefixed = address.startsWith(ETH_ADDRESS_STRING_PREFIX)
    ? address.substring(ETH_ADDRESS_STRING_PREFIX.length)
    : address
  return fromHexString(nonPrefixed)
}
