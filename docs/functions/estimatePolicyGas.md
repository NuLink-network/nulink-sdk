[NuLink SDK - v0.5.6](../README.md) / [Modules](../modules.md) / estimatePolicyGas

# Function: estimatePolicyGas

▸ **estimatePolicyGas**(`publisher`, `userAccountId`, `applyId`, `ursulaShares`, `ursulaThreshold`, `startDate`, `endDate`, `serverFee`, `gasPrice?`, `porterUri?`): `Promise`<`BigNumber`\>

estimate gas fees for sharing files/datas

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `publisher` | [`Account`](../classes/Account.md) | Account the account object of the file/data publisher (Alice) |
| `userAccountId` | `string` | the account Id of the file/data publisher (Alice) |
| `applyId` | `string` | The application ID returned to the user by the interface when applying to use a specific file/data |
| `ursulaShares` | `number` | Number of service shares |
| `ursulaThreshold` | `number` | The file/data user can download the file after obtaining the specified number of service data shares |
| `startDate` | `Date` | Start date(UTC date) of file/data usage application |
| `endDate` | `Date` | End date(UTC date) of file/data usage application |
| `serverFee` | `BigNumber` | server fees by call function of `getPolicyServerGasFee` |
| `gasPrice` | `BigNumber` | the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time |
| `porterUri?` | `string` | (Optional) the porter service url |

#### Returns

`Promise`<`BigNumber`\>

- the amount of bnb/tbnb in wei

#### Defined in

[core/pre/api/workflow.ts:1434](https://github.com/NuLink-network/nulink-sdk/blob/9e77a59/src/core/pre/api/workflow.ts#L1434)
