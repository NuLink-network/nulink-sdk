import { getGlobalThis } from '@offirmo/globalthis-ponyfill'
import { asUint8Array } from './util/as-uint8array'


/**
 * Returns a `Uint8Array` of the requested size. Referenced memory will
 * be initialized to 0.
 */
export const alloc = (size = 0): Uint8Array => {
  const globalThis = getGlobalThis();

  if (globalThis.Buffer?.alloc != null) {
    return asUint8Array(globalThis.Buffer.alloc(size))
  }

  return new Uint8Array(size)
}

/**
 * Where possible returns a Uint8Array of the requested size that references
 * uninitialized memory. Only use if you are certain you will immediately
 * overwrite every value in the returned `Uint8Array`.
 */
export const allocUnsafe = (size = 0): Uint8Array => {
  const globalThis = getGlobalThis();

  if (globalThis.Buffer?.allocUnsafe != null) {
    return asUint8Array(globalThis.Buffer.allocUnsafe(size))
  }

  return new Uint8Array(size)
}
