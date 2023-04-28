
import { getGlobalThis } from '@offirmo/globalthis-ponyfill'

/**
 * To guarantee Uint8Array semantics, convert nodejs Buffers
 * into vanilla Uint8Arrays
 */
export const asUint8Array = (buf: Uint8Array): Uint8Array => {
  const globalThis = getGlobalThis();
  if (globalThis.Buffer != null) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
  }

  return buf
}
