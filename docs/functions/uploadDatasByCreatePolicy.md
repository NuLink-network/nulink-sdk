[NuLink SDK - v0.5.6](../README.md) / [Modules](../modules.md) / uploadDatasByCreatePolicy

# Function: uploadDatasByCreatePolicy

▸ **uploadDatasByCreatePolicy**(`account`, `category`, `dataInfoList`): `Promise`<[`Strategy`](../classes/Strategy.md)\>

Uploads files/datas to the server by creating a new local policy and uploading the files encrypted with the policy's public key to IPFS.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `account` | [`Account`](../classes/Account.md) | The account to use to create the policy and upload the files/datas. |
| `category` | `string` \| [`DataCategory`](../enums/DataCategory.md) | The category of the files/datas being uploaded. Must be a valid DataCategory value or a string. |
| `dataInfoList` | [`DataInfo`](../types/DataInfo.md)[] | The list of files/datas to upload. Each element of the array must be an object with properties 'label' and 'dataArrayBuffer'. |

#### Returns

`Promise`<[`Strategy`](../classes/Strategy.md)\>

- Returns the strategy used to upload the files/datas.

#### Defined in

[core/pre/api/workflow.ts:307](https://github.com/NuLink-network/nulink-sdk/blob/9e77a59/src/core/pre/api/workflow.ts#L307)
