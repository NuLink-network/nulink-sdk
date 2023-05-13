/*
//The currently designed page calls the plugin logic
//Click the button on the page: pass in the parameters and function name (or message name), call the plug-in authorization, the user clicks OK, the plug-in obtains the default account, splices the parameters and calls the incoming function, and calls the page function after completion, or sends a message to tell the calling interface As a result, the page performs the next action.
Therefore, the interactive page is put into components, the exposed message or interface distribution is put into api / route, which is exported by this file (index.ts), and api is the basic packaging interface.
Only exposed messages are exported here, and functions that are directly called cannot be exported, otherwise the front end can be called at will.
*/

import { localStore } from "./localstorage";
import { indexdbStore } from "./indexdbstorage";
import { diskStore } from "./diskstorage";
import { sessionStore } from "./sessionstorage";

export { indexdbStore } from "./indexdbstorage";
export { localStore } from "./localstorage";
export { diskStore } from "./diskstorage";
export { sessionStore } from "./sessionstorage";

const bDiskStore = process.env.REACT_APP_STORAGE === "disk";
const blocalStore = process.env.REACT_APP_STORAGE === "localstorage";

/**
 * @internal
 */
export const store = bDiskStore
  ? diskStore
  : blocalStore
  ? localStore
  : indexdbStore;
