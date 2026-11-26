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
  const [editing, setEditing] = useState<Props["history"][number] | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const known = new Set(memberKeys);
  const current = editing ?? draft;
  const filled = current?.names.map(normalizeMemberName).filter(Boolean) ?? [];
  const existing = filled.filter(n => known.has(n)).length;

  function updateDraft(value: { date: string; names: string[] }) {
    if (editing) setEditing({ ...editing, ...value });
    else if (draft) setDraft({ ...draft, ...value });
  }

  function mutate(operation: () => Promise<{ error: string }>, success: string, clear = false) {
    setMessage("");
    startTransition(async () => {
      try {
        const { error } = await operation();
        setMessage(error || success);
        if (!error && clear) {
          if (editing) setEditing(null);
          else { setDraft(null); setRaw(""); }
        }
      } catch {
        setMessage("Koneksi terganggu. Periksa riwayat sebelum mencoba lagi.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <fieldset id="attendance-editor" disabled={pending} className="grid min-w-0 gap-3">
        {!editing && <><label htmlFor="chat">Chat WhatsApp</label>
        <textarea className={field} id="chat" rows={6} value={raw} onChange={e => {
          setRaw(e.target.value);
          setDraft(null);
          setMessage("");
        }} />
        <button className={button + " justify-self-start"} disabled={!raw.trim()} onClick={() => {
          setDraft(parseChat(raw, today));
          setMessage("");
        }}>Preview</button></>}
        {current && <>
          {!editing && draft?.warning && <p role="alert" className="text-amber-200">{draft?.warning}</p>}
          {editing && <div className="flex items-center justify-between"><strong>Revisi sesi {history.find(s => s.id === editing.id)?.date}</strong><button className={button} onClick={() => setEditing(null)}>Batal</button></div>}
          <label htmlFor="play-date">Tanggal bermain</label>
          <input className={field} id="play-date" type="date" max={today} value={current.date}
            onChange={e => updateDraft({ ...current, date: e.target.value })} />
          <p>{filled.length} pemain · {existing} member terdaftar · {filled.length - existing} NEW</p>
          <datalist id="member-names">{memberKeys.map(key => <option key={key} value={key} />)}</datalist>
          <ol className="space-y-2">
            {current.names.map((name, i) => (
              <li key={i} className="grid grid-cols-[2rem_minmax(0,12rem)_3rem_2.75rem] items-center gap-2">
                <span className="text-right tabular-nums">{i + 1}.</span>
                <input list="member-names" className={field} aria-label={`Nama pemain ${i + 1}`} value={name} onChange={e => {
                  const names = current.names.slice();
                  names[i] = e.target.value;
                  updateDraft({ ...current, names });
                }} />
                <span className="text-xs text-emerald-200">{!name.trim() ? "—" : known.has(normalizeMemberName(name)) ? "Member" : "NEW"}</span>
                <button className="grid size-11 place-items-center rounded-lg bg-red-400/15 text-2xl leading-none text-red-200 transition-colors hover:bg-red-400/25 focus-visible:outline-2 focus-visible:outline-red-300 active:bg-red-400/35" aria-label={`Hapus pemain ${i + 1}`}
                  onClick={() => updateDraft({ ...current, names: current.names.filter((_, j) => j !== i) })}>×</button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button className={button} disabled={current.names.length >= 40}
              onClick={() => updateDraft({ ...current, names: [...current.names, ""] })}>Tambah pemain</button>
            <button className="rounded-lg bg-emerald-200 px-4 py-2 font-semibold text-emerald-950"
              onClick={() => mutate(() => saveAttendance(current.date, raw, current.names, editing?.id), "Absensi tersimpan.", true)}>
              {editing ? "Simpan revisi" : "Konfirmasi dan simpan"}
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
            <button className={button + " mr-2"} disabled={pending || !!editing} onClick={() => {
              setEditing(session); setMessage("");
              document.getElementById("attendance-editor")?.scrollIntoView({ block: "start" });
            }}>Edit sesi</button>
            <button className={button} disabled={pending || !!editing} onClick={() => {
              if (window.confirm(`Hapus sesi ${session.date} beserta absensinya? Data member tetap tersimpan.`))
                mutate(() => deleteAttendance(session.id), "Sesi dihapus.");
            }}>Hapus sesi</button>
          </details>
        ))}
      </section>
    </div>
  );
}
