import NuLinkTokenABI from "./abi/NuLinkToken.json";
import SubscriptionManagerABI from "./abi/SubscriptionManager.json";

export enum NETWORK_LIST {
  Horus = "Horus TestNet",
  Conflux = "ConFlux Espace TestNet"
}

/**
 * @internal
 */
export enum CONTRACT_NAME {
  nuLinkToken = "nuLinkToken",
  subScriptManager = "subScriptManager",
}
/**
 * @internal
 */
const networkContractList = {
  [NETWORK_LIST.Horus]: {
    [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_BSC_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
    [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_BSC_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
  },
  [NETWORK_LIST.Conflux]: {
    [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
    [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
  },
};
/**
 * @internal
 */
export const contractList = networkContractList;