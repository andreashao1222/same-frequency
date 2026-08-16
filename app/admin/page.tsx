"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Profile {
  id: string;
  alias: string | null;
  artists: string[];
  music_platform: string | null;
  music_profile_url: string | null;
  taste_tags: string[] | null;
  created_at: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProfiles() {
    setLoading(true);
    const res = await fetch("/api/admin/profiles", { cache: "no-store" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setAuthed(false);
      setError(data.error ?? "Could not load pool.");
      return;
    }
    setProfiles(data.profiles ?? []);
    setAuthed(true);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Incorrect password.");
    setPassword("");
    await loadProfiles();
  }

  async function remove(ids: string[]) {
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} profile${ids.length === 1 ? "" : "s"} from the pool?`)) return;
    setLoading(true);
    const res = await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Could not delete profiles.");
    setSelected([]);
    await loadProfiles();
  }

  if (!authed) {
    return (
      <main className="min-h-screen noise flex items-center justify-center px-6">
        <div className="w-full max-w-md border-2 border-black bg-[#f5f0e6] p-8 shadow-[7px_7px_0_#000]">
          <Link href="/" className="font-mono text-xs font-black uppercase tracking-[.18em]">← same frequency.</Link>
          <p className="retro-kicker mt-12">private area / pool management</p>
          <h1 className="display mt-3 text-6xl leading-none">admin.</h1>
          <form onSubmit={login} className="mt-10">
            <label className="font-mono text-xs font-bold uppercase tracking-[.12em]">password</label>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border-2 border-black bg-transparent px-4 py-3 font-mono outline-none"
            />
            {error && <p className="mt-3 font-mono text-xs text-red-700">{error}</p>}
            <button className="retro-button mt-5 w-full bg-black px-5 py-3 font-mono text-xs font-black uppercase tracking-[.12em] text-white" type="submit">
              enter pool →
            </button>
          </form>
        </div>
      </main>
    );
  }

  const allSelected = profiles.length > 0 && selected.length === profiles.length;

  return (
    <main className="min-h-screen noise px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b-2 border-black pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="font-mono text-xs font-black uppercase tracking-[.18em]">same frequency.</Link>
            <p className="retro-kicker mt-8">private area / pool management</p>
            <h1 className="display mt-2 text-6xl leading-none md:text-8xl">the pool.</h1>
          </div>
          <div className="font-mono text-xs uppercase tracking-[.12em]">{profiles.length} profiles</div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black py-5">
          <label className="flex items-center gap-3 font-mono text-xs uppercase">
            <input type="checkbox" checked={allSelected} onChange={(e) => setSelected(e.target.checked ? profiles.map(p => p.id) : [])} />
            select all
          </label>
          <button disabled={!selected.length || loading} onClick={() => remove(selected)} className="retro-button border border-black px-4 py-2 font-mono text-xs font-black uppercase disabled:opacity-30">
            delete selected ({selected.length})
          </button>
        </div>

        {error && <p className="border-b border-black py-3 font-mono text-xs text-red-700">{error}</p>}
        {loading && <p className="py-4 font-mono text-xs uppercase tracking-[.12em]">working...</p>}

        <div className="divide-y-2 divide-black">
          {profiles.map((profile) => {
            const checked = selected.includes(profile.id);
            return (
              <article key={profile.id} className="grid gap-5 py-6 md:grid-cols-[auto_1fr_auto] md:items-center">
                <input type="checkbox" checked={checked} onChange={() => setSelected(s => checked ? s.filter(id => id !== profile.id) : [...s, profile.id])} />
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h2 className="display text-3xl">{profile.alias ?? "listener"}</h2>
                    <span className="font-mono text-[10px] uppercase tracking-[.1em] text-neutral-500">{new Date(profile.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 font-mono text-xs leading-5">{(profile.artists ?? []).join(" · ")}</p>
                  {profile.music_profile_url && <p className="mt-1 truncate font-mono text-[10px] text-neutral-500">{profile.music_profile_url}</p>}
                </div>
                <button onClick={() => remove([profile.id])} className="font-mono text-[10px] font-black uppercase tracking-[.12em] underline underline-offset-4">delete</button>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
