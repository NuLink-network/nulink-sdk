export const getDecimalsLength = (value: number) => {
  /*
        5 -> 0
        1.0 -> 1  
        2.12 -> 2
    */

  const afterPoint = value.toString().split(".")[1];
  if (!afterPoint) {
    return 0;
  }

  return afterPoint.length;
};

export const DecimalToInteger = (value: number) => {
  /*
        5 -> 5/1
        1.0 -> 11/10  
        2.12 -> 212/100
    */

  const decimalsLength = getDecimalsLength(value);

  if (decimalsLength === 0) {
    return [value, 1];
  }

  const dividend = value * Math.pow(10, decimalsLength); // 212
  const divisor = Math.pow(10, decimalsLength);
  return [dividend, divisor];
};


export const  isNumeric = (str: string): boolean  =>{
  const regex = /^\d+$/; //Regular expression that indicates the string must be composed of numbers
  return regex.test(str);
}