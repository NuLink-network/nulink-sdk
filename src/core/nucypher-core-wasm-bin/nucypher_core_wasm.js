import { TextDecoder } from '@polkadot/x-textdecoder';
import nucypherCoreWasm from './nucypher_core_bytes';
import { Buffer } from 'buffer'

let imports = {};
const exportsObj = {}
imports['__wbindgen_placeholder__'] = exportsObj;
let wasm;
const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject (idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject (idx) {
  if (idx < 36) return;
  heap[idx] = heap_next;
  heap_next = idx;
}

function takeObject (idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0 () {
  if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
    cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachegetUint8Memory0;
}

function getStringFromWasm0 (ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject (obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];

  heap[idx] = obj;
  return idx;
}

function _assertClass (instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance.ptr;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0 (arg, malloc) {
  const ptr = malloc(arg.length * 1);
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0 () {
  if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
    cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachegetInt32Memory0;
}

function getArrayU8FromWasm0 (ptr, len) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachegetUint32Memory0 = null;
function getUint32Memory0 () {
  if (cachegetUint32Memory0 === null || cachegetUint32Memory0.buffer !== wasm.memory.buffer) {
    cachegetUint32Memory0 = new Uint32Array(wasm.memory.buffer);
  }
  return cachegetUint32Memory0;
}

function getArrayJsValueFromWasm0 (ptr, len) {
  const mem = getUint32Memory0();
  const slice = mem.subarray(ptr / 4, ptr / 4 + len);
  const result = [];
  for (let i = 0; i < slice.length; i++) {
    result.push(takeObject(slice[i]));
  }
  return result;
}

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
  ? function(arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
  }
  : function(arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length
    };
  });

function passStringToWasm0 (arg, malloc, realloc) {

  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length);
    getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len);

  const mem = getUint8Memory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7F) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3);
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);

    offset += ret.written;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function isLikeNone (x) {
  return x === undefined || x === null;
}
/**
* @param {PublicKey} delegating_pk
* @param {Uint8Array} plaintext
* @returns {EncryptionResult}
*/
const encrypt = function(delegating_pk, plaintext) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    _assertClass(delegating_pk, PublicKey);
    var ptr0 = passArray8ToWasm0(plaintext, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.encrypt(retptr, delegating_pk.ptr, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    if (r2) {
      throw takeObject(r1);
    }
    return EncryptionResult.__wrap(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
};


/**
* @param {SecretKey} delegating_sk
* @param {Capsule} capsule
* @param {Uint8Array} ciphertext
* @returns {Uint8Array}
*/
const decryptOriginal = function(delegating_sk, capsule, ciphertext) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    _assertClass(delegating_sk, SecretKey);
    _assertClass(capsule, Capsule);
    var ptr0 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    wasm.decryptOriginal(retptr, delegating_sk.ptr, capsule.ptr, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var r2 = getInt32Memory0()[retptr / 4 + 2];
    var r3 = getInt32Memory0()[retptr / 4 + 3];
    if (r3) {
      throw takeObject(r2);
    }
    var v1 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return v1;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
};


/**
* @param {SecretKey} delegating_sk
* @param {PublicKey} receiving_pk
* @param {Signer} signer
* @param {number} threshold
* @param {number} shares
* @param {boolean} sign_delegating_key
* @param {boolean} sign_receiving_key
* @returns {any[]}
*/
const generateKFrags = function(delegating_sk, receiving_pk, signer, threshold, shares, sign_delegating_key, sign_receiving_key) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    _assertClass(delegating_sk, SecretKey);
    _assertClass(receiving_pk, PublicKey);
    _assertClass(signer, Signer);
    wasm.generateKFrags(retptr, delegating_sk.ptr, receiving_pk.ptr, signer.ptr, threshold, shares, sign_delegating_key, sign_receiving_key);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 4);
    return v0;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
};

/**
* @param {Capsule} capsule
* @param {VerifiedKeyFrag} kfrag
* @returns {VerifiedCapsuleFrag}
*/
const reencrypt = function(capsule, kfrag) {
  _assertClass(capsule, Capsule);
  _assertClass(kfrag, VerifiedKeyFrag);
  var ret = wasm.reencrypt(capsule.ptr, kfrag.ptr);
  return VerifiedCapsuleFrag.__wrap(ret);
};

function handleError (f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
/**
*/
class Capsule {

  static __wrap (ptr) {
    const obj = Object.create(Capsule.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_capsule_free(ptr);
  }
  /**
  * @param {VerifiedCapsuleFrag} cfrag
  * @returns {CapsuleWithFrags}
  */
  withCFrag (cfrag) {
    _assertClass(cfrag, VerifiedCapsuleFrag);
    var ret = wasm.capsule_withCFrag(this.ptr, cfrag.ptr);
    return CapsuleWithFrags.__wrap(ret);
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.capsule_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {Capsule}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.capsule_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Capsule.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.capsule_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @param {Capsule} other
  * @returns {boolean}
  */
  equals (other) {
    _assertClass(other, Capsule);
    var ret = wasm.capsule_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
}
/**
*/
class CapsuleFrag {

  static __wrap (ptr) {
    const obj = Object.create(CapsuleFrag.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_capsulefrag_free(ptr);
  }
  /**
  * @param {Capsule} capsule
  * @param {PublicKey} verifying_pk
  * @param {PublicKey} delegating_pk
  * @param {PublicKey} receiving_pk
  * @returns {VerifiedCapsuleFrag}
  */
  verify (capsule, verifying_pk, delegating_pk, receiving_pk) {
    try {
      const ptr = this.__destroy_into_raw();
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(capsule, Capsule);
      _assertClass(verifying_pk, PublicKey);
      _assertClass(delegating_pk, PublicKey);
      _assertClass(receiving_pk, PublicKey);
      wasm.capsulefrag_verify(retptr, ptr, capsule.ptr, verifying_pk.ptr, delegating_pk.ptr, receiving_pk.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedCapsuleFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.capsulefrag_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {CapsuleFrag}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.capsulefrag_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return CapsuleFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.capsulefrag_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @param {CapsuleFrag} other
  * @returns {boolean}
  */
  equals (other) {
    _assertClass(other, CapsuleFrag);
    var ret = wasm.capsulefrag_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
}
/**
*/
class CapsuleWithFrags {

  static __wrap (ptr) {
    const obj = Object.create(CapsuleWithFrags.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_capsulewithfrags_free(ptr);
  }
  /**
  * @param {VerifiedCapsuleFrag} cfrag
  * @returns {CapsuleWithFrags}
  */
  withCFrag (cfrag) {
    _assertClass(cfrag, VerifiedCapsuleFrag);
    var ret = wasm.capsulewithfrags_withCFrag(this.ptr, cfrag.ptr);
    return CapsuleWithFrags.__wrap(ret);
  }
  /**
  * @param {SecretKey} receiving_sk
  * @param {PublicKey} delegating_pk
  * @param {Uint8Array} ciphertext
  * @returns {Uint8Array}
  */
  decryptReencrypted (receiving_sk, delegating_pk, ciphertext) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(receiving_sk, SecretKey);
      _assertClass(delegating_pk, PublicKey);
      var ptr0 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.capsulewithfrags_decryptReencrypted(retptr, this.ptr, receiving_sk.ptr, delegating_pk.ptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      var r3 = getInt32Memory0()[retptr / 4 + 3];
      if (r3) {
        throw takeObject(r2);
      }
      var v1 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v1;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class EncryptedKeyFrag {

  static __wrap (ptr) {
    const obj = Object.create(EncryptedKeyFrag.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_encryptedkeyfrag_free(ptr);
  }
  /**
  * @param {Signer} signer
  * @param {PublicKey} recipient_key
  * @param {HRAC} hrac
  * @param {VerifiedKeyFrag} verified_kfrag
  */
  constructor(signer, recipient_key, hrac, verified_kfrag) {
    _assertClass(signer, Signer);
    _assertClass(recipient_key, PublicKey);
    _assertClass(hrac, HRAC);
    _assertClass(verified_kfrag, VerifiedKeyFrag);
    var ret = wasm.encryptedkeyfrag_new(signer.ptr, recipient_key.ptr, hrac.ptr, verified_kfrag.ptr);
    return EncryptedKeyFrag.__wrap(ret);
  }
  /**
  * @param {SecretKey} sk
  * @param {HRAC} hrac
  * @param {PublicKey} publisher_verifying_key
  * @returns {VerifiedKeyFrag}
  */
  decrypt (sk, hrac, publisher_verifying_key) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(sk, SecretKey);
      _assertClass(hrac, HRAC);
      _assertClass(publisher_verifying_key, PublicKey);
      wasm.encryptedkeyfrag_decrypt(retptr, this.ptr, sk.ptr, hrac.ptr, publisher_verifying_key.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedKeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {EncryptedKeyFrag}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.encryptedkeyfrag_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return EncryptedKeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.encryptedkeyfrag_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class EncryptedTreasureMap {

  static __wrap (ptr) {
    const obj = Object.create(EncryptedTreasureMap.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_encryptedtreasuremap_free(ptr);
  }
  /**
  * @param {SecretKey} sk
  * @param {PublicKey} publisher_verifying_key
  * @returns {TreasureMap}
  */
  decrypt (sk, publisher_verifying_key) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(sk, SecretKey);
      _assertClass(publisher_verifying_key, PublicKey);
      wasm.encryptedtreasuremap_decrypt(retptr, this.ptr, sk.ptr, publisher_verifying_key.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return TreasureMap.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {EncryptedTreasureMap}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.encryptedtreasuremap_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return EncryptedTreasureMap.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.encryptedtreasuremap_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class EncryptionResult {

  static __wrap (ptr) {
    const obj = Object.create(EncryptionResult.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_encryptionresult_free(ptr);
  }
  /**
  */
  get capsule () {
    var ret = wasm.__wbg_get_encryptionresult_capsule(this.ptr);
    return Capsule.__wrap(ret);
  }
  /**
  * @param {Capsule} arg0
  */
  set capsule (arg0) {
    _assertClass(arg0, Capsule);
    var ptr0 = arg0.ptr;
    arg0.ptr = 0;
    wasm.__wbg_set_encryptionresult_capsule(this.ptr, ptr0);
  }
  /**
  * @returns {Uint8Array}
  */
  get ciphertext () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.encryptionresult_ciphertext(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class FleetStateChecksum {

  static __wrap (ptr) {
    const obj = Object.create(FleetStateChecksum.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_fleetstatechecksum_free(ptr);
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.fleetstatechecksum_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class FleetStateChecksumBuilder {

  static __wrap (ptr) {
    const obj = Object.create(FleetStateChecksumBuilder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_fleetstatechecksumbuilder_free(ptr);
  }
  /**
  * @param {NodeMetadata | undefined} this_node
  */
  constructor(this_node) {
    let ptr0 = 0;
    if (!isLikeNone(this_node)) {
      _assertClass(this_node, NodeMetadata);
      ptr0 = this_node.ptr;
      this_node.ptr = 0;
    }
    var ret = wasm.fleetstatechecksumbuilder_new(ptr0);
    return FleetStateChecksumBuilder.__wrap(ret);
  }
  /**
  * @param {NodeMetadata} other_node
  * @returns {FleetStateChecksumBuilder}
  */
  addOtherNode (other_node) {
    _assertClass(other_node, NodeMetadata);
    var ret = wasm.fleetstatechecksumbuilder_addOtherNode(this.ptr, other_node.ptr);
    return FleetStateChecksumBuilder.__wrap(ret);
  }
  /**
  * @returns {FleetStateChecksum}
  */
  build () {
    var ret = wasm.fleetstatechecksumbuilder_build(this.ptr);
    return FleetStateChecksum.__wrap(ret);
  }
}
/**
*/
class HRAC {

  static __wrap (ptr) {
    const obj = Object.create(HRAC.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_hrac_free(ptr);
  }
  /**
  * @param {PublicKey} publisher_verifying_key
  * @param {PublicKey} bob_verifying_key
  * @param {Uint8Array} label
  */
  constructor(publisher_verifying_key, bob_verifying_key, label) {
    _assertClass(publisher_verifying_key, PublicKey);
    _assertClass(bob_verifying_key, PublicKey);
    var ptr0 = passArray8ToWasm0(label, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.hrac_new(publisher_verifying_key.ptr, bob_verifying_key.ptr, ptr0, len0);
    return HRAC.__wrap(ret);
  }
  /**
  * @param {Uint8Array} bytes
  * @returns {HRAC}
  */
  static fromBytes (bytes) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.hrac_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return HRAC.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.hrac_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class KeyFrag {

  static __wrap (ptr) {
    const obj = Object.create(KeyFrag.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_keyfrag_free(ptr);
  }
  /**
  * @param {PublicKey} verifying_pk
  * @returns {VerifiedKeyFrag}
  */
  verify (verifying_pk) {
    try {
      const ptr = this.__destroy_into_raw();
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(verifying_pk, PublicKey);
      wasm.keyfrag_verify(retptr, ptr, verifying_pk.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedKeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {PublicKey} verifying_pk
  * @param {PublicKey} delegating_pk
  * @returns {VerifiedKeyFrag}
  */
  verifyWithDelegatingKey (verifying_pk, delegating_pk) {
    try {
      const ptr = this.__destroy_into_raw();
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(verifying_pk, PublicKey);
      _assertClass(delegating_pk, PublicKey);
      wasm.keyfrag_verifyWithDelegatingKey(retptr, ptr, verifying_pk.ptr, delegating_pk.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedKeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {PublicKey} verifying_pk
  * @param {PublicKey} receiving_pk
  * @returns {VerifiedKeyFrag}
  */
  verifyWithReceivingKey (verifying_pk, receiving_pk) {
    try {
      const ptr = this.__destroy_into_raw();
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(verifying_pk, PublicKey);
      _assertClass(receiving_pk, PublicKey);
      wasm.keyfrag_verifyWithReceivingKey(retptr, ptr, verifying_pk.ptr, receiving_pk.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedKeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {PublicKey} verifying_pk
  * @param {PublicKey} delegating_pk
  * @param {PublicKey} receiving_pk
  * @returns {VerifiedKeyFrag}
  */
  verifyWithDelegatingAndReceivingKeys (verifying_pk, delegating_pk, receiving_pk) {
    try {
      const ptr = this.__destroy_into_raw();
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(verifying_pk, PublicKey);
      _assertClass(delegating_pk, PublicKey);
      _assertClass(receiving_pk, PublicKey);
      wasm.keyfrag_verifyWithDelegatingAndReceivingKeys(retptr, ptr, verifying_pk.ptr, delegating_pk.ptr, receiving_pk.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedKeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.keyfrag_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {KeyFrag}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.keyfrag_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return KeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.keyfrag_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @param {KeyFrag} other
  * @returns {boolean}
  */
  equals (other) {
    _assertClass(other, KeyFrag);
    var ret = wasm.keyfrag_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
}
/**
*/
class MessageKit {

  static __wrap (ptr) {
    const obj = Object.create(MessageKit.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_messagekit_free(ptr);
  }
  /**
  * @param {PublicKey} policy_encrypting_key
  * @param {Uint8Array} plaintext
  */
  constructor(policy_encrypting_key, plaintext) {
    _assertClass(policy_encrypting_key, PublicKey);
    var ptr0 = passArray8ToWasm0(plaintext, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.messagekit_new(policy_encrypting_key.ptr, ptr0, len0);
    return MessageKit.__wrap(ret);
  }
  /**
  * @param {VerifiedCapsuleFrag} cfrag
  * @returns {MessageKitWithFrags}
  */
  withCFrag (cfrag) {
    _assertClass(cfrag, VerifiedCapsuleFrag);
    var ret = wasm.messagekit_withCFrag(this.ptr, cfrag.ptr);
    return MessageKitWithFrags.__wrap(ret);
  }
  /**
  * @param {SecretKey} sk
  * @returns {Uint8Array}
  */
  decrypt (sk) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(sk, SecretKey);
      wasm.messagekit_decrypt(retptr, this.ptr, sk.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      var r3 = getInt32Memory0()[retptr / 4 + 3];
      if (r3) {
        throw takeObject(r2);
      }
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Capsule}
  */
  get capsule () {
    var ret = wasm.messagekit_capsule(this.ptr);
    return Capsule.__wrap(ret);
  }
  /**
  * @param {Uint8Array} data
  * @returns {MessageKit}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.messagekit_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return MessageKit.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.messagekit_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class MessageKitWithFrags {

  static __wrap (ptr) {
    const obj = Object.create(MessageKitWithFrags.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_messagekitwithfrags_free(ptr);
  }
  /**
  * @param {VerifiedCapsuleFrag} cfrag
  * @returns {MessageKitWithFrags}
  */
  withCFrag (cfrag) {
    _assertClass(cfrag, VerifiedCapsuleFrag);
    var ret = wasm.messagekitwithfrags_withCFrag(this.ptr, cfrag.ptr);
    return MessageKitWithFrags.__wrap(ret);
  }
  /**
  * @param {SecretKey} sk
  * @param {PublicKey} policy_encrypting_key
  * @returns {Uint8Array}
  */
  decryptReencrypted (sk, policy_encrypting_key) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(sk, SecretKey);
      _assertClass(policy_encrypting_key, PublicKey);
      wasm.messagekitwithfrags_decryptReencrypted(retptr, this.ptr, sk.ptr, policy_encrypting_key.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      var r3 = getInt32Memory0()[retptr / 4 + 3];
      if (r3) {
        throw takeObject(r2);
      }
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class MetadataRequest {

  static __wrap (ptr) {
    const obj = Object.create(MetadataRequest.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_metadatarequest_free(ptr);
  }
  /**
  * @returns {FleetStateChecksum}
  */
  get fleetStateChecksum () {
    var ret = wasm.metadatarequest_fleetStateChecksum(this.ptr);
    return FleetStateChecksum.__wrap(ret);
  }
  /**
  * @returns {any[]}
  */
  get announceNodes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.metadatarequest_announceNodes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 4);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {MetadataRequest}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.metadatarequest_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return MetadataRequest.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.metadatarequest_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class MetadataRequestBuilder {

  static __wrap (ptr) {
    const obj = Object.create(MetadataRequestBuilder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_metadatarequestbuilder_free(ptr);
  }
  /**
  * @param {FleetStateChecksum} fleet_state_checksum
  */
  constructor(fleet_state_checksum) {
    _assertClass(fleet_state_checksum, FleetStateChecksum);
    var ret = wasm.metadatarequestbuilder_new(fleet_state_checksum.ptr);
    return MetadataRequestBuilder.__wrap(ret);
  }
  /**
  * @param {NodeMetadata} announce_node
  * @returns {MetadataRequestBuilder}
  */
  addAnnounceNode (announce_node) {
    _assertClass(announce_node, NodeMetadata);
    var ret = wasm.metadatarequestbuilder_addAnnounceNode(this.ptr, announce_node.ptr);
    return MetadataRequestBuilder.__wrap(ret);
  }
  /**
  * @returns {MetadataRequest}
  */
  build () {
    var ret = wasm.metadatarequestbuilder_build(this.ptr);
    return MetadataRequest.__wrap(ret);
  }
}
/**
*/
class MetadataResponse {

  static __wrap (ptr) {
    const obj = Object.create(MetadataResponse.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_metadataresponse_free(ptr);
  }
  /**
  * @param {Signer} signer
  * @param {MetadataResponsePayload} response
  */
  constructor(signer, response) {
    _assertClass(signer, Signer);
    _assertClass(response, MetadataResponsePayload);
    var ret = wasm.metadataresponse_new(signer.ptr, response.ptr);
    return MetadataResponse.__wrap(ret);
  }
  /**
  * @param {PublicKey} verifying_pk
  * @returns {MetadataResponsePayload}
  */
  verify (verifying_pk) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(verifying_pk, PublicKey);
      wasm.metadataresponse_verify(retptr, this.ptr, verifying_pk.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return MetadataResponsePayload.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {MetadataResponse}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.metadataresponse_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return MetadataResponse.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.metadataresponse_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class MetadataResponsePayload {

  static __wrap (ptr) {
    const obj = Object.create(MetadataResponsePayload.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_metadataresponsepayload_free(ptr);
  }
  /**
  * @returns {number}
  */
  get timestamp_epoch () {
    var ret = wasm.metadataresponsepayload_timestamp_epoch(this.ptr);
    return ret >>> 0;
  }
  /**
  * @returns {any[]}
  */
  get announceNodes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.metadataresponsepayload_announceNodes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 4);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class MetadataResponsePayloadBuilder {

  static __wrap (ptr) {
    const obj = Object.create(MetadataResponsePayloadBuilder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_metadataresponsepayloadbuilder_free(ptr);
  }
  /**
  * @param {number} timestamp_epoch
  */
  constructor(timestamp_epoch) {
    var ret = wasm.metadataresponsepayloadbuilder_new(timestamp_epoch);
    return MetadataResponsePayloadBuilder.__wrap(ret);
  }
  /**
  * @param {NodeMetadata} announce_node
  * @returns {MetadataResponsePayloadBuilder}
  */
  addAnnounceNode (announce_node) {
    _assertClass(announce_node, NodeMetadata);
    var ret = wasm.metadataresponsepayloadbuilder_addAnnounceNode(this.ptr, announce_node.ptr);
    return MetadataResponsePayloadBuilder.__wrap(ret);
  }
  /**
  * @returns {MetadataResponsePayload}
  */
  build () {
    var ret = wasm.metadataresponsepayloadbuilder_build(this.ptr);
    return MetadataResponsePayload.__wrap(ret);
  }
}
/**
*/
class NodeMetadata {

  static __wrap (ptr) {
    const obj = Object.create(NodeMetadata.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_nodemetadata_free(ptr);
  }
  /**
  * @param {Signer} signer
  * @param {NodeMetadataPayload} payload
  */
  constructor(signer, payload) {
    _assertClass(signer, Signer);
    _assertClass(payload, NodeMetadataPayload);
    var ret = wasm.nodemetadata_new(signer.ptr, payload.ptr);
    return NodeMetadata.__wrap(ret);
  }
  /**
  * @returns {boolean}
  */
  verify () {
    var ret = wasm.nodemetadata_verify(this.ptr);
    return ret !== 0;
  }
  /**
  * @returns {NodeMetadataPayload}
  */
  get payload () {
    var ret = wasm.nodemetadata_payload(this.ptr);
    return NodeMetadataPayload.__wrap(ret);
  }
  /**
  * @param {Uint8Array} data
  * @returns {NodeMetadata}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.nodemetadata_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return NodeMetadata.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.nodemetadata_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class NodeMetadataPayload {

  static __wrap (ptr) {
    const obj = Object.create(NodeMetadataPayload.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_nodemetadatapayload_free(ptr);
  }
  /**
  * @param {Uint8Array} staking_provider_address
  * @param {string} domain
  * @param {number} timestamp_epoch
  * @param {PublicKey} verifying_key
  * @param {PublicKey} encrypting_key
  * @param {Uint8Array} certificate_der
  * @param {string} host
  * @param {number} port
  * @param {Uint8Array | undefined} operator_signature
  */
  constructor(staking_provider_address, domain, timestamp_epoch, verifying_key, encrypting_key, certificate_der, host, port, operator_signature) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(staking_provider_address, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      var ptr1 = passStringToWasm0(domain, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      var len1 = WASM_VECTOR_LEN;
      _assertClass(verifying_key, PublicKey);
      _assertClass(encrypting_key, PublicKey);
      var ptr2 = passArray8ToWasm0(certificate_der, wasm.__wbindgen_malloc);
      var len2 = WASM_VECTOR_LEN;
      var ptr3 = passStringToWasm0(host, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      var len3 = WASM_VECTOR_LEN;
      var ptr4 = isLikeNone(operator_signature) ? 0 : passArray8ToWasm0(operator_signature, wasm.__wbindgen_malloc);
      var len4 = WASM_VECTOR_LEN;
      wasm.nodemetadatapayload_new(retptr, ptr0, len0, ptr1, len1, timestamp_epoch, verifying_key.ptr, encrypting_key.ptr, ptr2, len2, ptr3, len3, port, ptr4, len4);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return NodeMetadataPayload.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  get staking_provider_address () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.nodemetadatapayload_staking_provider_address(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {PublicKey}
  */
  get verifyingKey () {
    var ret = wasm.nodemetadatapayload_verifyingKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @returns {PublicKey}
  */
  get encryptingKey () {
    var ret = wasm.nodemetadatapayload_encryptingKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @returns {Uint8Array | undefined}
  */
  get operator_signature () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.nodemetadatapayload_operator_signature(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      let v0;
      if (r0 !== 0) {
        v0 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1);
      }
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  get domain () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.nodemetadatapayload_domain(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @returns {string}
  */
  get host () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.nodemetadatapayload_host(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @returns {number}
  */
  get port () {
    var ret = wasm.nodemetadatapayload_port(this.ptr);
    return ret;
  }
  /**
  * @returns {number}
  */
  get timestampEpoch () {
    var ret = wasm.nodemetadatapayload_timestampEpoch(this.ptr);
    return ret >>> 0;
  }
  /**
  * @returns {Uint8Array}
  */
  get certificate_der () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.nodemetadatapayload_certificate_der(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  deriveOperatorAddress () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.nodemetadatapayload_deriveOperatorAddress(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      var r3 = getInt32Memory0()[retptr / 4 + 3];
      if (r3) {
        throw takeObject(r2);
      }
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class PublicKey {

  static __wrap (ptr) {
    const obj = Object.create(PublicKey.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_publickey_free(ptr);
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.publickey_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {PublicKey}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.publickey_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return PublicKey.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.publickey_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @param {PublicKey} other
  * @returns {boolean}
  */
  equals (other) {
    _assertClass(other, PublicKey);
    var ret = wasm.publickey_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
}
/**
*/
class ReencryptionRequest {

  static __wrap (ptr) {
    const obj = Object.create(ReencryptionRequest.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_reencryptionrequest_free(ptr);
  }
  /**
  * @returns {HRAC}
  */
  get hrac () {
    var ret = wasm.reencryptionrequest_hrac(this.ptr);
    return HRAC.__wrap(ret);
  }
  /**
  * @returns {PublicKey}
  */
  get publisherVerifyingKey () {
    var ret = wasm.reencryptionrequest_publisherVerifyingKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @returns {PublicKey}
  */
  get bobVerifyingKey () {
    var ret = wasm.reencryptionrequest_bobVerifyingKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @returns {EncryptedKeyFrag}
  */
  get encryptedKfrag () {
    var ret = wasm.reencryptionrequest_encryptedKfrag(this.ptr);
    return EncryptedKeyFrag.__wrap(ret);
  }
  /**
  * @returns {any[]}
  */
  get capsules () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.reencryptionrequest_capsules(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 4);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {ReencryptionRequest}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.reencryptionrequest_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return ReencryptionRequest.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.reencryptionrequest_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class ReencryptionRequestBuilder {

  static __wrap (ptr) {
    const obj = Object.create(ReencryptionRequestBuilder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_reencryptionrequestbuilder_free(ptr);
  }
  /**
  * @param {HRAC} hrac
  * @param {EncryptedKeyFrag} encrypted_kfrag
  * @param {PublicKey} publisher_verifying_key
  * @param {PublicKey} bob_verifying_key
  */
  constructor(hrac, encrypted_kfrag, publisher_verifying_key, bob_verifying_key) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(hrac, HRAC);
      _assertClass(encrypted_kfrag, EncryptedKeyFrag);
      _assertClass(publisher_verifying_key, PublicKey);
      _assertClass(bob_verifying_key, PublicKey);
      wasm.reencryptionrequestbuilder_new(retptr, hrac.ptr, encrypted_kfrag.ptr, publisher_verifying_key.ptr, bob_verifying_key.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return ReencryptionRequestBuilder.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Capsule} capsule
  * @returns {ReencryptionRequestBuilder}
  */
  addCapsule (capsule) {
    _assertClass(capsule, Capsule);
    var ret = wasm.reencryptionrequestbuilder_addCapsule(this.ptr, capsule.ptr);
    return ReencryptionRequestBuilder.__wrap(ret);
  }
  /**
  * @returns {ReencryptionRequest}
  */
  build () {
    var ret = wasm.reencryptionrequestbuilder_build(this.ptr);
    return ReencryptionRequest.__wrap(ret);
  }
}
/**
*/
class ReencryptionResponse {

  static __wrap (ptr) {
    const obj = Object.create(ReencryptionResponse.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_reencryptionresponse_free(ptr);
  }
  /**
  * @param {Capsule} capsule
  * @returns {ReencryptionResponseWithCapsules}
  */
  withCapsule (capsule) {
    _assertClass(capsule, Capsule);
    var ret = wasm.reencryptionresponse_withCapsule(this.ptr, capsule.ptr);
    return ReencryptionResponseWithCapsules.__wrap(ret);
  }
  /**
  * @param {Uint8Array} data
  * @returns {ReencryptionResponse}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.reencryptionresponse_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return ReencryptionResponse.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.reencryptionresponse_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class ReencryptionResponseBuilder {

  static __wrap (ptr) {
    const obj = Object.create(ReencryptionResponseBuilder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_reencryptionresponsebuilder_free(ptr);
  }
  /**
  * @param {Signer} signer
  */
  constructor(signer) {
    _assertClass(signer, Signer);
    var ret = wasm.reencryptionresponsebuilder_new(signer.ptr);
    return ReencryptionResponseBuilder.__wrap(ret);
  }
  /**
  * @param {Capsule} capsule
  * @returns {ReencryptionResponseBuilder}
  */
  addCapsule (capsule) {
    _assertClass(capsule, Capsule);
    var ret = wasm.reencryptionresponsebuilder_addCapsule(this.ptr, capsule.ptr);
    return ReencryptionResponseBuilder.__wrap(ret);
  }
  /**
  * @param {VerifiedCapsuleFrag} cfrag
  * @returns {ReencryptionResponseBuilder}
  */
  addCfrag (cfrag) {
    _assertClass(cfrag, VerifiedCapsuleFrag);
    var ret = wasm.reencryptionresponsebuilder_addCfrag(this.ptr, cfrag.ptr);
    return ReencryptionResponseBuilder.__wrap(ret);
  }
  /**
  * @returns {ReencryptionResponse}
  */
  build () {
    var ret = wasm.reencryptionresponsebuilder_build(this.ptr);
    return ReencryptionResponse.__wrap(ret);
  }
}
/**
*/
class ReencryptionResponseWithCapsules {

  static __wrap (ptr) {
    const obj = Object.create(ReencryptionResponseWithCapsules.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_reencryptionresponsewithcapsules_free(ptr);
  }
  /**
  * @param {Capsule} capsule
  * @returns {ReencryptionResponseWithCapsules}
  */
  withCapsule (capsule) {
    _assertClass(capsule, Capsule);
    var ret = wasm.reencryptionresponsewithcapsules_withCapsule(this.ptr, capsule.ptr);
    return ReencryptionResponseWithCapsules.__wrap(ret);
  }
  /**
  * @param {PublicKey} alice_verifying_key
  * @param {PublicKey} ursula_verifying_key
  * @param {PublicKey} policy_encrypting_key
  * @param {PublicKey} bob_encrypting_key
  * @returns {any[]}
  */
  verify (alice_verifying_key, ursula_verifying_key, policy_encrypting_key, bob_encrypting_key) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(alice_verifying_key, PublicKey);
      _assertClass(ursula_verifying_key, PublicKey);
      _assertClass(policy_encrypting_key, PublicKey);
      _assertClass(bob_encrypting_key, PublicKey);
      wasm.reencryptionresponsewithcapsules_verify(retptr, this.ptr, alice_verifying_key.ptr, ursula_verifying_key.ptr, policy_encrypting_key.ptr, bob_encrypting_key.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      var r3 = getInt32Memory0()[retptr / 4 + 3];
      if (r3) {
        throw takeObject(r2);
      }
      var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 4);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class RetrievalKit {

  static __wrap (ptr) {
    const obj = Object.create(RetrievalKit.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_retrievalkit_free(ptr);
  }
  /**
  * @param {MessageKit} message_kit
  * @returns {RetrievalKit}
  */
  static fromMessageKit (message_kit) {
    _assertClass(message_kit, MessageKit);
    var ret = wasm.retrievalkit_fromMessageKit(message_kit.ptr);
    return RetrievalKit.__wrap(ret);
  }
  /**
  * @returns {Capsule}
  */
  get capsule () {
    var ret = wasm.messagekit_capsule(this.ptr);
    return Capsule.__wrap(ret);
  }
  /**
  * @returns {any[]}
  */
  get queriedAddresses () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.retrievalkit_queriedAddresses(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      var r3 = getInt32Memory0()[retptr / 4 + 3];
      if (r3) {
        throw takeObject(r2);
      }
      var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 4);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {RetrievalKit}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.retrievalkit_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return RetrievalKit.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.retrievalkit_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class RetrievalKitBuilder {

  static __wrap (ptr) {
    const obj = Object.create(RetrievalKitBuilder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_retrievalkitbuilder_free(ptr);
  }
  /**
  * @param {Capsule} capsule
  */
  constructor(capsule) {
    _assertClass(capsule, Capsule);
    var ret = wasm.retrievalkitbuilder_new(capsule.ptr);
    return RetrievalKitBuilder.__wrap(ret);
  }
  /**
  * @param {Uint8Array} address
  * @returns {RetrievalKitBuilder}
  */
  addQueriedAddress (address) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(address, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.retrievalkitbuilder_addQueriedAddress(retptr, this.ptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return RetrievalKitBuilder.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {RetrievalKit}
  */
  build () {
    var ret = wasm.retrievalkitbuilder_build(this.ptr);
    return RetrievalKit.__wrap(ret);
  }
}
/**
*/
class RevocationOrder {

  static __wrap (ptr) {
    const obj = Object.create(RevocationOrder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_revocationorder_free(ptr);
  }
  /**
  * @param {Signer} signer
  * @param {Uint8Array} staking_provider_address
  * @param {EncryptedKeyFrag} encrypted_kfrag
  */
  constructor(signer, staking_provider_address, encrypted_kfrag) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(signer, Signer);
      var ptr0 = passArray8ToWasm0(staking_provider_address, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      _assertClass(encrypted_kfrag, EncryptedKeyFrag);
      wasm.revocationorder_new(retptr, signer.ptr, ptr0, len0, encrypted_kfrag.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return RevocationOrder.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {PublicKey} alice_verifying_key
  * @returns {VerifiedRevocationOrder}
  */
  verify (alice_verifying_key) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(alice_verifying_key, PublicKey);
      wasm.revocationorder_verify(retptr, this.ptr, alice_verifying_key.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedRevocationOrder.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {RevocationOrder}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.revocationorder_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return RevocationOrder.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.revocationorder_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class SecretKey {

  static __wrap (ptr) {
    const obj = Object.create(SecretKey.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_secretkey_free(ptr);
  }
  /**
  * Generates a secret key using the default RNG and returns it.
  * @returns {SecretKey}
  */
  static random () {
    var ret = wasm.secretkey_random();
    return SecretKey.__wrap(ret);
  }
  /**
  * Generates a secret key using the default RNG and returns it.
  * @returns {PublicKey}
  */
  publicKey () {
    var ret = wasm.secretkey_publicKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @returns {Uint8Array}
  */
  toSecretBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.secretkey_toSecretBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {SecretKey}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.secretkey_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return SecretKey.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.secretkey_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
}
/**
*/
class SecretKeyFactory {

  static __wrap (ptr) {
    const obj = Object.create(SecretKeyFactory.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_secretkeyfactory_free(ptr);
  }
  /**
  * Generates a secret key factory using the default RNG and returns it.
  * @returns {SecretKeyFactory}
  */
  static random () {
    var ret = wasm.secretkeyfactory_random();
    return SecretKeyFactory.__wrap(ret);
  }
  /**
  * @returns {number}
  */
  static seedSize () {
    var ret = wasm.secretkeyfactory_seedSize();
    return ret >>> 0;
  }
  /**
  * @param {Uint8Array} seed
  * @returns {SecretKeyFactory}
  */
  static fromSecureRandomness (seed) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.secretkeyfactory_fromSecureRandomness(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return SecretKeyFactory.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} label
  * @returns {SecretKey}
  */
  makeKey (label) {
    var ptr0 = passArray8ToWasm0(label, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.secretkeyfactory_makeKey(this.ptr, ptr0, len0);
    return SecretKey.__wrap(ret);
  }
  /**
  * @param {Uint8Array} label
  * @returns {SecretKeyFactory}
  */
  makeFactory (label) {
    var ptr0 = passArray8ToWasm0(label, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.secretkeyfactory_makeFactory(this.ptr, ptr0, len0);
    return SecretKeyFactory.__wrap(ret);
  }
  /**
  * @returns {Uint8Array}
  */
  toSecretBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.secretkeyfactory_toSecretBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {SecretKeyFactory}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.secretkeyfactory_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return SecretKeyFactory.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.secretkeyfactory_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
}
/**
*/
class Signature {

  static __wrap (ptr) {
    const obj = Object.create(Signature.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_signature_free(ptr);
  }
  /**
  * @param {PublicKey} verifying_pk
  * @param {Uint8Array} message
  * @returns {boolean}
  */
  verify (verifying_pk, message) {
    _assertClass(verifying_pk, PublicKey);
    var ptr0 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.signature_verify(this.ptr, verifying_pk.ptr, ptr0, len0);
    return ret !== 0;
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.signature_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} data
  * @returns {Signature}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.signature_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Signature.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.signature_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @param {Signature} other
  * @returns {boolean}
  */
  equals (other) {
    _assertClass(other, Signature);
    var ret = wasm.signature_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
}
/**
*/
class Signer {

  static __wrap (ptr) {
    const obj = Object.create(Signer.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_signer_free(ptr);
  }
  /**
  * @param {SecretKey} secret_key
  */
  constructor(secret_key) {
    _assertClass(secret_key, SecretKey);
    var ret = wasm.signer_new(secret_key.ptr);
    return Signer.__wrap(ret);
  }
  /**
  * @param {Uint8Array} message
  * @returns {Signature}
  */
  sign (message) {
    var ptr0 = passArray8ToWasm0(message, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.signer_sign(this.ptr, ptr0, len0);
    return Signature.__wrap(ret);
  }
  /**
  * @returns {PublicKey}
  */
  verifyingKey () {
    var ret = wasm.signer_verifyingKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.signer_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
}
/**
*/
class TreasureMap {

  static __wrap (ptr) {
    const obj = Object.create(TreasureMap.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_treasuremap_free(ptr);
  }
  /**
  * @param {Signer} signer
  * @param {PublicKey} recipient_key
  * @returns {EncryptedTreasureMap}
  */
  encrypt (signer, recipient_key) {
    _assertClass(signer, Signer);
    _assertClass(recipient_key, PublicKey);
    var ret = wasm.treasuremap_encrypt(this.ptr, signer.ptr, recipient_key.ptr);
    return EncryptedTreasureMap.__wrap(ret);
  }
  /**
  * @returns {any}
  */
  get destinations () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.treasuremap_destinations(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Signer} signer
  * @returns {any[]}
  */
  makeRevocationOrders (signer) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(signer, Signer);
      wasm.treasuremap_makeRevocationOrders(retptr, this.ptr, signer.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayJsValueFromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 4);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {HRAC}
  */
  get hrac () {
    var ret = wasm.treasuremap_hrac(this.ptr);
    return HRAC.__wrap(ret);
  }
  /**
  * @returns {number}
  */
  get threshold () {
    var ret = wasm.treasuremap_threshold(this.ptr);
    return ret;
  }
  /**
  * @returns {PublicKey}
  */
  get policyEncryptingKey () {
    var ret = wasm.treasuremap_policyEncryptingKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @returns {PublicKey}
  */
  get publisherVerifyingKey () {
    var ret = wasm.treasuremap_publisherVerifyingKey(this.ptr);
    return PublicKey.__wrap(ret);
  }
  /**
  * @param {Uint8Array} data
  * @returns {TreasureMap}
  */
  static fromBytes (data) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.treasuremap_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return TreasureMap.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.treasuremap_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
*/
class TreasureMapBuilder {

  static __wrap (ptr) {
    const obj = Object.create(TreasureMapBuilder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_treasuremapbuilder_free(ptr);
  }
  /**
  * @param {Signer} signer
  * @param {HRAC} hrac
  * @param {PublicKey} policy_encrypting_key
  * @param {number} threshold
  */
  constructor(signer, hrac, policy_encrypting_key, threshold) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(signer, Signer);
      _assertClass(hrac, HRAC);
      _assertClass(policy_encrypting_key, PublicKey);
      wasm.treasuremapbuilder_new(retptr, signer.ptr, hrac.ptr, policy_encrypting_key.ptr, threshold);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return TreasureMapBuilder.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @param {Uint8Array} address
  * @param {PublicKey} public_key
  * @param {VerifiedKeyFrag} vkfrag
  * @returns {TreasureMapBuilder}
  */
  addKfrag (address, public_key, vkfrag) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(address, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      _assertClass(public_key, PublicKey);
      _assertClass(vkfrag, VerifiedKeyFrag);
      wasm.treasuremapbuilder_addKfrag(retptr, this.ptr, ptr0, len0, public_key.ptr, vkfrag.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return TreasureMapBuilder.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {TreasureMap}
  */
  build () {
    var ret = wasm.treasuremapbuilder_build(this.ptr);
    return TreasureMap.__wrap(ret);
  }
}
/**
*/
class VerifiedCapsuleFrag {

  static __wrap (ptr) {
    const obj = Object.create(VerifiedCapsuleFrag.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_verifiedcapsulefrag_free(ptr);
  }
  /**
  * @param {Uint8Array} bytes
  * @returns {VerifiedCapsuleFrag}
  */
  static fromVerifiedBytes (bytes) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.verifiedcapsulefrag_fromVerifiedBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedCapsuleFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.verifiedcapsulefrag_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.verifiedcapsulefrag_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @param {VerifiedCapsuleFrag} other
  * @returns {boolean}
  */
  equals (other) {
    _assertClass(other, VerifiedCapsuleFrag);
    var ret = wasm.verifiedcapsulefrag_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
}
/**
*/
class VerifiedKeyFrag {

  static __wrap (ptr) {
    const obj = Object.create(VerifiedKeyFrag.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_verifiedkeyfrag_free(ptr);
  }
  /**
  * @param {Uint8Array} bytes
  * @returns {VerifiedKeyFrag}
  */
  static fromVerifiedBytes (bytes) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      var ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
      var len0 = WASM_VECTOR_LEN;
      wasm.verifiedkeyfrag_fromVerifiedBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return VerifiedKeyFrag.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {Uint8Array}
  */
  toBytes () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.verifiedkeyfrag_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {string}
  */
  toString () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.verifiedkeyfrag_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
  * @param {VerifiedKeyFrag} other
  * @returns {boolean}
  */
  equals (other) {
    _assertClass(other, VerifiedKeyFrag);
    var ret = wasm.verifiedkeyfrag_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
}
/**
*/
class VerifiedRevocationOrder {

  static __wrap (ptr) {
    const obj = Object.create(VerifiedRevocationOrder.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw () {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free () {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_verifiedrevocationorder_free(ptr);
  }
  /**
  * @returns {Uint8Array}
  */
  get address () {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.verifiedrevocationorder_address(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
  * @returns {EncryptedKeyFrag}
  */
  get encryptedKFrag () {
    var ret = wasm.reencryptionrequest_encryptedKfrag(this.ptr);
    return EncryptedKeyFrag.__wrap(ret);
  }
}

const __wbindgen_object_drop_ref = function(arg0) {
  takeObject(arg0);
};

const __wbindgen_json_parse = function(arg0, arg1) {
  var ret = JSON.parse(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
};

const __wbg_nodemetadata_new = function(arg0) {
  var ret = NodeMetadata.__wrap(arg0);
  return addHeapObject(ret);
};

const __wbindgen_object_clone_ref = function(arg0) {
  var ret = getObject(arg0);
  return addHeapObject(ret);
};

const __wbindgen_string_new = function(arg0, arg1) {
  var ret = getStringFromWasm0(arg0, arg1);
  return addHeapObject(ret);
};

const __wbg_set_f1a4ac8f3a605b11 = function(arg0, arg1, arg2) {
  getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

const __wbg_capsule_new = function(arg0) {
  var ret = Capsule.__wrap(arg0);
  return addHeapObject(ret);
};

const __wbg_verifiedkeyfrag_new = function(arg0) {
  var ret = VerifiedKeyFrag.__wrap(arg0);
  return addHeapObject(ret);
};

const __wbg_getRandomValues_3e46aa268da0fed1 = function() {
  return handleError(function(arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
  }, arguments)
};

const __wbg_randomFillSync_59fcc2add91fe7b3 = function() {
  return handleError(function(arg0, arg1, arg2) {
    getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
  }, arguments)
};

const __wbg_process_f2b73829dbd321da = function(arg0) {
  var ret = getObject(arg0).process;
  return addHeapObject(ret);
};

const __wbindgen_is_object = function(arg0) {
  const val = getObject(arg0);
  var ret = typeof (val) === 'object' && val !== null;
  return ret;
};

const __wbg_versions_cd82f79c98672a9f = function(arg0) {
  var ret = getObject(arg0).versions;
  return addHeapObject(ret);
};

const __wbg_node_ee3f6da4130bd35f = function(arg0) {
  var ret = getObject(arg0).node;
  return addHeapObject(ret);
};

const __wbindgen_is_string = function(arg0) {
  var ret = typeof (getObject(arg0)) === 'string';
  return ret;
};

const __wbg_modulerequire_0a83c0c31d12d2c7 = function() {
  return handleError(function(arg0, arg1) {
    var ret = module.require(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
  }, arguments)
};

const __wbg_crypto_9e3521ed42436d35 = function(arg0) {
  var ret = getObject(arg0).crypto;
  return addHeapObject(ret);
};

const __wbg_msCrypto_c429c3f8f7a70bb5 = function(arg0) {
  var ret = getObject(arg0).msCrypto;
  return addHeapObject(ret);
};

const __wbg_new_16f24b0728c5e67b = function() {
  var ret = new Array();
  return addHeapObject(ret);
};

const __wbg_newnoargs_f579424187aa1717 = function(arg0, arg1) {
  var ret = new Function(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
};

const __wbg_call_89558c3e96703ca1 = function() {
  return handleError(function(arg0, arg1) {
    var ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
  }, arguments)
};

const __wbg_new_d3138911a89329b0 = function() {
  var ret = new Object();
  return addHeapObject(ret);
};

const __wbg_push_a72df856079e6930 = function(arg0, arg1) {
  var ret = getObject(arg0).push(getObject(arg1));
  return ret;
};

const __wbg_new_55259b13834a484c = function(arg0, arg1) {
  var ret = new Error(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
};

const __wbg_self_e23d74ae45fb17d1 = function() {
  return handleError(function() {
    var ret = window.window;
    return addHeapObject(ret);
  }, arguments)
};

const __wbg_window_b4be7f48b24ac56e = function() {
  return handleError(function() {
    var ret = window.window;
    return addHeapObject(ret);
  }, arguments)
};

const __wbg_globalThis_d61b1f48a57191ae = function() {
  return handleError(function() {
    var ret = window.window;
    return addHeapObject(ret);
  }, arguments)
};

const __wbg_global_e7669da72fd7f239 = function() {
  return handleError(function() {
    var ret = global.global;
    return addHeapObject(ret);
  }, arguments)
};

const __wbindgen_is_undefined = function(arg0) {
  var ret = getObject(arg0) === undefined;
  return ret;
};

const __wbg_buffer_5e74a88a1424a2e0 = function(arg0) {
  var ret = getObject(arg0).buffer;
  return addHeapObject(ret);
};

const __wbg_newwithbyteoffsetandlength_278ec7532799393a = function(arg0, arg1, arg2) {
  var ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
};

const __wbg_new_e3b800e570795b3c = function(arg0) {
  var ret = new Uint8Array(getObject(arg0));
  return addHeapObject(ret);
};

const __wbg_set_5b8081e9d002f0df = function(arg0, arg1, arg2) {
  getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

const __wbg_length_30803400a8f15c59 = function(arg0) {
  var ret = getObject(arg0).length;
  return ret;
};

const __wbg_newwithlength_5f4ce114a24dfe1e = function(arg0) {
  var ret = new Uint8Array(arg0 >>> 0);
  return addHeapObject(ret);
};

const __wbg_subarray_a68f835ca2af506f = function(arg0, arg1, arg2) {
  var ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
};

const __wbindgen_throw = function(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
};

const __wbindgen_memory = function() {
  var ret = wasm.memory;
  return addHeapObject(ret);
};

exportsObj.encrypt = encrypt
exportsObj.decryptOriginal = decryptOriginal
exportsObj.generateKFrags = generateKFrags
exportsObj.reencrypt = reencrypt
exportsObj.Capsule = Capsule;
exportsObj.CapsuleFrag = CapsuleFrag;
exportsObj.CapsuleWithFrags = CapsuleWithFrags;
exportsObj.EncryptedKeyFrag = EncryptedKeyFrag;
exportsObj.EncryptedTreasureMap = EncryptedTreasureMap;
exportsObj.EncryptionResult = EncryptionResult;
exportsObj.FleetStateChecksum = FleetStateChecksum;
exportsObj.FleetStateChecksumBuilder = FleetStateChecksumBuilder;
exportsObj.HRAC = HRAC;
exportsObj.KeyFrag = KeyFrag;
exportsObj.MessageKit = MessageKit;
exportsObj.MessageKitWithFrags = MessageKitWithFrags;
exportsObj.MetadataRequest = MetadataRequest;
exportsObj.MetadataRequestBuilder = MetadataRequestBuilder;
exportsObj.MetadataResponse = MetadataResponse;
exportsObj.MetadataResponsePayload = MetadataResponsePayload;
exportsObj.MetadataResponsePayloadBuilder = MetadataResponsePayloadBuilder;
exportsObj.NodeMetadata = NodeMetadata;
exportsObj.NodeMetadataPayload = NodeMetadataPayload;
exportsObj.PublicKey = PublicKey;
exportsObj.ReencryptionRequest = ReencryptionRequest;
exportsObj.ReencryptionRequestBuilder = ReencryptionRequestBuilder;
exportsObj.ReencryptionResponse = ReencryptionResponse;
exportsObj.ReencryptionResponseBuilder = ReencryptionResponseBuilder;
exportsObj.ReencryptionResponseWithCapsules = ReencryptionResponseWithCapsules;
exportsObj.RetrievalKit = RetrievalKit;
exportsObj.RetrievalKitBuilder = RetrievalKitBuilder;
exportsObj.RevocationOrder = RevocationOrder;
exportsObj.SecretKey = SecretKey;
exportsObj.SecretKeyFactory = SecretKeyFactory;
exportsObj.Signature = Signature;
exportsObj.Signer = Signer;
exportsObj.TreasureMap = TreasureMap;
exportsObj.TreasureMapBuilder = TreasureMapBuilder;
exportsObj.VerifiedCapsuleFrag = VerifiedCapsuleFrag;
exportsObj.VerifiedKeyFrag = VerifiedKeyFrag;
exportsObj.VerifiedRevocationOrder = VerifiedRevocationOrder;
exportsObj.__wbindgen_object_drop_ref = __wbindgen_object_drop_ref
exportsObj.__wbindgen_json_parse = __wbindgen_json_parse
exportsObj.__wbg_nodemetadata_new = __wbg_nodemetadata_new
exportsObj.__wbindgen_object_clone_ref = __wbindgen_object_clone_ref
exportsObj.__wbindgen_string_new = __wbindgen_string_new
exportsObj.__wbg_set_f1a4ac8f3a605b11 = __wbg_set_f1a4ac8f3a605b11
exportsObj.__wbg_capsule_new = __wbg_capsule_new
exportsObj.__wbg_verifiedkeyfrag_new = __wbg_verifiedkeyfrag_new
exportsObj.__wbg_getRandomValues_3e46aa268da0fed1 = __wbg_getRandomValues_3e46aa268da0fed1
exportsObj.__wbg_randomFillSync_59fcc2add91fe7b3 = __wbg_randomFillSync_59fcc2add91fe7b3
exportsObj.__wbg_process_f2b73829dbd321da = __wbg_process_f2b73829dbd321da
exportsObj.__wbindgen_is_object = __wbindgen_is_object
exportsObj.__wbg_versions_cd82f79c98672a9f = __wbg_versions_cd82f79c98672a9f
exportsObj.__wbg_node_ee3f6da4130bd35f = __wbg_node_ee3f6da4130bd35f
exportsObj.__wbindgen_is_string = __wbindgen_is_string
exportsObj.__wbg_modulerequire_0a83c0c31d12d2c7 = __wbg_modulerequire_0a83c0c31d12d2c7
exportsObj.__wbg_crypto_9e3521ed42436d35 = __wbg_crypto_9e3521ed42436d35
exportsObj.__wbg_msCrypto_c429c3f8f7a70bb5 = __wbg_msCrypto_c429c3f8f7a70bb5
exportsObj.__wbg_new_16f24b0728c5e67b = __wbg_new_16f24b0728c5e67b
exportsObj.__wbg_newnoargs_f579424187aa1717 = __wbg_newnoargs_f579424187aa1717
exportsObj.__wbg_call_89558c3e96703ca1 = __wbg_call_89558c3e96703ca1
exportsObj.__wbg_new_d3138911a89329b0 = __wbg_new_d3138911a89329b0
exportsObj.__wbg_push_a72df856079e6930 = __wbg_push_a72df856079e6930
exportsObj.__wbg_new_55259b13834a484c = __wbg_new_55259b13834a484c
exportsObj.__wbg_self_e23d74ae45fb17d1 = __wbg_self_e23d74ae45fb17d1
exportsObj.__wbg_window_b4be7f48b24ac56e = __wbg_window_b4be7f48b24ac56e
exportsObj.__wbg_globalThis_d61b1f48a57191ae = __wbg_globalThis_d61b1f48a57191ae
exportsObj.__wbg_global_e7669da72fd7f239 = __wbg_global_e7669da72fd7f239
exportsObj.__wbindgen_is_undefined = __wbindgen_is_undefined
exportsObj.__wbg_buffer_5e74a88a1424a2e0 = __wbg_buffer_5e74a88a1424a2e0
exportsObj.__wbg_newwithbyteoffsetandlength_278ec7532799393a = __wbg_newwithbyteoffsetandlength_278ec7532799393a
exportsObj.__wbg_new_e3b800e570795b3c = __wbg_new_e3b800e570795b3c
exportsObj.__wbg_set_5b8081e9d002f0df = __wbg_set_5b8081e9d002f0df
exportsObj.__wbg_length_30803400a8f15c59 = __wbg_length_30803400a8f15c59
exportsObj.__wbg_newwithlength_5f4ce114a24dfe1e = __wbg_newwithlength_5f4ce114a24dfe1e
exportsObj.__wbg_subarray_a68f835ca2af506f = __wbg_subarray_a68f835ca2af506f
exportsObj.__wbindgen_throw = __wbindgen_throw
exportsObj.__wbindgen_memory = __wbindgen_memory

export const initWasm = () => {
  const bufferRes = Buffer.from(nucypherCoreWasm.data);
  var uint8Array = new Uint8Array(bufferRes);
  const arraybuffer = uint8Array.buffer;

  const wasmModule = new WebAssembly.Module(arraybuffer);
  const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
  wasm = wasmInstance.exports
  return wasm
};

(async function() {
  await initWasm()
}());

export {
  encrypt,
  decryptOriginal,
  generateKFrags,
  reencrypt,
  Capsule,
  CapsuleFrag,
  CapsuleWithFrags,
  EncryptedKeyFrag,
  EncryptedTreasureMap,
  EncryptionResult,
  FleetStateChecksum,
  FleetStateChecksumBuilder,
  HRAC,
  KeyFrag,
  MessageKit,
  MessageKitWithFrags,
  MetadataRequest,
  MetadataRequestBuilder,
  MetadataResponse,
  MetadataResponsePayload,
  MetadataResponsePayloadBuilder,
  NodeMetadata,
  NodeMetadataPayload,
  PublicKey,
  ReencryptionRequest,
  ReencryptionRequestBuilder,
  ReencryptionResponse,
  ReencryptionResponseBuilder,
  ReencryptionResponseWithCapsules,
  RetrievalKit,
  RetrievalKitBuilder,
  RevocationOrder,
  SecretKey,
  SecretKeyFactory,
  Signature,
  Signer,
  TreasureMap,
  TreasureMapBuilder,
  VerifiedCapsuleFrag,
  VerifiedKeyFrag,
  VerifiedRevocationOrder,
  __wbindgen_object_drop_ref,
  __wbindgen_json_parse,
  __wbg_nodemetadata_new,
  __wbindgen_object_clone_ref,
  __wbindgen_string_new,
  __wbg_set_f1a4ac8f3a605b11,
  __wbg_capsule_new,
  __wbg_verifiedkeyfrag_new,
  __wbg_getRandomValues_3e46aa268da0fed1,
  __wbg_randomFillSync_59fcc2add91fe7b3,
  __wbg_process_f2b73829dbd321da,
  __wbindgen_is_object,
  __wbg_versions_cd82f79c98672a9f,
  __wbg_node_ee3f6da4130bd35f,
  __wbindgen_is_string,
  __wbg_modulerequire_0a83c0c31d12d2c7,
  __wbg_crypto_9e3521ed42436d35,
  __wbg_msCrypto_c429c3f8f7a70bb5,
  __wbg_new_16f24b0728c5e67b,
  __wbg_newnoargs_f579424187aa1717,
  __wbg_call_89558c3e96703ca1,
  __wbg_new_d3138911a89329b0,
  __wbg_push_a72df856079e6930,
  __wbg_new_55259b13834a484c,
  __wbg_self_e23d74ae45fb17d1,
  __wbg_window_b4be7f48b24ac56e,
  __wbg_globalThis_d61b1f48a57191ae,
  __wbg_global_e7669da72fd7f239,
  __wbindgen_is_undefined,
  __wbg_buffer_5e74a88a1424a2e0,
  __wbg_newwithbyteoffsetandlength_278ec7532799393a,
  __wbg_new_e3b800e570795b3c,
  __wbg_set_5b8081e9d002f0df,
  __wbg_length_30803400a8f15c59,
  __wbg_newwithlength_5f4ce114a24dfe1e,
  __wbg_subarray_a68f835ca2af506f,
  __wbindgen_throw,
  __wbindgen_memory
}