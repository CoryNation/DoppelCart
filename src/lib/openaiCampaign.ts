import { z } from "zod";
import { callChatModel } from "@/lib/openai";
import type { Campaign } from "@/types/campaign";

export interface CampaignPersonaContext {
  id: string;
  display_name: string;
  biography?: string | null;
  occupation?: string | null;
  industry?: string | null;
  personality?: { tone?: string } | null;
  goals?: string[] | null;
  voice?: string | null;
  niche?: string | null;
}

const GeneratedPostSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  image_prompt: z.string().optional(),
  recommended_platforms: z.array(z.string().min(1)).min(1).max(4),
});

const CampaignContentResponseSchema = z.object({
  posts: z.array(GeneratedPostSchema).min(3).max(5),
});

const SYSTEM_PROMPT = `You are DoppelCart's campaign content AI.
Create platform-ready social content that aligns with the persona and campaign brief.
Return concise, high-signal writing free from marketing cliches.
You MUST respond with valid JSON only.`;

export type GeneratedCampaignContent = z.infer<
  typeof CampaignContentResponseSchema
>;

export async function generateCampaignContent(
  persona: CampaignPersonaContext,
  campaign: Campaign,
  researchContext?: Record<string, unknown>
): Promise<GeneratedCampaignContent> {
  const model =
    process.env.OPENAI_CAMPAIGN_MODEL ||
    process.env.OPENAI_MODEL_DEFAULT ||
    "gpt-4o-mini";

  const personaSummary = {
    name: persona.display_name,
    biography: persona.biography,
    occupation: persona.occupation,
    industry: persona.industry,
    goals: persona.goals,
    tone: persona.personality?.tone ?? persona.voice,
    niche: persona.niche,
  };

  const campaignSummary = {
    title: campaign.name,
    description: campaign.description ?? campaign.objective,
    target_platforms: campaign.target_platforms,
    status: campaign.status,
    timeframe: {
      start: campaign.start_date,
      end: campaign.end_date,
    },
  };

  const userMessage = `
Persona Context:
${JSON.stringify(personaSummary, null, 2)}

Campaign Brief:
${JSON.stringify(campaignSummary, null, 2)}

Research Context (optional):
${JSON.stringify(researchContext ?? {}, null, 2)}

Produce between 3 and 5 social posts optimized for the campaign.
Each post must include:
- title (short hook)
- text (2-3 paragraphs max, markdown allowed)
- image_prompt (describe a visual concept or leave empty)
- recommended_platforms (choose from persona target platforms first; include 1-3 entries)
`.trim();

  const response = await callChatModel({
    model,
    temperature: 0.7,
    responseFormatType: "json_object",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  });

  try {
    const parsed = CampaignContentResponseSchema.parse(JSON.parse(response));
    return parsed;
  } catch (error) {
    console.error("Failed to parse campaign content response", {
      error,
      response,
    });
    throw new Error("Unable to parse campaign content from OpenAI response.");
  }
}








