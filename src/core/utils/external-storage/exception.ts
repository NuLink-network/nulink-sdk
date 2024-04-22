

export class GetDataCallbackError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "GetDataCallbackError";
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