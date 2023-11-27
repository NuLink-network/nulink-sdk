import { FileCategory } from "../types";

export const getFileCategoryString = (
  fileCategory: FileCategory | string
): string => {
  let result = "";
  if (typeof fileCategory == "number") {
    //e.g. FileCategory.Philosophy => typeof FileCategory.Philosophy == "number"

    if (typeof FileCategory[fileCategory.toString()] == "undefined") {
      result = fileCategory.toString();
    } else {
      result = FileCategory[fileCategory.toString()];
    }
  } else {
    //typeof fileCategory == "string"
    result = fileCategory as string;
  }

  return result;
};
