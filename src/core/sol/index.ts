import NuLinkTokenABI from "./abi/NuLinkToken.json";
import SubscriptionManagerABI from "./abi/SubscriptionManager.json";

export enum NETWORK_LIST {
  Horus = "Horus", //testnet
  HorusMainNet = "Horus MainNet",
  ConfluxTestNet = "ConFlux Espace TestNet",
  PolygonTestNet = "Polygon Mumbai", //polygon testnet
  XChainTestNet = "OKX Chain TestNet",
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
  // [NETWORK_LIST.HorusMainNet]: {
  //   [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_BSC_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
  //   [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_BSC_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
  // },
  [NETWORK_LIST.Horus]: {
    [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_BSC_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
    [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_BSC_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
  },
  [NETWORK_LIST.ConfluxTestNet]: {
    [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
    [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
  },
  [NETWORK_LIST.PolygonTestNet]: {
    [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_POLYGON_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
    [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_POLYGON_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
  },

  [NETWORK_LIST.XChainTestNet]: {
    [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_XCHAIN_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
    [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_XCHAIN_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: SubscriptionManagerABI },
  },
};
/**
 * @internal
 */
export const contractList = networkContractList;