import { sql } from "drizzle-orm";
import { check, customType, index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export function normalizeMemberName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase().normalize("NFKC");
}

// Apply the same normalization to Drizzle writes and bound query values.
const normalizedText = customType<{ data: string; driverData: string }>({
  dataType: () => "text",
  toDriver: normalizeMemberName,
});

const createdAt = () => integer("created_at", { mode: "timestamp_ms" })
  .notNull().default(sql`(unixepoch('subsec') * 1000)`);
const updatedAt = () => integer("updated_at", { mode: "timestamp_ms" })
  .notNull().default(sql`(unixepoch('subsec') * 1000)`).$onUpdate(() => new Date());

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  normalizedName: normalizedText("normalized_name").notNull().unique(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  check("members_name_nonempty", sql`length(trim(${t.name}, char(9,10,11,12,13,32))) > 0`),
  check("members_normalized_name_nonempty", sql`length(trim(${t.normalizedName}, char(9,10,11,12,13,32))) > 0`),
]);

// A Jakarta calendar date, stored independently of UTC audit timestamps.
export const playSessions = sqliteTable("play_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playDate: text("play_date").notNull().unique(),
  rawText: text("raw_text").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  check("play_sessions_valid_date", sql`${t.playDate} glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' and date(${t.playDate}, '+0 days') is ${t.playDate}`),
]);

export const attendances = sqliteTable("attendances", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => playSessions.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
}, (t) => [
  unique("attendances_session_member_unique").on(t.sessionId, t.memberId),
  index("attendances_member_idx").on(t.memberId),
]);
