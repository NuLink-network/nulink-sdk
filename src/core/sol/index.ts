import NuLinkTokenABI from './abi/NuLinkToken.json';
import SubscriptionManagerABI from './abi/SubscriptionManager.json';
import AppPayABI from './abi/appPay.json';


/**
 * @internal
 */

export enum NETWORK_LIST {
  Horus = 'Horus', //testnet    bnbt
  HorusMainNet = 'Horus MainNet', // bnb
  ConfluxTestNet = 'ConFlux Espace TestNet',
  PolygonTestNet = 'Polygon Mumbai', //polygon testnet
  XChainTestNet = 'X-Layer TestNet',
  ETHHoleSkyTestNet = 'Holesky TestNet' //ETH testnet
}

/**
 * @internal
 */
export enum CONTRACT_NAME {
  nuLinkToken = 'nuLinkToken',
  subScriptManager = 'subScriptManager',
  appPay = 'appPay',
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
    [CONTRACT_NAME.nuLinkToken]: {
      address: process.env.REACT_APP_BSC_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string,
      abi: NuLinkTokenABI
    },
    [CONTRACT_NAME.subScriptManager]: {
      address: process.env.REACT_APP_BSC_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string,
      abi: SubscriptionManagerABI
    },

    [CONTRACT_NAME.appPay]: {
      address: process.env.REACT_APP_BSC_TESTNET_CONTRACT_APP_PAY_ADDRESS as string,
      abi: AppPayABI
    },
  },
  // [NETWORK_LIST.Horus]: {
  //   [CONTRACT_NAME.nuLinkToken]: { address:  "0x8A95eF66ef0b5bCD10cb8aB433c768f50B5822a8", /*process.env.REACT_APP_BSC_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string,*/ abi: NuLinkTokenABI },
  //   [CONTRACT_NAME.subScriptManager]: { address: "0xc337EE62Fd5A6bF36A52A5f6a1C83DFc81945EB3", /*process.env.REACT_APP_BSC_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string,*/ abi: SubscriptionManagerABI },
  // },
  [NETWORK_LIST.ConfluxTestNet]: {
    [CONTRACT_NAME.nuLinkToken]: {
      address: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string,
      abi: NuLinkTokenABI
    },
    [CONTRACT_NAME.subScriptManager]: {
      address: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string,
      abi: SubscriptionManagerABI
    },
    [CONTRACT_NAME.appPay]: {
      address: process.env.REACT_APP_CONFLUX_ESPACE_TESTNET_CONTRACT_APP_PAY_ADDRESS as string,
      abi: AppPayABI
    },
  },
  [NETWORK_LIST.PolygonTestNet]: {
    [CONTRACT_NAME.nuLinkToken]: {
      address: process.env.REACT_APP_POLYGON_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string,
      abi: NuLinkTokenABI
    },
    [CONTRACT_NAME.subScriptManager]: {
      address: process.env.REACT_APP_POLYGON_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string,
      abi: SubscriptionManagerABI
    },
    [CONTRACT_NAME.appPay]: {
      address: process.env.REACT_APP_POLYGON_TESTNET_CONTRACT_APP_PAY_ADDRESS as string,
      abi: AppPayABI
    },
  },

  [NETWORK_LIST.XChainTestNet]: {
    [CONTRACT_NAME.nuLinkToken]: {
      address: process.env.REACT_APP_XCHAIN_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string,
      abi: NuLinkTokenABI
    },
    [CONTRACT_NAME.subScriptManager]: {
      address: process.env.REACT_APP_XCHAIN_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string,
      abi: SubscriptionManagerABI
    },
    [CONTRACT_NAME.appPay]: {
      address: process.env.REACT_APP_XCHAIN_TESTNET_CONTRACT_APP_PAY_ADDRESS as string,
      abi: AppPayABI
    },
  },

  [NETWORK_LIST.ETHHoleSkyTestNet]: {
    [CONTRACT_NAME.nuLinkToken]: {
      address: process.env.REACT_APP_HOLESKY_TESTNET_CONTRACT_NULINKTOKEN_ADDRESS as string,
      abi: NuLinkTokenABI
    },
    [CONTRACT_NAME.subScriptManager]: {
      address: process.env.REACT_APP_HOLESKY_TESTNET_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string,
      abi: SubscriptionManagerABI
    },
    [CONTRACT_NAME.appPay]: {
      address: process.env.REACT_APP_HOLESKY_TESTNET_CONTRACT_APP_PAY_ADDRESS as string,
      abi: AppPayABI
    },
  }
};
/**
 * @internal
 */
export const contractList = networkContractList;
