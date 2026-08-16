"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Music2 } from "lucide-react";
import { getMatches, seedUsers, User } from "@/lib/data";

type Match = User & { score: number };

export default function MatchesPage() {
  const [artists, setArtists] = useState<string[]>([]);
  const [spotify, setSpotify] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("sf_artists") || "[]");
    const profile = localStorage.getItem("sf_spotify") || "";
    setArtists(saved);
    setSpotify(profile);
    if (saved.length) setMatches(getMatches(saved, seedUsers));
  }, []);

  if (!artists.length) {
    return (
      <main className="min-h-screen grid place-items-center noise p-6">
        <div className="text-center">
          <h1 className="display text-5xl">No taste profile yet.</h1>
          <Link href="/join" className="mt-6 inline-block bg-black px-6 py-3 font-bold text-white">Make one →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen noise">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black">same frequency.</Link>
        <Link href="/join" className="text-sm font-bold underline">edit my taste</Link>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="border-b-2 border-black pb-10">
          <p className="text-xs font-bold uppercase tracking-[.25em]">your frequency</p>
          <h1 className="display mt-4 text-6xl md:text-8xl">You&apos;re not the<br/><i>only one.</i></h1>
          <div className="mt-8 flex flex-wrap gap-2">
            {artists.map(a => <span key={a} className="rounded-full border border-black px-4 py-2 text-sm font-bold">{a}</span>)}
          </div>
          {spotify && <p className="mt-5 text-xs text-neutral-500">Spotify profile connected ✓</p>}
        </div>

        <div className="mt-12 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold">your closest matches</p>
            <p className="mt-1 text-sm text-neutral-500">Based on your favorite artists.</p>
          </div>
          <span className="text-sm text-neutral-500">{matches.length} people</span>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          {matches.map((user, i) => (
            <article key={user.id} className="card transition-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-500">#{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-1 text-2xl font-black">@{user.username}</h2>
                </div>
                <div className="text-right">
                  <p className="display text-5xl">{user.score}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest">match</p>
                </div>
              </div>

              <p className="mt-7 flex items-center gap-2 text-sm text-neutral-600"><Music2 size={15}/> {user.bio}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {user.artists.map(a => {
                  const same = artists.some(x => x.toLowerCase() === a.toLowerCase());
                  return <span key={a} className={`rounded-full px-3 py-1.5 text-xs font-bold ${same ? "bg-[#d9ff57]" : "bg-neutral-200"}`}>{a}</span>;
                })}
              </div>

              <a href={user.spotify} target="_blank" rel="noreferrer" className="mt-7 flex items-center justify-center gap-2 border border-black px-4 py-3 text-sm font-bold hover:bg-black hover:text-white">
                View Spotify profile <ExternalLink size={15}/>
              </a>
            </article>
          ))}
        </div>

        <div className="mt-16 border border-black bg-[#d9ff57] p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest">mvp note</p>
          <p className="mt-3 max-w-2xl text-lg leading-7">
            These are demo profiles for the first version. The next step is connecting a real database and Spotify artist search so every person who joins becomes part of the pool.
          </p>
          <Link href="/join" className="mt-6 inline-flex items-center gap-2 text-sm font-black underline"><ArrowLeft size={15}/> add another profile</Link>
        </div>
      </section>
    </main>
  );
}