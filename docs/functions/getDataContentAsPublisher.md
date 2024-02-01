[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / getDataContentAsPublisher

# Function: getDataContentAsPublisher

▸ **getDataContentAsPublisher**(`data`): `Promise`<{ `url`: `string` = url; `dataLabel`: `string`  }\>

The data/file publisher obtains the content of the data/file

**`Throws`**

UnauthorizedError get logined account failed, must be login account first

**`Throws`**

ParameterError The input parameter must have the "dataId" field

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Object` | Object must be include the following fields in the "data" section: |
| `data.dataId` | `string` |  |
| `data.dataLabel` | `string` |  |

#### Returns

`Promise`<{ `url`: `string` = url; `dataLabel`: `string`  }\>

- { url: "data content url", dataLabel: "data label" }

#### Defined in

[api/pre.ts:893](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/api/pre.ts#L893)
