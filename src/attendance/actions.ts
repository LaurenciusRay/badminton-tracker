"use server";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/session";
import { db } from "../db";
import { attendances, members, playSessions } from "../db/schema";
import { normalizeMemberName } from "./name";
import { jakartaToday, validDate } from "./parser";

export async function loadAttendance() {
  await requireSession();
  const sessions = db.select({ id: playSessions.id, date: playSessions.playDate }).from(playSessions)
    .orderBy(desc(playSessions.playDate)).limit(20).all();
  const rows = db.select({ sessionId: attendances.sessionId, name: members.name }).from(attendances)
    .innerJoin(members, eq(members.id, attendances.memberId))
    .where(inArray(attendances.sessionId, sessions.map(s => s.id))).orderBy(asc(attendances.id)).all();
  return {
    today: jakartaToday(),
    memberKeys: db.select({ key: members.normalizedName }).from(members).all().map(m => m.key),
    history: sessions.map(s => ({ ...s, names: rows.filter(r => r.sessionId === s.id).map(r => r.name) })),
  };
}

export async function saveAttendance(date: string, raw: string, names: string[]) {
  await requireSession();
  if (typeof date !== "string" || !validDate(date) || date > jakartaToday())
    return { error: "Pilih tanggal bermain yang valid sampai hari ini." };
  if (typeof raw !== "string" || !raw.trim()) return { error: "Chat asli masih kosong." };
  if (!Array.isArray(names) || names.length < 1 || names.length > 40)
    return { error: "Jumlah pemain harus 1–40." };
  if (names.some(n => typeof n !== "string" || !normalizeMemberName(n)))
    return { error: "Isi atau hapus nama pemain yang kosong." };
  const keys = names.map(normalizeMemberName);
  if (new Set(keys).size !== keys.length) return { error: "Ada nama pemain yang sama. Periksa daftar pemain." };
  try {
    const saved = db.transaction(tx => {
      const session = tx.insert(playSessions).values({ playDate: date, rawText: raw })
        .onConflictDoNothing({ target: playSessions.playDate }).returning({ id: playSessions.id }).get();
      if (!session) return false;
      tx.insert(members).values(names.map((name, i) => ({ name: name.trim(), normalizedName: keys[i] })))
        .onConflictDoNothing({ target: members.normalizedName }).run();
      const ids = new Map(tx.select().from(members).where(inArray(members.normalizedName, keys)).all()
        .map(m => [m.normalizedName, m.id]));
      tx.insert(attendances).values(keys.map(key => ({ sessionId: session.id, memberId: ids.get(key)! }))).run();
      return true;
    }, { behavior: "immediate" });
    if (!saved) return { error: "Sesi pada tanggal ini sudah tercatat." };
  } catch {
    return { error: "Sesi gagal disimpan. Coba lagi." };
  }
  revalidatePath("/");
  return { error: "" };
}

export async function deleteAttendance(id: number) {
  await requireSession();
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Sesi tidak valid." };
  try {
    if (!db.delete(playSessions).where(eq(playSessions.id, id)).run().changes)
      return { error: "Sesi sudah dihapus." };
  } catch {
    return { error: "Gagal menghapus sesi. Coba lagi." };
  }
  revalidatePath("/");
  return { error: "" };
}
