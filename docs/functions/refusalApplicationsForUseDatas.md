[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / refusalApplicationsForUseDatas

# Function: refusalApplicationsForUseDatas

▸ **refusalApplicationsForUseDatas**(`publisher`, `applyIds`, `remark?`): `Promise`<`unknown`\>

Rejects the applications for the use of files/data. This account acts as the publisher (Alice). The batch version of the function refusalApplicationForUseDatas.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `publisher` | [`Account`](../classes/Account.md) | `undefined` | The account of the publisher (Alice). |
| `applyIds` | `string`[] | `undefined` | The application apply ID to reject. |
| `remark` | `string` | `''` | (Optional) Additional remarks for the rejection. Default is an empty string. |

#### Returns

`Promise`<`unknown`\>

#### Defined in

[core/pre/api/workflow.ts:2407](https://github.com/NuLink-network/nulink-sdk/blob/65ffe0d/src/core/pre/api/workflow.ts#L2407)
