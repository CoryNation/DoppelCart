import { callChatModel } from "@/lib/openai";

export interface PersonaFromCorpusInput {
  userName?: string;        // optional persona name from user
  userDescription?: string; // what the user says they want this persona to achieve
  corpusSummary: string;    // preprocessed text from CSV or AI history
  mode: "digital_twin_csv" | "ai_history_import";
}

export interface PersonaFromCorpusResult {
  personaDraft: {
    name: string;
    tagline: string;
    goals: string[];
    audience: string;
    tone: string;
    style_traits: string[];
    content_topics: string[];
    do: string[];
    dont: string[];
    bio: string;
  };
  debug_summary?: string;
}

const SYSTEM_PROMPT = `You are a Persona Architect helping create a social media persona based on a corpus of text that reflects the user's voice, thinking, or content style.

Your task is to analyze the provided text corpus and create a single, cohesive persona optimized for content creation that matches the style and voice evident in the corpus.

The persona should be:
- Authentic to the voice and style in the corpus
- Optimized for social media content creation
- Cohesive and consistent
- Ready to generate engaging content

You must output ONLY a JSON object matching this exact structure:
{
  "personaDraft": {
    "name": "string - a memorable name for this persona",
    "tagline": "string - a short tagline that captures the essence",
    "goals": ["string"] - 3-5 clear content goals,
    "audience": "string - description of who this persona speaks to",
    "tone": "string - primary tone (e.g., 'witty', 'professional', 'casual', 'inspiring')",
    "style_traits": ["string"] - 3-5 key style characteristics,
    "content_topics": ["string"] - 5-7 main topics this persona covers,
    "do": ["string"] - 3-5 things this persona should do/say,
    "dont": ["string"] - 3-5 things this persona should avoid,
    "bio": "string - 2-3 paragraph biography that captures the persona's essence"
  },
  "debug_summary": "string - optional brief summary of what you extracted"
}

Return JSON ONLY. No markdown, no commentary, no extra text.`;

export async function generatePersonaFromCorpus(
  input: PersonaFromCorpusInput
): Promise<PersonaFromCorpusResult> {
  const { userName, userDescription, corpusSummary, mode } = input;

  // Build context-aware user message
  let userMessage = `I'm providing text that reflects my voice, thinking, or content style. `;
  
  if (mode === "digital_twin_csv") {
    userMessage += `This is based on my public posts/comments from social media. `;
  } else if (mode === "ai_history_import") {
    userMessage += `This is based on my AI conversation history, which may be more internal or conceptual. `;
  }

  // Add persona context if provided
  if (userName || userDescription) {
    userMessage += `\n\nPERSONA CONTEXT:\n`;
    if (userName) {
      userMessage += `Persona Name: ${userName}\n`;
    }
    if (userDescription) {
      userMessage += `Purpose/Description: ${userDescription}\n`;
    }
    userMessage += `\n`;
  }

  userMessage += `\nText corpus:\n${corpusSummary}`;

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    { role: "user" as const, content: userMessage },
  ];

  const responseContent = await callChatModel({
    messages,
    model: process.env.OPENAI_MODEL_DEFAULT || "gpt-4o-mini",
    temperature: 0.7,
    responseFormatType: "json_object",
  });

  let parsedContent: unknown;
  try {
    parsedContent = JSON.parse(responseContent);
  } catch (parseError) {
    console.error(
      "JSON parse error from persona corpus generator:",
      parseError,
      "Content preview:",
      responseContent.substring(0, 500)
    );
    throw new Error("Failed to parse AI response. Please try again.");
  }

  if (!parsedContent || typeof parsedContent !== "object") {
    console.error(
      "AI response is not an object:",
      typeof parsedContent,
      "Preview:",
      responseContent.substring(0, 500)
    );
    throw new Error("Received invalid response format from AI. Please try again.");
  }

  const contentRecord = parsedContent as Record<string, unknown>;

  // Validate required structure
  if (!contentRecord.personaDraft || typeof contentRecord.personaDraft !== "object") {
    console.error(
      "AI response missing personaDraft:",
      Object.keys(contentRecord),
      "Preview:",
      responseContent.substring(0, 500)
    );
    throw new Error("Received incomplete response from AI. Please try again.");
  }

  const personaDraft = contentRecord.personaDraft as Record<string, unknown>;

  // Validate required fields in personaDraft
  const requiredFields = [
    "name",
    "tagline",
    "goals",
    "audience",
    "tone",
    "style_traits",
    "content_topics",
    "do",
    "dont",
    "bio",
  ];

  for (const field of requiredFields) {
    if (!(field in personaDraft)) {
      console.error(
        `Missing required field in personaDraft: ${field}`,
        "Available fields:",
        Object.keys(personaDraft),
        "Preview:",
        responseContent.substring(0, 500)
      );
      throw new Error(`Received incomplete persona data. Missing: ${field}`);
    }
  }

  return {
    personaDraft: {
      name: String(personaDraft.name),
      tagline: String(personaDraft.tagline),
      goals: Array.isArray(personaDraft.goals) ? personaDraft.goals.map(String) : [],
      audience: String(personaDraft.audience),
      tone: String(personaDraft.tone),
      style_traits: Array.isArray(personaDraft.style_traits) ? personaDraft.style_traits.map(String) : [],
      content_topics: Array.isArray(personaDraft.content_topics) ? personaDraft.content_topics.map(String) : [],
      do: Array.isArray(personaDraft.do) ? personaDraft.do.map(String) : [],
      dont: Array.isArray(personaDraft.dont) ? personaDraft.dont.map(String) : [],
      bio: String(personaDraft.bio),
    },
    debug_summary: contentRecord.debug_summary ? String(contentRecord.debug_summary) : undefined,
  };
}

