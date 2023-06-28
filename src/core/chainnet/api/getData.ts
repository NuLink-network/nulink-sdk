import type { NetworkConfigOptions } from "../types";
import { store as storage } from "../../utils/storage";
import { defaultChainNetWork, networkDetails } from "../config";
import { NETWORK_LIST } from "../../sol"

/**
 * @internal
 */
export const CHAIN_NETWORK_LABEL = "chain_network";

/**
 * @internal
 */
export const CHAIN_NETWORK_CONFIG = "chain_network_config";


/**
 * get current setting data
 * @returns Promise<NetworkConfigOptions>
 */
export const getSettingsData = async (): Promise<NetworkConfigOptions> => {
  const data = await storage.getItem(CHAIN_NETWORK_CONFIG);
  return data || (await getCurrentNetworkInitialConfiguration());
};

/**
 * get the default network key
 * @returns Promise<NETWORK_LIST>
 */
export const getCurrentNetworkKey = async (): Promise<NETWORK_LIST> => {
  const network = await storage.getItem(CHAIN_NETWORK_LABEL);
  return network || defaultChainNetWork;
};

/**
 * @internal
 */
export const getCurrentNetworkInitialConfiguration = async () => {
  const currentNetwork: NETWORK_LIST = await getCurrentNetworkKey();

  console.log("current Network is ", NETWORK_LIST[NETWORK_LIST.Horus]);

  if (!(currentNetwork in networkDetails)) {
    return {};
  }

  const netDetails = networkDetails[currentNetwork];

  const initialConfig: NetworkConfigOptions = {
    web3RpcUrl: netDetails.WEB3_RPC_URL,
    chainId: netDetails.CHAIN_ID,
    chainName: netDetails.CHAIN_NAME,
    ipfs: netDetails.IPFS_NODE_URL,
    infura_ipfs_encrypted_auth: netDetails.INFURA_IPFS_ENCRYPT_AUTH,
    service: netDetails.CENTRALIZED_SERVER_URL,
    porter: netDetails.PORTER_URL,
    contract_info: netDetails.CONTRACT_INFO as any,
    token_symbol: netDetails.TOKEN_SYMBOL,
    nlk_token_symbol: netDetails.NLK_TOKEN_SYMBOL,
  };

  return initialConfig;
};
