"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

type PoolProfile = {
  id: string;
  alias: string;
  artists: string[];
  taste_tags: string[];
  created_at: string;
  score: number | null;
  sharedArtists: string[];
  sharedTags: string[];
};

export default function PoolPage() {
  const [profiles, setProfiles] = useState<PoolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasOwnProfile, setHasOwnProfile] = useState(false);

  useEffect(() => {
    const ownId = localStorage.getItem("sf_profile_id");
    setHasOwnProfile(Boolean(ownId));

    const load = async () => {
      try {
        const query = ownId ? `?exclude=${encodeURIComponent(ownId)}` : "";
        const res = await fetch(`/api/pool${query}`, { cache: "no-store" });
        const data = await res.json();
        if (res.ok) setProfiles(data.profiles ?? []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="min-h-screen noise">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-mono text-sm font-black uppercase tracking-[.18em]">
          same frequency.
        </Link>
        <Link href="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em]">
          <ArrowLeft size={14} /> home
        </Link>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="border-b-2 border-black pb-10">
          <p className="retro-kicker">the listener archive</p>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="display text-6xl leading-[.88] md:text-8xl">
                everyone in<br /><i>the frequency.</i>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600">
                Browse the people who have joined Same Frequency. Open any listener to read their full cultural report.
              </p>
            </div>
            <div className="retro-label shrink-0 text-xs font-black uppercase">
              {profiles.length} listener{profiles.length === 1 ? "" : "s"} / archive
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center font-mono text-xs uppercase tracking-[.16em] text-neutral-500">
            loading the archive…
          </div>
        ) : profiles.length === 0 ? (
          <div className="mt-10 border border-black p-8 text-center">
            <h2 className="display text-4xl">The pool is empty.</h2>
            <p className="mt-3 text-sm text-neutral-600">Be the first frequency in the archive.</p>
            <Link href="/join" className="retro-button mt-7 inline-flex bg-black px-6 py-3 text-sm font-bold text-white">
              join the pool →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {profiles.map((profile, index) => (
              <Link
                key={profile.id}
                href={`/matches?id=${encodeURIComponent(profile.id)}`}
                className="group border border-black bg-white/45 p-6 transition hover:-translate-y-1 hover:bg-[#d8df62]"
              >
                <div className="flex items-start justify-between gap-5 border-b border-black/20 pb-5">
                  <div>
                    <p className="retro-kicker text-neutral-500">listener {String(index + 1).padStart(3, "0")}</p>
                    <h2 className="display mt-2 text-3xl">{profile.alias}</h2>
                  </div>
                  <ArrowUpRight size={18} className="shrink-0 transition group-hover:rotate-45" />
                </div>

                <ol className="mt-5 space-y-2">
                  {profile.artists.map((artist, i) => (
                    <li key={`${profile.id}-${artist}`} className="flex gap-3 text-sm font-bold">
                      <span className="font-mono text-xs text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
                      {artist}
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-wrap gap-2">
                  {profile.taste_tags.slice(0, 4).map(tag => (
                    <span key={tag} className="retro-tag px-3 py-1.5 text-[9px]">{tag}</span>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-black/20 pt-4">
                  <span className="text-xs font-bold underline underline-offset-4">read report ↗</span>
                  {hasOwnProfile && profile.score !== null && (
                    <span className="font-mono text-xs font-black">{profile.score}% similar</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 flex items-center justify-between border-t border-black pt-6 text-xs text-neutral-500">
          <span>same frequency. / listener archive</span>
          <Link href="/join" className="font-bold text-black underline">join the pool →</Link>
        </div>
      </section>
    </main>
  );
}
