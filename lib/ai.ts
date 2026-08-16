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

export class AIAnalysisError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AIAnalysisError";
    this.status = status;
  }
}

export async function analyzeTasteWithAI(
  artists: string[],
  artistGenres: string[][] = []
): Promise<AIReport> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIAnalysisError("OPENAI_API_KEY is missing on the server.");

  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const artistContext = artists.map((artist, i) => {
    const genres = artistGenres[i]?.filter(Boolean).join(", ");
    return `${i + 1}. ${artist}${genres ? ` (Spotify catalog genres: ${genres})` : ""}`;
  }).join("\n");

  const input = `You are the taste editor for an experimental music-culture website called same frequency.

Analyze this listener's five favorite artists:
${artistContext}

This is a taste-analysis task, not a generic recommendation task. Treat the five artists as evidence and reason about what they have in common AND where they differ. Do not assume that "indie" or "alternative" is the default. If the artists are primarily hip-hop, rap, trap, R&B, pop, metal, country, electronic, jazz, etc., say so explicitly.

Infer useful dimensions such as:
- actual genre / subgenre
- production style
- rhythm and instrumentation
- vocal approach
- songwriting / lyrical style
- emotional register
- scale: intimate vs maximalist
- theatricality, experimentation, polish, rawness
- cultural or aesthetic tendencies

Write a playful, stylish cultural report that feels specific enough that the listener might screenshot it. Keep it about music and cultural taste. Do not make claims about mental health, diagnosis, intelligence, morality, or other sensitive traits.

Requirements:
- tags: 3-6 concise sonic/aesthetic tags. Use actual dominant genres when appropriate (hip-hop, rap, trap, R&B, pop rap, drill, jazz, metal, etc.). Never output indie/alternative unless the selected artists genuinely support them.
- description: one concise sentence summarizing the listener's sonic world.
- portrait: 2-3 witty but grounded sentences that clearly reference the musical evidence.
- redFlag: one funny sentence about a music-taste habit.
- color/weather/place/season/feeling: vivid but concise metaphors.
- culturalMatches: exactly four items: one artist, one album, one movie, and one book. Make them genuinely connected to this specific taste, not a fixed generic list. The artist should be a plausible discovery rather than one of the five input artists.
- opposite: choose one deliberately opposite cultural object (artist, album, movie, or book). It should be funny and defensible as an aesthetic opposite.
- Do not provide URLs; the website creates links for music items.
- Do not mention that you are an AI.

Before returning the JSON, sanity-check the tags against the five artists. If five major rap/hip-hop artists are supplied, a result dominated by indie/alternative is incorrect.`;

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
      }),
      cache: "no-store"
    });

    const rawText = await response.text();
    if (!response.ok) {
      let message = `OpenAI request failed (${response.status}).`;
      try {
        const parsed = JSON.parse(rawText);
        const apiMessage = parsed?.error?.message;
        if (apiMessage) message += ` ${apiMessage}`;
      } catch {}
      console.error("OpenAI taste analysis failed:", response.status, rawText);
      throw new AIAnalysisError(message, response.status);
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new AIAnalysisError("OpenAI returned an invalid response.");
    }

    if (!data.output_text) {
      console.error("OpenAI response had no output_text:", data);
      throw new AIAnalysisError("OpenAI returned no taste report.");
    }

    let parsedReport: unknown;
    try {
      parsedReport = JSON.parse(data.output_text);
    } catch {
      throw new AIAnalysisError("OpenAI returned invalid structured output.");
    }

    const report = cleanReport(parsedReport);

    if (report.tags.length < 3 || report.culturalMatches.length !== 4) {
      throw new AIAnalysisError("AI returned an incomplete taste report. Please try again.");
    }

    return report;
  } catch (error) {
    if (error instanceof AIAnalysisError) throw error;
    console.error("OpenAI taste analysis error:", error);
    throw new AIAnalysisError("Could not complete the AI taste analysis.");
  }
}
