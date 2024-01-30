

export class GetDatasCallbackError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "GetDatasCallbackError";
  }
}


export class GetStorageDataError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "GetStorageDataError";
  }
}

export class SetStorageDataError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "SetStorageDataError";
  }
}