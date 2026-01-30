import fs from "fs";
import path from "path";
import { mustExistDir } from "../utils/fsSafe.js";
import { AppError } from "../utils/errors.js";

export const loadKnowledgeIndex = async () => {
  try {
    const dir = path.join(process.cwd(), "data", "knowledge");
    mustExistDir(dir);

    const indexPath = path.join(dir, "index.json");
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

    if (!Array.isArray(index.documents)) {
      throw new AppError("Invalid knowledge index.json", 500, "KNOWLEDGE_INDEX_INVALID");
    }

    return index.documents.map((f) => {
      const p = path.join(dir, f);
      return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
    });
  } catch (err) {
    throw new AppError(`Failed to load knowledge: ${err.message}`, 500, err.code || "KNOWLEDGE_LOAD_FAILED");
  }
};
