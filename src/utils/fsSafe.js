import fs from "fs";

export const mustExistDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    const err = new Error(`Directory not found: ${dirPath}`);
    err.code = "DIR_NOT_FOUND";
    throw err;
  }
};
