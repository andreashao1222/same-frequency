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
  const apiKey = process.env.ARK_API_KEY;
  if (!apiKey) throw new AIAnalysisError("ARK_API_KEY is missing on the server.");

  // 火山方舟在线推理使用你在控制台创建的推理接入点 ID（Endpoint ID）。
  const model = process.env.ARK_MODEL;
  if (!model) throw new AIAnalysisError("ARK_MODEL is missing on the server. Set it to your Ark inference endpoint ID.");
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
    // 火山方舟提供 OpenAI-compatible Chat Completions 接口。
    // 为了兼容不同豆包模型，这里使用 json_object + prompt schema，
    // 而不是依赖 OpenAI Responses API 的 json_schema 格式。
    const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You must return ONLY valid JSON. No markdown, no code fences, no commentary.

The JSON must follow this exact shape and field types:
${JSON.stringify(schema, null, 2)}`
          },
          { role: "user", content: input }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 1800
      }),
      cache: "no-store"
    });

    const rawText = await response.text();
    if (!response.ok) {
      let message = `Doubao request failed (${response.status}).`;
      try {
        const parsed = JSON.parse(rawText);
        const apiMessage = parsed?.error?.message;
        if (apiMessage) message += ` ${apiMessage}`;
      } catch {}
      console.error("Doubao taste analysis failed:", response.status, rawText);
      throw new AIAnalysisError(message, response.status);
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new AIAnalysisError("Doubao returned an invalid response.");
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error("Doubao response had no message content:", data);
      throw new AIAnalysisError("Doubao returned no taste report.");
    }

    let parsedReport: unknown;
    try {
      parsedReport = JSON.parse(content);
    } catch {
      throw new AIAnalysisError("Doubao returned invalid JSON output.");
    }

    const report = cleanReport(parsedReport);

    if (report.tags.length < 3 || report.culturalMatches.length !== 4) {
      throw new AIAnalysisError("AI returned an incomplete taste report. Please try again.");
    }

    return report;
  } catch (error) {
    if (error instanceof AIAnalysisError) throw error;
    console.error("Doubao taste analysis error:", error);
    throw new AIAnalysisError("Could not complete the AI taste analysis.");
  }
}
