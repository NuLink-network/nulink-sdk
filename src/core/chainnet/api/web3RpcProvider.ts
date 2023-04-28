/**
 *  nucypher ts parameter need Web3Provider object
 */

import { getSettingsData } from "./getData";
import { registerOnChangeCallBackFunction } from "./saveData";
import { isBlank } from "../../utils/null";
import SingletonService from "singleton-service";
// Remove interdependence
// import { Account } from "../../hdwallet/api/account";
import { Web3Provider } from "@ethersproject/providers";
import { BigNumber, ethers } from "ethers";
import { Wallet } from "@ethersproject/wallet";
import toWeb3Provider from "ethers-to-web3";
import { decrypt as pwdDecrypt } from "../../utils/passwordEncryption";

const RPC_WEB3PROVIDER_INSTANCE_NAME_PREFIX = "rpcWeb3provider";
const PRIVODER_NAME = (account: 'Account') => `${RPC_WEB3PROVIDER_INSTANCE_NAME_PREFIX}_${(account as any).address}`;

export const getWeb3Provider = async (account: 'Account', ethUrl?: string): Promise<ethers.providers.Web3Provider> => {
  // for get instance with saved key
  let web3Provider = SingletonService.get<ethers.providers.Web3Provider>(PRIVODER_NAME(account));
  if (isBlank(web3Provider)) {
    web3Provider = await initWeb3Provider(account, ethUrl);
  }
  return web3Provider;
};

export const initWeb3Provider = async (account: 'Account', ethUrl?: string): Promise<ethers.providers.Web3Provider> => {
  const web3Provider = await setWeb3Provider(account, ethUrl);

  registerOnChangeCallBackFunction("web3RpcUrl", onProviderChangedClosure(account));
  return web3Provider;
};

const onProviderChangedClosure = (account: 'Account'): any => {
  const accountSave = account;

  const onProviderChanged = async (ethUrl?: string): Promise<ethers.providers.Web3Provider> => {
    //Clear all web3Provider objects and obtain them again
    const keys = Array.from(SingletonService._container.keys());
    for (const key of keys) {
      const _key = key as string;
      if (_key.startsWith(RPC_WEB3PROVIDER_INSTANCE_NAME_PREFIX)) {
        SingletonService.delete(_key);
      }
    }

    return await setWeb3Provider(accountSave, ethUrl);
  };

  return onProviderChanged;
};

export const setWeb3Provider = async (account: 'Account', ethUrl?: string): Promise<ethers.providers.Web3Provider> => {
  if (isBlank(ethUrl)) {
    const data = await getSettingsData();
    ethUrl = data.web3RpcUrl;
  }

  // Using ethers.js
  const _web3Provider = new ethers.providers.JsonRpcProvider(ethUrl) as Web3Provider;

  //below codes is bind account to provider start
  const signer = new Wallet(pwdDecrypt((account as any).encryptedKeyPair._privateKey, true)).connect(_web3Provider);
  //https://npm.io/package/ethers-to-web3
  //https://github.com/raymondpulver/ethers-to-web3
  const web3Provider = new ethers.providers.Web3Provider(toWeb3Provider(signer));
  //above codes is bind account to provider end

  SingletonService.set<ethers.providers.Web3Provider>(PRIVODER_NAME(account), web3Provider, true);
  return web3Provider;
};
