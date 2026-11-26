import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const lifetime = 30 * 24 * 60 * 60;
const directory = join(dirname(process.env.DATABASE_PATH || "./data/badminton.sqlite"), "sessions");
const cookieName = "sotki_session";

function sessionPath(token: string) {
  return join(directory, createHash("sha256").update(token).digest("hex"));
}

function expiresAt(path: string) {
  try {
    return Number(readFileSync(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }
}

export async function currentSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const path = sessionPath(token);
  return expiresAt(path) > Date.now() ? path : null;
}

export async function requireSession() {
  const path = await currentSession();
  if (!path) redirect("/login");
  return path;
}

export async function startSession() {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (/^[a-f0-9]{64}$/.test(name) && expiresAt(path) <= Date.now()) rmSync(path, { force: true });
  }

  const token = randomBytes(32).toString("hex");
  writeFileSync(sessionPath(token), String(Date.now() + lifetime * 1000), { mode: 0o600, flag: "wx" });
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: lifetime,
  });
}

export async function endSession() {
  const path = await requireSession();
  rmSync(path, { force: true });
  (await cookies()).delete(cookieName);
}
