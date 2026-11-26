import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function databasePath() {
  const filename = resolve(process.env.DATABASE_PATH || "./data/badminton.sqlite");
  mkdirSync(dirname(filename), { recursive: true });
  return filename;
}
