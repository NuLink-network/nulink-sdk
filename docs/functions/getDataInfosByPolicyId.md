[NuLink SDK - v0.5.6](../README.md) / [Modules](../modules.md) / getDataInfosByPolicyId

# Function: getDataInfosByPolicyId

▸ **getDataInfosByPolicyId**(`policyId`, `policyPublisherId?`, `policyUserId?`, `pageIndex?`, `pageSize?`): `Promise`<`unknown`\>

Gets the file/data information associated with the published policy (so the policy has been published)

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `policyId` | `string` | `undefined` | policyId |
| `policyPublisherId?` | `string` | `undefined` | (Optional) The account id of the file/data publisher, acting as the role of file publisher |
| `policyUserId?` | `string` | `undefined` | (Optional) The account id of the file/data user, acting as the role of file applicant Only one of the two parameters, "policyPublisherId" and "policyUserId", can be selected, or neither of them can be passed |
| `pageIndex` | `number` | `1` | (Optional) number default 1 |
| `pageSize` | `number` | `10` | (Optional) number default 10 |

#### Returns

`Promise`<`unknown`\>

- {
               "list": [
                 {
                   "file_id": "File ID",
                   "file_name": "File name",
                   "owner": "File owner",
                   "owner_id": "File owner account ID",
                   "owner_avatar": "File owner avatar",
                   "address": "File address",
                   "thumbnail": "File thumbnail",
                   "created_at": "File upload timestamp",
                   "policy_id": "Policy ID",
                   "policy_hrac": "Policy HRAC",
                   "policy_start_at": "Policy start timestamp",
                   "policy_end_at": "Policy end timestamp",
                 },
                 ...
             ],
             "total": total count
           }

#### Defined in

[core/pre/api/workflow.ts:2440](https://github.com/NuLink-network/nulink-sdk/blob/9e77a59/src/core/pre/api/workflow.ts#L2440)
