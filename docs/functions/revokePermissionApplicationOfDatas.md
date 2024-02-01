[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / revokePermissionApplicationOfDatas

# Function: revokePermissionApplicationOfDatas

▸ **revokePermissionApplicationOfDatas**(`account`, `applyIds`): `Promise`<`unknown`\>

Revokes the permission application of the specified files/data. This account acts as the user(Bob).
If it has been approved or failed, it can not be revoked.
The background service processing logic is such that if there are multiple permission applications, either all of them will be successful or none of them will be successful.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `account` | [`Account`](../classes/Account.md) | The account that revokes the permission application. |
| `applyIds` | `number`[] | An array of application applyIds to revoke. |

#### Returns

`Promise`<`unknown`\>

- Returns an empty object.

#### Defined in

[core/pre/api/workflow.ts:757](https://github.com/NuLink-network/nulink-sdk/blob/65ffe0d/src/core/pre/api/workflow.ts#L757)
