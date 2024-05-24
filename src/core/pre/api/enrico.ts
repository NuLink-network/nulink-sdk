//reference: https://github.com/nucypher/nucypher-ts-demo/blob/main/src/characters.ts
// must be use the nucypher-ts's SecretKey PublicKey , not use the nucypher-core's SecretKey PublicKey (wasm code) to avoid the nucypher_core_wasm_bg.js Error: expected instance of e

import { Enrico, PublicKey, MessageKit, RetrievalKit, CapsuleFrag } from '@nulink_network/nulink-ts-app-test'

import { compressPublicKeyBuffer } from '../../hdwallet/api/common'

// export const testSecretKey = () =>
//   console.log(
//     "SecretKey print",
//     SecretKey.fromBytes(Buffer.from("fake-secret-key-32-bytes-bob-xxx")),
//   );

export const encryptMessage = (
  policyEncryptingPublicKeyString: string,
  szDataBinaryArrayBuffer: ArrayBuffer[]
): MessageKit[] => {

  // console.log(CapsuleFrag);
  // console.log(CapsuleFrag.fromBytes);
  // try {
  //   console.log(RetrievalKit);
  //   console.log(RetrievalKit.fromMessageKit);
  // } catch (error) {
  //   console.log(error);
  // }

  const x = PublicKey;
  console.log(x);
  /*
        policyEncryptingKey: Policy public key  
szDataBinaryArrayBuffer: Multiple data/file arrays, each returned by a callback called FileReader.readAsArrayBuffer(file) e.target.result        
    */
  const policyEncryptingPublicKey: PublicKey = PublicKey.fromBytes(
    compressPublicKeyBuffer(policyEncryptingPublicKeyString)
  )

  //Adapter code for nucypher-ts    Note Bob, Enrico's Encrypted PK SK is the same as Verify PK SK.  Alice verify PK can use encrypted PK.  In Nucypher-TS, Alice encryption key uses the public and private key pair generated by label, which is the policy public key for us.
  //Since we only have the encryption key of the policy and no verification signature key of the policy when we design the policy, the encryption of the policy here is multiplexed with the verification signature key
  const enrico = new Enrico(policyEncryptingPublicKey, policyEncryptingPublicKey)

  const szEncryptMessage: MessageKit[] = []
  for (const dataBinaryArrayBuffer of szDataBinaryArrayBuffer) {
    const uInt8a = new Uint8Array(dataBinaryArrayBuffer)
    const encryptedMessage = enrico.encryptMessage(uInt8a)
    // const enricoVerifyingKey:PublicKey = enrico.verifyingKey;
    szEncryptMessage.push(encryptedMessage)
  }

  return szEncryptMessage
}
