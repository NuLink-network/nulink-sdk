import encryptpwd from "encrypt-with-password";
import { generateRandomString } from "ts-randomstring/lib";

const encryptedPreffix = "encrypted:";

export const encrypt = (plaintext: string, password?: string | null, repeatEncryption = false) => {
  //repeatEncryption: if it is ciphertext, determine whether to encrypt it again
  if (!plaintext) {
    return plaintext;
  }

  const ciphertext: string = encryptedPreffix;

  if (plaintext.startsWith(encryptedPreffix) && !repeatEncryption) {
    return plaintext;
  }

  let pwdLen: number;
  if (!password) {
    pwdLen = 6;
    password = generateRandomString({
      length: pwdLen,
    });
  } else {
    pwdLen = (password as string).length;
  }

  //The password contains a maximum of two characters
  const spwdLen = pwdLen.toString().padStart(2, "0");
  const data = encryptpwd.encrypt(plaintext, password) + password + spwdLen;

  return ciphertext + data;
};

export const decrypt = (ciphertext: string, repeatDecryption = false) => {
  //repeatDecryption: If the ciphertext is still encrypted after decryption, whether to continue the recursive decryption until it becomes plaintext
  if (!ciphertext) {
    return ciphertext;
  }

  if (!ciphertext.startsWith(encryptedPreffix)) {
    //If not encrypted, return plaintext
    return ciphertext;
  }

  ciphertext = ciphertext.substring(encryptedPreffix.length);

  //Gets the password length by intercepting the last two digits of the string
  const spwdLen = parseInt(ciphertext.substring(ciphertext.length - 2));
  ciphertext = ciphertext.substring(0, ciphertext.length - 2);
  let plaintext = encryptpwd.decrypt(ciphertext.slice(0, -spwdLen), ciphertext.slice(-spwdLen));

  if (plaintext.startsWith(encryptedPreffix) && repeatDecryption) {
    plaintext = decrypt(plaintext, repeatDecryption);
  }
  return plaintext;
};
