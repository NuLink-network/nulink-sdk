[NuLink SDK - v0.5.23](../README.md) / [Modules](../modules.md) / checkMultiDataApprovalStatusIsApprovedOrApproving

# Function: checkMultiDataApprovalStatusIsApprovedOrApproving

▸ **checkMultiDataApprovalStatusIsApprovedOrApproving**(`applyIds`): `Promise`<`object`\>

Check whether the status of multiple applications is "under review" or "approved".

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `applyIds` | `string`[] \| `number`[] | string[]\| number[] |

#### Returns

`Promise`<`object`\>

Promise<object> - return two lists of applyIds, one list of applyIds that are in the "approving(Under review)" statuses, and the other list of applyIds that are in the "approved" statuses.
                 {
                  approvedApplyIds: [],
                  underViewApplyIds: [],
                 }

#### Defined in

[core/pre/api/workflow.ts:2119](https://github.com/NuLink-network/nulink-sdk/blob/1365126/src/core/pre/api/workflow.ts#L2119)
