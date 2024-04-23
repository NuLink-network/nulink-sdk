import { NuLinkHDWallet, Account, Strategy, AccountManager, BigNumber } from "../src";

import assert from "assert-ts";
import { createWallet, loadWallet } from "../src/api/wallet";
import * as pre from "../src/api/pre";

export const run = async () => {
  const password: string = "1";

  //first We create Alice wallet and account by password
  const nuLinkHDWallet1: NuLinkHDWallet = await createWallet(password);

  assert(nuLinkHDWallet1);

  // after we created the wallet, we can loadWallet by password
  const nuLinkHDWallet: NuLinkHDWallet | null = await loadWallet(password);
  assert(nuLinkHDWallet);
// eslint-disable-next-line no-debugger
  debugger;
  const fromAddress: string = nuLinkHDWallet
    ?.getAccountManager()
    .getDefaultAccount()?.address as string;
  //transfer 0.1 token(tbnb or CFX) from ${fromAddress} to '0xeEFA1EADDEea7a3d9acf04D421bDb26a4725Faed'
  const toAddress = "0xeEFA1EADDEea7a3d9acf04D421bDb26a4725Faed";
  const rawTxData = undefined;
  const value = (1e17).toString(); //wei
  const gasPrice = undefined;
  const gasinWei: BigNumber | null = await pre.estimateCustomTransactionGas(
    toAddress,
    rawTxData,
    value,
    gasPrice
  );
  console.log("estimate gasinWei: ", gasinWei);
  const transactionHash: string | null = await pre.sendCustomTransaction(
    toAddress,
    rawTxData,
    value,
    gasPrice
  );
  console.log("transactionHash: ", transactionHash);
};
