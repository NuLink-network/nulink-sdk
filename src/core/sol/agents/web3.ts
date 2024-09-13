import { ethers } from 'ethers';

import { ChecksumAddress } from './types';

export class Web3Provider {
  private constructor(private web3Provider: ethers.providers.Web3Provider) {}

  public static fromEthersWeb3Provider(
    web3Provider: ethers.providers.Web3Provider
  ) {
    return new Web3Provider(web3Provider);
  }

  public getAddress(): Promise<ChecksumAddress> {
    return this.web3Provider.getSigner().getAddress();
  }

  public get provider(): ethers.providers.Web3Provider {
    return this.web3Provider;
  }

  public get signer(): ethers.providers.JsonRpcSigner {
    return this.web3Provider.getSigner();
  }
}