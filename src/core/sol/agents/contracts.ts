
import {  contractList, NETWORK_LIST } from "..";
export const getContracts =  async (chainId: number): Promise<object> => {

  const  { getCurrentNetworkKey,getSettingsData } = await import("../../chainnet");
  const settingsData = await getSettingsData();


  if (!Object.values(settingsData.chainId).includes(chainId)) {
    throw new Error(`Web3 no contracts found for chainId: ${chainId}`);
  }
  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();

  const contractInfo: any = contractList[curNetwork];
  return contractInfo;
};

export const DEFAULT_WAIT_N_CONFIRMATIONS = 1;