export const fromBytes = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

export const fromBytesByEncoding = (bytes: Uint8Array, encoding: BufferEncoding = "utf-8"): string =>
  Buffer.from(bytes.buffer).toString(encoding);
export const toBytesByEncoding = (str: string, encoding: BufferEncoding = "utf-8"): Uint8Array =>
  new Uint8Array(Buffer.from(str, encoding));
