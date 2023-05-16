export class UnauthorizedError extends Error {
  // need to login 401
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class PasswordDecryptError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "PasswordDecryptError"; // (2)
  }
}

export class getUrsulaError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "getUrsulaError"; // (2)
  }
}

export class GetActiveTabError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "GetActiveTabError"; // (2)
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "InsufficientBalanceError"; // (2)
  }
}

export class InvalidRootExtendedPrivateKeyError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "InvalidRootPrivateKeyError"; // (2)
  }
}

export class PolicyHasBeenActivedOnChain extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "PolicyHasBeenActivedOnChain"; // (2)
  }
}

export class UserDataVersionLowError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "UserDataVersionLowError"; // (2)
  }
}

export class UserDataCorruptedError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "UserDataCorruptedError"; // (2)
  }
}

/**
 * @internal
 */
export class NotImplementError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "NotImplementError"; // (2)
  }
}


export class MnemonicError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "MnemonicError"; // (2)
  }
}

export class RootExtendedPrivateKeyError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "RootExtendedPrivateKeyError"; // (2)
  }
}

export class ParameterError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "ParameterError"; // (2)
  }
}