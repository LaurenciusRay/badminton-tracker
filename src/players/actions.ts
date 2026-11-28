"use server";

import { and, count, eq, ne, notExists } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/session";
import { cleanMemberDisplayName, normalizeMemberName } from "../attendance/name";
import { db } from "../db";
import { attendances, members } from "../db/schema";
import { rewardProgress } from "./progress";

export async function loadPlayers() {
  await requireSession();
  return db.select({ id: members.id, name: members.name, total: count(attendances.id) })
    .from(members).leftJoin(attendances, eq(attendances.memberId, members.id)).groupBy(members.id).all()
    .map(p => ({ ...p, progress: rewardProgress(p.total) }))
    .sort((a, b) => b.progress - a.progress || a.name.localeCompare(b.name, "id"));
}

export type RenameResult = {
  error: string;
  duplicateMember?: { id: number; name: string };
};

export async function renamePlayer(id: number, name: string): Promise<RenameResult> {
  await requireSession();
  const cleaned = cleanMemberDisplayName(name);
  if (!Number.isSafeInteger(id) || typeof name !== "string" || !cleaned)
    return { error: "Isi nama pemain yang valid." };
  const normalized = normalizeMemberName(cleaned);
  let duplicateMember: { id: number; name: string } | undefined;
  const error = db.transaction(tx => {
    const duplicate = tx.select({ id: members.id, name: members.name }).from(members)
      .where(and(eq(members.normalizedName, normalized), ne(members.id, id))).get();
    if (duplicate) {
      duplicateMember = duplicate;
      return "Nama tersebut sudah digunakan pemain lain.";
    }
    const result = tx.update(members).set({ name: cleaned, normalizedName: normalized }).where(eq(members.id, id)).run();
    return result.changes ? "" : "Pemain sudah dihapus.";
  }, { behavior: "immediate" });
  if (!error) revalidatePath("/");
  return { error, duplicateMember };
}

export async function mergePlayers(sourceId: number, targetId: number): Promise<string> {
  await requireSession();
  if (!Number.isSafeInteger(sourceId) || !Number.isSafeInteger(targetId) || sourceId === targetId)
    return "Pemain tidak valid.";
  const error = db.transaction(tx => {
    const source = tx.select({ id: members.id, name: members.name }).from(members).where(eq(members.id, sourceId)).get();
    const target = tx.select({ id: members.id, name: members.name }).from(members).where(eq(members.id, targetId)).get();
    if (!source || !target) return "Pemain tidak ditemukan atau sudah dihapus.";

    const sourceAttendances = tx.select({ id: attendances.id, sessionId: attendances.sessionId })
      .from(attendances).where(eq(attendances.memberId, sourceId)).all();

    for (const att of sourceAttendances) {
      const existing = tx.select({ id: attendances.id })
        .from(attendances).where(and(eq(attendances.sessionId, att.sessionId), eq(attendances.memberId, targetId))).get();
      if (existing) {
        tx.delete(attendances).where(eq(attendances.id, att.id)).run();
      } else {
        tx.update(attendances).set({ memberId: targetId }).where(eq(attendances.id, att.id)).run();
      }
    }

    tx.delete(members).where(eq(members.id, sourceId)).run();
    return "";
  }, { behavior: "immediate" });
  if (!error) revalidatePath("/");
  return error;
}

export async function removePlayer(id: number) {
  await requireSession();
  if (!Number.isSafeInteger(id)) return "Pemain tidak valid.";
  const history = db.select({ id: attendances.id }).from(attendances).where(eq(attendances.memberId, members.id));
  const result = db.delete(members).where(and(eq(members.id, id), notExists(history))).run();
  if (!result.changes) return "Pemain sudah dihapus atau masih memiliki riwayat absensi.";
  revalidatePath("/");
  return "";
}
