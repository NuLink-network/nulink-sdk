[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / checkDataApprovalStatusIsUnderReviewOrApproved

# Function: checkDataApprovalStatusIsUnderReviewOrApproved

▸ **checkDataApprovalStatusIsUnderReviewOrApproved**(`data`): `Promise`<``null`` \| `boolean`\>

Check if the application status is "under review" or "approved"

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Object` | Object be must be have the property of "applyId", return null otherwise |
| `data.applyId` | `string` | The ID of the data/file application. |

#### Returns

`Promise`<``null`` \| `boolean`\>

param data Object be must be have the property of "applyId",  return null otherwise.
          Return true if the status is "under review" or "approved", false otherwise

#### Defined in

[api/pre.ts:387](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/api/pre.ts#L387)
