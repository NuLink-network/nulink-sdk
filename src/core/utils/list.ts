export const equal = (array1, array2): boolean => {
  if (array1.length !== array2.length) {
    return false;
  } else {
    for (let i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) {
        return false;
      }
    }
    return true;
  }
};

/**
 *  To randomly select multiple elements from an array.
 * @param arr 
 * @param count 
 * @returns array
 * @example 
            const myArray = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Charlie' }, { id: 4, name: 'Dave' }];
            const randomElements = getRandomElementsFromArray(myArray, 2);

            console.log(myArray); // [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 3, name: 'Charlie' }, { id: 4, name: 'Dave' }]
            console.log(randomElements); // [{ id: 3, name: 'Charlie' }, { id: 1, name: 'Alice' }]
 */

export const getRandomElementsFromArray = <T>(array: T[], count: number): T[]  => {
  const shuffled = array.slice(0);
  let i = array.length;
  let temp: T;
  let randIndex: number;

  while (i--) {
    randIndex = Math.floor((i + 1) * Math.random());
    temp = shuffled[randIndex];
    shuffled[randIndex] = shuffled[i];
    shuffled[i] = temp;
  }

  return shuffled.slice(0, count);
}

