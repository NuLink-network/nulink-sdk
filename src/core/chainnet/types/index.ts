/**
 * @internal
 */
export type NetworkConfigOptions = {
  web3RpcUrl: string;
  chainId: number;
  ipfs: string;
  infura_ipfs_encrypted_auth: string;
  service: string; // fe service address
  porter: string;
  contract_info: any;
  token_symbol: string;
  nlk_token_symbol: string;
};
/**
 * @internal
 */
export type NetworkConfigKeys = keyof NetworkConfigOptions;
/**
 * @internal
 */
export type AsyncConfigChangedCallbackFunction = (
  value: string,
  oldValue?: string
) => Promise<any>;
