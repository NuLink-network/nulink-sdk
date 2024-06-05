[NuLink SDK - v0.0.9](../README.md) / [Modules](../modules.md) / getPolicyTokenCost

# Function: getPolicyTokenCost

▸ **getPolicyTokenCost**(`publisher`, `startDate`, `endDate`, `ursulaShares`): `Promise`<`BigNumber`\>

calcurate publish policy server fee (nlk/tnlk): By calling calcPolicyCost

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `publisher` | [`Account`](../classes/Account.md) | the current logined Account object |
| `startDate` | `Date` | Start time of file/data usage application in seconds |
| `endDate` | `Date` | End time of file/data usage application in seconds |
| `ursulaShares` | `number` | Number of service shares |

#### Returns

`Promise`<`BigNumber`\>

- the amount of NLK/TNLK in wei

#### Defined in

[core/pre/api/workflow.ts:1396](https://github.com/NuLink-network/nulink-sdk/blob/66c291e/src/core/pre/api/workflow.ts#L1396)
