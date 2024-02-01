[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / getPolicysGasFee

# Function: getPolicysGasFee

▸ **getPolicysGasFee**(`userAccountIds`, `applyIds`, `ursulaShares`, `ursulaThresholds`, `startSeconds`, `endSeconds`, `serverFee`, `gasPrice?`): `Promise`<`string`\>

estimate service gas fees for sharing data/files. The batch version of the getPolicyGasFee function.
Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.

**`Throws`**

UnauthorizedError get logined account failed, must be login account first

**`Throws`**

PolicyHasBeenActivedOnChain Policy has been actived(created) on chain (policy is currently active)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userAccountIds` | `string`[] | the account Id of the data/file applicant (Bob) |
| `applyIds` | `string`[] | The application ID returned to the user by the interface when applying to use a specific data/file |
| `ursulaShares` | `number`[] | Number of service shares |
| `ursulaThresholds` | `number`[] | - |
| `startSeconds` | `number`[] | Start time of data/file usage application in UTC seconds |
| `endSeconds` | `number`[] | End time of data/file usage application in UTC seconds |
| `serverFee` | `BigNumber` | server fees by call function of `getPolicysServerFee` |
| `gasPrice` | `BigNumber` | - |

#### Returns

`Promise`<`string`\>

- the amount of bnb/tbnb in wei

#### Defined in

[api/pre.ts:187](https://github.com/NuLink-network/nulink-sdk/blob/65ffe0d/src/api/pre.ts#L187)
