/**
 *  nucypher ts parameter need Web3Provider object
 */

 import { getSettingsData } from "./getData";
import { isBlank } from "../../utils/null";
// Remove interdependence
// import { Account } from "../../hdwallet/api/account";
import { ethers } from "ethers";
import { getWeb3Provider as getWeb3ProviderFromInfura } from "./web3InfuraProvider";
import { getWeb3Provider as getWeb3ProviderFromRpc } from "./web3RpcProvider";

export const getWeb3Provider = async (account: 'Account', ethUrl?: string): Promise<ethers.providers.Web3Provider> => {
  if (isBlank(ethUrl)) {
    const data = await getSettingsData();
    ethUrl = data.web3RpcUrl;
  }

  if (ethUrl?.includes("infura")) {
    return await getWeb3ProviderFromInfura(account, ethUrl);
  }

  return await getWeb3ProviderFromRpc(account, ethUrl);
};
