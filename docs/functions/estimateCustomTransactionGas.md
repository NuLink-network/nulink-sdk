[NuLink SDK - v0.5.17](../README.md) / [Modules](../modules.md) / estimateCustomTransactionGas

# Function: estimateCustomTransactionGas

▸ **estimateCustomTransactionGas**(`toAddress`, `rawTxData?`, `value?`, `gasPrice?`, `account?`): `Promise`<``null`` \| `number`\>

send the raw transaction

**`Throws`**

UnauthorizedError get logined account failed, must be login account first

**`Throws`**

estimateCustomTransactionGas failed exception

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `toAddress` | `string` | The recevier of the transaction, can be empty when deploying a contract. |
| `rawTxData?` | `string` | (Optional) The call data of the transaction, can be empty for simple value transfers. |
| `value?` | `string` | (Optional) The value of the transaction in wei. |
| `gasPrice?` | `string` | (Optional) The gas price set by this transaction, if empty, it will use web3.eth.getGasPrice(). |
| `account?` | [`Account`](../classes/Account.md) | (Optional) The current account information. If the parameter is not passed, the function will call `getWalletDefaultAccount` to retrieve the current account. |

#### Returns

`Promise`<``null`` \| `number`\>

- Returns the gasFee or null if estimate gas failed .

#### Defined in

[api/pre.ts:1254](https://github.com/NuLink-network/nulink-sdk/blob/675c732/src/api/pre.ts#L1254)
