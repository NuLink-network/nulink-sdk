export const toBytes = (str: string): Uint8Array =>
  new TextEncoder().encode(str); /** Returns "utf-8". */

export const fromBytes = (bytes: Uint8Array, encoding = 'utf8'): string =>
  new TextDecoder(encoding).decode(bytes);

export const fromHexString = (hexString: string): Uint8Array => {
  const matches = hexString.match(/.{1,2}/g) ?? [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
};

export const toHexString = (bytes: Uint8Array): string =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export const toBase64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64');

export const fromBase64 = (str: string): Uint8Array =>
  Buffer.from(str, 'base64');

const periodToEpoch = (period: number, secondsPerPeriod: number): number =>
  period * secondsPerPeriod * 1000;

const epochToPeriod = (epoch: number, secondsPerPeriod: number): number =>
  Math.floor(epoch / secondsPerPeriod);

const dateToPeriod = (date: Date, secondsPerPeriod: number): number =>
  epochToPeriod(date.getTime() * 1000, secondsPerPeriod);

/**
 * Returns the Date object at a given period, future, or past.
 * If startOfPeriod, the Date object represents the first second of said period.
 * @param period
 * @param secondsPerPeriod
 * @param startOfPeriod
 */
export const dateAtPeriod = (
  period: number,
  secondsPerPeriod: number,
  startOfPeriod: boolean
): Date => {
  if (startOfPeriod) {
    const atStartOfPeriod = periodToEpoch(period, secondsPerPeriod);
    return new Date(atStartOfPeriod);
  }
  const now = new Date(Date.now());
  const currentPeriod = dateToPeriod(now, secondsPerPeriod);
  const deltaPeriods = period - currentPeriod;
  return new Date(now.getTime() - secondsPerPeriod * deltaPeriods * 1000);
};

/**
 * Takes a future Date object and calculates the duration from now, returning in number of periods
 * @param futureDate
 * @param secondsPerPeriod
 * @param now
 * @returns
 */
export const calculatePeriodDuration = (
  futureDate: Date,
  secondsPerPeriod: number,
  now?: Date
): number => {
  if (!now) {
    now = new Date(Date.now());
  }
  const futurePeriod = dateToPeriod(futureDate, secondsPerPeriod);
  const currentPeriod = dateToPeriod(now, secondsPerPeriod);
  return futurePeriod - currentPeriod;
};

export const mergeWithoutUndefined = (
  A: Record<string, any>,
  B: Record<string, any>
) => {
  const res: Record<string, any> = {};
  Object.keys({ ...A, ...B }).map((key) => {
    res[key] = B[key] || A[key];
  });
  return res;
};

export const zip = (a: Array<any>, b: Array<any>) => a.map((k, i) => [k, b[i]]);

export const toEpoch = (date: Date) => (date.getTime() / 1000) | 0;

/* 

// 示例用法
const array = new Uint8Array([1, 2, 3, 4, 9, 1, 2, 3, 4, 9, 1, 2, 3, 5]);
const pattern = new Uint8Array([9, 1, 2, 3, 4]);

const splitArray = splitUint8ArrayByPattern(array, pattern);

console.log(splitArray); 

//----------output:----------
[Uint8Array: {
  "0": 1,
  "1": 2,
  "2": 3,
  "3": 4
}, Uint8Array: {
  "0": 9,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 5
}] 
*/
export function splitUint8ArrayByPattern(
  array: Uint8Array,
  pattern: Uint8Array
): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  let startIndex = 0;

  while (startIndex < array.length) {
    const endIndex = findPatternIndex(array, pattern, startIndex);
    if (endIndex === -1) {
      // If the specified pattern is not found, the remaining part will be treated as the last chunk.
      const chunk = array.subarray(startIndex);
      chunks.push(chunk);
      break;
    }

    const chunk = array.subarray(startIndex, endIndex);
    chunks.push(chunk);
    startIndex = endIndex + pattern.length;
  }

  return chunks;
}

function findPatternIndex(
  array: Uint8Array,
  pattern: Uint8Array,
  startIndex: number
): number {
  for (let i = startIndex; i <= array.length - pattern.length; i++) {
    let found = true;
    for (let j = 0; j < pattern.length; j++) {
      if (array[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      return i;
    }
  }
  return -1; // The specified pattern was not found.
}
