//  Bob: as the user of the file (file requester)

import { Account } from "../../hdwallet/api/account";
import { privateKeyBuffer } from "../../hdwallet/api/common";

//reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
// must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
import { Configuration, PublicKey as NucypherTsPublicKey, RemoteBob, SecretKey as NucypherTsSecretKey, RetrievalKit} from "@nulink_network/nulink-ts-crosschain";

// notice: bacause the generateKFrags import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
import * as NucypherCore from '@nucypher/nucypher-core'; 

import { compressPublicKeyBuffer } from "../../hdwallet/api/common";
import { getPorterUrl } from "./porter";
import { Porter } from "@nulink_network/nulink-ts-crosschain/build/main/src/characters/porter";
import { CapsuleFrag, CrossChainHRAC } from "@nulink_network/nulink-ts-crosschain";

import { EncryptedTreasureMap, MessageKit, Signer } from "@nucypher/nucypher-core";

import { PolicyMessageKit } from "@nulink_network/nulink-ts-crosschain/build/main/src/kits/message";
import { RetrievalResult } from "@nulink_network/nulink-ts-crosschain/build/main/src/kits/retrieval";
import { Keyring } from "@nulink_network/nulink-ts-crosschain/build/main/src/keyring";
import { fromBase64, zip } from "@nulink_network/nulink-ts-crosschain/build/main/src/utils";
import {decrypt as pwdDecrypt } from "../../utils/password.encryption"

//Adapter code for nucypher-ts   Note Bob, Enrico's Encrypted PK SK is the same as Verify PK SK.  Alice verify PK can use encrypted PK.  In Nucypher-TS, Alice encryption key uses the public and private key pair generated by label, which is the policy public key for us.  
export const makeBob = async (account: Account, porterUri?: string): Promise<Bob> => {
  porterUri = (porterUri || (await getPorterUrl())) as string;
  const privateKeyString = pwdDecrypt(account.encryptedKeyPair._privateKey, true);
  // console.log("makeBob BobEncrypedPrivateKey: ",privateKeyString);
  const secretKey = NucypherTsSecretKey.fromBytes(privateKeyBuffer(privateKeyString));
  return Bob.fromSecretKey({ porterUri }, secretKey);
};

// Alice can't get bob's account
export const makeRemoteBob = (decryptingKey: string, verifyingKey: string): RemoteBob => {
  return RemoteBob.fromKeys(compressPublicKeyBuffer(decryptingKey), compressPublicKeyBuffer(verifyingKey));
};

// "@nucypher/nucypher-ts": "^0.7.0",  must be this version
export class Bob {
  private readonly porter: Porter;
  private readonly keyring: Keyring;

  constructor(config: Configuration, secretKey: NucypherTsSecretKey) {
    this.porter = new Porter(config.porterUri);
    this.keyring = new Keyring(secretKey);
  }

  public get decryptingKey(): NucypherTsPublicKey {
    return this.keyring.publicKey;
  }

  public get verifyingKey(): NucypherTsPublicKey {
    return this.keyring.publicKey;
  }

  public get signer(): Signer {
    return this.keyring.signer;
  }

  public static fromSecretKey(config: Configuration, secretKey: NucypherTsSecretKey): Bob {
    return new Bob(config, secretKey);
  }

  public decrypt(messageKit: MessageKit | PolicyMessageKit): Uint8Array {
    return this.keyring.decrypt(messageKit);
  }

  public async retrieveAndDecrypt(
    policyEncryptingKey: NucypherTsPublicKey,
    publisherVerifyingKey: NucypherTsPublicKey,
    messageKits: MessageKit[],
    encryptedTreasureMap: EncryptedTreasureMap,
    crossChainHrac: CrossChainHRAC,
  ): Promise<Uint8Array[]> {
    const policyMessageKits = await this.retrieve(
      policyEncryptingKey,
      publisherVerifyingKey,
      messageKits,
      encryptedTreasureMap,
      crossChainHrac
    );

    policyMessageKits.forEach((mk) => {
      if (!mk.isDecryptableByReceiver()) {
        throw Error(`Not enough cFrags retrieved to open capsule ${mk.capsule}. Was the policy revoked?`);
      }
    });

    return policyMessageKits.map((mk) => this.keyring.decrypt(mk));
  }

  public async retrieve(
    policyEncryptingKey: NucypherTsPublicKey,
    publisherVerifyingKey: NucypherTsPublicKey,
    messageKits: MessageKit[],
    encryptedTreasureMap: EncryptedTreasureMap,
    crossChainHrac: CrossChainHRAC,
  ): Promise<PolicyMessageKit[]> {

    // notice: bacause the encryptedTreasureMap import from nucypher-core, so you  must be use the nucypher-core's SecretKey PublicKey , not use the nucypher-ts's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e
    // so we must be the SecretKey, PublicKey type of NucypherCore.Signer
    
    const nucypherSecretKey: NucypherCore.SecretKey  = NucypherCore.SecretKey.fromBytes((this.keyring.secretKey as NucypherTsSecretKey).toSecretBytes());

    const nucypherCorePublisherVerifyingKey= NucypherCore.PublicKey.fromBytes(publisherVerifyingKey.toBytes());

    // const treasureMap = encryptedTreasureMap.decrypt(this.keyring.secretKey, publisherVerifyingKey);
    const treasureMap = encryptedTreasureMap.decrypt(nucypherSecretKey, nucypherCorePublisherVerifyingKey);
    
    const policyMessageKits = messageKits.map((mk) =>
      PolicyMessageKit.fromMessageKit(mk, policyEncryptingKey, treasureMap.threshold),
    );


    // resolve => TypeError: Cannot read properties of undefined (reading 'fromMessageKit')
    // const retrievalKits = policyMessageKits.map((pk) => pk.asRetrievalKit());
    const retrievalKits = policyMessageKits.map((pk) => RetrievalKit.fromMessageKit(pk.messageKit)); 
    console.log("retrievalKits: ", retrievalKits);

    let retrieveCFragsResponses;
    // try {
    //   retrieveCFragsResponses = await this.porter.retrieveCFrags(
    //     treasureMap,
    //     retrievalKits,
    //     publisherVerifyingKey,
    //     this.decryptingKey,
    //     this.verifyingKey,
    //     hrac,
    //   );
    //   // console.log("bob.ts retrieveCFrags info", retrieveCFragsResponses);
    // } catch (e) {
    //   const info = e as object;
    //   // console.log("bob.ts retrieve info", info);
    //   if (Object.prototype.hasOwnProperty.call(info, "status") && info["status"].toString().startsWith("2")) {
    //     //2xx
    //     retrieveCFragsResponses = info["data"].result.retrieval_results
    //       .map((result) => result.cfrags)
    //       .map((cFrags) => {
    //         const parsed = Object.keys(cFrags).map((address) => [
    //           address,
    //           CapsuleFrag.fromBytes(fromBase64(cFrags[address])),
    //         ]);
    //         return Object.fromEntries(parsed);
    //       });
    //   } else {
    //     throw e;
    //   }
    // }


    retrieveCFragsResponses = await this.porter.retrieveCFragsReturnResponse(
      treasureMap,
      retrievalKits,
      publisherVerifyingKey,
      this.decryptingKey,
      this.verifyingKey,
      crossChainHrac,
    );

    if (Object.prototype.hasOwnProperty.call(retrieveCFragsResponses, "status") && retrieveCFragsResponses["status"].toString().startsWith("2")) {
      //2xx
      retrieveCFragsResponses = retrieveCFragsResponses["data"].result.retrieval_results
        .map((result) => result.cfrags)
        .map((cFrags) => {
          const parsed = Object.keys(cFrags).map((address) => [
            address,
            CapsuleFrag.fromBytes(fromBase64(cFrags[address])),
          ]);
          return Object.fromEntries(parsed);
        });
    } else {
      throw Error("Get CFrags Failed");
    }

    return zip(policyMessageKits, retrieveCFragsResponses).map((pair) => {
      const [messageKit, cFragResponse] = pair;
      const results = Object.keys(cFragResponse).map((address) => {
        const verified = cFragResponse[address].verify(
          messageKit.capsule,
          publisherVerifyingKey,
          policyEncryptingKey,
          this.decryptingKey,
        );
        return [address, verified];
      });
      const retrievalResult = new RetrievalResult(Object.fromEntries(results));
      return messageKit.withResult(retrievalResult);
    });
  }
}
