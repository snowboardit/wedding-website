import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeJson(filePath, obj) {
  const json = JSON.stringify(obj, null, 2) + "\n";
  await fs.writeFile(filePath, json, "utf8");
}

export async function cleanDir(dirPath) {
  // remove contents, keep directory
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  await Promise.all(
    entries.map(async (ent) => {
      const p = path.join(dirPath, ent.name);
      if (ent.isDirectory()) {
        await fs.rm(p, { recursive: true, force: true });
      } else {
        await fs.rm(p, { force: true });
      }
    }),
  );
}
