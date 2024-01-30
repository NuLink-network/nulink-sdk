import { DataCategory } from "../types";

export const getDataCategoryString = (
  category: DataCategory | string
): string => {
  let result = "";
  if (typeof category == "number") {
    //e.g. DataCategory.Philosophy => typeof DataCategory.Philosophy == "number"

    if (typeof DataCategory[category.toString()] == "undefined") {
      result = category.toString();
    } else {
      result = DataCategory[category.toString()];
    }
  } else {
    //typeof category == "string"
    result = category as string;
  }

  return result;
};
