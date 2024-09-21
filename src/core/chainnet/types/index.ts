/**
 * @internal
 */
export type NetworkConfigOptions = {
  web3RpcUrl: string;
  chainId: number;
  chainName: string;
  service: string; // fe service address
  porter: string;
  contract_info: any;
  tokenAddress: string;
  tokenSymbol: string;
  nlkTokenAddress: string;
  nlkTokenSymbol: string;
};
/**
 * @internal
 */
export type NetworkConfigKeys = keyof NetworkConfigOptions;
/**
 * @internal
 */
export type AsyncConfigChangedCallbackFunction = (value: string, oldValue?: string) => Promise<any>;
