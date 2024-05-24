/* tslint:disable */
/* eslint-disable */
/**
* @param {PublicKey} delegating_pk
* @param {Uint8Array} plaintext
* @returns {EncryptionResult}
*/
export function encrypt(delegating_pk: PublicKey, plaintext: Uint8Array): EncryptionResult;
/**
* @param {SecretKey} delegating_sk
* @param {Capsule} capsule
* @param {Uint8Array} ciphertext
* @returns {Uint8Array}
*/
export function decryptOriginal(delegating_sk: SecretKey, capsule: Capsule, ciphertext: Uint8Array): Uint8Array;
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
export function generateKFrags(delegating_sk: SecretKey, receiving_pk: PublicKey, signer: Signer, threshold: number, shares: number, sign_delegating_key: boolean, sign_receiving_key: boolean): any[];
/**
* @param {Capsule} capsule
* @param {VerifiedKeyFrag} kfrag
* @returns {VerifiedCapsuleFrag}
*/
export function reencrypt(capsule: Capsule, kfrag: VerifiedKeyFrag): VerifiedCapsuleFrag;
/**
*/
export class Capsule {
  free(): void;
/**
* @param {VerifiedCapsuleFrag} cfrag
* @returns {CapsuleWithFrags}
*/
  withCFrag(cfrag: VerifiedCapsuleFrag): CapsuleWithFrags;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {Capsule}
*/
  static fromBytes(data: Uint8Array): Capsule;
/**
* @returns {string}
*/
  toString(): string;
/**
* @param {Capsule} other
* @returns {boolean}
*/
  equals(other: Capsule): boolean;
}
/**
*/
export class CapsuleFrag {
  free(): void;
/**
* @param {Capsule} capsule
* @param {PublicKey} verifying_pk
* @param {PublicKey} delegating_pk
* @param {PublicKey} receiving_pk
* @returns {VerifiedCapsuleFrag}
*/
  verify(capsule: Capsule, verifying_pk: PublicKey, delegating_pk: PublicKey, receiving_pk: PublicKey): VerifiedCapsuleFrag;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {CapsuleFrag}
*/
  static fromBytes(data: Uint8Array): CapsuleFrag;
/**
* @returns {string}
*/
  toString(): string;
/**
* @param {CapsuleFrag} other
* @returns {boolean}
*/
  equals(other: CapsuleFrag): boolean;
}
/**
*/
export class CapsuleWithFrags {
  free(): void;
/**
* @param {VerifiedCapsuleFrag} cfrag
* @returns {CapsuleWithFrags}
*/
  withCFrag(cfrag: VerifiedCapsuleFrag): CapsuleWithFrags;
/**
* @param {SecretKey} receiving_sk
* @param {PublicKey} delegating_pk
* @param {Uint8Array} ciphertext
* @returns {Uint8Array}
*/
  decryptReencrypted(receiving_sk: SecretKey, delegating_pk: PublicKey, ciphertext: Uint8Array): Uint8Array;
}
/**
*/
export class EncryptedKeyFrag {
  free(): void;
/**
* @param {Signer} signer
* @param {PublicKey} recipient_key
* @param {HRAC} hrac
* @param {VerifiedKeyFrag} verified_kfrag
*/
  constructor(signer: Signer, recipient_key: PublicKey, hrac: HRAC, verified_kfrag: VerifiedKeyFrag);
/**
* @param {SecretKey} sk
* @param {HRAC} hrac
* @param {PublicKey} publisher_verifying_key
* @returns {VerifiedKeyFrag}
*/
  decrypt(sk: SecretKey, hrac: HRAC, publisher_verifying_key: PublicKey): VerifiedKeyFrag;
/**
* @param {Uint8Array} data
* @returns {EncryptedKeyFrag}
*/
  static fromBytes(data: Uint8Array): EncryptedKeyFrag;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
*/
export class EncryptedTreasureMap {
  free(): void;
/**
* @param {SecretKey} sk
* @param {PublicKey} publisher_verifying_key
* @returns {TreasureMap}
*/
  decrypt(sk: SecretKey, publisher_verifying_key: PublicKey): TreasureMap;
/**
* @param {Uint8Array} data
* @returns {EncryptedTreasureMap}
*/
  static fromBytes(data: Uint8Array): EncryptedTreasureMap;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
*/
export class EncryptionResult {
  free(): void;
/**
*/
  capsule: Capsule;
/**
* @returns {Uint8Array}
*/
  readonly ciphertext: Uint8Array;
}
/**
*/
export class FleetStateChecksum {
  free(): void;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
*/
export class FleetStateChecksumBuilder {
  free(): void;
/**
* @param {NodeMetadata | undefined} this_node
*/
  constructor(this_node?: NodeMetadata);
/**
* @param {NodeMetadata} other_node
* @returns {FleetStateChecksumBuilder}
*/
  addOtherNode(other_node: NodeMetadata): FleetStateChecksumBuilder;
/**
* @returns {FleetStateChecksum}
*/
  build(): FleetStateChecksum;
}
/**
*/
export class HRAC {
  free(): void;
/**
* @param {PublicKey} publisher_verifying_key
* @param {PublicKey} bob_verifying_key
* @param {Uint8Array} label
*/
  constructor(publisher_verifying_key: PublicKey, bob_verifying_key: PublicKey, label: Uint8Array);
/**
* @param {Uint8Array} bytes
* @returns {HRAC}
*/
  static fromBytes(bytes: Uint8Array): HRAC;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
*/
export class KeyFrag {
  free(): void;
/**
* @param {PublicKey} verifying_pk
* @returns {VerifiedKeyFrag}
*/
  verify(verifying_pk: PublicKey): VerifiedKeyFrag;
/**
* @param {PublicKey} verifying_pk
* @param {PublicKey} delegating_pk
* @returns {VerifiedKeyFrag}
*/
  verifyWithDelegatingKey(verifying_pk: PublicKey, delegating_pk: PublicKey): VerifiedKeyFrag;
/**
* @param {PublicKey} verifying_pk
* @param {PublicKey} receiving_pk
* @returns {VerifiedKeyFrag}
*/
  verifyWithReceivingKey(verifying_pk: PublicKey, receiving_pk: PublicKey): VerifiedKeyFrag;
/**
* @param {PublicKey} verifying_pk
* @param {PublicKey} delegating_pk
* @param {PublicKey} receiving_pk
* @returns {VerifiedKeyFrag}
*/
  verifyWithDelegatingAndReceivingKeys(verifying_pk: PublicKey, delegating_pk: PublicKey, receiving_pk: PublicKey): VerifiedKeyFrag;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {KeyFrag}
*/
  static fromBytes(data: Uint8Array): KeyFrag;
/**
* @returns {string}
*/
  toString(): string;
/**
* @param {KeyFrag} other
* @returns {boolean}
*/
  equals(other: KeyFrag): boolean;
}
/**
*/
export class MessageKit {
  free(): void;
/**
* @param {PublicKey} policy_encrypting_key
* @param {Uint8Array} plaintext
*/
  constructor(policy_encrypting_key: PublicKey, plaintext: Uint8Array);
/**
* @param {VerifiedCapsuleFrag} cfrag
* @returns {MessageKitWithFrags}
*/
  withCFrag(cfrag: VerifiedCapsuleFrag): MessageKitWithFrags;
/**
* @param {SecretKey} sk
* @returns {Uint8Array}
*/
  decrypt(sk: SecretKey): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {MessageKit}
*/
  static fromBytes(data: Uint8Array): MessageKit;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {Capsule}
*/
  readonly capsule: Capsule;
}
/**
*/
export class MessageKitWithFrags {
  free(): void;
/**
* @param {VerifiedCapsuleFrag} cfrag
* @returns {MessageKitWithFrags}
*/
  withCFrag(cfrag: VerifiedCapsuleFrag): MessageKitWithFrags;
/**
* @param {SecretKey} sk
* @param {PublicKey} policy_encrypting_key
* @returns {Uint8Array}
*/
  decryptReencrypted(sk: SecretKey, policy_encrypting_key: PublicKey): Uint8Array;
}
/**
*/
export class MetadataRequest {
  free(): void;
/**
* @param {Uint8Array} data
* @returns {MetadataRequest}
*/
  static fromBytes(data: Uint8Array): MetadataRequest;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {any[]}
*/
  readonly announceNodes: any[];
/**
* @returns {FleetStateChecksum}
*/
  readonly fleetStateChecksum: FleetStateChecksum;
}
/**
*/
export class MetadataRequestBuilder {
  free(): void;
/**
* @param {FleetStateChecksum} fleet_state_checksum
*/
  constructor(fleet_state_checksum: FleetStateChecksum);
/**
* @param {NodeMetadata} announce_node
* @returns {MetadataRequestBuilder}
*/
  addAnnounceNode(announce_node: NodeMetadata): MetadataRequestBuilder;
/**
* @returns {MetadataRequest}
*/
  build(): MetadataRequest;
}
/**
*/
export class MetadataResponse {
  free(): void;
/**
* @param {Signer} signer
* @param {MetadataResponsePayload} response
*/
  constructor(signer: Signer, response: MetadataResponsePayload);
/**
* @param {PublicKey} verifying_pk
* @returns {MetadataResponsePayload}
*/
  verify(verifying_pk: PublicKey): MetadataResponsePayload;
/**
* @param {Uint8Array} data
* @returns {MetadataResponse}
*/
  static fromBytes(data: Uint8Array): MetadataResponse;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
*/
export class MetadataResponsePayload {
  free(): void;
/**
* @returns {any[]}
*/
  readonly announceNodes: any[];
/**
* @returns {number}
*/
  readonly timestamp_epoch: number;
}
/**
*/
export class MetadataResponsePayloadBuilder {
  free(): void;
/**
* @param {number} timestamp_epoch
*/
  constructor(timestamp_epoch: number);
/**
* @param {NodeMetadata} announce_node
* @returns {MetadataResponsePayloadBuilder}
*/
  addAnnounceNode(announce_node: NodeMetadata): MetadataResponsePayloadBuilder;
/**
* @returns {MetadataResponsePayload}
*/
  build(): MetadataResponsePayload;
}
/**
*/
export class NodeMetadata {
  free(): void;
/**
* @param {Signer} signer
* @param {NodeMetadataPayload} payload
*/
  constructor(signer: Signer, payload: NodeMetadataPayload);
/**
* @returns {boolean}
*/
  verify(): boolean;
/**
* @param {Uint8Array} data
* @returns {NodeMetadata}
*/
  static fromBytes(data: Uint8Array): NodeMetadata;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {NodeMetadataPayload}
*/
  readonly payload: NodeMetadataPayload;
}
/**
*/
export class NodeMetadataPayload {
  free(): void;
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
  constructor(staking_provider_address: Uint8Array, domain: string, timestamp_epoch: number, verifying_key: PublicKey, encrypting_key: PublicKey, certificate_der: Uint8Array, host: string, port: number, operator_signature?: Uint8Array);
/**
* @returns {Uint8Array}
*/
  deriveOperatorAddress(): Uint8Array;
/**
* @returns {Uint8Array}
*/
  readonly certificate_der: Uint8Array;
/**
* @returns {string}
*/
  readonly domain: string;
/**
* @returns {PublicKey}
*/
  readonly encryptingKey: PublicKey;
/**
* @returns {string}
*/
  readonly host: string;
/**
* @returns {Uint8Array | undefined}
*/
  readonly operator_signature: Uint8Array | undefined;
/**
* @returns {number}
*/
  readonly port: number;
/**
* @returns {Uint8Array}
*/
  readonly staking_provider_address: Uint8Array;
/**
* @returns {number}
*/
  readonly timestampEpoch: number;
/**
* @returns {PublicKey}
*/
  readonly verifyingKey: PublicKey;
}
/**
*/
export class PublicKey {
  free(): void;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {PublicKey}
*/
  static fromBytes(data: Uint8Array): PublicKey;
/**
* @returns {string}
*/
  toString(): string;
/**
* @param {PublicKey} other
* @returns {boolean}
*/
  equals(other: PublicKey): boolean;
}
/**
*/
export class ReencryptionRequest {
  free(): void;
/**
* @param {Uint8Array} data
* @returns {ReencryptionRequest}
*/
  static fromBytes(data: Uint8Array): ReencryptionRequest;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {PublicKey}
*/
  readonly bobVerifyingKey: PublicKey;
/**
* @returns {any[]}
*/
  readonly capsules: any[];
/**
* @returns {EncryptedKeyFrag}
*/
  readonly encryptedKfrag: EncryptedKeyFrag;
/**
* @returns {HRAC}
*/
  readonly hrac: HRAC;
/**
* @returns {PublicKey}
*/
  readonly publisherVerifyingKey: PublicKey;
}
/**
*/
export class ReencryptionRequestBuilder {
  free(): void;
/**
* @param {HRAC} hrac
* @param {EncryptedKeyFrag} encrypted_kfrag
* @param {PublicKey} publisher_verifying_key
* @param {PublicKey} bob_verifying_key
*/
  constructor(hrac: HRAC, encrypted_kfrag: EncryptedKeyFrag, publisher_verifying_key: PublicKey, bob_verifying_key: PublicKey);
/**
* @param {Capsule} capsule
* @returns {ReencryptionRequestBuilder}
*/
  addCapsule(capsule: Capsule): ReencryptionRequestBuilder;
/**
* @returns {ReencryptionRequest}
*/
  build(): ReencryptionRequest;
}
/**
*/
export class ReencryptionResponse {
  free(): void;
/**
* @param {Capsule} capsule
* @returns {ReencryptionResponseWithCapsules}
*/
  withCapsule(capsule: Capsule): ReencryptionResponseWithCapsules;
/**
* @param {Uint8Array} data
* @returns {ReencryptionResponse}
*/
  static fromBytes(data: Uint8Array): ReencryptionResponse;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
*/
export class ReencryptionResponseBuilder {
  free(): void;
/**
* @param {Signer} signer
*/
  constructor(signer: Signer);
/**
* @param {Capsule} capsule
* @returns {ReencryptionResponseBuilder}
*/
  addCapsule(capsule: Capsule): ReencryptionResponseBuilder;
/**
* @param {VerifiedCapsuleFrag} cfrag
* @returns {ReencryptionResponseBuilder}
*/
  addCfrag(cfrag: VerifiedCapsuleFrag): ReencryptionResponseBuilder;
/**
* @returns {ReencryptionResponse}
*/
  build(): ReencryptionResponse;
}
/**
*/
export class ReencryptionResponseWithCapsules {
  free(): void;
/**
* @param {Capsule} capsule
* @returns {ReencryptionResponseWithCapsules}
*/
  withCapsule(capsule: Capsule): ReencryptionResponseWithCapsules;
/**
* @param {PublicKey} alice_verifying_key
* @param {PublicKey} ursula_verifying_key
* @param {PublicKey} policy_encrypting_key
* @param {PublicKey} bob_encrypting_key
* @returns {any[]}
*/
  verify(alice_verifying_key: PublicKey, ursula_verifying_key: PublicKey, policy_encrypting_key: PublicKey, bob_encrypting_key: PublicKey): any[];
}
/**
*/
export class RetrievalKit {
  free(): void;
/**
* @param {MessageKit} message_kit
* @returns {RetrievalKit}
*/
  static fromMessageKit(message_kit: MessageKit): RetrievalKit;
/**
* @param {Uint8Array} data
* @returns {RetrievalKit}
*/
  static fromBytes(data: Uint8Array): RetrievalKit;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {Capsule}
*/
  readonly capsule: Capsule;
/**
* @returns {any[]}
*/
  readonly queriedAddresses: any[];
}
/**
*/
export class RetrievalKitBuilder {
  free(): void;
/**
* @param {Capsule} capsule
*/
  constructor(capsule: Capsule);
/**
* @param {Uint8Array} address
* @returns {RetrievalKitBuilder}
*/
  addQueriedAddress(address: Uint8Array): RetrievalKitBuilder;
/**
* @returns {RetrievalKit}
*/
  build(): RetrievalKit;
}
/**
*/
export class RevocationOrder {
  free(): void;
/**
* @param {Signer} signer
* @param {Uint8Array} staking_provider_address
* @param {EncryptedKeyFrag} encrypted_kfrag
*/
  constructor(signer: Signer, staking_provider_address: Uint8Array, encrypted_kfrag: EncryptedKeyFrag);
/**
* @param {PublicKey} alice_verifying_key
* @returns {VerifiedRevocationOrder}
*/
  verify(alice_verifying_key: PublicKey): VerifiedRevocationOrder;
/**
* @param {Uint8Array} data
* @returns {RevocationOrder}
*/
  static fromBytes(data: Uint8Array): RevocationOrder;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
}
/**
*/
export class SecretKey {
  free(): void;
/**
* Generates a secret key using the default RNG and returns it.
* @returns {SecretKey}
*/
  static random(): SecretKey;
/**
* Generates a secret key using the default RNG and returns it.
* @returns {PublicKey}
*/
  publicKey(): PublicKey;
/**
* @returns {Uint8Array}
*/
  toSecretBytes(): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {SecretKey}
*/
  static fromBytes(data: Uint8Array): SecretKey;
/**
* @returns {string}
*/
  toString(): string;
}
/**
*/
export class SecretKeyFactory {
  free(): void;
/**
* Generates a secret key factory using the default RNG and returns it.
* @returns {SecretKeyFactory}
*/
  static random(): SecretKeyFactory;
/**
* @returns {number}
*/
  static seedSize(): number;
/**
* @param {Uint8Array} seed
* @returns {SecretKeyFactory}
*/
  static fromSecureRandomness(seed: Uint8Array): SecretKeyFactory;
/**
* @param {Uint8Array} label
* @returns {SecretKey}
*/
  makeKey(label: Uint8Array): SecretKey;
/**
* @param {Uint8Array} label
* @returns {SecretKeyFactory}
*/
  makeFactory(label: Uint8Array): SecretKeyFactory;
/**
* @returns {Uint8Array}
*/
  toSecretBytes(): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {SecretKeyFactory}
*/
  static fromBytes(data: Uint8Array): SecretKeyFactory;
/**
* @returns {string}
*/
  toString(): string;
}
/**
*/
export class Signature {
  free(): void;
/**
* @param {PublicKey} verifying_pk
* @param {Uint8Array} message
* @returns {boolean}
*/
  verify(verifying_pk: PublicKey, message: Uint8Array): boolean;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {Signature}
*/
  static fromBytes(data: Uint8Array): Signature;
/**
* @returns {string}
*/
  toString(): string;
/**
* @param {Signature} other
* @returns {boolean}
*/
  equals(other: Signature): boolean;
}
/**
*/
export class Signer {
  free(): void;
/**
* @param {SecretKey} secret_key
*/
  constructor(secret_key: SecretKey);
/**
* @param {Uint8Array} message
* @returns {Signature}
*/
  sign(message: Uint8Array): Signature;
/**
* @returns {PublicKey}
*/
  verifyingKey(): PublicKey;
/**
* @returns {string}
*/
  toString(): string;
}
/**
*/
export class TreasureMap {
  free(): void;
/**
* @param {Signer} signer
* @param {PublicKey} recipient_key
* @returns {EncryptedTreasureMap}
*/
  encrypt(signer: Signer, recipient_key: PublicKey): EncryptedTreasureMap;
/**
* @param {Signer} signer
* @returns {any[]}
*/
  makeRevocationOrders(signer: Signer): any[];
/**
* @param {Uint8Array} data
* @returns {TreasureMap}
*/
  static fromBytes(data: Uint8Array): TreasureMap;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {any}
*/
  readonly destinations: any;
/**
* @returns {HRAC}
*/
  readonly hrac: HRAC;
/**
* @returns {PublicKey}
*/
  readonly policyEncryptingKey: PublicKey;
/**
* @returns {PublicKey}
*/
  readonly publisherVerifyingKey: PublicKey;
/**
* @returns {number}
*/
  readonly threshold: number;
}
/**
*/
export class TreasureMapBuilder {
  free(): void;
/**
* @param {Signer} signer
* @param {HRAC} hrac
* @param {PublicKey} policy_encrypting_key
* @param {number} threshold
*/
  constructor(signer: Signer, hrac: HRAC, policy_encrypting_key: PublicKey, threshold: number);
/**
* @param {Uint8Array} address
* @param {PublicKey} public_key
* @param {VerifiedKeyFrag} vkfrag
* @returns {TreasureMapBuilder}
*/
  addKfrag(address: Uint8Array, public_key: PublicKey, vkfrag: VerifiedKeyFrag): TreasureMapBuilder;
/**
* @returns {TreasureMap}
*/
  build(): TreasureMap;
}
/**
*/
export class VerifiedCapsuleFrag {
  free(): void;
/**
* @param {Uint8Array} bytes
* @returns {VerifiedCapsuleFrag}
*/
  static fromVerifiedBytes(bytes: Uint8Array): VerifiedCapsuleFrag;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {string}
*/
  toString(): string;
/**
* @param {VerifiedCapsuleFrag} other
* @returns {boolean}
*/
  equals(other: VerifiedCapsuleFrag): boolean;
}
/**
*/
export class VerifiedKeyFrag {
  free(): void;
/**
* @param {Uint8Array} bytes
* @returns {VerifiedKeyFrag}
*/
  static fromVerifiedBytes(bytes: Uint8Array): VerifiedKeyFrag;
/**
* @returns {Uint8Array}
*/
  toBytes(): Uint8Array;
/**
* @returns {string}
*/
  toString(): string;
/**
* @param {VerifiedKeyFrag} other
* @returns {boolean}
*/
  equals(other: VerifiedKeyFrag): boolean;
}
/**
*/
export class VerifiedRevocationOrder {
  free(): void;
/**
* @returns {Uint8Array}
*/
  readonly address: Uint8Array;
/**
* @returns {EncryptedKeyFrag}
*/
  readonly encryptedKFrag: EncryptedKeyFrag;
}
