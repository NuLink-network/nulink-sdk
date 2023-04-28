import NuLinkTokenABI from "./abi/NuLinkToken.json";


export enum NETWORK_LIST {
  Horus = "Horus",
}

export enum CONTRACT_NAME {
  nuLinkToken = "nuLinkToken",
  subScriptManager = "subScriptManager",
}

const networkContractList = {
  [NETWORK_LIST.Horus]: {
    [CONTRACT_NAME.nuLinkToken]: { address:  process.env.REACT_APP_CONTRACT_NULINKTOKEN_ADDRESS as string, abi: NuLinkTokenABI },
    [CONTRACT_NAME.subScriptManager]: { address: process.env.REACT_APP_CONTRACT_SUBSCRIPTMANAGER_ADDRESS as string, abi: null },
  },
};

export const contractList = networkContractList;
