[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / deleteUploadedDatas

# Function: deleteUploadedDatas

▸ **deleteUploadedDatas**(`account`, `dataIds`): `Promise`<`unknown`\>

Deletes the specified files/data uploaded by the account from the server, This account acts as the publisher

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `account` | [`Account`](../classes/Account.md) | The account that owns the files/data to be deleted. |
| `dataIds` | `string`[] | An array of file/data IDs to delete. |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[core/pre/api/workflow.ts:608](https://github.com/NuLink-network/nulink-sdk/blob/65ffe0d/src/core/pre/api/workflow.ts#L608)
