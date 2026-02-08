import fetch from "node-fetch";
import { AppError } from "../utils/errors.js";

const repo = "LexBANK/BSU";

const getToken = () => {
  const token = process.env.GITHUB_BSU_TOKEN;
  if (!token) {
    throw new AppError("Missing GITHUB_BSU_TOKEN", 500, "MISSING_GITHUB_TOKEN");
  }
  return token;
};

export const createFile = async (path, content) => {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const token = getToken();

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify({
      message: `Create ${path}`,
      content: Buffer.from(content).toString("base64")
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new AppError(`GitHub create file failed: ${text}`, 500, "GITHUB_CREATE_FILE_FAILED");
  }

  return res.json();
};
