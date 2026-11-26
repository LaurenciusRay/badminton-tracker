"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "./session";

const windowMs = 60_000;
// One shared code and one application process. A global limit also works behind a proxy.
let failures = 0;
let resetAt = 0;

export async function login(data: FormData) {
  const now = Date.now();
  if (now >= resetAt) {
    failures = 0;
    resetAt = now + windowMs;
  }
  if (failures >= 10) redirect("/login?error=limit");
  const accessCode = process.env.SOTKI_ACCESS_CODE;
  if (!accessCode || !/^\d{6}$/.test(accessCode) || data.get("code") !== accessCode) {
    failures++;
    redirect("/login?error=code");
  }
  await startSession();
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
