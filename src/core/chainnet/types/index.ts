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

export type NetworkConfigKeys = keyof NetworkConfigOptions;

export type AsyncConfigChangedCallbackFunction = (
  value: string,
  oldValue?: string
) => Promise<any>;
