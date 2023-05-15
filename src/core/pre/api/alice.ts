//  Alice: as the publisher of the file (file uploader). 

import { privateKeyBuffer } from "../../hdwallet/api/common";
import {
  Alice,
  BlockchainPolicyParameters,
  EnactedPolicy,
  RemoteBob,
} from "@nulink_network/nulink-ts";

//reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
// notice: bacause the Alice import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
import {
  PublicKey as NucypherTsPublicKey,
  SecretKey as NucypherTsSecretKey,
  Signer as NucypherTsSigner,
} from "@nulink_network/nulink-ts";

// notice: bacause the generateKFrags import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
import * as NucypherCore from "@nucypher/nucypher-core";

import {
  EncryptedTreasureMap,
  HRAC,
  TreasureMap,
  TreasureMapBuilder,
} from "@nucypher/nucypher-core";
import { Web3Provider } from "@ethersproject/providers";
import { Account, Strategy } from "../../hdwallet/api/account";
import {
  generateKFrags,
  Signer as NucypherCoreSigner,
  VerifiedKeyFrag,
} from "@nucypher/nucypher-core";
import { getPorterUrl } from "./porter";
import { getWeb3Provider } from "../../chainnet/api/web3Provider";
import {
  GetUrsulasResponse,
  Ursula,
} from "@nulink_network/nulink-ts/build/main/src/characters/porter";
import { PreEnactedPolicy } from "@nulink_network/nulink-ts/build/main/src/policies/policy";
import { RevocationKit } from "@nulink_network/nulink-ts/build/main/src/kits/revocation";
import { getWeb3, toCanonicalAddress } from "../../hdwallet/api";
import {
  toBytes,
  zip,
  toEpoch,
} from "@nulink_network/nulink-ts/build/main/src/utils";
import { SubscriptionManagerAgent } from "@nulink_network/nulink-ts/build/main/src/agents/subscription-manager";
import Web3 from "web3";
import { getCurrentNetworkKey, getSettingsData } from "../../chainnet";
import { BigNumber } from "ethers";
import { ChecksumAddress } from "@nulink_network/nulink-ts/build/main/src/types";
import qs from "qs";
import axiosRetry from "axios-retry";
import axios, { AxiosRequestConfig } from "axios";
import { decrypt as pwdDecrypt } from "../../utils/passwordEncryption";
import { getContractInst } from "../../sol/contract";
import { Contract, ContractOptions } from "web3-eth-contract";
import { contractList, CONTRACT_NAME, NETWORK_LIST } from "../../sol";
import { Transaction as Tx } from "@ethereumjs/tx";
// import {  Common, Chain} from '@ethereumjs/common'
import Common from "ethereumjs-common";
//https://github.com/ethereumjs/ethereumjs-common
import { TransactionReceipt } from "web3-core";
import {
  InsufficientBalanceError,
  PolicyHasBeenActivedOnChain,
} from "../../utils/exception";
import { GAS_LIMIT_FACTOR, GAS_PRICE_FACTOR } from "../../chainnet/config";
import { DecimalToInteger } from "../../utils/math";
import Erc20TokenABI from "../../sol/abi/Erc20.json";
import AwaitLock from "await-lock";
import { isBlank } from "../../utils/null";
import sleep from "await-sleep";
import { getTransactionNonceLock } from "../../utils/transaction";

// import assert from "assert-ts";


//Adapter code for nucypher-ts  Note Bob, Enrico's Encrypted PK SK is the same as Verify PK SK.  Alice verify PK can use encrypted PK.  In Nucypher-TS, Alice encryption key uses the public and private key pair generated by label, which is the policy public key for us.
export const makeAlice = async (
  account: Account, //current Account
  porterUri?: string,
  provider?: Web3Provider
): Promise<Alice> => {
  const privateKeyString = pwdDecrypt(
    account.encryptedKeyPair._privateKey,
    true
  );

  // notice: bacause the Alice import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
  const secretKey: NucypherTsSecretKey = NucypherTsSecretKey.fromBytes(
    privateKeyBuffer(privateKeyString)
  );

  provider = (provider || (await getWeb3Provider(account as any))) as Web3Provider;

  porterUri = (porterUri || (await getPorterUrl())) as string;

  // globalThis.Alice = Alice;
  // globalThis.SecretKey = NucypherTsSecretKey;
  // globalThis.privateKeyBuffer = privateKeyBuffer;
  // globalThis.provider = provider;
  // globalThis.secretKey = secretKey;
  // globalThis.porterUri = porterUri;

  // notice: bacause the Alice import from nucypher-ts, so you  must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
  return Alice.fromSecretKey({ porterUri }, secretKey, provider);
};

// "@nucypher/nucypher-ts": "^0.7.0",  must be this version

//Create an on-chain policy
export const createChainPolicy = async (
  alice: Alice,
  rawParameters: BlockchainPolicyParameters,
  strategy: Strategy
): Promise<BlockchainPolicy> => {
  const { bob, label, threshold, shares, startDate, endDate } =
    await validatePolicyParameters(alice, rawParameters);
  const { delegatingKey, verifiedKFrags } = alicegGenerateKFrags(
    alice,
    bob,
    strategy,
    threshold,
    shares
  );
  return new BlockchainPolicy(
    alice,
    label,
    bob,
    verifiedKFrags,
    delegatingKey,
    threshold,
    shares,
    startDate,
    endDate
  );
};

export class BlockchainPolicy {
  public readonly hrac: HRAC;

  constructor(
    private readonly publisher: Alice,
    private readonly label: string,
    private bob: RemoteBob,
    private verifiedKFrags: VerifiedKeyFrag[],
    private delegatingKey: NucypherTsPublicKey,
    private readonly threshold: number,
    private readonly shares: number,
    private readonly startDate: Date,
    private readonly endDate: Date
  ) {
    //reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
    // notice: bacause the HRAC import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
    const publisherVerifyingKey = NucypherCore.PublicKey.fromBytes(
      this.publisher.verifyingKey.toBytes()
    );
    const bobVerifyingKey = NucypherCore.PublicKey.fromBytes(
      this.bob.verifyingKey.toBytes()
    );
    this.hrac = new HRAC(
      publisherVerifyingKey,
      bobVerifyingKey,
      toBytes(this.label)
    );
  }

  public async estimateCreatePolicyGas(
    publisher: Alice
  ): Promise<BigNumber> {
    //return gasFee =  estimatedGas(gasUsed or gasLimit) * gasPrice
    const startTimestamp = toEpoch(this.startDate);
    const endTimestamp = toEpoch(this.endDate);
    const ownerAddress = await publisher.web3Provider.getAddress();
    // const value = await SubscriptionManagerAgent.getPolicyCost(
    //   publisher.web3Provider.provider,
    //   this.shares,
    //   startTimestamp,
    //   endTimestamp,
    // );

    const web3: Web3 = await getWeb3();

    const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] =
        DecimalToInteger(GAS_PRICE_FACTOR);
      //estimatedGas * gasPrice * factor
    const gasPrice = BigNumber.from(await web3.eth.getGasPrice()).mul(GAS_PRICE_FACTOR_LEFT)
        .div(GAS_PRICE_FACTOR_RIGHT);

    try {
      const estimatedGas =
        await SubscriptionManagerAgent.estimateGasByCreatePolicy(
          publisher.web3Provider,
          BigNumber.from("0"),
          this.hrac.toBytes(),
          this.shares,
          startTimestamp,
          endTimestamp,
          ownerAddress
        );

      const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] =
        DecimalToInteger(GAS_PRICE_FACTOR);
      //estimatedGas * gasPrice * factor
      const gasFeeInWei = BigNumber.from(estimatedGas)
        .mul(BigNumber.from(gasPrice))
        .mul(GAS_PRICE_FACTOR_LEFT)
        .div(GAS_PRICE_FACTOR_RIGHT);
      return gasFeeInWei;
    } catch (error: any) {
      const error_info: string = error?.message || error;
      if (error_info?.toLowerCase()?.includes("policy is currently active")) {
        //The policy has been created successfully, and there is no need to created again
        throw new PolicyHasBeenActivedOnChain("Policy is currently active");
      } else {
        throw error;
      }
    }
  }

  public async enact(
    ursulas: Ursula[],
    waitReceipt = true,
    gasUsedAmount?: BigNumber
  ): Promise<EnactedPolicy> {
    const preEnacted = await this.generatePreEnactedPolicy(ursulas);
    return await preEnacted.enact(this.publisher, waitReceipt, gasUsedAmount);
  }

  public async generatePreEnactedPolicy(
    ursulas: Ursula[]
  ): Promise<PreEnactedPolicy> {
    const treasureMap = this.makeTreasureMap(ursulas, this.verifiedKFrags);
    const encryptedTreasureMap = this.encryptTreasureMap(treasureMap);

    //reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
    // notice: bacause the RevocationKit use the nucypher-core's Signer, so you  must be use the nucypher-core's Signer , not use the nucypher-ts's Signer (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    const nucypherSecretKey: NucypherCore.SecretKey =
      NucypherCore.SecretKey.fromBytes(
        (
          (this.publisher as any).keyring.secretKey as NucypherTsSecretKey
        ).toSecretBytes()
      );
    const nucypherCoreSigner: NucypherCore.Signer = new NucypherCore.Signer(
      nucypherSecretKey
    );

    const revocationKit = new RevocationKit(
      treasureMap,
      /* this.publisher.signer */ nucypherCoreSigner
    );

    return new PreEnactedPolicy(
      this.hrac,
      this.label,
      this.delegatingKey,
      encryptedTreasureMap,
      revocationKit,
      this.publisher.verifyingKey.toBytes(),
      this.shares,
      this.startDate,
      this.endDate
    );
  }

  private makeTreasureMap(
    ursulas: Ursula[],
    verifiedKFrags: VerifiedKeyFrag[]
  ): TreasureMap {
    // reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
    // notice: bacause the TreasureMapBuilder import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
    const nucypherCoreDelegatingKey = NucypherCore.PublicKey.fromBytes(
      this.delegatingKey.toBytes()
    );

    // notice: bacause the TreasureMapBuilder import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
    // so we must be the signer type of NucypherCore.Signer

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    const nucypherSecretKey: NucypherCore.SecretKey =
      NucypherCore.SecretKey.fromBytes(
        (
          (this.publisher as any).keyring.secretKey as NucypherTsSecretKey
        ).toSecretBytes()
      );
    const nucypherCoreSigner: NucypherCore.Signer = new NucypherCore.Signer(
      nucypherSecretKey
    );

    const builder = new TreasureMapBuilder(
      /* this.publisher.signer */ nucypherCoreSigner,
      this.hrac,
      nucypherCoreDelegatingKey,
      this.threshold
    );
    zip(ursulas, verifiedKFrags).forEach(([ursula, kFrag]) => {
      const ursulaAddress = toCanonicalAddress(ursula.checksumAddress);
      //reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
      // notice: bacause the build(TreasureMapBuilder) import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
      const ursulaEncryptingKey = NucypherCore.PublicKey.fromBytes(
        ursula.encryptingKey.toBytes()
      );
      builder.addKfrag(
        ursulaAddress,
        /* ursula.encryptingKey */ ursulaEncryptingKey,
        kFrag
      );
    });
    return builder.build();
  }

  private encryptTreasureMap(treasureMap: TreasureMap): EncryptedTreasureMap {
    //reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
    // notice: bacause the TreasureMapBuilder import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
    const nucypherCoreBobDelegatingKey = NucypherCore.PublicKey.fromBytes(
      this.bob.decryptingKey.toBytes()
    );

    // notice: bacause the TreasureMapBuilder import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
    // so we must be the signer type of NucypherCore.Signer

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    const nucypherSecretKey: NucypherCore.SecretKey =
      NucypherCore.SecretKey.fromBytes(
        (
          (this.publisher as any).keyring.secretKey as NucypherTsSecretKey
        ).toSecretBytes()
      );
    const nucypherCoreSigner: NucypherCore.Signer = new NucypherCore.Signer(
      nucypherSecretKey
    );

    return treasureMap.encrypt(
      nucypherCoreSigner,
      nucypherCoreBobDelegatingKey
    );
  }
}

const alicegGenerateKFrags = (
  alice: Alice,
  bob: RemoteBob,
  strategy: Strategy,
  threshold: number,
  shares: number
): {
  delegatingKey: NucypherCore.PublicKey;
  verifiedKFrags: VerifiedKeyFrag[];
} => {
  // notice: bacause the generateKFrags import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
  // so we must be the signer type of NucypherCore.Signer

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  const nucypherSecretKey: NucypherCore.SecretKey =
    NucypherCore.SecretKey.fromBytes(
      ((alice as any).keyring.secretKey as NucypherTsSecretKey).toSecretBytes()
    );
  const nucypherCoreSigner: NucypherCore.Signer = new NucypherCore.Signer(
    nucypherSecretKey
  );

  // notice: bacause the generateKFrags import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
  // so we must be use the signer type of NucypherCore.Signer
  return keyringGenerateKFrags(
    bob.decryptingKey,
    /* alice.signer */ nucypherCoreSigner,
    strategy,
    threshold,
    shares
  );
};

const validatePolicyParameters = async (
  alice: Alice,
  rawParams: BlockchainPolicyParameters
): Promise<BlockchainPolicyParameters> => {
  const startDate = rawParams.startDate ?? new Date();
  const { endDate, threshold, shares } = rawParams;
  // Validate raw parameters
  if (threshold > shares) {
    throw new Error(
      `Threshold must not exceed the number of shares: ${threshold} > ${shares}`
    );
  }

  if (endDate < new Date(Date.now())) {
    throw new Error(`The end date must be set to a future date: ${endDate}).`);
  }

  if (startDate > endDate) {
    throw new Error(
      `Start date must occur before the end date: ${startDate} > ${endDate}).`
    );
  }

  const blockNumber = await alice.web3Provider.provider.getBlockNumber();
  const block = await alice.web3Provider.provider.getBlock(blockNumber);
  const blockTime = new Date(block.timestamp * 1000);
  if (endDate < blockTime) {
    throw new Error(
      `The end date must be set to a future date, ${endDate} is earlier than block time ${blockTime}).`
    );
  }
  return { ...rawParams, startDate };
};

const keyringGenerateKFrags = (
  receivingKey: NucypherTsPublicKey,
  signer: NucypherCore.Signer,
  strategy: Strategy, //not label
  threshold: number,
  shares: number
): {
  delegatingKey: NucypherTsPublicKey;
  verifiedKFrags: VerifiedKeyFrag[];
} => {
  //const delegatingSecretKey = this.getSecretKeyFromLabel(label);

  const skBuffer = privateKeyBuffer(
    pwdDecrypt(strategy.strategyKeyPair._privateKey, true)
  );

  //reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
  // notice: bacause the generateKFrags import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e

  // const delegatingSecretKey: NucypherTsSecretKey = NucypherTsSecretKey.fromBytes(skBuffer);
  const delegatingSecretKey: NucypherCore.SecretKey =
    NucypherCore.SecretKey.fromBytes(skBuffer);
  const delegatingKey: NucypherCore.PublicKey = delegatingSecretKey.publicKey();

  // notice: bacause the generateKFrags import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
  // so we must be convert the receivingKey(NucypherTsPublicKey) to the NucypherCore.PublicKey
  const NucypherCoreReceivingKey: NucypherCore.PublicKey =
    NucypherCore.PublicKey.fromBytes(receivingKey.toBytes());

  // notice: bacause the generateKFrags import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
  // so we must be use the signer type of NucypherCore.Signer

  const verifiedKFrags: VerifiedKeyFrag[] = generateKFrags(
    delegatingSecretKey,
    NucypherCoreReceivingKey, //receivingKey,
    signer,
    threshold,
    shares,
    false,
    false
  );
  console.log("keyringGenerateKFrags after generateKFrags");
  return {
    delegatingKey,
    verifiedKFrags,
  };
};

export const getBalance = async (
  accountAddress: string
): Promise<BigNumber> => {
  // Get account balance from Ethereum  42 bits account address

  // let account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
  //web3.eth.accounts.wallet.add(account);

  const data = await getSettingsData();
  const web3 = new Web3(data.web3RpcUrl);

  const address = Web3.utils.toChecksumAddress(
    accountAddress //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
  );

  //wei can use  BigNumber.from(), ether can use ethers.utils.parseEther(), because the BigNumber.from("1.2"), the number can't not be decimals (x.x)
  const balanceWei: string = await web3.eth.getBalance(address);
  return BigNumber.from(balanceWei);
};

export const estimateApproveNLKGas = async (
  account: Account,
  nlkInWei: BigNumber,
  serverFee: BigNumber // wei
): Promise<number> => {
  //approveNLKEstimateGas
  const gasFee: string = await approveNLK(account, nlkInWei, serverFee, true);
  return Number(gasFee);
};

export const approveNLK = async (
  account: Account,
  approveNlkInWei: BigNumber,
  serverFeeNlkInWei: BigNumber, //nlk
  estimateGas = false
): Promise<string> => {
  // Allow my nlk to be deducted from the subscriptManager contract

  // const account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
  //web3.eth.accounts.wallet.add(account);

  const nlkBalanceEthers = await account.getNLKBalance();

  const nlkBalanceWei = BigNumber.from(Web3.utils.toWei(nlkBalanceEthers));

  console.log("nlkBalanceWei is ", nlkBalanceWei.toString());
  console.log("serverFeeInWei is ", serverFeeNlkInWei.toString());

  const serverFeeNlkInEthers = Web3.utils.fromWei(
    serverFeeNlkInWei.toString(),
    "ether"
  );

  console.log("nlkBalanceEthers is ", nlkBalanceEthers);
  console.log("nlkEthers is ", serverFeeNlkInEthers);

  const chainConfigInfo = await getSettingsData();

  if (serverFeeNlkInWei.gt(nlkBalanceWei)) {
    // Message.error(
    //   `Insufficient balance ${nlkBalance} ${chainConfigInfo.nlk_token_symbol} for pay ${nlkInWei} ${chainConfigInfo.nlk_token_symbol}`,
    // );
    console.log(
      `approveNLK - Insufficient balance ${nlkBalanceEthers} ${chainConfigInfo.nlk_token_symbol} to cover payment ${serverFeeNlkInEthers} ${chainConfigInfo.nlk_token_symbol}`
    );
    throw new InsufficientBalanceError(
      `approveNLK - Insufficient balance ${nlkBalanceEthers} ${chainConfigInfo.nlk_token_symbol} to cover payment ${serverFeeNlkInEthers} ${chainConfigInfo.nlk_token_symbol}`
    );
  }

  const web3: Web3 = await getWeb3();
  const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();
  const nuLinkTokenContractInfo: any =
    contractList[curNetwork][CONTRACT_NAME.nuLinkToken];
  const subScriptionManagerContractInfo: any =
    contractList[curNetwork][CONTRACT_NAME.subScriptManager];

  const nuLinkTokenContract: Contract = await getContractInst(
    CONTRACT_NAME.nuLinkToken
  );

  const aliceAddress = Web3.utils.toChecksumAddress(
    account.address //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
  );

  const subScriptionManagerAddress = Web3.utils.toChecksumAddress(
    subScriptionManagerContractInfo.address
  );
  const nuLinkTokenAddress = Web3.utils.toChecksumAddress(
    nuLinkTokenContractInfo.address
  );

  //owner, spender,
  const allowanceWei: string = await nuLinkTokenContract.methods
    .allowance(aliceAddress, subScriptionManagerAddress)
    .call();

  if (BigNumber.from(allowanceWei).gte(approveNlkInWei)) {
    console.log(
      `allowance is ${allowanceWei}, to approve is ${approveNlkInWei}`
    );
    return "";
  }

  //privateKeyString startwith 0x and total length is 66( include the length of 0x)
  const privateKeyStringHex = pwdDecrypt(
    account.encryptedKeyPair._privateKey,
    true
  );
  const privateKeyString = privateKeyStringHex.substring(2, 66);
  // console.log(privateKeyString);

  const _encodedABI = nuLinkTokenContract.methods
    .approve(
      subScriptionManagerAddress,
      web3.utils.toBN(approveNlkInWei.toHexString())
    )
    .encodeABI();

  const transactionNonceLock: AwaitLock = await getTransactionNonceLock();
  await transactionNonceLock.acquireAsync();

  try {
    const txCount = await web3.eth.getTransactionCount(aliceAddress);

    const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] =
      DecimalToInteger(GAS_PRICE_FACTOR);

    const gasPrice = BigNumber.from(await web3.eth.getGasPrice())
      .mul(GAS_PRICE_FACTOR_LEFT)
      .div(GAS_PRICE_FACTOR_RIGHT);
    const gasPriceHex = web3.utils.toHex(gasPrice.toString());

    const rawTx = {
      nonce: web3.utils.toHex(txCount),
      from: aliceAddress,
      to: nuLinkTokenAddress,
      data: _encodedABI,
      gasPrice: gasPriceHex, //'0x09184e72a000',
      value: "0x0",
    };

    // const networkId = await web3.eth.net.getId();

    //https://github.com/paulmillr/noble-ed25519/issues/23
    // const tx = new Tx(rawTx, {common});  //attention: cause extension error: Cannot convert a BigInt value to a number
    // tx.sign(/* Buffer.from("1aefdd79679b4e8fe2d55375d976a79b9a0082d23fff8e2768befe6aceb8d3646", 'hex') */ account.encryptedKeyPair.privateKeyBuffer()); //Buffer.from(aliceEthAccount.privateKey, 'hex')

    // const serializedTx = tx.serialize().toString("hex");
    const data = await getSettingsData();

    //don't add this
    // if (!!estimateGas) {
    //   //fix error: invalid argument 0: json: cannot unmarshal non-string into Go struct field TransactionArgs.chainId of type *hexutil.Big
    //   rawTx["chainId"] = web3.utils.toHex(data.chainId);
    // } else {
    //   rawTx["chainId"] =data.chainId; // data.chainId.toString(); //97
    // }

    // gasUsed => estimateGas return gasUsed is the gasLimit (How many gas were used,that is the amount of gas), not the gasFee (gasLimit * gasPrice)
    const gasUsed: number = await web3.eth.estimateGas(rawTx as any);
    console.log(`approveNLK estimateGas Used is ${gasUsed} wei`);

    const [GAS_LIMIT_FACTOR_LEFT, GAS_LIMIT_FACTOR_RIGHT] =
      DecimalToInteger(GAS_LIMIT_FACTOR);

    //estimatedGas * gasPrice * factor
    const gasFeeInWei = BigNumber.from(gasUsed)
      .mul(BigNumber.from(gasPrice))
      .mul(GAS_LIMIT_FACTOR_LEFT)
      .div(GAS_LIMIT_FACTOR_RIGHT);

    console.log(`approveNLK estimate GasFee is ${gasFeeInWei} wei`);
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!estimateGas) {
      return gasFeeInWei.toString();
    }

    const tokenBalanceEthers = await account.balance(); //tbnb
    const tokenBalanceWei = Web3.utils.toWei(tokenBalanceEthers);

    // tokenBalanceWei must be great than gasUsed(gasLimit) * gitPrice
    // Calculate if the balance is enough to cover the fee of approveNLK
    if (BigNumber.from(tokenBalanceWei).lt(gasFeeInWei)) {
      const tips = `Insufficient balance ${tokenBalanceEthers} ${
        chainConfigInfo.token_symbol
      } for approveNLK ${Web3.utils.fromWei(gasFeeInWei.toString(), "ether")} ${
        chainConfigInfo.token_symbol
      }`;

      // Message.error(tips);
      console.error(tips);
      throw new InsufficientBalanceError(tips);
    }

    // https://ethereum.stackexchange.com/questions/87606/ethereumjs-tx-returned-error-invalid-sender

    //estimatedGas * factor
    rawTx["gasLimit"] = web3.utils.toHex(
      BigNumber.from(gasUsed)
        .mul(GAS_LIMIT_FACTOR_LEFT)
        .div(GAS_LIMIT_FACTOR_RIGHT)
        .toString()
    ); // '0x2710'  The amount of gas

    const signedTx = await web3.eth.accounts.signTransaction(
      rawTx as any,
      privateKeyString
    ); // privateKeyString is the length of 64
    const txReceipt: TransactionReceipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction as string /* "0x" + serializedTx */
    );
    /*
    {
      raw: '0xf86c808504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a04f4c17305743700648bc4f6cd3038ec6f6af0df73e31757007b7f59df7bee88da07e1941b264348e80c78c4027afc65a87b0a5e43e86742b8ca0823584c6788fd0',
      tx: {
          nonce: '0x0',
          gasPrice: '0x4a817c800',
          gas: '0x5208',
          to: '0x3535353535353535353535353535353535353535',
          value: '0xde0b6b3a7640000',
          input: '0x',
          v: '0x25',
          r: '0x4f4c17305743700648bc4f6cd3038ec6f6af0df73e31757007b7f59df7bee88d',
          s: '0x7e1941b264348e80c78c4027afc65a87b0a5e43e86742b8ca0823584c6788fd0',
          hash: '0xda3be87732110de6c1354c83770aae630ede9ac308d9f7b399ecfba23d923384'
      }
    */

    console.log("txReceipt:", txReceipt);

    //wait txReceipt
    console.log(
      // eslint-disable-next-line no-extra-boolean-cast
      !!txReceipt.transactionHash
        ? `In approveNLK: no need approve`
        : `txHash: ${txReceipt.transactionHash}`
    );
    
    // eslint-disable-next-line no-extra-boolean-cast
    if (!!txReceipt.transactionHash) {
      let receipt: any = null;
      
      do {
        receipt = await web3.eth.getTransactionReceipt(
          txReceipt.transactionHash
        );
        //status - Boolean: TRUE if the transaction was successful, FALSE if the EVM reverted the
        await sleep(1000);
      } while (isBlank(receipt));
      
    }

    return txReceipt.transactionHash;
  } finally {
    transactionNonceLock.release();
  }
};

axios.defaults.timeout = 60000; //default `0` (Never timeout)
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return /* retryCount * */ 1000;
  },
  retryCondition: (error) => {
    // if retry condition is not specified, by default idempotent requests are retried
    //return error.response.status === 503;
    // if(typeof error?.response?.status === "number")
    // {
    //   return error.response.status.toString().startsWith("5");
    // }
    // return false;
    try {
      return [502, 503, 504].includes(error?.response?.status as number);
    } catch (e) {
      return false;
    }
  },
});

export const getUrsulas = async (
  porterUri: string,
  quantity: number,
  excludeUrsulas?: ChecksumAddress[],
  includeUrsulas?: ChecksumAddress[]
): Promise<any> => {
  const params = {
    quantity,
    exclude_ursulas: excludeUrsulas,
    include_ursulas: includeUrsulas,
  };
  const resp = await axios.get(`${porterUri}/get_ursulas`, {
    params,
    paramsSerializer: (params) => {
      return qs.stringify(params, { arrayFormat: "comma" });
    },
  });
  return resp;
};
