import { Buffer } from "buffer";
import * as bip39 from "bip39";
import { hdkey } from "ethereumjs-wallet";
import Wallet from "ethereumjs-wallet";
import * as util from "ethereumjs-util";
import { equals } from "../../utils/uint8arrays";
import EthCrypto from "eth-crypto";
import assert from "assert";
import {
  decrypt as pwdDecrypt,
  encrypt as pwdEncrypt,
} from "../../utils/password.encryption";

/**
 * @internal
 */
export type EthWallet = Wallet;

/**
 * @internal
 */
export abstract class IJson {
  public dump(): string {
    return JSON.stringify(this);
  }

  public static async load(
    jsonString: string,
    save = false
  ): Promise<IJson | null> {
    //
    return JSON.parse(jsonString);
  }
}

export const bufferEquals = (b1: Buffer, b2: Buffer): boolean => {
  return equals(b1, b2);
};

export const uint8ArrayEquals = (b1: Uint8Array, b2: Uint8Array): boolean => {
  return equals(b1, b2);
};

export const string2HalfLengthBuffer = (str: string): Buffer => {
  //  String of length n is converted to Buffer of length n/2 (Unit8Array subclass)
  // if (!str.startsWith("0x")) {
  //   str = "0x" + str;
  // }
  // String must start by 0x (As Util is the Util of Ethereumjs)

  // // return util.toBuffer(str); // this is also right .

  if (str.startsWith("0x")) {
    str = str.substring(2); // truncate 0x
  }
  //privateKeyString needs to start with 0x
  return Buffer.from(str, "hex");
};
export const compressPublicKeyBuffer = (publicKeyString: string): Buffer => {
  //The uncompressed public key passed is of length 130, which must start with 0x or 04.
  //Returns a compressed public key Buffer of length 33 bytes.

  const compressedPublicKey: string = compressPublicKey(publicKeyString);
  return string2HalfLengthBuffer(compressedPublicKey);
};

export const compressPublicKeyBuffer2 = (
  compressedPublicKeyString: string
): Buffer => {
  //The compressed public key passed is of length 66, which must not start with 0x, example: 03946c765c4582d44be229a9f94df8f14339727249a7b4afe80c93cb7269751d43
  //Returns a compressed public key Buffer of length 33 bytes.
  assert(
    !compressedPublicKeyString.startsWith("0x") &&
      compressedPublicKeyString.length === 66
  );

  return string2HalfLengthBuffer(compressedPublicKeyString);
};

export const compressPublicKey = (publicKeyString: string): string => {
  //The uncompressed public key passed is of length 130, which must start with 0x or 04.
  //Returns a compressed public key string of length 66: '039955dc454c93d40df759de82ad9da3ce456bd4c3eaad27706b60b7b02ff7dcc1'
  //Note that the return value string does not contain 0x

  assert(
    (publicKeyString.startsWith("0x") || publicKeyString.startsWith("04")) &&
      publicKeyString.length === 130
  );

  if (publicKeyString.startsWith("0x")) {
    publicKeyString = publicKeyString.replace("0x", "04");
  }

  return EthCrypto.publicKey.compress(publicKeyString);
};

export const unCompressPublicKey = (compressedPublicKeyString: string): string => {
  //Pass in a compressed public key string of length 66: '039955dc454c93d40df759de82ad9da3ce456bd4c3eaad27706b60b7b02ff7dcc1'
  //Returns an uncompressed public key string of length 130
  //Note that the return value string starts with 0x, and the incoming value does not start with 0x

  assert(
    !compressedPublicKeyString.startsWith("0x") &&
      compressedPublicKeyString.length === 66
  );
  return "0x" + EthCrypto.publicKey.decompress(compressedPublicKeyString);
};

export const publicKeyBuffer64Bytes = (publicKeyString: string): Buffer => {
  //Get the 64-byte Buffer corresponding to the public key string (0x..... length 130)
  //publicKeyString must start with 0x
  return util.toBuffer(publicKeyString); //eccryptoJS.utf8ToBuffer(publicKey);
};

export const publicKeyBuffer65Bytes = (publicKeyString: string): Buffer => {
  //Get the 65-byte Buffer corresponding to the public key string (0x..... length 130), start with 04
  //Some public keys are given in the same format as above, except that 04 is added in front, which means non-compression, and the length of the entire public key becomes 65 bytes.
  //publicKeyString must start with 0x
  const pk: Buffer = publicKeyBuffer64Bytes(publicKeyString);
  return Buffer.concat([Buffer.from([4]), pk]); //eccryptoJS.encrypt public keys can only recieve 65 byte public keys.
};

export const privateKeyBuffer = (privateKeyString: string): Buffer => {
  //Get the private key in 32-byte Buffer compressed format corresponding to a 66-byte privateKey String
  //privateKeyString must start with 0x
  return Buffer.from(privateKeyString.substring(2, 66), "hex");
};

export const publicKeyString2StartWith04 = (publicKeyString: string): string => {
  //The string starting with 04 corresponding to the public key string (0x..... length 130)
  return publicKeyString.replace("0x", "04");
};

export const s04publicKeyString2StartWith0x = (publicKeyString: string): string => {
  //The string starting with 0x corresponding to the public key string (04.....length 130)
  return publicKeyString.replace("04", "0x");
};

export class KeyPair extends IJson {
  public readonly _publicKey: string;
  public readonly _privateKey: string;

  constructor(publicKey: string, privateKey: string) {
    super();
    this._privateKey = pwdEncrypt(privateKey, null, false); //0x.... , length 66
    this._publicKey = publicKey; //0x..... , length 130
  }

  public dump(): string {
    return JSON.stringify({ pk: this._publicKey, sk: this._privateKey });
  }

  public static async load(jsonString: string): Promise<KeyPair> {
    //
    const jsonObj = JSON.parse(jsonString);
    return new KeyPair(jsonObj.pk, jsonObj.sk);
  }

  public publicKeyBuffer64Bytes(): Buffer {
    //Get the 64-byte Buffer corresponding to the public key string (0x..... length 130)

    return publicKeyBuffer64Bytes(this._publicKey); //eccryptoJS.utf8ToBuffer(publicKey);
  }

  public publicKeyBuffer65Bytes(): Buffer {
    //Get the 65-byte Buffer corresponding to the public key string (0x..... length 130)
    //Some public keys are given in the same format as above, except that 04 is added in front, which means non-compression, and the length of the entire public key becomes 65 bytes.
    return publicKeyBuffer65Bytes(this._publicKey); //eccryptoJS.encryptpublic keys can only recieve 65 byte public keys.
  }

  public privateKeyBuffer(): Buffer {
    //Get the 32-byte Buffer corresponding to the 66-byte privateKey String
    return privateKeyBuffer(pwdDecrypt(this._privateKey, true));
  }
}

// Spanning Tree base path

const base_drive_path = "m/44'/60'/0'/0/";

// 1.1 Generate Mnemonic
export const generateMnemonic = () => {
  const mnemonic: string = bip39.generateMnemonic();
  return mnemonic;
};
// const mnemonic_chinese = bip39.generateMnemonic(128,null,bip39.wordlists.chinese_simplified)
// console.log("Chinese Mnemonic： " + mnemonic_chinese)

//2.Convert mnemonic to seed
export const getSeed = async (mnemonic: string) => {
  const seed = await bip39.mnemonicToSeed(mnemonic);
  //console.log("seed: " + util.bufferToHex(seed));
  return seed;
};

export const getHDWallet = async (mnemonic: string) => {
  const seed = await getSeed(mnemonic);
  //3.Generate HD Wallet from seed through hdKey
  const hdWallet = hdkey.fromMasterSeed(seed);
  return hdWallet;
};

export const getHDWalletBySeed = async (seed: Buffer) => {
  const hdWallet = hdkey.fromMasterSeed(seed);
  return hdWallet;
};

export const getHDWalletByRootExtendedPrivateKey = (base58Key: string) => {
  /* base58Key：is startwith 'xprv'
    Restoring the wallet by extending the private key of the root account
    We cannot judge whether the incoming private key is the root private key or the private key under a certain level path
    Even if the account is recovered with the private key below a certain level, we do not know the address index of its key generation tree
    You can only recover the account with the root private key. The wallet corresponding to the recovered account is an ordinary wallet.
    HDWallet cannot be generated, because HDWallet needs to derive sub-accounts with tree structure, and needs to expand private key
    The extended private key (BIP32) cannot be derived from the private key. However, by extending the private key, it is possible to derive sub-accounts and the corresponding private key.
    So exporting the private key must be exporting the extended private key of the root account.

  */

  const hdWallet = hdkey.fromExtendedKey(base58Key);

  return hdWallet;
};

export const getRootExtendedPrivateKey = (
  hdWallet: hdkey /*EthereumHDKey*/
): Buffer => {
  return hdWallet.privateExtendedKey();
};

//Get the specified key spanning tree path Public and private key and address information related to keyPair (public and private key pair) under derivePath
export const getEthereumAccountBaseInfo = (
  hdWallet: hdkey /*EthereumHDKey*/,
  subDerivePath: string,
  addr = true
) => {
  //subDerivePath like string is 1/0/0, not start with `/`

  //Generate keypair Ethereum at m/44'/60'/0'/0/i path in wallet
  const keyPair: hdkey = hdWallet.derivePath(
    `${base_drive_path}${subDerivePath}`
  );

  const wallet = keyPair.getWallet(); //hdWallet.getWallet(); root
  const ret: any = {
    // sk: util.bufferToHex(keyPair._hdkey._privateKey),
    // pk: util.bufferToHex(keyPair._hdkey._publicKey),
    pk: wallet.getPublicKeyString(),
    sk: wallet.getPrivateKeyString(),
  };
  if (addr) {
    //Generate address using public key in keypair

    const address = util.pubToAddress(wallet.getPublicKey(), true);
    ret["addr"] = "0x" + address.toString("hex");
  }

  return ret;
};

//Get an account for encryption
//When creating each account, in addition to the Ethereum public-private key pair and account address (Encrypted PK, SK) manually triggered by the user, it is recorded as Account1 Detailed design document 12/21
//We stipulate that Account1 accounts are generated sequentially in the fifth-level path. That is, m/44'/60'/0'/0/i , i ∈ [0, 2^31 -1] , i is the account address_index
export const getEthereumEncryptAccount = (
  hdWallet: hdkey /*EthereumHDKey*/,
  addressIndex: number
) => {
  if (addressIndex < 0) {
    return null;
  }

  return getEthereumAccountBaseInfo(hdWallet, `${addressIndex}`);
};

//The verify PK, SK for proxy re-encryption process signature and verification corresponding to the master account. We record it as KeyPair2
//KeyPair2 is m/44'/60'/0'/0/i/0, which is the 0th next level (sixth level) of Account1.
export const getEthereumVerifyAccount = (
  hdWallet: hdkey /*EthereumHDKey*/,
  addressIndex: number
) => {
  if (addressIndex < 0) {
    return null;
  }

  return getEthereumAccountBaseInfo(hdWallet, `${addressIndex}/0`, false);
};

//The verify PK, SK for proxy re-encryption process signature and verification corresponding to the master account. We record it as KeyPair2
//The strategy KeyPair increases sequentially from level 7 m/44'/60'/0'/0/i/0/j i,j ∈ [0, 2^31 -1], i is the account address_index, j is the policy address_index
export const getEthereumStrategyKeyPair = (
  hdWallet: hdkey /*EthereumHDKey*/,
  accountAddressIndex: number,
  strategyAddressIndex: number
) => {
  if (accountAddressIndex < 0 || strategyAddressIndex < 0) {
    return null;
  }

  return getEthereumAccountBaseInfo(
    hdWallet,
    `${accountAddressIndex}/0/${strategyAddressIndex}`,
    false
  );
};

