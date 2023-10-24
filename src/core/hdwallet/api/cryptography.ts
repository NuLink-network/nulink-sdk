import { Buffer } from 'buffer'
import * as eccryptoJS from 'eccrypto-js'
import * as macro from '../types'
import * as util from '../../utils/null'
import * as exception from '../../utils/exception'

import { fromString } from '../../utils/uint8arrays'
import { toString } from '../../utils/uint8arrays/to-string'
import { concat } from '../../utils/uint8arrays/concat'
import { equals } from '../../utils/uint8arrays/equals'
// import toBuffer from "typedarray-to-buffer";
import toUint8Array from 'buffer-to-uint8array'
import { ChaCha20 } from 'chacha20-ts'
import assert from 'assert-ts'
import * as common from './common'
import encryptpwd from 'encrypt-with-password'
import getRandomValues from 'get-random-values'
import { store } from '../../utils/storage'
// import { toBuffer } from "ethereumjs-util";
import { encrypt as pwdEncrypt, decrypt as pwdDecrypt } from '../../utils/passwordEncryption'
import { Keccak } from "sha3";
import md5 from "md5";


//Temporarily set the data storage scheme as: generate a random string, encrypt it with the user's public key, and store it on the disk. This random string is used as a symmetric key to encrypt data.
/**
 * @internal
 */
export class CryptoBroker {
  private _symkey: null | Uint8Array = null //symkey is a 32-byte Uint8Array, iv is an 8-byte Uint8Array
  private _iv: null | Uint8Array = null //Random vector to ensure that the ciphertext encrypted by the unified symmetric key is different, and should be exported with iv
  private _publicKey: string
  private _privateKey: string

  private constructor(publicKey: string, privateKey: string) {
    //Note the non-extended public and private keys (the child public and private keys cannot be deduced)
    this._publicKey = publicKey
    this._privateKey = pwdEncrypt(privateKey, null, false)
  }

  public static async cryptoBrokerFactory(
    rootAccountKeyPair: common.KeyPair,
    symkey: Uint8Array | null = null,
    iv: Uint8Array | null = null,
    save = true
  ): Promise<CryptoBroker> {
    const cryptoBroker = new CryptoBroker(
      rootAccountKeyPair._publicKey,
      pwdDecrypt(rootAccountKeyPair._privateKey, true)
    )

    if (util.isBlank(symkey) || util.isBlank(iv)) {
      //When recovering an account through a mnemonic phrase or an extended root private key, there is no need for the user to store the symkey and iv. 
      // Therefore, it is required that the symkey and iv must be generated through the mnemonic phrase or the extended root private key.
      await cryptoBroker.generateSecretKeyBySecret(save);
      //await cryptoBroker.generateSecretKey(save)
    } else {
      assert(symkey?.length === 32 && iv?.length === 8)
      cryptoBroker._symkey = symkey
      cryptoBroker._iv = iv

      const encryptedSymmetricKeyIv: string = await cryptoBroker.dump()

      if (save) {
        await store.setItem(macro.symmetricKeyIv, encryptedSymmetricKeyIv)
      }

      //try eccryptoJS.utf8ToBuffer(encryptedSymmetricKeyIv)
      // console.log(`CryptoBroker:cryptoBrokerFactory setOneRecord encryptedSymmetricKeyIv: ${toBuffer(encryptedSymmetricKeyIv)}`);
    }
    return cryptoBroker
  }

  public static async cryptoBrokerFactoryByEncryptedKeyIV(
    rootAccountKeyPair: common.KeyPair,
    encryptedSymmetricKeyIv = '',
    save = true
  ): Promise<CryptoBroker> {
    let cryptoBroker: CryptoBroker
    if (!util.isBlank(encryptedSymmetricKeyIv)) {
      cryptoBroker = new CryptoBroker(rootAccountKeyPair._publicKey, pwdDecrypt(rootAccountKeyPair._privateKey, true))
      await cryptoBroker.load(encryptedSymmetricKeyIv, save)
    } else {
      cryptoBroker = await CryptoBroker.cryptoBrokerFactory(rootAccountKeyPair, null, null, save)
    }

    return cryptoBroker
  }

  public needReCreate(symkey: Uint8Array, iv: Uint8Array): boolean {
    //Determine whether the object needs to be updated by comparing whether the symkey, iv are equal to the original
    return !(equals(symkey, this._symkey as Uint8Array) && equals(iv, this._iv as Uint8Array))
  }

  public async needReCreateByEncryptedKeyIv(encryptedSymmetricKeyIv: string): Promise<boolean> {
    //Determine whether the object needs to be updated by comparing whether the symkey, iv are equal to the original
    return !(encryptedSymmetricKeyIv === (await this.dump()))
  }

  private async generateSecretKeyBySecret(save = true) {
    //Generate symmetric encryption key
    //Temporarily set the data storage scheme as: generate a random string, encrypt it with the user's public key, and store it on the disk. This random string is used as a symmetric key to encrypt data

    // xchacha requires symmetric key is 32 byte Uint8Array, iv is 8 byte Uint8Array
  
    const sk = pwdDecrypt(this._privateKey, true);
    const pk = this._publicKey;

    const signed = md5(pk + sk, { encoding: "string" });
    const hash = new Keccak(256);
    hash.update(signed);
    const hashBuffer :Buffer = hash.digest(); //Buffer extends Uint8Array
    //the hashBuffer.byteLength is 32
    
    const symmetryKey: Uint8Array = new Uint8Array(32)

    //subarray end indices: the subarray result is not include the bytes of end indices
    symmetryKey.set(hashBuffer.subarray (0, symmetryKey.byteLength))
    
    const signedSk = md5(sk, { encoding: "string" });
    const hashSk = new Keccak(256);
    hashSk.update(signedSk);
    const hashSkBuffer :Buffer = hashSk.digest(); //Buffer extends Uint8Array

    const iv: Uint8Array = new Uint8Array(8)
    //subarray end indices: the subarray result is not include the bytes of end indices
    iv.set(hashSkBuffer.subarray (0, iv.byteLength))

    // const arrays = [
    //   Uint8Array.from([0, 1, 2]),
    //   Uint8Array.from([3, 4, 5])
    // ]

    // const all = concat(arrays, 6) //Uint8Array

    const symmetryKeyIv = concat([symmetryKey, iv], symmetryKey.length + iv.length)

    // console.log(`CryptoBroker:generateSecretKey symmetryKey: ${symmetryKey} iv: ${iv}`);
    //const encrypted = await eccryptoJS.encrypt( Buffer.from(pk), msg);
    //Elliptic Curve Algorithm Asymmetric Encryption
    const encrypted = await eccryptoJS.encrypt(
      common.publicKeyBuffer65Bytes(this._publicKey),
      Buffer.from(symmetryKeyIv.buffer, 0, symmetryKeyIv.buffer.byteLength) //error => // toBuffer(symmetryKeyIv), //eccryptoJS.utf8ToBuffer(symmetryKeyIv)
    )

    const encryptedSymmetricKeyIvBuf: Buffer = eccryptoJS.serialize(encrypted)
    //const decrypted = await eccryptoJS.decrypt(pwdDecrypt(keyPairB.privateKey, true), encrypted);
    // decrypted.toString() === str
    //Store TOOD in chrome, find out if there is a problem with the same key in different applications, and if so, add the publickey prefix
    //Note: Storage is absolutely isolated between extensions, there is no way to share data. So don't worry about key conflicts between different extensions
    if (save) {
      await store.setItem(macro.symmetricKeyIv, encryptedSymmetricKeyIvBuf.toString('binary'))
    }

    this._symkey = symmetryKey
    this._iv = iv

    // console.log(`CryptoBroker:generateSecretKey setOneRecord encryptedSymmetricKeyIv: ${encryptedSymmetricKeyIvBuf}`);
  }

  private async generateSecretKey(save = true) {
    //Generate symmetric encryption key
    //Temporarily set the data storage scheme as: generate a random string, encrypt it with the user's public key, and store it on the disk. This random string is used as a symmetric key to encrypt data

    // xchacha requires symmetric key is 32 byte Uint8Array, iv is 8 byte Uint8Array
    const symmetryKey: Uint8Array = new Uint8Array(32)
    //window.crypto.getRandomValues(symmetryKey);
    getRandomValues(symmetryKey)
    const iv: Uint8Array = new Uint8Array(8)
    //window.crypto.getRandomValues(iv);
    getRandomValues(iv)

    // const arrays = [
    //   Uint8Array.from([0, 1, 2]),
    //   Uint8Array.from([3, 4, 5])
    // ]

    // const all = concat(arrays, 6) //Uint8Array

    const symmetryKeyIv = concat([symmetryKey, iv], symmetryKey.length + iv.length)

    // console.log(`CryptoBroker:generateSecretKey symmetryKey: ${symmetryKey} iv: ${iv}`);
    //const encrypted = await eccryptoJS.encrypt( Buffer.from(pk), msg);
    //Elliptic Curve Algorithm Asymmetric Encryption
    const encrypted = await eccryptoJS.encrypt(
      common.publicKeyBuffer65Bytes(this._publicKey),
      Buffer.from(symmetryKeyIv.buffer, 0, symmetryKeyIv.buffer.byteLength) //error => // toBuffer(symmetryKeyIv), //eccryptoJS.utf8ToBuffer(symmetryKeyIv)
    )

    const encryptedSymmetricKeyIvBuf: Buffer = eccryptoJS.serialize(encrypted)
    //const decrypted = await eccryptoJS.decrypt(pwdDecrypt(keyPairB.privateKey, true), encrypted);
    // decrypted.toString() === str
    //Store TOOD in chrome, find out if there is a problem with the same key in different applications, and if so, add the publickey prefix
    //Note: Storage is absolutely isolated between extensions, there is no way to share data. So don't worry about key conflicts between different extensions
    if (save) {
      await store.setItem(macro.symmetricKeyIv, encryptedSymmetricKeyIvBuf.toString('binary'))
    }

    this._symkey = symmetryKey
    this._iv = iv

    // console.log(`CryptoBroker:generateSecretKey setOneRecord encryptedSymmetricKeyIv: ${encryptedSymmetricKeyIvBuf}`);
  }

  private async getSecretKey(): Promise<[Uint8Array, Uint8Array]> {
    //Generate symmetric encryption key
    //Temporarily set the data storage scheme as: generate a random string, encrypt it with the user's public key, and store it on the disk. This random string is used as a symmetric key to encrypt data
    if (!util.isBlank(this._symkey) && !util.isBlank(this._iv)) {
      return [this._symkey as Uint8Array, this._iv as Uint8Array]
    }

    const encryptedSymmetricKeyIv: string = (await store.getItem(macro.symmetricKeyIv)) as string

    //When it is empty, you need to call load() first, or declare reGenerate=false in the constructor
    assert(!util.isBlank(encryptedSymmetricKeyIv))

    // console.log(`before eccryptoJS.deserialize: ${toBuffer(encryptedSymmetricKeyIv)}`);
    // console.log(eccryptoJS);

    const encrypted: eccryptoJS.Encrypted = eccryptoJS.deserialize(
      Buffer.from(encryptedSymmetricKeyIv, 'binary') //error => // toBuffer(encryptedSymmetricKeyIv) //eccryptoJS.utf8ToBuffer(encryptedSymmetricKeyIv),
    )
    const decrypted: Buffer = await eccryptoJS.decrypt(
      common.privateKeyBuffer(pwdDecrypt(this._privateKey, true)),
      encrypted
    )
    const symmetryKeyIv = toUint8Array(decrypted) as Uint8Array

    this._symkey = symmetryKeyIv.slice(0, 32) //32 bytes
    this._iv = symmetryKeyIv.slice(32) // 8 bytes

    // console.log(`CryptoBroker: getSecretKey _symkey: ${this._symkey} iv: ${this._iv}`);

    return [this._symkey as Uint8Array, this._iv as Uint8Array]
  }

  public async dump(): Promise<string> {
    //Return the encrypted string of key, iv (encrypted string)

    assert(this._symkey != null && this._iv != null)

    const symmetryKey = this._symkey
    const iv = this._iv

    const symmetryKeyIv = concat([symmetryKey, iv], symmetryKey.length + iv.length)

    //const encrypted = await eccryptoJS.encrypt( Buffer.from(pk), msg);
    // console.log(`CryptoBroker: dump symmetryKey: ${symmetryKey} iv: ${iv}`);
    // console.log(`CryptoBroker: dump encrypt publicKey: ${this._publicKey}, privateKey: ${pwdDecrypt(this._privateKey, true)}`);

    // let bbb = Buffer.from(symmetryKeyIv.buffer, 0, symmetryKeyIv.buffer.byteLength);
    // console.log(Buffer.from(bbb.toString('binary'), 'binary'));

    //Elliptic Curve Algorithm Asymmetric Encryption
    const encrypted = await eccryptoJS.encrypt(
      common.publicKeyBuffer65Bytes(this._publicKey),
      Buffer.from(symmetryKeyIv.buffer, 0, symmetryKeyIv.buffer.byteLength) //error ==> // Buffer.from(symmetryKeyIv.toString() , 'binary') //toBuffer(symmetryKeyIv), //eccryptoJS.utf8ToBuffer(symmetryKeyIv)
    )
    const encryptedSymmetricKeyIv: Buffer = eccryptoJS.serialize(encrypted)

    //Note that after toBuffer or utf8ToBuffer Buffer.from is different from the original encryptedSymmetricKeyIv, there is a problem. So toBuffer, utf8ToBuffer Buffer.from cannot be used
    //https://stackoverflow.com/questions/63839410/converting-a-nodejs-buffer-to-string-and-back-to-buffer-gives-a-different-result
    // console.log(toBuffer(encryptedSymmetricKeyIv.toString()))
    // console.log(eccryptoJS.utf8ToBuffer(encryptedSymmetricKeyIv.toString()))
    // console.log(encryptedSymmetricKeyIv.toString())
    // console.log(Buffer.from(encryptedSymmetricKeyIv.toString('binary'),'binary'));
    // console.log(encryptedSymmetricKeyIv);
    // console.log(`CryptoBroker: dump serialize encryptedSymmetricKeyIv: ${encryptedSymmetricKeyIv}`);

    return encryptedSymmetricKeyIv.toString('binary') //If not passed, the default is Utf-8
  }

  public async load(encryptedSymmetricKeyIv: string, save = true): Promise<void> {
    //Note that after the load, since the key and iv are updated, all data encrypted and saved by key and iv need to be re-encrypted
    assert(!util.isBlank(encryptedSymmetricKeyIv))

    const encrypted: eccryptoJS.Encrypted = eccryptoJS.deserialize(
      Buffer.from(encryptedSymmetricKeyIv, 'binary') //eccryptoJS.utf8ToBuffer(encryptedSymmetricKeyIv),
    )
    // console.log(`CryptoBroker: load decrypt privateKey: ${pwdDecrypt(this._privateKey, true)}  publicKey: ${this._publicKey}`);

    const decrypted: Buffer = await eccryptoJS.decrypt(
      common.privateKeyBuffer(pwdDecrypt(this._privateKey, true)),
      encrypted
    )
    const symmetryKeyIv = toUint8Array(decrypted) as Uint8Array

    this._symkey = symmetryKeyIv.slice(0, 32) as Uint8Array //32 bytes
    this._iv = symmetryKeyIv.slice(32) as Uint8Array // 8 bytes

    // console.log(`CryptoBroker: load setOneRecord encryptedSymmetricKeyIv: ${toBuffer(encryptedSymmetricKeyIv)}`);
    //Dont forget
    if (save) {
      await store.setItem(macro.symmetricKeyIv, encryptedSymmetricKeyIv)
    }
  }

  public async encryptData(plainText: string): Promise<string> {
    //Symmetrically encrypted data
    const [symmetricKey, iv] = await this.getSecretKey()
    // console.log(`encryptData symkey: ${symmetricKey}  iv: ${iv}`);
    const { XORKeyStream } = ChaCha20.NewWithRounds(symmetricKey, iv)

    const pt: Uint8Array = fromString(plainText) //Uint8Array
    const ct = new Uint8Array(pt.length) //CipherText

    XORKeyStream(ct, pt)

    //After encryption
    //console.log("cipherText: "+ toString(ct));
    return toString(ct, 'base64')
  }

  public async decryptData(cipherText: string): Promise<string> {
    assert(!util.isBlank(this._symkey) && !util.isBlank(this._iv))
    // console.log(`decryptData symkey: ${this._symkey}  iv: ${this._iv}`);
    const { XORKeyStream } = ChaCha20.NewWithRounds(this._symkey as Uint8Array, this._iv as Uint8Array)

    const ct: Uint8Array = fromString(cipherText, 'base64') //Uint8Array
    //Decrypt
    const pt = new Uint8Array(ct.length)
    //XORKeyStream(src_pt, ct) //Note that the application must be re-applied here, and the encrypted XORKeyStream object cannot be used
    XORKeyStream(pt, ct)
    //after decryption
    //console.log("plainText: " + toString(pt));

    return toString(pt)
  }

  public async encryptSaveData(saveKey: string, plainText: string): Promise<string> {
    //Encrypt and save data locally
    const cipherText: string = await this.encryptData(plainText)

    await store.setItem(saveKey, String(cipherText))
    return cipherText
  }

  public async decryptSavedData(savedKey: string): Promise<string> {
    //Read data from local storage and decrypt

    const cipherText: string = (await store.getItem(savedKey)) as string
    // console.log("decryptSavedData cipherText:", cipherText);
    if (util.isBlank(cipherText)) {
      //An empty string means that there is no key to store this data, and no one will store "" in the storage
      return ''
    }

    const plainText: string = await this.decryptData(cipherText)
    // console.log("decryptSavedData decryptData:", plainText);
    return plainText
  }

  public async cleanAllSavedData() {
    await store.clear()
  }

  public async removeSavedData(savedKey: string) {
    //Try not to call this function. Deleting a key without logic alone will destroy the overall storage interface.
    //Unless you know the consequences of deleting a key (such as load failure), don't do this lightly.
    //Given this, this function is set to private
    try {
      await store.removeItem(savedKey)
    } catch (error) {
      console.log(error)
    }
  }

  private async removeSavedDatas(saveKeys: string[]) {
    //Try not to call this function. Deleting a key without logic alone will destroy the overall storage interface.
    //Unless you know the consequences of deleting a key (such as load failure), don't do this lightly.
    //Given this, this function is set to private
    try {
      await store.removeItems(saveKeys)
    } catch (error) {
      console.log(error)
    }
  }

  public static encryptWithPassword(plaintext: string, password: string) {
    try {
      return encryptpwd.encrypt(plaintext, password)
    } catch (error) {
      console.error('encryptWithPassword error', error)
      throw new exception.PasswordDecryptError(error)
    }
  }

  public static decryptWithPassword(ciphertext: string, password: string): string {
    try {
      return encryptpwd.decrypt(ciphertext, password)
    } catch (error) {
      console.error('decryptWithPassword error', error)
      throw new exception.PasswordDecryptError(error)
    }
  }

  public static async encryptWithPasswordSave(plaintext: string, password: string, savekey: string) {
    const encrypted = CryptoBroker.encryptWithPassword(plaintext, password)

    await store.setItem(savekey, encrypted)

    return encrypted
  }

  public static async decryptWithPasswordSaved(password: string, savekey: string) {
    const ciphertext: string = (await store.getItem(savekey)) as string
    if (util.isBlank(ciphertext)) {
      return ''
    }
    return CryptoBroker.decryptWithPassword(ciphertext, password)
  }
}
