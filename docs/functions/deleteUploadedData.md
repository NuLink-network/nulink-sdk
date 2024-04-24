[NuLink SDK - v0.5.20](../README.md) / [Modules](../modules.md) / deleteUploadedData

# Function: deleteUploadedData

▸ **deleteUploadedData**(`account`, `dataIds`): `Promise`<`unknown`\>

Deletes the specified files/data uploaded by the account from the server, This account acts as the publisher

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `account` | [`Account`](../classes/Account.md) | The account that owns the files/data to be deleted. |
| `dataIds` | `string`[] | An array of file/data IDs to delete. |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[core/pre/api/workflow.ts:612](https://github.com/NuLink-network/nulink-sdk/blob/e6138bf/src/core/pre/api/workflow.ts#L612)
