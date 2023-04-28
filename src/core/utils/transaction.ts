import SingletonService from "singleton-service";
import AwaitLock from "await-lock";
import { isBlank } from "./null";

export const getTransactionNonceLock = async (): Promise<AwaitLock> => {
  // for get instance with saved key

  const waitLockName = "TransactionCountAwaitLock";
  const waitLock = SingletonService.get<AwaitLock>(waitLockName);

  if (isBlank(waitLock)) {
    const waitLockNew = new AwaitLock(); //Generation strategy (key spanning tree path) index

    SingletonService.set<AwaitLock>(waitLockName, waitLockNew, true);
  }

  return SingletonService.get<AwaitLock>(waitLockName);
};