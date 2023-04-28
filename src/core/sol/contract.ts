import Web3 from "web3";
import { isBlank, fromHexString } from "../utils";
import SingletonService from "singleton-service";
// Remove interdependence
// import { getCurrentNetworkKey } from "../chainnet";
//import { getWeb3 } from "../hdwallet";
import { CONTRACT_NAME } from ".";
import { contractList, NETWORK_LIST } from ".";
import { Contract, ContractOptions } from "web3-eth-contract";

const CONTRACT_INSTANCE_NAME_PREFIX = "contract_name";
const CONTRACT_INSTANCE_NAME = (
  networkName: NETWORK_LIST,
  contractName: CONTRACT_NAME
) => `${CONTRACT_INSTANCE_NAME_PREFIX}_${networkName}_${contractName}`;

export const getContractInst = async (
  contractName: CONTRACT_NAME
): Promise<Contract> => {
  const  { getCurrentNetworkKey } = await import("../chainnet");
  // for get instance with saved key
  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();
  let contractInst = SingletonService.get<Contract>(
    CONTRACT_INSTANCE_NAME(curNetwork, contractName)
  );
  if (isBlank(contractInst)) {
    contractInst = await initContractInst(contractName);
  }
  return contractInst;
};

export const setContractInst = async (
  contractName: CONTRACT_NAME | string
): Promise<Contract> => {
  //https://github.com/ChainSafe/web3.js

  const enumContractName: CONTRACT_NAME = CONTRACT_NAME[contractName];
  const  { getCurrentNetworkKey } = await import("../chainnet");
  const { getWeb3 } = await import("../hdwallet");

  const web3: Web3 = await getWeb3();
  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();
  const contractInfo: any = contractList[curNetwork][contractName];
  const contract = new web3.eth.Contract(
    contractInfo.abi,
    contractInfo.address
  );

  SingletonService.set<Contract>(
    CONTRACT_INSTANCE_NAME(curNetwork, enumContractName),
    contract,
    true
  );

  return contract;
};

export const initContractInst = async (
  contractName: CONTRACT_NAME
): Promise<Contract> => {
  const contractInst = await setContractInst(contractName);
  return contractInst;
};

export const reInitCurrentContractInst = async () => {
  const  { getCurrentNetworkKey } = await import("../chainnet");
  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();
  for (const key in contractList[curNetwork]) {
    await setContractInst(key);
  }
};

export const toCanonicalAddress = (address: string): Uint8Array => {
  const ETH_ADDRESS_STRING_PREFIX = "0x";
  const nonPrefixed = address.startsWith(ETH_ADDRESS_STRING_PREFIX)
    ? address.substring(ETH_ADDRESS_STRING_PREFIX.length)
    : address;
  return fromHexString(nonPrefixed);
};