import type { NetworkConfigOptions } from "../types";
import { store as storage } from "../../utils/storage";
import { defaultChainNetWork, networkDetails } from "../config";
import { NETWORK_LIST } from "../../sol";

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
 * get network NETWORK_LIST name by chainId 
 * @returns Promise<NETWORK_LIST>
 */
export const getNetworkKeyByChainId = (chainId: string | number): NETWORK_LIST | undefined => {

  for (const networkDetailsKey in networkDetails) {
    if (chainId.toString() === networkDetails[networkDetailsKey].CHAIN_ID as string){
        return networkDetailsKey as NETWORK_LIST;
    }
  }
  return undefined;
};

/**
 * @internal
 */
export const getCurrentNetworkInitialConfiguration = async () => {
  const currentNetwork: NETWORK_LIST = await getCurrentNetworkKey();

  console.log("current Network is ", currentNetwork);

  if (!(currentNetwork in networkDetails)) {
    return {};
  }

  const netDetails = networkDetails[currentNetwork];

  const initialConfig: NetworkConfigOptions = {
    web3RpcUrl: netDetails.WEB3_RPC_URL,
    chainId: netDetails.CHAIN_ID,
    chainName: netDetails.CHAIN_NAME,
    service: netDetails.CENTRALIZED_SERVER_URL,
    porter: netDetails.PORTER_URL,
    contract_info: netDetails.CONTRACT_INFO as any,
    tokenAddress: netDetails.TOKEN_ADDRESS,
    tokenSymbol: netDetails.TOKEN_SYMBOL,
    nlkTokenSymbol: netDetails.NLK_TOKEN_SYMBOL,
    nlkTokenAddress: netDetails.NLK_TOKEN_ADDRESS,
  };

  return initialConfig;
};
