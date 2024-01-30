
export const dataSuffix = (dataName: string): string => {
  const lastIndex = dataName.lastIndexOf(".");
  if (lastIndex < 0) {
    return "";
  }
  return dataName.substring(lastIndex + 1);
};

//* Convert resBlob to ArrayBuffer
export const blobToArrayBuffer = (blob: Blob) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e: any) => {
      const dataArrayBuffer = new Uint8Array(e?.target?.result).buffer;
      resolve(dataArrayBuffer);
    }
    reader.readAsArrayBuffer(blob);
  });
}

export const getSize = (size: number | string) => `${(Number(size) / (1024 * 1024)).toFixed(2)} M`