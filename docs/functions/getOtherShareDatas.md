[NuLink SDK - v0.5.7](../README.md) / [Modules](../modules.md) / getOtherShareDatas

# Function: getOtherShareDatas

▸ **getOtherShareDatas**(`account`, `dataLabel?`, `include?`, `category?`, `dataType?`, `descOrder?`, `pageIndex?`, `pageSize?`): `Promise`<`unknown`\>

Gets a list of files/data shared by others (files uploaded by the current account are not included). This account acts as the user(Bob).

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `account` | [`Account`](../classes/Account.md) | `undefined` | The current account information. |
| `dataLabel?` | `string` | `undefined` | (Optional) The name of the file/data to search for. support fuzzy query. Leave blank to retrieve all files. |
| `include?` | `boolean` | `undefined` | Indicates whether the query result contains file/data list data of the current account. |
| `category?` | `string` \| [`DataCategory`](../enums/DataCategory.md) | `undefined` | (Optional) The category of the file/data to search for. |
| `dataType?` | [`DataType`](../enums/DataType.md) | `undefined` | (Optional) The type of the file/data to search for. |
| `descOrder` | `boolean` | `true` | (Optional) Whether to sort by upload time in reverse order. |
| `pageIndex` | `number` | `1` | (Optional) The index of the page to retrieve. Default is 1. |
| `pageSize` | `number` | `10` | (Optional) The number of files/data to retrieve per page. Default is 10. |

#### Returns

`Promise`<`unknown`\>

- Returns an object containing the list of files/data and pagination information.
                        {
                            total: number
                            list: [{
                                file_id: string - File/Data ID
                                file_name: string - File/Data name
                                category: string - File/Data category/type
                                format: string - File/Data format
                                suffix: string - File/Data suffix
                                address: string - File/Data address
                                thumbnail: string - File/Data thumbnail
                                owner: string - File/Data owner
                                owner_id: string - File/Data owner's account ID
                                owner_avatar: string - File/Data owner's avatar
                                created_at: number - File/Data upload timestamp
                            }]
                        }

#### Defined in

[core/pre/api/workflow.ts:652](https://github.com/NuLink-network/nulink-sdk/blob/11cbdd7/src/core/pre/api/workflow.ts#L652)
