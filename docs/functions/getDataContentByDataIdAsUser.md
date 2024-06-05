[NuLink SDK - v0.0.9](../README.md) / [Modules](../modules.md) / getDataContentByDataIdAsUser

# Function: getDataContentByDataIdAsUser

▸ **getDataContentByDataIdAsUser**(`userAccount`, `dataId`): `Promise`<`ArrayBuffer`\>

Get approved document content (downloadable). The file/data applicant retrieves the content of a file/data that has been approved for their usage.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `userAccount` | [`Account`](../classes/Account.md) | Account the current account object |
| `dataId` | `string` | file/data's id |

#### Returns

`Promise`<`ArrayBuffer`\>

#### Defined in

[core/pre/api/workflow.ts:3093](https://github.com/NuLink-network/nulink-sdk/blob/66c291e/src/core/pre/api/workflow.ts#L3093)
