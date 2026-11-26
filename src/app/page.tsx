import PlayerPanel from "../players/PlayerPanel";
import { loadPlayers } from "../players/actions";
import AttendancePanel from "../attendance/AttendancePanel";
import { loadAttendance } from "../attendance/actions";
import Link from "next/link";
import { logout } from "../auth/actions";
import { requireSession } from "../auth/session";

export default async function Home({ searchParams }: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireSession();
  const { tab } = await searchParams;
  const active = tab === "pemain" || tab === "reward" ? "Pemain" : "Absen";

  return (
    <main className="min-h-dvh bg-emerald-950 px-5 py-6 text-white">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">SOTKI Badminton Tracker</h1>
          <form action={logout}>
            <button className="rounded-lg border border-emerald-700 px-4 py-2 hover:bg-emerald-900">Keluar</button>
          </form>
        </header>
        <nav aria-label="Menu utama" className="mt-8 flex gap-2 border-b border-emerald-800">
          {(["Absen", "Pemain"] as const).map(tab => (
            <Link key={tab} href={tab === "Absen" ? "/" : "/?tab=pemain"}
              aria-current={tab === active ? "page" : undefined}
              className="border-b-2 border-transparent px-5 py-3 text-emerald-200 aria-[current=page]:border-emerald-300 aria-[current=page]:text-white">
              {tab}
            </Link>
          ))}
        </nav>
        <section className="py-8">
          <h2 className="mb-2 text-xl font-semibold">{active}</h2>
          {active === "Absen" ? <AttendancePanel {...await loadAttendance()} /> : (
            <PlayerPanel players={await loadPlayers()} />
          )}
        </section>
      </div>
    </main>
  );
}
