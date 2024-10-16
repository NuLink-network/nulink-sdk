import { contractList, NETWORK_LIST } from '..';
export const getContracts = async (chainId: number): Promise<object> => {
  const { getCurrentNetworkKey, getSettingsData, networkDetails } = await import('../../chainnet');
  // const settingsData = await getSettingsData();

  const chainIdList: number [] = [];
  for (const value of Object.values(networkDetails)) {
    // console.log(value.CENTRALIZED_SERVER_URL as string);
    
    chainIdList.push(value.CHAIN_ID as number)
  }
  
  if (!chainIdList.includes(chainId)) {
    throw new Error(`No default confituration found for chainId: ${chainId}`);
  }
  
  // if (settingsData.chainId != chainId) {
  //   throw new Error(`getContracts error: chainId ${chainId} not match settingsData.chainId: ${settingsData.chainId}`);
  // }

  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();

  const contractInfo: any = contractList[curNetwork];
  return contractInfo;
};

export const DEFAULT_WAIT_N_CONFIRMATIONS = 1;
