import { redirect } from "next/navigation";
import { login } from "../../auth/actions";
import { currentSession } from "../../auth/session";

export default async function Login({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentSession()) redirect("/");
  const { error } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-emerald-950 px-5 text-white">
      <section className="w-full max-w-sm">
        <h1 className="mb-8 text-4xl font-semibold tracking-tight">SOTKI Badminton Tracker</h1>
        <form action={login} className="grid gap-3">
          <label htmlFor="code">Kode akses</label>
          <input id="code" name="code" type="password" inputMode="numeric" pattern="[0-9]{6}"
            maxLength={6} required className="rounded-lg bg-white px-4 py-3 text-emerald-950" />
          {error && <p role="alert">{error === "limit" ? "Terlalu banyak percobaan. Coba lagi dalam satu menit." : "Kode akses salah."}</p>}
          <button className="rounded-lg bg-emerald-200 py-3 font-semibold text-emerald-950">Masuk</button>
        </form>
      </section>
    </main>
  );
}
