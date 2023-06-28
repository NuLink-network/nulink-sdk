import type {
  NetworkConfigOptions,
  AsyncConfigChangedCallbackFunction,
  NetworkConfigKeys,
} from "../types";
import { store as storage } from "../../utils/storage";
import { networkDetails } from "../config";
import { CONTRACT_NAME, NETWORK_LIST } from "../../sol"
import {
  getCurrentNetworkKey,
  getSettingsData,
  CHAIN_NETWORK_LABEL,
  CHAIN_NETWORK_CONFIG,
  getCurrentNetworkInitialConfiguration,
} from "./getData";
import { reInitCurrentContractInst } from "../../sol/contract";

const asyncCallBackFunctions = {};
export const registerOnChangeCallBackFunction = async (
  key: string | CONTRACT_NAME,
  asyncCallFackFunction: AsyncConfigChangedCallbackFunction
) => {
  asyncCallBackFunctions[key] = asyncCallFackFunction;
};

const onChangedValue = async (
  key: string,
  newValue: string,
  oldValue: string
) => {
  if (Object.prototype.hasOwnProperty.call(asyncCallBackFunctions, key)) {
    const f = asyncCallBackFunctions[key];
    try {
      if (f.length > 1) {
        // number of arguments
        await f(newValue, oldValue);
      } else {
        await f(newValue);
      }
    } catch (error) {
      console.error(`onChangedValue key: ${key} value: ${newValue}`, error);
    }
  }
};

export const saveSettingsData = async (data: NetworkConfigOptions): Promise<void> => {
  const oldData = await getSettingsData();

  const initialConfig = await getCurrentNetworkInitialConfiguration();

  const temp: any = {};
  for (const key in initialConfig) {
    if (Object.prototype.hasOwnProperty.call(initialConfig, key)) {
      temp[key] =
        data[key as NetworkConfigKeys] ||
        initialConfig[key as NetworkConfigKeys];
      if (temp[key] !== oldData[key]) {
        await onChangedValue(key, temp[key], oldData[key]);
      }
    }
  }
  const mergedData = Object.assign(initialConfig, temp);
  await storage.setItem(CHAIN_NETWORK_CONFIG, mergedData);
};

//get the default network key
export const setCurrentNetworkKey = async (
  networkKey: NETWORK_LIST
): Promise<void> => {
  const currentNetwork: NETWORK_LIST = await getCurrentNetworkKey();

  if (networkKey === currentNetwork) {
    return;
  }

  await storage.setItem(CHAIN_NETWORK_LABEL, networkKey);

  //get currentNetwork config info

  const netDetails: Record<string, any> = networkDetails[networkKey];

  const newConfig: NetworkConfigOptions = {
    web3RpcUrl: netDetails.WEB3_RPC_URL,
    chainId: netDetails.CHAIN_ID,
    chainName: netDetails.CHAIN_NAME,
    ipfs: netDetails.IPFS_NODE_URL,
    infura_ipfs_encrypted_auth: netDetails.INFURA_IPFS_ENCRYPT_AUTH,
    service: netDetails.CENTRALIZED_SERVER_URL,
    porter: netDetails.PORTER_URL,
    contract_info: netDetails.CONTRACT_INFO,
    token_symbol: netDetails.TOKEN_SYMBOL,
    nlk_token_symbol: netDetails.NLK_TOKEN_SYMBOL,
  };

  await saveSettingsData(newConfig);

  //reinit contractInst
  await reInitCurrentContractInst();
};

export const setCurrentNetworkWeb3RpcUrl = async (
  web3RpcUrl: string
): Promise<void> => {
  const networkConfig = await getSettingsData();
  networkConfig.web3RpcUrl = web3RpcUrl;
  await saveSettingsData(networkConfig);
};
