[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / getApprovedDataContent

# Function: getApprovedDataContent

▸ **getApprovedDataContent**(`dataId`): `Promise`<`ArrayBuffer`\>

The data/file applicant retrieves the content of a data/file that has been approved for their usage.

**`Throws`**

UnauthorizedError get logined account failed, must be login account first

**`Throws`**

ParameterError The input parameter must have the "dataId" field

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dataId` | `any` | data's id |

#### Returns

`Promise`<`ArrayBuffer`\>

#### Defined in

[api/pre.ts:865](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/api/pre.ts#L865)
