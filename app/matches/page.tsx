"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Music2, Sparkles } from "lucide-react";
import { getTasteProfile, recommendArtists } from "@/lib/taste";

type Profile = {
  id: string;
  alias: string;
  artists: string[];
  spotify_url: string;
  taste_tags: string[];
  score?: number;
  sharedArtists?: string[];
  sharedTags?: string[];
};

export default function MatchesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id") || localStorage.getItem("sf_profile_id");
    const artists = JSON.parse(localStorage.getItem("sf_artists") || "[]");
    const spotify = localStorage.getItem("sf_spotify") || "";
    if (!id) { setLoading(false); return; }

    const taste = getTasteProfile(artists);
    setProfile({ id, alias: "you", artists, spotify_url: spotify, taste_tags: taste.tags });

    fetch(`/api/matches?exclude=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => setMatches(data.matches ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (!profile && !loading) {
    return (
      <main className="min-h-screen grid place-items-center noise p-6">
        <div className="text-center">
          <h1 className="display text-5xl">No taste profile yet.</h1>
          <Link href="/join" className="mt-6 inline-block bg-black px-6 py-3 font-bold text-white">Make one →</Link>
        </div>
      </main>
    );
  }

  if (!profile) return <main className="min-h-screen grid place-items-center noise">Loading…</main>;

  const taste = getTasteProfile(profile.artists);
  const recs = recommendArtists(profile.artists, 5);

  return (
    <main className="min-h-screen noise">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black">same frequency.</Link>
        <Link href="/join" className="text-sm font-bold underline">edit my taste</Link>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <div className="border-b-2 border-black pb-10">
          <p className="text-xs font-bold uppercase tracking-[.25em]">your frequency</p>
          <h1 className="display mt-4 text-6xl md:text-8xl">Your taste is<br/><i>{taste.description}.</i></h1>
          <div className="mt-8 flex flex-wrap gap-2">
            {taste.tags.map(tag => <span key={tag} className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white">{tag}</span>)}
          </div>
        </div>

        <section className="mt-12 border border-black bg-[#d9ff57] p-6 md:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><Sparkles size={14}/> for your next rabbit hole</p>
              <h2 className="display mt-3 text-4xl md:text-5xl">5 artists you might love.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-700">Picked from the same sonic neighborhood, with an extra bias toward artists you may be less likely to already know.</p>
            </div>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-5">
            {recs.map((artist, i) => (
              <a key={artist.name} href={artist.spotifyUrl} target="_blank" rel="noreferrer" className="group border border-black bg-white/50 p-4 hover:bg-white">
                <p className="text-xs text-neutral-500">0{i + 1}</p>
                <h3 className="mt-8 font-black">{artist.name}</h3>
                <p className="mt-2 text-[11px] leading-4 text-neutral-600">{artist.tags.slice(0, 2).join(" · ")}</p>
                <p className="mt-5 text-xs font-bold underline group-hover:no-underline">open Spotify ↗</p>
              </a>
            ))}
          </div>
        </section>

        <div className="mt-14 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold">people on your frequency</p>
            <p className="mt-1 text-sm text-neutral-500">{loading ? "finding your closest listeners…" : `${matches.length} profiles in the current pool`}</p>
          </div>
        </div>

        {!loading && matches.length === 0 && (
          <div className="mt-7 border border-dashed border-black p-10 text-center">
            <p className="display text-3xl">You&apos;re early.</p>
            <p className="mt-2 text-sm text-neutral-600">Share the site with a few music-obsessed friends and come back when the pool grows.</p>
          </div>
        )}

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          {matches.map((user, i) => (
            <article key={user.id} className="card transition-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-neutral-500">#{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-1 text-2xl font-black">@{user.alias}</h2>
                </div>
                <div className="text-right">
                  <p className="display text-5xl">{user.score}%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest">match</p>
                </div>
              </div>

              <p className="mt-7 flex items-center gap-2 text-sm text-neutral-600"><Music2 size={15}/> {getTasteProfile(user.artists).description}</p>

              {user.sharedArtists && user.sharedArtists.length > 0 && (
                <p className="mt-4 text-xs font-bold">You both listen to: <span className="font-normal">{user.sharedArtists.join(" · ")}</span></p>
              )}
              {user.sharedTags && user.sharedTags.length > 0 && (
                <p className="mt-2 text-xs text-neutral-500">Sonic overlap: {user.sharedTags.slice(0, 3).join(" · ")}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {user.artists.map(a => {
                  const same = profile.artists.some(x => x.toLowerCase() === a.toLowerCase());
                  return <span key={a} className={`rounded-full px-3 py-1.5 text-xs font-bold ${same ? "bg-[#d9ff57]" : "bg-neutral-200"}`}>{a}</span>;
                })}
              </div>

              <a href={user.spotify_url} target="_blank" rel="noreferrer" className="mt-7 flex items-center justify-center gap-2 border border-black px-4 py-3 text-sm font-bold hover:bg-black hover:text-white">
                View Spotify profile <ExternalLink size={15}/>
              </a>
            </article>
          ))}
        </div>

        <div className="mt-16 border-t border-black pt-8 text-xs leading-5 text-neutral-500">
          same frequency. only displays the alias, five selected artists, taste tags and Spotify profile link that a member chose to submit. No private Spotify account data is pulled into the site.
        </div>
      </section>
    </main>
  );
}