"use client";

import { useState, useTransition } from "react";
import { deleteAttendance, saveAttendance, type loadAttendance } from "./actions";
import { normalizeMemberName } from "./name";
import { parseChat } from "./parser";

type Props = Awaited<ReturnType<typeof loadAttendance>>;
const field = "w-full min-w-0 rounded-lg bg-white px-3 py-2 text-emerald-950";
const button = "rounded-lg border border-emerald-600 px-4 py-2 hover:bg-emerald-900 disabled:opacity-50";

export default function AttendancePanel({ today, memberKeys, history }: Props) {
  const [raw, setRaw] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof parseChat> | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const known = new Set(memberKeys);
  const filled = draft?.names.map(normalizeMemberName).filter(Boolean) ?? [];
  const existing = filled.filter(n => known.has(n)).length;

  function mutate(operation: () => Promise<{ error: string }>, success: string, clear = false) {
    setMessage("");
    startTransition(async () => {
      try {
        const { error } = await operation();
        setMessage(error || success);
        if (!error && clear) {
          setDraft(null);
          setRaw("");
        }
      } catch {
        setMessage("Koneksi terganggu. Periksa riwayat sebelum mencoba lagi.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <fieldset disabled={pending} className="grid min-w-0 gap-3">
        <label htmlFor="chat">Chat WhatsApp</label>
        <textarea className={field} id="chat" rows={6} value={raw} onChange={e => {
          setRaw(e.target.value);
          setDraft(null);
          setMessage("");
        }} />
        <button className={button + " justify-self-start"} disabled={!raw.trim()} onClick={() => {
          setDraft(parseChat(raw, today));
          setMessage("");
        }}>Preview</button>
        {draft && <>
          {draft.warning && <p role="alert" className="text-amber-200">{draft.warning}</p>}
          <label htmlFor="play-date">Tanggal bermain</label>
          <input className={field} id="play-date" type="date" max={today} value={draft.date}
            onChange={e => setDraft({ ...draft, date: e.target.value })} />
          <p>{filled.length} pemain · {existing} member terdaftar · {filled.length - existing} NEW</p>
          <ol className="space-y-2">
            {draft.names.map((name, i) => (
              <li key={i} className="flex items-center gap-2">
                <span>{i + 1}.</span>
                <input className={field} aria-label={`Nama pemain ${i + 1}`} value={name} onChange={e => {
                  const names = draft.names.slice();
                  names[i] = e.target.value;
                  setDraft({ ...draft, names });
                }} />
                <span className="text-xs text-emerald-200">{!name.trim() ? "—" : known.has(normalizeMemberName(name)) ? "Member" : "NEW"}</span>
                <button className="p-2" aria-label={`Hapus pemain ${i + 1}`}
                  onClick={() => setDraft({ ...draft, names: draft.names.filter((_, j) => j !== i) })}>×</button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button className={button} disabled={draft.names.length >= 40}
              onClick={() => setDraft({ ...draft, names: [...draft.names, ""] })}>Tambah pemain</button>
            <button className="rounded-lg bg-emerald-200 px-4 py-2 font-semibold text-emerald-950"
              onClick={() => mutate(() => saveAttendance(draft.date, raw, draft.names), "Absensi tersimpan.", true)}>
              Konfirmasi dan simpan
            </button>
          </div>
        </>}
      </fieldset>
      <p role="status" aria-live="polite">{pending ? "Memproses…" : message}</p>
      <section>
        <h3 className="mb-3 text-lg font-semibold">Riwayat terbaru</h3>
        {!history.length && <p className="text-emerald-200">Belum ada sesi bermain.</p>}
        {history.map(session => (
          <details key={session.id} className="border-b border-emerald-800 py-3">
            <summary className="cursor-pointer">{session.date} · {session.names.length} pemain</summary>
            <ol className="my-3 list-inside list-decimal">{session.names.map(name => <li key={name}>{name}</li>)}</ol>
            <button className={button} disabled={pending} onClick={() => {
              if (window.confirm(`Hapus sesi ${session.date} beserta absensinya? Data member tetap tersimpan.`))
                mutate(() => deleteAttendance(session.id), "Sesi dihapus.");
            }}>Hapus sesi</button>
          </details>
        ))}
      </section>
    </div>
  );
}
