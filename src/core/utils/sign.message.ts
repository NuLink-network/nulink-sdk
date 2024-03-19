import { ethers } from "ethers";
import { isBlank } from "./null";

/**
 * {
    "files": [
      {
        "id": "WKITiFOlIoabWBaB6TiaP",
        "name": "Snipaste_2023-03-21_14-22-29.png",
        "address": "QmentiTZ2dPhaqSrDvqw82S35iMHavuGS5mfyjvhDgoCWy",
        "md5": "1c96e271a85ae57487fba344fdc17130",
        "suffix": "png",
        "category": "unkown",
        "thumbnail": "image/png|QmNMmuowY1T6NsW2SFkw2GJLrxEXdUGD7gaWk7AL7QwnZV"
      }
    ],
    "account_id": "c8d62a5dc12f9f8eb5146ab2951300f17508883a79a792dccb1e6f925128ae98",
    "policy_label_id": "h3i58lgtjAv6pL_yLYgJ-",
    "policy_label": "unkown_h3i58lgtjAv6pL_yLYgJ-",
    "policy_label_index": 0,
    "encrypted_pk": "0xe22700efa1ca5e3c907525da40b300dea367926186a2f28d6486002163b1fa65d183247f9a239343082076b4d3921c79efd76d6e5e7bb2dea1f52aea2872d6dd",
    "signature": "0xba8ddf8cde8e669a963d6a106ca9282b89ac6493cd6da447e066bdc8032f31277c280c5e1dfcb32691ff38066fa40df28f8447f20017263e382051d4e3b83d781b"
  }
*/

export const sortLexObject2String = (data: any /*: 'dataDict' */) => {
  //Sorting all parameters in lexicographic order: and
  // The dictionary sorting method involves sorting words based on the first letter, followed by the second letter if the first letters are the same, and so on.
  //return format: key1=value1&key2=value2 (where value2 could also be in the form of key3=value3&key4&value4 ).
  // { 'm': ['a','b','c']}  ==> after sort: m=a&b&c
  let signRawString = "";

  if (data instanceof Array) {
    data.sort((a, b) => (a > b ? 1 : -1));
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      if (!isBlank(signRawString)) {
        signRawString += "&";
      }
      signRawString += `${sortLexObject2String(element)}`;
    }
    return signRawString;
  } else if (data instanceof Object) {
    const sortedKeys: any[] = Object.keys(data).sort((a, b) =>
      a > b ? 1 : -1
    );
    for (let index = 0; index < sortedKeys.length; index++) {
      const key = sortedKeys[index] as string;
      const element = data[key];
      if (!isBlank(signRawString)) {
        signRawString += "&";
      }
      signRawString += `${key}=${sortLexObject2String(element)}`;
    }

    return signRawString;
  } else {
    return String(data);
  }
};

// EIP-191 sign
export const signMessage = async (
  messageData: any, //"dataDict",
  privateKey: string
): Promise<string> => {
  //privateKey start with 0x

  //https://github.com/ethers-io/ethers.js/issues/447
  const wallet = new ethers.Wallet(privateKey);
  
  if(messageData instanceof FormData)
  {
    throw new Error("signMessage not support type: form-data lib's FormData")
  }

  //Sorting all parameters in lexicographic order.
  const message: string = sortLexObject2String(messageData);
  const signature = await wallet.signMessage(message); //'0x655f4a155cb1dceb98a4913a51f6073818b4e6d3a516562a2e426ad84491f9b226fa111ea282b7de017e2ea1edc2163dc43c8bf6ff94118a20c83396b5f7923c1b'
  return signature;
};

// EIP-191 verify sign
export const verifyMessage = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  // Approach 1
  const actualAddress = ethers.utils.verifyMessage(message, signature);

  return expectedAddress.toLowerCase() === actualAddress.toLowerCase();
};

// recover checksum address from EIP-191 signature
export const recoverPubKeyAndAddress = (
  message: string,
  signature: string
): Record<string, string> => {
  //After signing with private key, A sends the signature, message hash, and A's address to B. B recovers A's public key and address using the message hash and signature, and verifies them against the address returned by A.

  // Approach 2
  const msgHash = ethers.utils.hashMessage(message); //same with my java's project eth method isSignatureValid (keccak256 algorithm)

  const msgHashBytes = ethers.utils.arrayify(msgHash);

  // Now you have the digest,
  const recoveredPubKey = ethers.utils.recoverPublicKey(
    msgHashBytes,
    signature
  );
  const recoveredAddress = ethers.utils.recoverAddress(msgHashBytes, signature);

  return { publickey: recoveredPubKey, address: recoveredAddress };
};
