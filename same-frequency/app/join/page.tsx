"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Plus, X } from "lucide-react";

type Artist = { id: string; name: string; spotifyUrl: string };

export default function JoinPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [spotify, setSpotify] = useState("");
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim() || artists.length >= 5) { setResults([]); return; }
      setSearching(true);
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.artists ?? []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, artists.length]);

  const addArtist = (artist: Artist) => {
    if (artists.length >= 5 || artists.some(a => a.id === artist.id)) return;
    setArtists([...artists, artist]);
    setQuery("");
    setResults([]);
  };

  const removeArtist = (id: string) => setArtists(artists.filter(a => a.id !== id));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (artists.length !== 5) return setError("Choose exactly 5 artists.");
    if (spotify.trim() && !/^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}(?:-[A-Z]{2})?\/)?(?:user|profile)\//i.test(spotify.trim())) {
      return setError("Paste a valid Spotify profile link.");
    }

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artists: artists.map(a => a.name), spotifyUrl: spotify.trim() })
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Something went wrong.");

    localStorage.setItem("sf_profile_id", data.profile.id);
    localStorage.setItem("sf_artists", JSON.stringify(artists.map(a => a.name)));
    localStorage.setItem("sf_spotify", spotify.trim());
    router.push(`/matches?id=${data.profile.id}`);
  };

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
                <span key={artist.id} className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
                  <span className="text-neutral-400">{i + 1}</span>{artist.name}
                  <button type="button" onClick={() => removeArtist(artist.id)}><X size={14}/></button>
                </span>
              ))}
              {artists.length < 5 && (
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={artists.length ? "search another artist..." : "search an artist..."}
                  className="min-w-[220px] flex-1 bg-transparent py-2 outline-none placeholder:text-neutral-400"
                />
              )}
            </div>

            {(results.length > 0 || searching) && (
              <div className="mt-2 border border-black bg-white">
                {searching && <p className="px-4 py-3 text-sm text-neutral-500">searching Spotify…</p>}
                {results.map(artist => (
                  <button type="button" key={artist.id} onClick={() => addArtist(artist)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#d9ff57]">
                    {artist.name}<Plus size={16}/>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-neutral-500">Search results come from Spotify. Pick the exact artist rather than typing free-form text.</p>
          </section>

          <section>
            <label className="text-sm font-bold">your Spotify profile <span className="font-normal text-neutral-400">(optional)</span></label>
            <p className="mt-1 text-sm text-neutral-500">Optional. Add it if you want friends to be able to find you on Spotify — you do not need Spotify to use the experiment.</p>
            <input
              value={spotify}
              onChange={e => setSpotify(e.target.value)}
              placeholder="https://open.spotify.com/user/... (optional)"
              className="mt-5 w-full border-b-2 border-black bg-transparent py-4 text-lg outline-none placeholder:text-neutral-400 focus:bg-white"
            />
          </section>

          {error && <p className="border border-red-700 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}

          <button className="flex w-full items-center justify-center gap-3 bg-black px-7 py-5 text-lg font-bold text-white hover:bg-[#222]">
            <Check size={20}/> Find my frequency
          </button>

          <p className="text-center text-xs text-neutral-500">
            By joining, you agree that your selected artists and optional Spotify profile link can be displayed to other members.
          </p>
        </form>
      </div>
    </main>
  );
}