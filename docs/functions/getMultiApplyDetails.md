[NuLink SDK - v0.5.20](../README.md) / [Modules](../modules.md) / getMultiApplyDetails

# Function: getMultiApplyDetails

▸ **getMultiApplyDetails**(`applyIds`): `Promise`<``null`` \| `object`[]\>

Gets the details of multiple application records.

#### Parameters

| Name | Type |
| :------ | :------ |
| `applyIds` | `string`[] |

#### Returns

`Promise`<``null`` \| `object`[]\>

- Returns an array object containing the multiple details of the application record, or null if the record does not exist.
             {
               start_at:  "The start timestamp of the application",
               end_at: "The end timestamp of the application",
               policy_label: "The label of the policy",
               policy_label_id: "The ID of the policy label",
               days: "days",
               status: "apply status: 1 - In progress, 2 - Approved, 3 - Rejected, 4 - Under review, 5 - Expired"
             }

#### Defined in

[core/pre/api/workflow.ts:3035](https://github.com/NuLink-network/nulink-sdk/blob/e6138bf/src/core/pre/api/workflow.ts#L3035)
