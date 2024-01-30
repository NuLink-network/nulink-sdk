[NuLink SDK - v0.5.6](../README.md) / [Modules](../modules.md) / getPolicyGasFee

# Function: getPolicyGasFee

▸ **getPolicyGasFee**(`userAccountId`, `applyId`, `ursulaShares`, `ursulaThreshold`, `startSeconds`, `endSeconds`, `serverFee`, `gasPrice?`): `Promise`<`string`\>

estimate service gas fees for sharing files
Please unlock account with your password first by call getWalletDefaultAccount(userpassword), otherwise an UnauthorizedError exception will be thrown.

**`Throws`**

UnauthorizedError get logined account failed, must be login account first

**`Throws`**

PolicyHasBeenActivedOnChain Policy has been actived(created) on chain (policy is currently active)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userAccountId` | `string` | the account Id of the file applicant (Bob) |
| `applyId` | `string` | The application ID returned to the user by the interface when applying to use a specific file |
| `ursulaShares` | `number` | Number of service shares |
| `ursulaThreshold` | `number` | The file user can download the file after obtaining the specified number of service data shares |
| `startSeconds` | `number` | Start time of file usage application in seconds |
| `endSeconds` | `number` | End time of file usage application in seconds |
| `serverFee` | `BigNumber` | server fees by call function of `getPolicyServerGasFee` |
| `gasPrice` | `BigNumber` | the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time |

#### Returns

`Promise`<`string`\>

- the amount of bnb/tbnb in wei

#### Defined in

[api/pre.ts:119](https://github.com/NuLink-network/nulink-sdk/blob/9e77a59/src/api/pre.ts#L119)
