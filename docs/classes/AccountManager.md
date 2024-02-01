[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / AccountManager

# Class: AccountManager

An account management object that stores all account information.

## Hierarchy

- `IJson`

  ↳ **`AccountManager`**

## Table of contents

### Constructors

- [constructor](AccountManager.md#constructor)

### Properties

- [defaultAccountAddressIndex](AccountManager.md#defaultaccountaddressindex)

### Methods

- [restoreDefaultAccount](AccountManager.md#restoredefaultaccount)
- [load](AccountManager.md#load)
- [loadSaved](AccountManager.md#loadsaved)
- [getAccountCount](AccountManager.md#getaccountcount)
- [getAllAccount](AccountManager.md#getallaccount)
- [getAllAccountSortByAccountId](AccountManager.md#getallaccountsortbyaccountid)
- [createAccount](AccountManager.md#createaccount)
- [removeAccount](AccountManager.md#removeaccount)
- [getAccount](AccountManager.md#getaccount)
- [getAccountByAddress](AccountManager.md#getaccountbyaddress)
- [getDefaultAccount](AccountManager.md#getdefaultaccount)
- [strategyIds](AccountManager.md#strategyids)
- [accountIds](AccountManager.md#accountids)
- [dump](AccountManager.md#dump)
- [serialize](AccountManager.md#serialize)
- [deserialize](AccountManager.md#deserialize)

## Constructors

### constructor

• **new AccountManager**()

#### Inherited from

IJson.constructor

## Properties

### defaultAccountAddressIndex

• **defaultAccountAddressIndex**: `number` = `0`

#### Defined in

[core/hdwallet/api/account.ts:994](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L994)

## Methods

### restoreDefaultAccount

▸ `Static` **restoreDefaultAccount**(): `Promise`<[`AccountManager`](AccountManager.md)\>

Restores the default account using the strategies stored in the backend database and returns a new AccountManager object.

**`Memberof`**

AccountManager

**`Static`**

#### Returns

`Promise`<[`AccountManager`](AccountManager.md)\>

｛Promise<AccountManager>｝- A Promise that resolves to a new AccountManager object with the default account restored.

#### Defined in

[core/hdwallet/api/account.ts:1362](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1362)

___

### load

▸ `Static` **load**(`jsonString`, `save?`): `Promise`<[`AccountManager`](AccountManager.md)\>

Loads a accountManager object from a JSON string.

**`Static`**

**`Memberof`**

AccountManager

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `jsonString` | `string` | `undefined` | The JSON string to parse and load. |
| `save` | `boolean` | `false` | - |

#### Returns

`Promise`<[`AccountManager`](AccountManager.md)\>

- Returns a Promise that resolves with the accountManager object.

#### Overrides

IJson.load

#### Defined in

[core/hdwallet/api/account.ts:1406](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1406)

___

### loadSaved

▸ `Static` **loadSaved**(): `Promise`<[`AccountManager`](AccountManager.md)\>

**`Static`**

Loads the saved account information from browser local storage and returns a AccountManager object.

**`Memberof`**

AccountManager

#### Returns

`Promise`<[`AccountManager`](AccountManager.md)\>

- A Promise that resolves to a AccountManager object with the saved account information loaded.

#### Defined in

[core/hdwallet/api/account.ts:1444](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1444)

___

### getAccountCount

▸ **getAccountCount**(): `number`

Returns the number of accounts in the account mapping data structure.

**`Memberof`**

AccountManager

#### Returns

`number`

- The number of accounts as a number.

#### Defined in

[core/hdwallet/api/account.ts:1028](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1028)

___

### getAllAccount

▸ **getAllAccount**(): [`Account`](Account.md)[]

Returns an array of all the accounts in the account mapping data structure, sorted by address index in ascending order.

**`Memberof`**

AccountManager

#### Returns

[`Account`](Account.md)[]

- An array of Account objects.

#### Defined in

[core/hdwallet/api/account.ts:1037](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1037)

___

### getAllAccountSortByAccountId

▸ **getAllAccountSortByAccountId**(): [`Account`](Account.md)[]

Returns an array of all the accounts in the account mapping data structure, sorted by account ID in ascending order.

**`Memberof`**

AccountManager

#### Returns

[`Account`](Account.md)[]

- An array of Account objects.

#### Defined in

[core/hdwallet/api/account.ts:1048](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1048)

___

### createAccount

▸ **createAccount**(`name?`, `defaultAccount?`): `Promise`<[`Account`](Account.md)\>

Creates a new account and returns it.

**`Memberof`**

AccountManager

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `name` | `string` | `''` | {string} - (optional) The name of the account . |
| `defaultAccount` | `boolean` | `false` | {boolean} - (optional) Whether to set the new account as the default account (optional, defaults to false). |

#### Returns

`Promise`<[`Account`](Account.md)\>

- A Promise that resolves to the newly created Account object.

#### Defined in

[core/hdwallet/api/account.ts:1106](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1106)

___

### removeAccount

▸ **removeAccount**(`addressIndex`): `Promise`<`undefined` \| [`Account`](Account.md)\>

Removes an account with the specified address index and returns it.

**`Memberof`**

AccountManager

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `addressIndex` | `number` | {number} - The address index of the account to be removed. |

#### Returns

`Promise`<`undefined` \| [`Account`](Account.md)\>

- A Promise that resolves to the removed Account object, or undefined if the account does not exist or cannot be removed.

#### Defined in

[core/hdwallet/api/account.ts:1150](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1150)

___

### getAccount

▸ **getAccount**(`index`): `undefined` \| [`Account`](Account.md)

Returns the Account object with the specified address index, or undefined if the account does not exist.

**`Memberof`**

AccountManager

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | {number} - The address index of the account to be retrieved. |

#### Returns

`undefined` \| [`Account`](Account.md)

- The Account object with the specified address index, or undefined if the account does not exist.

#### Defined in

[core/hdwallet/api/account.ts:1289](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1289)

___

### getAccountByAddress

▸ **getAccountByAddress**(`address`): `undefined` \| [`Account`](Account.md)

Returns the Account object with the specified address, or undefined if the account does not exist.

**`Memberof`**

AccountManager

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | {string} - The address index of the account to be retrieved. |

#### Returns

`undefined` \| [`Account`](Account.md)

- The Account object with the specified address, or undefined if the account does not exist.

#### Defined in

[core/hdwallet/api/account.ts:1299](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1299)

___

### getDefaultAccount

▸ **getDefaultAccount**(): `undefined` \| [`Account`](Account.md)

Retrieves the default account associated with the NuLinkHDWallet.
If no default account is set, the account with index 0 will be returned.

**`Memberof`**

AccountManager

#### Returns

`undefined` \| [`Account`](Account.md)

- Returns the default account or undefined if it does not exist.

#### Defined in

[core/hdwallet/api/account.ts:1317](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1317)

___

### strategyIds

▸ **strategyIds**(): `string`[]

Returns an array of strategy IDs associated with all accounts of the current HD wallet instance.

**`Memberof`**

AccountManager

#### Returns

`string`[]

- An array of strategy IDs as strings.

#### Defined in

[core/hdwallet/api/account.ts:1327](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1327)

___

### accountIds

▸ **accountIds**(): `string`[]

Returns an array of account IDs associated with all accounts of the current HD wallet instance.

**`Memberof`**

AccountManager

#### Returns

`string`[]

- An array of account IDs as strings.

#### Defined in

[core/hdwallet/api/account.ts:1344](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1344)

___

### dump

▸ **dump**(): `string`

Returns a JSON string representation of the AccountManager object.

**`Memberof`**

AccountManager

#### Returns

`string`

- Returns a JSON string representation of the AccountManager object.

#### Overrides

IJson.dump

#### Defined in

[core/hdwallet/api/account.ts:1382](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1382)

___

### serialize

▸ **serialize**(): `Promise`<`void`\>

Serializes the accountManager object and encrypts it to 'Browser-local storage'.

**`Memberof`**

AccountManager

#### Returns

`Promise`<`void`\>

#### Defined in

[core/hdwallet/api/account.ts:1532](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1532)

___

### deserialize

▸ **deserialize**(): `Promise`<[`AccountManager`](AccountManager.md)\>

Deserializes a accountManager object from 'Browser-local storage' by decrypting it and creating a account object in memory.

**`Memberof`**

AccountManager

#### Returns

`Promise`<[`AccountManager`](AccountManager.md)\>

- Returns a Promise that resolves with the deserialized accountManager object.

#### Defined in

[core/hdwallet/api/account.ts:1542](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/hdwallet/api/account.ts#L1542)
