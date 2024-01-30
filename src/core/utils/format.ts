//date to seconds
export const toEpoch = (date: Date) => (date.getTime() / 1000) | 0;

export const fromHexString = (hexString: string): Uint8Array => {
  const matches = hexString.match(/.{1,2}/g) ?? [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
};

export const toHexString = (bytes: Uint8Array): string =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

/**
 * 
    demo
    const myString = 'https://example.com/';
    const result = removeTrailingSlash(myString);
    console.log(result); //output: 'https://example.com'

 * @param str 
 * @returns 
 */
export function removeTrailingSlash(str: string): string {
  if (str.endsWith("/")) {
    return str.slice(0, -1);
  }
  return str;
}
