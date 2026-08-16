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
  opposite: {
    title: string;
    meta: string;
    reason: string;
    url?: string;
  };
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    tags: { type: "array", items: { type: "string" } },
    description: { type: "string" },
    portrait: { type: "string" },
    redFlag: { type: "string" },
    color: { type: "string" },
    weather: { type: "string" },
    place: { type: "string" },
    season: { type: "string" },
    feeling: { type: "string" },
    culturalMatches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string", enum: ["artist", "album", "movie", "book"] },
          title: { type: "string" },
          meta: { type: "string" },
          reason: { type: "string" }
        },
        required: ["type", "title", "meta", "reason"]
      }
    },
    opposite: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        meta: { type: "string" },
        reason: { type: "string" }
      },
      required: ["title", "meta", "reason"]
    }
  },
  required: [
    "tags", "description", "portrait", "redFlag", "color", "weather", "place", "season",
    "feeling", "culturalMatches", "opposite"
  ]
};

function spotifySearch(title: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(title)}`;
}

function addLinks(report: AIReport): AIReport {
  return {
    ...report,
    culturalMatches: report.culturalMatches.map(item => ({
      ...item,
      ...(item.type === "artist" || item.type === "album" ? { url: spotifySearch(item.title) } : {})
    })),
    opposite: {
      ...report.opposite,
      ...(report.opposite.meta.toLowerCase().includes("album") ? { url: spotifySearch(report.opposite.title) } : {})
    }
  };
}

function cleanReport(value: unknown): AIReport {
  const raw = value as Partial<AIReport>;
  const cultural = Array.isArray(raw.culturalMatches) ? raw.culturalMatches : [];
  const opposite = raw.opposite && typeof raw.opposite === "object" ? raw.opposite : {};
  return addLinks({
    tags: Array.isArray(raw.tags) ? raw.tags.map(String).slice(0, 6) : ["eclectic"],
    description: String(raw.description || ""),
    portrait: String(raw.portrait || "Your taste feels specific, curious, and hard to fake."),
    redFlag: String(raw.redFlag || "You probably have very strong opinions about the skip button."),
    color: String(raw.color || "off-white"),
    weather: String(raw.weather || "cloudy evening"),
    place: String(raw.place || "a room with good speakers"),
    season: String(raw.season || "late autumn"),
    feeling: String(raw.feeling || "quiet anticipation"),
    culturalMatches: cultural.slice(0, 4).map((item: any) => ({
      type: ["artist", "album", "movie", "book"].includes(item?.type) ? item.type : "album",
      title: String(item?.title || "Unknown"),
      meta: String(item?.meta || ""),
      reason: String(item?.reason || "A left-field connection to your taste.")
    })),
    opposite: {
      title: String((opposite as any).title || "Something completely different"),
      meta: String((opposite as any).meta || "culture · opposite energy"),
      reason: String((opposite as any).reason || "This deliberately goes in the opposite direction from your usual taste.")
    }
  });
}

export async function analyzeTasteWithAI(
  artists: string[],
  artistGenres: string[][] = []
): Promise<AIReport | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const artistContext = artists.map((artist, i) => {
    const genres = artistGenres[i]?.filter(Boolean).join(", ");
    return `${i + 1}. ${artist}${genres ? ` (catalog genres: ${genres})` : ""}`;
  }).join("\n");

  const input = `You are the taste editor for an experimental music-culture website called same frequency.\n\nAnalyze this listener's five favorite artists:\n${artistContext}\n\nYour job is NOT to classify the listener with a generic genre label. Infer the interesting intersection of these artists: production choices, songwriting, vocal style, emotional register, ambition, cultural scale, rhythm, texture, theatricality, intimacy, etc. Pay attention to contradictions between the artists too.\n\nWrite a playful, stylish cultural report that feels specific enough that the listener might screenshot it. Do not make claims about mental health, diagnosis, intelligence, morality, or other sensitive traits. Keep it about taste and aesthetics.\n\nRequirements:\n- tags: 3-6 concise sonic/aesthetic tags. Use the actual dominant genres when appropriate (for example hip-hop, rap, trap, R&B, indie rock, art pop, etc.). Never default to indie/alternative unless the selected artists genuinely support that.\n- portrait: 2-3 sentences, witty but grounded in the five artists.\n- redFlag: one funny sentence about a music-taste habit.\n- color/weather/place/season/feeling: vivid but concise.\n- culturalMatches: exactly four items: one artist, one album, one movie, and one book. They should be genuinely different from one another and connected to the listener's taste for a clear reason. Avoid recommending any of the five input artists. The artist recommendation should be a plausible discovery, not an obvious adjacent superstar.\n- opposite: choose a deliberately opposite cultural object (artist, album, movie, or book). It should be funny and defensible as an aesthetic opposite, not just a random unpopular thing.\n- Do not provide URLs; the website will create Spotify search links for music items.\n- Do not mention that you are an AI.\n`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        store: false,
        input,
        text: {
          format: {
            type: "json_schema",
            name: "same_frequency_taste_report",
            strict: true,
            schema
          }
        }
      })
    });

    if (!response.ok) {
      console.error("OpenAI taste analysis failed:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (!data.output_text) return null;
    return cleanReport(JSON.parse(data.output_text));
  } catch (error) {
    console.error("OpenAI taste analysis error:", error);
    return null;
  }
}
