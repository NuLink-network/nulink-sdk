[NuLink SDK - v0.5.17](../README.md) / [Modules](../modules.md) / unlockWallet

# Function: unlockWallet

▸ **unlockWallet**(`password`): `Promise`<`boolean`\>

Attempts to unlock the NuLinkHDWallet with the given password.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `password` | `string` | The password used to decrypt the wallet. |

#### Returns

`Promise`<`boolean`\>

- Returns true if the password is correct, false otherwise.

#### Defined in

[api/wallet.ts:270](https://github.com/NuLink-network/nulink-sdk/blob/675c732/src/api/wallet.ts#L270)
