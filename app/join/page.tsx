"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Plus, X } from "lucide-react";

const suggestions = [
  "Clairo", "Phoebe Bridgers", "Laufey", "The 1975", "Ethel Cain",
  "Lorde", "The Marías", "Mitski", "beabadoobee", "Caroline Polachek"
];

export default function JoinPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [spotify, setSpotify] = useState("");
  const [error, setError] = useState("");

  const addArtist = (name: string) => {
    const clean = name.trim();
    if (!clean || artists.length >= 5 || artists.includes(clean)) return;
    setArtists([...artists, clean]);
    setQuery("");
  };

  const removeArtist = (name: string) => setArtists(artists.filter(a => a !== name));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (artists.length !== 5) return setError("Choose exactly 5 artists.");
    if (!spotify.includes("open.spotify.com/")) return setError("Paste a valid Spotify profile link.");
    localStorage.setItem("sf_artists", JSON.stringify(artists));
    localStorage.setItem("sf_spotify", spotify.trim());
    router.push("/matches");
  };

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(query.toLowerCase()) && !artists.includes(s)
  );

  return (
    <main className="min-h-screen noise">
      <nav className="mx-auto flex max-w-5xl items-center px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold"><ArrowLeft size={16}/> back</Link>
      </nav>

      <div className="mx-auto max-w-3xl px-6 pb-20 pt-8">
        <p className="text-xs font-bold uppercase tracking-[.25em]">join the taste pool</p>
        <h1 className="display mt-5 text-6xl leading-none md:text-8xl">What are you<br/><i>listening to?</i></h1>

        <form onSubmit={submit} className="mt-14 space-y-12">
          <section>
            <div className="mb-4 flex items-end justify-between">
              <label className="text-sm font-bold">your top 5 artists</label>
              <span className="text-sm text-neutral-500">{artists.length} / 5</span>
            </div>

            <div className="flex min-h-16 flex-wrap gap-2 border-b-2 border-black py-3">
              {artists.map((artist, i) => (
                <span key={artist} className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
                  <span className="text-neutral-400">{i + 1}</span>{artist}
                  <button type="button" onClick={() => removeArtist(artist)} aria-label={`Remove ${artist}`}><X size={14}/></button>
                </span>
              ))}
              {artists.length < 5 && (
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); addArtist(query); }
                  }}
                  placeholder={artists.length ? "add another..." : "type an artist..."}
                  className="min-w-[180px] flex-1 bg-transparent py-2 outline-none placeholder:text-neutral-400"
                />
              )}
            </div>

            {query && artists.length < 5 && (
              <div className="mt-2 border border-black bg-white">
                {filtered.slice(0, 5).map(s => (
                  <button type="button" key={s} onClick={() => addArtist(s)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#d9ff57]">
                    {s}<Plus size={16}/>
                  </button>
                ))}
                {!filtered.length && <button type="button" onClick={() => addArtist(query)} className="w-full px-4 py-3 text-left hover:bg-[#d9ff57]">Add “{query}”</button>}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.slice(0, 6).map(s => !artists.includes(s) && (
                <button key={s} type="button" onClick={() => addArtist(s)} className="rounded-full border border-neutral-400 px-3 py-1.5 text-xs hover:border-black hover:bg-white">{s}</button>
              ))}
            </div>
          </section>

          <section>
            <label className="text-sm font-bold">your Spotify profile</label>
            <p className="mt-1 text-sm text-neutral-500">Only your public Spotify link is shown to other users.</p>
            <input
              value={spotify}
              onChange={e => setSpotify(e.target.value)}
              placeholder="https://open.spotify.com/user/..."
              className="mt-5 w-full border-b-2 border-black bg-transparent py-4 text-lg outline-none placeholder:text-neutral-400 focus:bg-white"
            />
          </section>

          {error && <p className="border border-red-700 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}

          <button className="flex w-full items-center justify-center gap-3 bg-black px-7 py-5 text-lg font-bold text-white hover:bg-[#222]">
            <Check size={20}/> Find my frequency
          </button>

          <p className="text-center text-xs text-neutral-500">
            By joining, you agree that your selected artists and Spotify profile link can be displayed to other members.
          </p>
        </form>
      </div>
    </main>
  );
}