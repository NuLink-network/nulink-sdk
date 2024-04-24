[NuLink SDK - v0.5.22](../README.md) / [Modules](../modules.md) / checkMultiDataApprovalStatusIsApprovedOrApproving

# Function: checkMultiDataApprovalStatusIsApprovedOrApproving

▸ **checkMultiDataApprovalStatusIsApprovedOrApproving**(`applyIds`): `Promise`<`string`[]\>

Check whether the status of multiple applications is "under review" or "approved".

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `applyIds` | `string`[] \| `number`[] | string[]\| number[] |

#### Returns

`Promise`<`string`[]\>

Promise<string[]> -- return a list of applyIds that are not in the "pending approval" and "approved" statuses.

#### Defined in

[core/pre/api/workflow.ts:2080](https://github.com/NuLink-network/nulink-sdk/blob/d9e8f81/src/core/pre/api/workflow.ts#L2080)
