[NuLink SDK - v0.5.17](../README.md) / [Modules](../modules.md) / getUnapprovedDataAsUser

# Function: getUnapprovedDataAsUser

▸ **getUnapprovedDataAsUser**(`account`, `pageIndex?`, `pageSize?`): `Promise`<`object`\>

Gets a list of files/data with the "approved failed" status, which cannot be used by the user (Bob) using this account.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `account` | [`Account`](../classes/Account.md) | `undefined` | The current account information. |
| `pageIndex` | `number` | `1` | The index of the page to retrieve. Default is 1. |
| `pageSize` | `number` | `10` | The number of files/data to retrieve per page. Default is 10. |

#### Returns

`Promise`<`object`\>

- Returns an object containing the list of files/data and pagination information.

#### Defined in

[core/pre/api/workflow.ts:1071](https://github.com/NuLink-network/nulink-sdk/blob/675c732/src/core/pre/api/workflow.ts#L1071)
