[NuLink SDK - v0.5.6](../README.md) / [Modules](../modules.md) / applyForDatasUsagePermission

# Function: applyForDatasUsagePermission

▸ **applyForDatasUsagePermission**(`dataIds`, `account`, `usageDays?`): `Promise`<`unknown`\>

Applies for file/data usage permission for the specified files/datas, This account acts as the user(Bob).

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `dataIds` | `string`[] | `undefined` | An array of file IDs to apply for usage permission. |
| `account` | [`Account`](../classes/Account.md) | `undefined` | The account that applies for the permission. |
| `usageDays` | `number` | `7` | (Optional) The validity period of the application, in days. Default is 7. |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[core/pre/api/workflow.ts:709](https://github.com/NuLink-network/nulink-sdk/blob/9e77a59/src/core/pre/api/workflow.ts#L709)
