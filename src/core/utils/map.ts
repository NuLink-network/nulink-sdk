export const  mapToJson = <T1, T2>(map: Map<T1, T2>) => {
  return JSON.stringify([...Array.from(map)]);
}

export const  jsonToMap = (jsonStr: string) => {
  return new Map(JSON.parse(jsonStr));
}

