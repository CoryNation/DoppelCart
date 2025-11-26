import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import type { ResearchPersona } from "@/types/persona";

export type ResearchTaskStatus = "queued" | "running" | "completed" | "failed";

export interface ResearchChatMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

export interface ResonanceFinalReport {
  executiveSummary: string;
  audienceSnapshot: {
    whoTheyAre: string;
    keyMotivations: string[];
    keyFrustrations: string[];
  };
  resonanceFindings: {
    theme: string;
    description: string;
    supportingEvidence: string[];
    implications: string[];
  }[];
  channelAndFormatInsights: {
    byPlatform: {
      platform: string;
      whatWorks: string[];
      whatToAvoid: string[];
      exampleAngles: string[];
    }[];
    crossPlatformPatterns: string[];
  };
  messagingRecommendations: {
    coreNarratives: string[];
    recommendedHooks: string[];
    languageToUse: string[];
    languageToAvoid: string[];
  };
  objectionsAndResponses: {
    objection: string;
    context: string;
    recommendedResponseAngle: string;
  }[];
  nextSteps: string[];
}

export interface ResearchResultDetails {
  finalReport?: ResonanceFinalReport;
  lastGeneratedPersona?: ResearchPersona;
  [key: string]: unknown;
}

export interface ResearchTask {
  id: string;
  userId: string;
  title: string;
  description: string;
  clarifiedScope: string | null;
  parameters: Record<string, unknown> | null;
  messages: ResearchChatMessage[];
  status: ResearchTaskStatus;
  progress: number;
  resultSummary: string | null;
  resultDetails: ResearchResultDetails | null;
  createdAt: string;
  updatedAt: string;
}

interface ResearchTaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  clarified_scope: string | null;
  parameters: Record<string, unknown> | null;
  messages: ResearchChatMessage[];
  status: ResearchTaskStatus;
  progress: number;
  result_summary: string | null;
  result_details: ResearchResultDetails | null;
  created_at: string;
  updated_at: string;
}

function mapRowToTask(row: ResearchTaskRow): ResearchTask {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    clarifiedScope: row.clarified_scope,
    parameters: row.parameters,
    messages: row.messages,
    status: row.status,
    progress: row.progress,
    resultSummary: row.result_summary,
    resultDetails: row.result_details,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const mergeResultDetails = (
  current: ResearchResultDetails | null,
  incoming?: ResearchResultDetails | null
): ResearchResultDetails | null => {
  if (incoming === undefined) {
    return current;
  }

  if (incoming === null) {
    return null;
  }

  return {
    ...(current ?? {}),
    ...incoming,
  };
};

const ensureArray = (value: unknown, fallback: string[]): string[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    );
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
};

const ensureText = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

const generatePlaceholderFinalReport = (
  task: ResearchTask
): ResonanceFinalReport => {
  const describedAudience =
    ensureText(task.parameters?.audience, "") ||
    ensureText(task.parameters?.customer, "") ||
    "the audience you described";
  const primaryGoal =
    ensureText(task.parameters?.goal, "") ||
    ensureText(task.parameters?.objective, "") ||
    "driving meaningful engagement";
  const keyPlatforms = ensureArray(task.parameters?.platforms, [
    "TikTok",
    "Instagram",
    "LinkedIn",
  ]);

  const frustrations = ensureArray(task.parameters?.frustrations, [
    "Overloaded feeds full of generic advice",
    "Vendors who overpromise and under-deliver",
    "Content that speaks at them instead of with them",
  ]);

  const motivations = ensureArray(task.parameters?.motivations, [
    "Seeing proof that something actually works",
    "Saving time with ready-to-use frameworks",
    "Feeling ahead of trends before their peers",
  ]);

  const hooks = [
    `“What ${describedAudience} stopped doing last quarter”`,
    `“Steal this ${primaryGoal} workflow”`,
    `“From chaos to clarity in 15 minutes”`,
  ];

  return {
    executiveSummary: `The ${task.title} study shows that ${describedAudience} respond best to candid, proof-driven storytelling. They reward brands that show their work, unpack failures, and connect recommendations to lived experiences. Lean into highly tactical content, spotlight fast wins, and stress how your approach reduces risk while ${primaryGoal}.`,
    audienceSnapshot: {
      whoTheyAre: `Practitioners and operators focused on ${primaryGoal}, often juggling multiple channels and measuring themselves on visible results.`,
      keyMotivations: motivations,
      keyFrustrations: frustrations,
    },
    resonanceFindings: [
      {
        theme: "Proof beats positioning",
        description:
          "Posts that open with a concrete metric, mini case study, or screen recording consistently outperform inspirational language. This audience scans for signals that you've solved their exact pain before.",
        supportingEvidence: [
          "Top-shared TikToks feature walkthroughs with on-screen metrics",
          "LinkedIn carousels that show 'before vs. after' earn 2-3x saves",
        ],
        implications: [
          "Lead with the outcome, then rewind to the process.",
          "Treat hooks as claims you immediately validate.",
        ],
      },
      {
        theme: "Make experimentation feel safe",
        description:
          "People want to test new ideas but hate wasting time. Content that provides guardrails (checklists, prompts, frameworks) unlocks experimentation without anxiety.",
        supportingEvidence: [
          "Saves spike when templates are included",
          "Commenters ask for 'swipe files' and 'plug-and-play prompts'",
        ],
        implications: [
          "Ship toolkits alongside every recommendation.",
          "Highlight what to watch out for when trying the tactic.",
        ],
      },
    ],
    channelAndFormatInsights: {
      byPlatform: keyPlatforms.map((platform) => ({
        platform,
        whatWorks: [
          "Fast, confident hooks that set context within 3 seconds",
          "Split-screen demos or annotated screenshots",
          "Contrarian takes backed by data",
        ],
        whatToAvoid: [
          "Long intros about your brand story",
          "Buzzword-heavy slides with no proof",
          "Vague CTAs like 'let me know your thoughts'",
        ],
        exampleAngles: [
          `${platform}: “We tried the viral tactic everyone recommends—here's what actually broke.”`,
          `${platform}: “Copy-paste hook formulas that still outperform in ${new Date().getFullYear()}.”`,
        ],
      })),
      crossPlatformPatterns: [
        "Audiences reward creators who share unfinished work and lessons learned in public.",
        "Hooks framed as a strong POV ('Stop doing X') outperform question-only openers.",
        "Any content that reduces set-up time (templates, swipe files, prompt packs) earns outsized saves.",
      ],
    },
    messagingRecommendations: {
      coreNarratives: [
        "Radically transparent playbooks from people still in the trenches.",
        "Small consistent experiments beat high-stakes big swings.",
        "Great marketers are curators—share what to copy and what to ignore.",
      ],
      recommendedHooks: hooks,
      languageToUse: [
        "Specific time frames ('in 7 days', 'week 3')",
        "Signals and indicators ('your save-to-view ratio should be…')",
        "Plainspoken verbs (ship, test, scrap, remix)",
      ],
      languageToAvoid: [
        "Vague qualifiers ('world-class', 'cutting-edge')",
        "Corporate filler ('synergy', 'omnichannel excellence')",
        "Heavy-handed hype with no receipts",
      ],
    },
    objectionsAndResponses: [
      {
        objection: "“I’ve tried frameworks like this before—they never fit our context.”",
        context: "Experienced operators have seen oversimplified playbooks fail.",
        recommendedResponseAngle:
          "Show how to adapt each tactic. Include 'when this won’t work' callouts and variables to tweak.",
      },
      {
        objection: "“We don’t have the team to execute another content experiment.”",
        context: "Lean teams guard their time aggressively.",
        recommendedResponseAngle:
          "Highlight lightweight pilots (e.g., '90-minute workshop, 3 TikToks, 1 LinkedIn carousel') and reuse existing assets.",
      },
    ],
    nextSteps: [
      "Publish a 'proof library' that curates your 3 most credible wins with raw receipts.",
      "Ship a weekly 'field test' series documenting what you tried, what happened, and what you'll change.",
      "Launch a swipe-file opt-in that shares ready-to-use hooks, outlines, and CTAs tailored to this audience.",
      "Interview two customers on-camera about the last buying objection they raised and how it was resolved.",
    ],
  };
};

export async function createResearchTask(options: {
  userId: string;
  title: string;
  description: string;
  clarifiedScope: string;
  parameters: Record<string, unknown>;
  messages: ResearchChatMessage[];
}): Promise<ResearchTask> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("research_tasks")
    .insert({
      user_id: options.userId,
      title: options.title,
      description: options.description,
      clarified_scope: options.clarifiedScope,
      parameters: options.parameters,
      messages: options.messages,
      status: "running",
      progress: 12,
      result_summary: null,
      result_details: null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create research task: ${error?.message ?? "Unknown error"}`);
  }

  return mapRowToTask(data as ResearchTaskRow);
}

export async function getResearchTaskById(
  id: string,
  userId?: string
): Promise<ResearchTask | null> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("research_tasks")
    .select("*")
    .eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    if (error?.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch research task: ${error?.message ?? "Unknown error"}`);
  }

  return mapRowToTask(data as ResearchTaskRow);
}

export async function updateResearchTask(
  id: string,
  updates: Partial<Omit<ResearchTask, "id" | "userId" | "createdAt">>,
  options?: { userId?: string }
): Promise<ResearchTask | null> {
  const supabase = await createSupabaseServerClient();

  // First, get the current task to merge result details
  const current = await getResearchTaskById(id, options?.userId);
  if (!current) return null;

  const mergedDetails = mergeResultDetails(
    current.resultDetails,
    updates.resultDetails
  );

  // Map updates to database column names
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.clarifiedScope !== undefined) dbUpdates.clarified_scope = updates.clarifiedScope;
  if (updates.parameters !== undefined) dbUpdates.parameters = updates.parameters;
  if (updates.messages !== undefined) dbUpdates.messages = updates.messages;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
  if (updates.resultSummary !== undefined) dbUpdates.result_summary = updates.resultSummary;
  if (mergedDetails !== undefined) dbUpdates.result_details = mergedDetails;

  let query = supabase
    .from("research_tasks")
    .update(dbUpdates)
    .eq("id", id);

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  const { data, error } = await query.select().single();

  if (error || !data) {
    if (error && typeof error === "object" && "code" in error && error.code === "PGRST116") {
      return null; // Not found
    }
    const errorMessage = error && typeof error === "object" && "message" in error 
      ? String(error.message) 
      : "Unknown error";
    throw new Error(`Failed to update research task: ${errorMessage}`);
  }

  return mapRowToTask(data as ResearchTaskRow);
}

export async function progressResearchTask(
  id: string,
  options?: { userId?: string }
): Promise<ResearchTask | null> {
  const current = await getResearchTaskById(id, options?.userId);
  if (!current) return null;
  if (current.status !== "running") return current;

  // Check if enough time has passed since last update (prevent too frequent updates)
  const now = new Date();
  const lastUpdate = new Date(current.updatedAt);
  const msSinceLast = now.getTime() - lastUpdate.getTime();
  if (msSinceLast < 1500) {
    return current;
  }

  const increment = Math.floor(Math.random() * 20) + 5;
  const nextProgress = Math.min(100, current.progress + increment);

  const updates: Partial<ResearchTask> = {
    progress: nextProgress,
  };

  if (nextProgress >= 100) {
    const finalReport = generatePlaceholderFinalReport(current);
    updates.status = "completed";
    updates.progress = 100;
    updates.resultSummary = finalReport.executiveSummary;
    updates.resultDetails = {
      ...(current.resultDetails ?? {}),
      finalReport,
    };
  }

  return updateResearchTask(id, updates, options);
}

export async function attachPersonaToResearchTask(
  id: string,
  persona: ResearchPersona,
  options?: { userId?: string }
): Promise<ResearchTask | null> {
  const current = await getResearchTaskById(id, options?.userId);
  if (!current) return null;

  return updateResearchTask(
    id,
    {
      resultDetails: {
        ...(current.resultDetails ?? {}),
        lastGeneratedPersona: persona,
      },
    },
    options
  );
}


