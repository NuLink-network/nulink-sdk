[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / getPolicysServerGasFee

# Function: getPolicysServerGasFee

▸ **getPolicysServerGasFee**(`startSeconds`, `endSeconds`, `ursulaShares`): `Promise`<`string`\>

Retrieving the total of the service fees (NLK/TNLK) in bulk for data/file sharing purposes.
Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.

**`Throws`**

UnauthorizedError get logined account failed, must be login account first

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `startSeconds` | `number`[] | An array of the start time of data/file usage application in seconds |
| `endSeconds` | `number`[] | An array of the end time of data/file usage application in seconds |
| `ursulaShares` | `number`[] | An array of the number of service shares |

#### Returns

`Promise`<`string`\>

- the amount of NLK/TNLK in wei

#### Defined in

[api/pre.ts:66](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/api/pre.ts#L66)
