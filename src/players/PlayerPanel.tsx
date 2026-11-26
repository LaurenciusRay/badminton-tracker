"use client";

import { useRef, useState, useTransition } from "react";
import { normalizeMemberName } from "../attendance/name";
import { renamePlayer, removePlayer, type loadPlayers } from "./actions";

type Player = Awaited<ReturnType<typeof loadPlayers>>[number];
const button = "min-h-11 rounded-lg border border-emerald-700 px-3 aria-pressed:bg-emerald-800 disabled:opacity-50";
const iconButton = "grid size-11 place-items-center rounded-lg hover:bg-emerald-900";

export default function PlayerPanel({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");
  const [onlyReward, setOnlyReward] = useState(false);
  const [message, setMessage] = useState("");
  const [edit, setEdit] = useState<Player | null>(null);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const rewards = players.filter(p => p.progress === 4);
  const visible = (onlyReward ? rewards : players).filter(p => normalizeMemberName(p.name).includes(normalizeMemberName(query)));

  async function copy() {
    const text = ["POTONGAN DISKON 10K :", ...rewards.map(p => "• " + p.name), "",
      "Note :", "• play 4x, potongan 10K next play"].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Daftar reward disalin.");
    } catch {
      window.prompt("Salin daftar reward", text);
    }
  }

  return <div className="space-y-3">
    <input type="search" aria-label="Cari pemain" placeholder="Cari nama pemain" value={query}
      onChange={e => setQuery(e.target.value)} className="w-full rounded-lg bg-white px-3 py-2 text-emerald-950" />
    <div className="flex flex-wrap gap-2">
      <button className={button} aria-pressed={!onlyReward} onClick={() => setOnlyReward(false)}>Semua ({players.length})</button>
      <button className={button} aria-pressed={onlyReward} onClick={() => setOnlyReward(true)}>Reward ({rewards.length})</button>
      <button className={button} disabled={!rewards.length} onClick={copy}>Copy List Reward</button>
    </div>
    <p role="status">{message}</p>
    {!visible.length && <p>Tidak ada pemain yang sesuai.</p>}
    <ul>{visible.map(p => <li key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto_6rem] items-center gap-2 border-b border-emerald-800 py-2">
      <div className="min-w-0 break-words">{p.name}
        {p.progress === 4 && <small className="block text-emerald-300">Potongan 10K</small>}
      </div>
      <span role="img" aria-label={`Progres ${p.progress} dari 4`} className="flex">
        {[1, 2, 3, 4].map(i => <svg key={i} aria-hidden="true" viewBox="0 0 20 20" fill="currentColor"
          className={`size-4 ${i <= p.progress ? "text-green-400" : "text-gray-500"}`}>
          <circle cx="10" cy="6" r="3.5" /><path d="M3 18v-2a7 7 0 0 1 14 0v2z" /></svg>)}
      </span>
      <div className="flex gap-2">
        <button className={iconButton} disabled={pending} aria-label={`Edit ${p.name}`} onClick={() => {
          setEdit(p); setError(""); dialog.current?.showModal();
        }}><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" /></svg></button>
        <button className={iconButton + " text-red-300"} disabled={pending} aria-label={`Hapus ${p.name}`} onClick={() => {
          if (confirm(`Hapus pemain ${p.name}?`)) start(async () => {
            try { setMessage(await removePlayer(p.id) || "Pemain dihapus."); }
            catch { setMessage("Gagal menghapus pemain."); }
          });
        }}><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" /></svg></button>
      </div>
    </li>)}</ul>
    <dialog ref={dialog} aria-labelledby="edit-title" className="m-auto w-[min(90vw,24rem)] rounded-lg bg-emerald-950 p-5 text-white backdrop:bg-black/60">
      <form className="grid gap-3" onSubmit={e => {
        e.preventDefault();
        if (!edit || pending) return;
        start(async () => {
          try {
            const problem = await renamePlayer(edit.id, edit.name);
            if (problem) { setError(problem); return; }
            dialog.current?.close(); setMessage("Nama pemain diperbarui.");
          } catch { setError("Gagal menyimpan nama."); }
        });
      }}>
        <label id="edit-title" htmlFor="edit-name">Edit nama pemain</label>
        <input id="edit-name" autoFocus required value={edit?.name ?? ""} disabled={pending}
          onChange={e => edit && setEdit({ ...edit, name: e.target.value })} className="rounded-lg bg-white p-2 text-emerald-950" />
        {error && <p role="alert">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className={button} disabled={pending} onClick={() => dialog.current?.close()}>Batal</button>
          <button className={button} disabled={pending}>Simpan</button></div>
      </form>
    </dialog>
  </div>;
}
