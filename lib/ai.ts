import { getTasteProfile, getTasteProfileFromTags, getCulturalMatches, getMusicalOpposite } from "@/lib/taste";

export type CulturalMatch = {
  type: "artist" | "album" | "movie" | "book";
  title: string;
  meta: string;
  reason: string;
  url?: string;
};

export type AIReport = {
  tags: string[];
  description: string;
  portrait: string;
  redFlag: string;
  color: string;
  weather: string;
  place: string;
  season: string;
  feeling: string;
  culturalMatches: CulturalMatch[];
  opposite: { title: string; meta: string; reason: string; url?: string };
};

// No external AI API is used here. The report is generated locally from the
// Spotify artist names + genre metadata already returned by Spotify search.
// This keeps the public site free to run and avoids API credits/rate limits.
export async function analyzeTasteWithAI(
  artists: string[],
  artistGenres: string[][] = []
): Promise<AIReport> {
  const profile = getTasteProfile(artists, artistGenres);
  const culturalMatches = getCulturalMatches(artists, profile.tags, 4) as CulturalMatch[];
  const opposite = getMusicalOpposite(artists, profile.tags);

  return {
    ...profile,
    culturalMatches,
    opposite
  };
}

export function rebuildLocalReport(artists: string[], storedTags: string[] = [], artistGenres: string[][] = []): AIReport {
  const profile = storedTags.length
    ? getTasteProfileFromTags(artists, storedTags)
    : getTasteProfile(artists, artistGenres);
  return {
    ...profile,
    culturalMatches: getCulturalMatches(artists, profile.tags, 4) as CulturalMatch[],
    opposite: getMusicalOpposite(artists, profile.tags)
  };
}

export class AIAnalysisError extends Error {}
