export const hexString2ArrayBuffer = (hexString: string): ArrayBuffer => {
  const bytes = new Uint8Array(hexString.length / 2);

  // use Array.from() and map
  bytes.set(Array.from({ length: bytes.length }, (_, i) => parseInt(hexString.slice(i * 2, i * 2 + 2), 16)));

  const arrayBuffer: ArrayBuffer = bytes.buffer;
  // console.log(arrayBuffer);

  return arrayBuffer;
};


/**
 *  ArrayBuffer to convert to hex string
 * @param {ArrayBuffer} buffer - data for type of ArrayBuffer
 * @returns {string} - hex string
 * 
 * usage:
 * 
        const buffer = new Uint8Array([255, 16, 32]).buffer; // demo: ArrayBuffer
        const hexString = arrayBufferToHexString(buffer);
        console.log(hexString); // output: "ff1020" 
 */
export const  arrayBuffer2HexString = (buffer: ArrayBuffer): string  =>{
    const byteArray = new Uint8Array(buffer);
    let hexString = '';

    byteArray.forEach(byte => {
        // Convert each byte to hexadecimal and pad it to two digits.
        hexString += byte.toString(16).padStart(2, '0');
    });

    return hexString;
}

