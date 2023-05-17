import {
  init as initDB,
  getInstance,
  TsIndexDb,
  IIndexDb,
  DbOperate,
  DbCountOperate,
} from "@nulink_network/ts-indexdb";
// import { TsIndexDb, IIndexDb, DbOperate } from "@nulink_network/ts-indexdb/dist/TsIndexDb";
import { isBlank } from "../null";

// data record type or table struct
// export type Rack = {
//   name: string;
//   id?: number;
// };

/**
 * @internal
 */
export const indexdb = {
  //https://www.npmjs.com/package/@nulink_network/ts-indexdb

  /**
 * @method init db 
 * @param {Object}
 *  @property dbName
 *  @property version
 *  @property tables
 * 
 * {
    dbName: "books",        // database name               
    version: 1,             // version number                
    tables: [                               
        {
            tableName: "bookrackList",         // table name         
            option: { keyPath: "id", autoIncrement: true }, // Indicates that the primary key is id
            indexs: [    // database index
                {
                    key: "id",
                    option: {
                        unique: true
                    }
                },
                {
                    key: "name"
                }
            ]
        }
    ]
}
 */

  init: async ({ dbName, version, tables }: IIndexDb): Promise<TsIndexDb> => {
    //The actual call is to the open_db function

    try {
      return await getInstance().open_db();
    } catch (e) {
      if (isBlank(getInstance())) {
        //Guarantee to initialize once and never initialize again
        return await initDB({ dbName, version, tables });
      }

      console.log("index db open_db exception ", e);

      throw e;
    }
  },
  /**
   * @method Query the number of elements that satisfy the key condition (returns the number of elements that match the condition).
   * @param {Object}
   *   @property {string} tableName  the name of table
   *   @property {Number|String} key The key to be queried.
   *   @property {Object} countCondition The query condition.
   *  await getInstance().count<T>({
   *     tableName: 'bookrackList',
   *     key: 'createdTime',
   *     countCondition: {
   *       type: 'between',
   *       rangeValue:[1676627113088,new Date().getTime()]
   **/

  /** countCondition: The key passed in must be a field that has already been indexed.
   *  key ≥ x	            {key: 'gt' rangeValue: [x]}
      key > x	            {key: 'gt' rangeValue: [x, true]}
      key ≤ y	            {key: 'lt' rangeValue: [y]}
      key < y	            {key: 'lt' rangeValue: [y, true]}
      key ≥ x && ≤ y	    {key: 'between' rangeValue: [x, y]}
      key > x &&< y	    {key: 'between' rangeValue: [x, y, true, true]}
      key > x && ≤ y	    {key: 'between' rangeValue: [x, y, true, false]}
      key ≥ x &&< y	    {key: 'between' rangeValue: [x, y, false, true]}
      key = z	            {key: 'equal' rangeValue: [z]}
    */

  count: async <T>({
    tableName,
    key,
    countCondition,
  }: Pick<
    DbCountOperate<T>,
    "key" | "tableName" | "countCondition"
  >): Promise<number> => {
    let count = (await getInstance().count<T>({
      tableName: tableName,
      key: key,
      countCondition: countCondition,
    })) as any;

    if (isBlank(count)) {
      count = 0;
    }
    return count;
  },

  /**
   * @method Query all the data in a table (returns a array)
   * @param {Object}
   *  @property {string} tableName Indicate the table name
   *
   *  await getInstance().queryAll<T>({tableName: 'bookrackList'});
   */

  queryAll: async <T>({
    tableName,
  }: Pick<DbOperate<T>, "tableName">): Promise<T[]> => {
    return await getInstance().queryAll<T>({
      tableName: tableName,
    });
  },

  /**
 * @method Query (returns a array)
 * @param {Object}
 *   @property {string} tableName Indicate the table name
 *   @property {Function} condition  data filtering condition
 * 
 *  await getInstance().query<T>({
    tableName: 'bookrackList',
    condition: item => item.id === 3
  })
 * */
  query: async <T>({
    tableName,
    condition,
  }: Pick<DbOperate<T>, "condition" | "tableName">): Promise<T[]> => {
    return await getInstance().query<T>({
      tableName: tableName,
      condition: condition,
    });
  },

  /**
     * @method Query data (with table specific attributes) returns a specific one
     * @param {Object}
     *   @property {string} tableName Indicate the table name
     *   @property {Number|String} key key
     *   @property {Number|String} value value
     * 
     *   await getInstance().query_by_keyValue<T>({
          tableName: 'bookrackList',
          key: 'name',
          value: 'value1'
        })
     * */

  queryByKeyValue: async <T>({
    tableName,
    key,
    value,
  }: Pick<DbOperate<T>, "tableName" | "key" | "value">): Promise<T> => {
    return await getInstance().query_by_keyValue<T>({
      tableName: tableName,
      key: key,
      value: value,
    });
  },

  /**
     * @method Query data (by value of the primary key)
     * @param {Object}
     *   @property {string} tableName Indicate the table name
     *   @property {Number|String} value value of the primary key
     * await getInstance().query_by_primaryKey<T>({
        tableName: 'bookrackList',
        value: 3
      })
     * */

  queryByPrimaryKey: async <T>({
    tableName,
    value,
  }: Pick<DbOperate<T>, "tableName" | "value">): Promise<T> => {
    return await getInstance().query_by_primaryKey<T>({
      tableName: tableName,
      value: value,
    });
  },

  /**
     * @method Modify data (return the modified array)
     * @param {Object}
     *   @property {string} tableName Indicate the table name
     *   @property {Function} condition data filtering condition
     *      @arg {Object} each element
     *      @return condition
     *   @property {Function} handle handle function: Receives a reference to the data and modifies it
     * 
     *  await getInstance().update<T>({
              tableName: 'bookrackList',
              condition: item => item.id === 8,
              handle: r => {
                r.name = 'new name';
              }
          })
     * */

  update: async <T>({
    tableName,
    condition,
    handle,
  }: Pick<DbOperate<T>, "tableName" | "condition" | "handle">): Promise<T> => {
    return await getInstance().update<T>({
      tableName: tableName,
      condition: condition,
      handle: handle,
    });
  },

  /**
    * @method Modifying a piece of data (by value of the primary key) Returns the modified object
    * @param {Object}
    *   @property {string} tableName Indicate the table name
    *   @property {String\|Number} value value of the primary key
    *   @property {Function} handle handle function: Receives a reference to the data and modifies it
    * 
    * await getInstance().update<T>({
        tableName: 'bookrackList',
        value: 1,
        handle: r => {
          r.name = 'new name';
        }
  })
    * */

  updateByPrimaryKey: async <T>({
    tableName,
    value,
    handle,
  }: Pick<DbOperate<T>, "tableName" | "value" | "handle">): Promise<T> => {
    return await getInstance().update_by_primaryKey<T>({
      tableName: tableName,
      value: value,
      handle: handle,
    });
  },

  /**
     * @method adds data to the table
     * @param {Object}
     *   @property {string} tableName Indicate the table name
     *   @property {Object} data The data you want to insert
     * 
     * await getInstance().insert<T>({
        tableName: 'bookrackList',
        data: {
          name: 'alice',
        }
      })

     * */
  insert: async <T>({
    tableName,
    data,
  }: Pick<DbOperate<T>, "tableName" | "data">): Promise<T> => {
    return await getInstance().insert<T>({
      tableName: tableName,
      data: data,
    });
  },

  /**
     * @method delete data (return the deleted array)
     * @param {Object}
     *   @property {string} tableName Indicate the table name
     *   @property {Function} condition data filtering condition
     *      @arg {Object} each element
     *      @return condition
     * await getInstance().delete<T>({
        tableName: 'bookrackList',
        condition: (item)=> item.name === 'testname',
      })
     * */

  delete_: async <T>({
    tableName,
    condition,
  }: Pick<DbOperate<T>, "tableName" | "condition">): Promise<T> => {
    return await getInstance().delete<T>({
      tableName: tableName,
      condition: condition,
    });
  },

  /**
   * @method delete data from the table (by value of the primary key)
   * @param {Object}
   *   @property {string} tableName Indicate the table name
   *   @property {String\|Number} value value of the primary key
   * */
  deleteByPrimaryKey: async <T>({
    tableName,
    value,
  }: Pick<DbOperate<T>, "tableName" | "value">): Promise<T> => {
    return await getInstance().delete_by_primaryKey<T>({
      tableName: tableName,
      value: value,
    });
  },

  /**
   *@method close database
   * @param  {[type]} db [database name]
   */
  unInit: async (): Promise<unknown> => {
    return await getInstance().close_db();
  },

  /**
   * @method delete the database
   * @param {string}name database name
   *
   * await getInstance().delete_db('bookrackList')
   *
   */
  deleteDB: async (dbName: string): Promise<unknown> => {
    return await getInstance().delete_db(dbName);
  },

  /**
   * @method delete table name of the database
   * @param {string}name database name
   *
   * await getInstance().delete_table('bookrackList')
   *
   */
  deleteTable: async (tableName: string): Promise<unknown> => {
    return await getInstance().delete_table(tableName);
  },
};

export type { TsIndexDb, IIndexDb, DbOperate, DbCountOperate };
