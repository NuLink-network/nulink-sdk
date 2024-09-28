import { BigNumber, ContractTransaction, ethers } from 'ethers';
import Web3 from 'web3';

import { AppPay, AppPay__factory } from '../../../../types/ethers-contracts';
import { ChecksumAddress } from './types';
import { Web3Provider } from './web3';

import { DEFAULT_WAIT_N_CONFIRMATIONS, getContracts } from './contracts';

import { CONTRACT_NAME } from '..';
import { getClientId } from '../../chainnet/api/getData';
import { DecimalToInteger, isBlank } from '../../../core/utils';
import { GAS_LIMIT_FACTOR, GAS_PRICE_FACTOR } from '../../chainnet/config';
import { getWeb3 } from '../../hdwallet/api/web3';
import { GasInfo } from '../../pre/api';

export class AppPayAgent {
  public static async estimateGasByBobPay(
    web3Provider: Web3Provider,
    // valueInWei: BigNumber,
    orderId: BigNumber, //payId
    payAmount: BigNumber,
    payToken: ChecksumAddress,
    usageDays: number,
    // startTimestamp: number,
    // endTimestamp: number,
    aliceAddress: ChecksumAddress,
    gasPrice: BigNumber = BigNumber.from('0') //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
  ): Promise<GasInfo> {
    const appPay: AppPay = await this.connect(web3Provider.provider, web3Provider.signer);
    const overrides = {
      //value: valueInWei.toString()
    };

    //const gasPrice: BigNumber = await web3Provider.provider.getGasPrice();

    const clientId = await getClientId(true);

    if (isBlank(clientId)) {
      throw new Error('clientId is not set, need invoke the function initClientId first');
    }
    
    const gasUsedAmounts = await appPay.estimateGas.pay(
      clientId,
      orderId,
      payAmount,
      // startTimestamp, // unit: seconds
      // endTimestamp, // unit: seconds
      // usageDays * 86400, //seconds, 
      aliceAddress,
      payToken,
      overrides
      //{ ...overrides, gasLimit: 30000000, gasPrice: gasPrice}
    );

    const web3: Web3 = await getWeb3();

    const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] = DecimalToInteger(GAS_PRICE_FACTOR);

    //estimatedGas * gasPrice * factor
    if (gasPrice.lte(BigNumber.from('0'))) {
      // the gasPrice is obtained in real time
      gasPrice = BigNumber.from(await web3.eth.getGasPrice());
      gasPrice = gasPrice.mul(GAS_PRICE_FACTOR_LEFT).div(GAS_PRICE_FACTOR_RIGHT);
    } else {
      //If the gasPrice is manually set, the GAS_PRICE_FACTOR is not set
    }

    const [GAS_LIMIT_FACTOR_LEFT, GAS_LIMIT_FACTOR_RIGHT] = DecimalToInteger(GAS_LIMIT_FACTOR);

    const newGasUsedAmounts = gasUsedAmounts.mul(GAS_LIMIT_FACTOR_LEFT).div(GAS_LIMIT_FACTOR_RIGHT);

    const gasFeeInWei = newGasUsedAmounts.mul(gasPrice);

    const gasInfo: GasInfo = {
      gasPrice: gasPrice,
      gasLimit: newGasUsedAmounts,
      gasFee: gasFeeInWei
    };

    return gasInfo;
  }

  public static async bobPay(
    web3Provider: Web3Provider,
    // valueInWei: BigNumber,
    orderId: BigNumber, //payId
    payAmount: BigNumber,
    payToken: ChecksumAddress,
    usageDays: number,
    // startTimestamp: number, // unit: seconds
    // endTimestamp: number, // unit: seconds
    aliceAddress: ChecksumAddress,
    waitReceipt = true,
    gasUsedAmounts: BigNumber = BigNumber.from('0'), // Note that using gasUsedAmount ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
    gasPrice: BigNumber = BigNumber.from('0') // Note that using gasPrice ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  ): Promise<ContractTransaction> {
    const appPay: AppPay = await this.connect(web3Provider.provider, web3Provider.signer);
    const overrides = {
      //value: valueInWei.toString()
    };

    //const gasPrice: BigNumber = await web3Provider.provider.getGasPrice();

    //note: Each digit in the clientId must be composed of numbers.
    const clientId = await getClientId(true);

    if (isBlank(clientId)) {
      throw new Error('clientId is not set, need invoke the function initClientId first');
    }

    if (gasPrice.lte(BigNumber.from('0'))) {
      gasPrice = await web3Provider.provider.getGasPrice();
    }

    if (gasUsedAmounts.lte(BigNumber.from('0'))) {
      const gasInfo = await AppPayAgent.estimateGasByBobPay(
        web3Provider,
        orderId,
        payAmount,
        payToken,
        usageDays,
        aliceAddress,
        gasPrice,
        //{ ...overrides, gasLimit: 30000000, gasPrice: gasPrice}
      );

      gasUsedAmounts = gasInfo.gasLimit
    }

    const tx = await appPay.pay(clientId, orderId, payAmount, /* startTimestamp, endTimestamp *//*usageDays,*/ aliceAddress, payToken, {
      ...overrides,
      gasLimit: gasUsedAmounts,
      gasPrice: gasPrice
    });

    if (waitReceipt) {
      await tx.wait(DEFAULT_WAIT_N_CONFIRMATIONS);
    }

    return tx;
  }

  public static async estimateGasBybobPayCancel(
    web3Provider: Web3Provider,
    // valueInWei: BigNumber,
    orderId: BigNumber, //payId
    gasPrice: BigNumber = BigNumber.from('0') //the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time
  ): Promise<GasInfo> {
    const appPay: AppPay = await this.connect(web3Provider.provider, web3Provider.signer);
    const overrides = {
      //value: valueInWei.toString()
    };

    //const gasPrice: BigNumber = await web3Provider.provider.getGasPrice();

    const clientId = await getClientId(true);

    if (isBlank(clientId)) {
      throw new Error('clientId is not set, need invoke the function initClientId first');
    }

    const gasUsedAmounts = await appPay.estimateGas.payCancel(
      clientId,
      orderId,
      overrides
      //{ ...overrides, gasLimit: 30000000, gasPrice: gasPrice}
    );

    const web3: Web3 = await getWeb3();

    const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] = DecimalToInteger(GAS_PRICE_FACTOR);

    //estimatedGas * gasPrice * factor
    if (gasPrice.lte(BigNumber.from('0'))) {
      // the gasPrice is obtained in real time
      gasPrice = BigNumber.from(await web3.eth.getGasPrice());
      gasPrice = gasPrice.mul(GAS_PRICE_FACTOR_LEFT).div(GAS_PRICE_FACTOR_RIGHT);
    } else {
      //If the gasPrice is manually set, the GAS_PRICE_FACTOR is not set
    }

    const [GAS_LIMIT_FACTOR_LEFT, GAS_LIMIT_FACTOR_RIGHT] = DecimalToInteger(GAS_LIMIT_FACTOR);

    const newGasUsedAmounts = gasUsedAmounts.mul(GAS_LIMIT_FACTOR_LEFT).div(GAS_LIMIT_FACTOR_RIGHT);

    const gasFeeInWei = newGasUsedAmounts.mul(gasPrice);

    const gasInfo: GasInfo = {
      gasPrice: gasPrice,
      gasLimit: newGasUsedAmounts,
      gasFee: gasFeeInWei
    };

    return gasInfo;
  }

  public static async bobPayCancel(
    web3Provider: Web3Provider,
    // valueInWei: BigNumber,
    orderId: BigNumber, //payId
    waitReceipt = true,
    gasUsedAmounts: BigNumber = BigNumber.from('0'), // Note that using gasUsedAmount ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
    gasPrice: BigNumber = BigNumber.from('0') // Note that using gasPrice ?: BigNumber here will cause the reference to PublicKey from nulink-ts to become undefined.
  ): Promise<ContractTransaction> {
    const appPay: AppPay = await this.connect(web3Provider.provider, web3Provider.signer);
    const overrides = {
      //value: valueInWei.toString()
    };

    //const gasPrice: BigNumber = await web3Provider.provider.getGasPrice();

    //note: Each digit in the clientId must be composed of numbers.
    const clientId = await getClientId(true);

    if (isBlank(clientId)) {
      throw new Error('clientId is not set, need invoke the function initClientId first');
    }

    if (gasPrice.lte(BigNumber.from('0'))) {
      gasPrice = await web3Provider.provider.getGasPrice();
    }

    if (gasUsedAmounts.lte(BigNumber.from('0'))) {
      const gasInfo = await AppPayAgent.estimateGasBybobPayCancel(
        web3Provider,
        orderId,
        gasPrice,
        //{ ...overrides, gasLimit: 30000000, gasPrice: gasPrice}
      );

      gasUsedAmounts = gasInfo.gasLimit
    }

    const tx = await appPay.payCancel(clientId, orderId, {
      ...overrides,
      gasLimit: gasUsedAmounts,
      gasPrice: gasPrice
    });

    if (waitReceipt) {
      await tx.wait(DEFAULT_WAIT_N_CONFIRMATIONS);
    }

    return tx;
  }


  public static async getPayInfo(
    provider: ethers.providers.Provider,
    orderId: BigNumber, //payId
  ): Promise<[
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    number,
    string,
    string,
    string
  ] & {
    payID: BigNumber;
    payAmount: BigNumber;
    payTime: BigNumber;
    startTime: BigNumber;
    endTime: BigNumber;
    paySts: number;
    bobAddress: string;
    aliceAddress: string;
    payToken: string;
  }> {
    const appPay = await this.connect(provider);
    // console.log("SubscriptionManager", SubscriptionManager);
    // console.log("provider", provider);

    //note: Each digit in the clientId must be composed of numbers.
    const clientId = await getClientId(true); 
    
    /**
     *     struct payInfoS{
              uint256 payID;
              uint256 payAmount;
              uint256 payTime;
              uint256 startTime;
              uint256 endTime;
              payStatus paySts;
              address bobAddress;
              address aliceAddress;
              address payToken; 
          }
     */
    const payInfos = await appPay.payInfo(clientId, orderId);

    return payInfos; // According to the contract rules, the value must be increased by at least 1.
  }

  private static async connect(
    provider: ethers.providers.Provider,
    signer?: ethers.providers.JsonRpcSigner
  ): Promise<AppPay> {
    const network = await provider.getNetwork();
    let contractAddress = await getContracts(network.chainId)[CONTRACT_NAME.appPay].address;

    // console.log("provider", provider);
    // console.log("network", network);
    // console.log("contractAddress", contractAddress);

    contractAddress = Web3.utils.toChecksumAddress(
      contractAddress //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
    );

    return AppPay__factory.connect(contractAddress, signer ?? provider);
  }
}
