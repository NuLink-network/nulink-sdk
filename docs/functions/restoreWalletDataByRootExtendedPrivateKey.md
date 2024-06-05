[NuLink SDK - v0.0.9](../README.md) / [Modules](../modules.md) / restoreWalletDataByRootExtendedPrivateKey

# Function: restoreWalletDataByRootExtendedPrivateKey

▸ **restoreWalletDataByRootExtendedPrivateKey**(`newPassword`, `rootExtendedPrivateKey`): `Promise`<[`NuLinkHDWallet`](../classes/NuLinkHDWallet.md)\>

restore wallet by the strategys of account stored in the backend db.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newPassword` | `string` | new password |
| `rootExtendedPrivateKey` | `string` | BIP32 root Extended PrivateKey. base58Key format：be startwith 'xprv' |

#### Returns

`Promise`<[`NuLinkHDWallet`](../classes/NuLinkHDWallet.md)\>

- Returns a new NuLinkHDWallet object with the restored account.

#### Defined in

[api/wallet.ts:75](https://github.com/NuLink-network/nulink-sdk/blob/66c291e/src/api/wallet.ts#L75)
