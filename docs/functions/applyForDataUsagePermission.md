[NuLink SDK - v0.5.23](../README.md) / [Modules](../modules.md) / applyForDataUsagePermission

# Function: applyForDataUsagePermission

▸ **applyForDataUsagePermission**(`dataIds`, `account`, `usageDays?`): `Promise`<`unknown`\>

Applies for file/data usage permission for the specified files/data, This account acts as the user(Bob).

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `dataIds` | `string`[] | `undefined` | An array of file IDs to apply for usage permission. |
| `account` | [`Account`](../classes/Account.md) | `undefined` | The account that applies for the permission. |
| `usageDays` | `number` | `7` | (Optional) The validity period of the application, in days. Default is 7. |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[core/pre/api/workflow.ts:736](https://github.com/NuLink-network/nulink-sdk/blob/1365126/src/core/pre/api/workflow.ts#L736)
