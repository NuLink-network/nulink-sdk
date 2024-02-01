[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / estimatePolicysGas

# Function: estimatePolicysGas

▸ **estimatePolicysGas**(`publisher`, `userAccountIds`, `applyIds`, `ursulaShares`, `ursulaThresholds`, `startDates`, `endDates`, `serverFee`, `gasPrice?`, `porterUri?`): `Promise`<`BigNumber`\>

estimate the gas fee for batch (sharing files/data) creating policies.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `publisher` | [`Account`](../classes/Account.md) | Account the account object of the file/data publisher (Alice) |
| `userAccountIds` | `string`[] | the account Id of the file/data publisher (Alice) |
| `applyIds` | `string`[] | The application ID returned to the user by the interface when applying to use a specific file/data |
| `ursulaShares` | `number`[] | Number of service shares |
| `ursulaThresholds` | `number`[] | The file/data user can download the file/data after obtaining the specified number of service data shares |
| `startDates` | `Date`[] | Start date(UTC date) of file/data usage application |
| `endDates` | `Date`[] | End date(UTC date) of file/data usage application |
| `serverFee` | `BigNumber` | server fees by call function of `getPolicyServerGasFee` |
| `gasPrice` | `BigNumber` | the user can set the gas rate manually, and if it is set to 0, the gasPrice is obtained in real time |
| `porterUri?` | `string` | (Optional) the porter service url |

#### Returns

`Promise`<`BigNumber`\>

- the amount of bnb/tbnb in wei

#### Defined in

[core/pre/api/workflow.ts:1517](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/pre/api/workflow.ts#L1517)
