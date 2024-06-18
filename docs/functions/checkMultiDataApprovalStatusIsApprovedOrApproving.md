[NuLink SDK - v0.5.31](../README.md) / [Modules](../modules.md) / checkMultiDataApprovalStatusIsApprovedOrApproving

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

[core/pre/api/workflow.ts:2178](https://github.com/NuLink-network/nulink-sdk/blob/b71aeb1/src/core/pre/api/workflow.ts#L2178)
