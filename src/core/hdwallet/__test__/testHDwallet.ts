// The following code is about importing the required packages from the different kind of sources.
import * as nucypher from "@nulink_network/nulink-ts-crosschain";
import {
  AccountManager,
  NuLinkHDWallet,
  Account,
  Strategy,
} from "../api";
import {
  privateKeyBuffer,
  publicKeyBuffer65Bytes,
  string2HalfLengthBuffer,
  uint8ArrayEquals,
  unCompressPublicKey,
  compressPublicKey,
  compressPublicKeyBuffer,
} from "../api/common";
import assert from "assert-ts";
import EthCrypto from "eth-crypto";
import { ethers } from "ethers";
import {
  encrypt as pwdEncrypt,
  decrypt as pwdDecrypt,
} from "../../utils/passwordEncryption";

// The following code is using Asynchronous, which means by using async multiple codes can run simultaneously.
export const hdWalletTestRun = async () => {
  // Declaring and intializing the mnemonic and password variables.
  const mnemonic: string = NuLinkHDWallet.generateMnemonic();
  let password: string = "123456";

  // Here the wallet will be created by using NuLinkHDWallet.createHDWallet() function.
  //The await keyword used for the waiting the code statement for execution.
  const nuLinkHDWallet: NuLinkHDWallet = await NuLinkHDWallet.createHDWallet(
    mnemonic,
    password
  );

  // const accountManager: AccountManager = nuLinkHDWallet.getAccountManager();
  // // Similarly getting account
  // const account: Account = accountManager.getAccount(0) as Account;
  //TODO: need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  // import { createAccount as cAccount, createAccountIfNotExist } from "@feats/pre/api/workflow";
  // await createAccountIfNotExist(account);

  // Here is the wallet is getting loaded by using the password
  const nuLinkHDWallet2 = await NuLinkHDWallet.loadHDWallet(password);

  assert(nuLinkHDWallet === nuLinkHDWallet2);
  // Creating variable and storing the password is correct or not.
  const correct: boolean = await nuLinkHDWallet.verifyPassword(password);

  assert(correct);
  // if correct
  // Creating variable and storing the account manager in accountManager type variable.
  const accountManager: AccountManager = nuLinkHDWallet.getAccountManager();
  // Similarly getting account
  const account: Account = accountManager.getAccount(0) as Account;

  // const _privateKey = pwdDecrypt(account.encryptedKeyPair._privateKey);
  // const _publicKey = account.encryptedKeyPair._publicKey;

  // // eslint-disable-next-line no-debugger
  // debugger;

  // creating strategy by using label1

  const strategy1: Strategy = await account.createStrategy("label1");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // similarly for label2 as strategy2
  const strategy2: Strategy = await account.createStrategy("label2");
  const account2 = await accountManager.createAccount("test");

  //TODO: need to call the createAccountIfNotExist method outside of this function for add user account to the center server for decouple
  // import { createAccount as cAccount, createAccountIfNotExist } from "@feats/pre/api/workflow";
  // await createAccountIfNotExist(account);

  const accountAddressIndex2 = account2.addressIndex;
  // Sending information about the private key to console
  console.info(
    `strategy2 sk: ${pwdDecrypt(
      strategy1.strategyKeyPair._privateKey,
      true
    )}, pk: ${strategy1.strategyKeyPair._publicKey}`
  );
  // Exporting the user data by using password
  const userDataString: string = await nuLinkHDWallet.exportUserData(password);

  // Finally the details are removed from account manager
  await nuLinkHDWallet.getAccountManager().removeAccount(accountAddressIndex2);
  // Getting the rootextendedprivatekey by using password as parameter
  const rootExtendedPrivateKey = await nuLinkHDWallet.getRootExtendedPrivateKey(
    password
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  assert(rootExtendedPrivateKey != null);
  // if rootextendedprivatekey is not null executes the following code.
  const oldPassword = password;
  // changing the password
  password = "987654";
  // The restoring wallet5 private key is as follows
  const nuLinkHDWallet5 =
    await NuLinkHDWallet.restoreHDWalletByRootExtendedPrivateKey(
      rootExtendedPrivateKey,
      password
    );
  // The accountmanager for wallet5 is assigned to a variable
  const accountManager5: AccountManager = nuLinkHDWallet5.getAccountManager();
  assert(accountManager5.getAccountCount() === 1);
  // if the count is 1 then executes the following
  const nuLinkHDWallet3 = await NuLinkHDWallet.restoreHDWallet(
    mnemonic,
    password
  );
  // The accountmanager for wallet3 is assigned to a variable
  const accountManager3: AccountManager = nuLinkHDWallet.getAccountManager();
  assert(accountManager3.getAccountCount() === 1);
  await nuLinkHDWallet3.recoverUserData(password, userDataString);
  assert(nuLinkHDWallet3.getAccountManager().getAccountCount() === 2);
  const nuLinkHDWallet_ = await NuLinkHDWallet.loadHDWallet(password);

  // assert(nuLinkHDWallet3 === nuLinkHDWallet_);
  const nuLinkHDWallet4 = await NuLinkHDWallet.restoreHDWallet(
    mnemonic,
    password,
    userDataString
  );
  // The accountmanager for wallet4 is assigned to a variable
  const accountManager4: AccountManager = nuLinkHDWallet4.getAccountManager();

  const account4: Account = accountManager4.getAccount(0) as Account;
  // getting all strategies
  const strategys: Strategy[] = account4.getAllStrategy();
  // Sending information about the public key to console
  console.info(
    `strategy2 sk: ${pwdDecrypt(
      strategys[1].strategyKeyPair._privateKey,
      true
    )}, pk: ${strategys[1].strategyKeyPair._publicKey}`
  );

  const _Buffer = Buffer;
  const _PublicKey = nucypher.PublicKey;
  // encrypting the public key
  const policyEncryptingPublicKey: nucypher.PublicKey =
    nucypher.PublicKey.fromBytes(
      compressPublicKeyBuffer(strategys[1].strategyKeyPair._publicKey)
    );

  // getting the secret key in bytes
  const secretKey = nucypher.SecretKey.fromBytes(
    privateKeyBuffer(pwdDecrypt(strategys[1].strategyKeyPair._privateKey, true))
  );
  const publicKey: Uint8Array = secretKey.publicKey().toBytes();
  // Sending information about the private key to console
  console.log(
    publicKeyBuffer65Bytes(strategys[1].strategyKeyPair._publicKey).toString(
      "hex"
    )
  );
  // getting the public key from EthCrypto
  const pkHandle = EthCrypto.publicKey;
  // const compressed_address = EthCrypto.publicKey.compress(
  //   strategys[1].strategyKeyPair._publicKey.replace("0x", "04"),
  // );
  // const uncompressed_address =
  // "0x" + EthCrypto.publicKey.decompress(compressed_address);
  // getting the compressing public key
  const compressed_address = compressPublicKey(
    strategys[1].strategyKeyPair._publicKey
  );
  // uncompressing the compressed public key
  const uncompressed_address = unCompressPublicKey(compressed_address);

  const compressed_address_uint8Array = string2HalfLengthBuffer(
    "0x" + compressed_address
  );

  const compressed_address_uint8Array2 =
    string2HalfLengthBuffer(compressed_address);
  //This statements checks if the unit8array equals to compressed addresses
  assert(
    uint8ArrayEquals(
      compressed_address_uint8Array,
      compressed_address_uint8Array2
    )
  );

  //the blow code is important for our works
  assert(uint8ArrayEquals(publicKey, compressed_address_uint8Array));

  // Exporting all wallet data by using password
  const walletDataString: string = await nuLinkHDWallet4.exportWalletData(
    password
  );

  const password6 = "123213";
  const nuLinkHDWallet6 = await NuLinkHDWallet.restoreHDWalletByData(
    password6,
    walletDataString
  );

  console.log("hdwallet test finish");

};
