import { Account, Strategy } from "../../hdwallet/api/account";
import { TransactionReceipt } from "web3-core";
// import { message as Message } from "antd";
import { InsufficientBalanceError, TransactionError } from "../../utils/exception";
import { GAS_LIMIT_FACTOR, GAS_PRICE_FACTOR } from "../../chainnet/config";
import { DecimalToInteger } from "../../utils/math";
import Erc20TokenABI from "../../sol/abi/Erc20.json";
import AwaitLock from "await-lock";
import { isBlank } from "../../utils/null";
import sleep from "await-sleep";
import { getTransactionNonceLock } from "../../utils/transaction";
import { getWeb3, toCanonicalAddress } from "../../hdwallet/api";
import Web3 from "web3";
import { getCurrentNetworkKey, getSettingsData } from "../../chainnet";
import { decrypt as pwdDecrypt } from "../../utils/password.encryption";
import { BigNumber } from "ethers";


/**
  * estimate the Gas of sending the raw transaction
  * @param {Account} account - Account the current account object.
  * @param {string} toAddress - The recevier of the transaction, can be empty when deploying a contract.
  * @param {string} rawTxData - The call data of the transaction, can be empty for simple value transfers.
  * @param {string} value - The value of the transaction in wei.
  * @param {string} gasPrice - The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice().
 * @returns {Promise<number | null>} - Returns the gasFee or null if estimate gas failed.
*/
export const sendRawTransactionGas = async (
    account: Account,
    toAddress: string,
    rawTxData?: string,
    value?: string, //wei
    gasPrice?: string //wei
): Promise<number | null> => {
  //approveNLKEstimateGas
  const gasFee: string | null = await sendRawTransaction(
    account,
    toAddress,
    rawTxData,
    value,
    gasPrice,
    true
  );
  if (isBlank(gasFee)) {
    return null;
  }
  return Number(gasFee);
};


/**
 * send the raw transaction
 * @throws {@link Error} set Transaction failed or get account exception
 * @param {Account} account - Account the current account object.
 * @param {string} toAddress - The recevier of the transaction, can be empty when deploying a contract.
 * @param {string} rawTxData - The call data of the transaction, can be empty for simple value transfers.
 * @param {string} value - The value of the transaction in wei.
 * @param {string} gasPrice - (Optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice().
 * @param {boolean} estimateGas - (Optional) Whether to assess gas fees.
 * @param {boolean} gasLimit - (Optional) set gas limit
 * @returns {Promise<string | null >} - Returns the transactionHash or null.
 */
export const sendRawTransaction = async (
  account: Account,
  toAddress: string,
  rawTxData?: string,
  value?: string, //wei
  gasPrice?: string, //wei
  estimateGas?: boolean, //default false
  gasLimit?: BigNumber
): Promise<string | null> => {
  // Allow my nlk to be deducted from the subscriptManager contract

  // const account = web3.eth.accounts.privateKeyToAccount('0x2cc983ef0f52c5e430b780e53da10ee2bb5cbb5be922a63016fc39d4d52ce962');
  //web3.eth.accounts.wallet.add(account);

    const chainConfigInfo = await getSettingsData();

    const web3: Web3 = await getWeb3();
  // const curNetwork: NETWORK_LIST = await getCurrentNetworkKey();

    const _fromAddress = Web3.utils.toChecksumAddress(
    account.address //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
    );

    const _toAddress = Web3.utils.toChecksumAddress(
    toAddress //"0xDCf049D1a3770f17a64E622D88BFb67c67Ee0e01"
    );

    //privateKeyString startwith 0x and total length is 66( include the length of 0x)
    const privateKeyStringHex = pwdDecrypt(
    account.encryptedKeyPair._privateKey,
    true
    );
    const privateKeyString = privateKeyStringHex.substring(2, 66);
  // console.log(privateKeyString);

    const transactionNonceLock: AwaitLock = await getTransactionNonceLock(
        _fromAddress
    );
    await transactionNonceLock.acquireAsync();

  let txReceipt: TransactionReceipt | null = null;
  try {
    const txCount = await web3.eth.getTransactionCount(_fromAddress);

    const [GAS_PRICE_FACTOR_LEFT, GAS_PRICE_FACTOR_RIGHT] =
        DecimalToInteger(GAS_PRICE_FACTOR);

    const _gasPrice = isBlank(gasPrice)
        ? BigNumber.from(await web3.eth.getGasPrice())
            .mul(GAS_PRICE_FACTOR_LEFT)
            .div(GAS_PRICE_FACTOR_RIGHT)
        : (gasPrice as string);

    const gasPriceHex = web3.utils.toHex(_gasPrice.toString());

    const rawTx = {
        nonce: web3.utils.toHex(txCount),
        from: _fromAddress,
        to: _toAddress,
        data: isBlank(rawTxData) ? undefined : rawTxData,
        gasPrice: gasPriceHex, //'0x09184e72a000',
        value: isBlank(value) ? "0x0" : value, //wei
    };

    // const networkId = await web3.eth.net.getId();

    //https://github.com/paulmillr/noble-ed25519/issues/23
    // const tx = new Tx(rawTx, {common});  //attention: cause extension error: Cannot convert a BigInt value to a number
    // tx.sign(/* Buffer.from("1aefdd79679b4e8fe2d55375d976a79b9a0082d23fff8e2768befe6aceb8d3646", 'hex') */ account.encryptedKeyPair.privateKeyBuffer()); //Buffer.from(aliceEthAccount.privateKey, 'hex')

    // const serializedTx = tx.serialize().toString("hex");
    // const chainConfigInfo = await getSettingsData();

    //don't add this
    // if (!!estimateGas) {
    //   //fix error: invalid argument 0: json: cannot unmarshal non-string into Go struct field TransactionArgs.chainId of type *hexutil.Big
    //   rawTx["chainId"] = web3.utils.toHex(chainConfigInfo.chainId);
    // } else {
    //   rawTx["chainId"] =chainConfigInfo.chainId; // chainConfigInfo.chainId.toString(); //97
    // }

    const [GAS_LIMIT_FACTOR_LEFT, GAS_LIMIT_FACTOR_RIGHT] =
      DecimalToInteger(GAS_LIMIT_FACTOR);

    // eslint-disable-next-line no-extra-boolean-cast
    if (!!estimateGas) {
      // gasUsed => estimateGas return gasUsed is the gasLimit (How many gas were used,that is the amount of gas), not the gasFee (gasLimit * _gasPrice)
      const gasUsed: number = await web3.eth.estimateGas(rawTx as any);
      console.log(`sendRawTransaction estimateGas Used is ${gasUsed} wei`);

      //estimatedGas * _gasPrice * factor
      const gasFeeInWei = BigNumber.from(gasUsed)
        .mul(BigNumber.from(_gasPrice))
        .mul(GAS_LIMIT_FACTOR_LEFT)
        .div(GAS_LIMIT_FACTOR_RIGHT);

      console.log(`sendRawTransaction estimate GasFee is ${gasFeeInWei} wei`);

      return gasFeeInWei.toString();
    }

    let gasUsed = BigNumber.from("0");
    if (!isBlank(gasLimit) && gasLimit?.gt(BigNumber.from("0"))) {
      gasUsed = gasLimit;
    } else {
      gasUsed = BigNumber.from(await web3.eth.estimateGas(rawTx as any));
    }

    //estimatedGas * _gasPrice * factor
    const gasFeeInWei = BigNumber.from(gasUsed)
      .mul(BigNumber.from(_gasPrice))
      .mul(GAS_LIMIT_FACTOR_LEFT)
      .div(GAS_LIMIT_FACTOR_RIGHT);

    const tokenBalanceEthers = (await account.balance()) as string; //tbnb
    const tokenBalanceWei = Web3.utils.toWei(tokenBalanceEthers);

    // tokenBalanceWei must be great than gasUsed(gasLimit) * gitPrice
    // Calculate if the balance is enough to cover the fee of sendRawTransaction
    if (BigNumber.from(tokenBalanceWei).lt(gasFeeInWei)) {
        const tips = `Insufficient balance ${tokenBalanceEthers} ${
        chainConfigInfo.token_symbol
        } for sendRawTransaction ${Web3.utils.fromWei(
        gasFeeInWei.toString(),
        "ether"
        )} ${chainConfigInfo.token_symbol}`;

        //Message.error(tips);
        console.error("sendRawTransaction error: ", tips);
        throw new InsufficientBalanceError(tips);
    }

    // https://ethereum.stackexchange.com/questions/87606/ethereumjs-tx-returned-error-invalid-sender

    //param gas means gasLimit

    //estimatedGas * factor
    rawTx["gas" /* "gasLimit" */] = web3.utils.toHex(
      BigNumber.from(gasUsed)
        .mul(GAS_LIMIT_FACTOR_LEFT)
        .div(GAS_LIMIT_FACTOR_RIGHT)
        .toString()
    ); // '0x2710'  The amount of gas

    const signedTx = await web3.eth.accounts.signTransaction(
        rawTx as any,
        privateKeyString
    ); // privateKeyString is the length of 64
    txReceipt = await web3.eth.sendSignedTransaction(
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

    console.log("sendRawTransaction txReceipt:", txReceipt);

    //wait txReceipt
    console.log(`sendRawTransaction txHash: ${txReceipt.transactionHash}`);

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

    //return txReceipt.transactionHash;
  } finally {
    transactionNonceLock.release();
  }

  if (txReceipt) {
    if (!isBlank(txReceipt.transactionHash)) {
      return txReceipt.transactionHash;
    } else {
      throw new TransactionError(
        "send raw transaction failed txReceipt: " + txReceipt
      );
    }
  } else {
    return null;
  }
};
