// src/content/aiHistoryPersonaPrompt.ts

export const AI_HISTORY_PERSONA_PROMPT = `
I want you to analyze my past conversations in this AI platform and build a detailed persona profile that captures how I think, write, and show up online.

You will:
1. Read a large sample of my previous messages and replies.
2. Infer my communication style, values, typical topics, and how I explain or argue things.
3. Create a structured persona profile that another AI system can use to generate content "as me."

Important process instructions:
- First, acknowledge that you are ready to receive my history.
- Then WAIT. I will paste multiple chunks of my past conversations.
- Do NOT analyze or respond until I explicitly write: END_OF_HISTORY
- After I send END_OF_HISTORY, you will return ONE final response in a very specific JSON format.

Focus:
- Base everything ONLY on patterns you can actually observe in my messages.
- Do not idealize or "fix" me—model my real voice, not an aspirational one.
- If my history covers multiple contexts (work, personal, creative, etc.), infer the dominant patterns but feel free to note the sub-styles.

When I send END_OF_HISTORY, analyze everything and respond with a SINGLE JSON object in the following exact structure (no extra keys, no comments, no markdown, no code fences):

{
  "persona_name": "A short name or label that fits how I show up in these conversations",
  "persona_role": "A one-sentence description of who this persona is (e.g., 'Pragmatic tech strategist who explains complex ideas simply')",
  "summary": "A 3–5 sentence overview of my personality, thinking style, and communication style as seen in this history.",

  "core_identity": {
    "who_you_are": "1–2 sentences describing my core identity as inferred from my messages.",
    "professional_background": "What you can infer about my work, domain knowledge, or expertise.",
    "personal_background": "Any recurring personal context that seems relevant (e.g., roles, life constraints, worldview).",
    "core_values": ["List of 4–8 values that show up repeatedly in my tone, priorities, and arguments."]
  },

  "target_audience": {
    "summary": "Who I seem to be talking to or trying to help most often.",
    "ideal_followers": [
      "Short description of one ideal follower type",
      "Another ideal follower type"
    ]
  },

  "goals": [
    "Goal 1 you can infer from my conversations",
    "Goal 2",
    "Goal 3"
  ],

  "topics": {
    "primary": [
      "List of 3–7 main topics I talk about often"
    ],
    "secondary": [
      "List of 3–7 secondary or occasional topics"
    ]
  },

  "tone_and_voice": {
    "overall_tone": "Short description: e.g. 'direct but kind', 'playful and irreverent', 'formal and precise'.",
    "style_traits": [
      "3–8 adjectives that describe how I sound (e.g., analytical, empathetic, skeptical, visionary)."
    ],
    "formality": "Describe my typical formality level: casual, semi-formal, formal, etc.",
    "pacing": "Describe how I tend to structure responses: short and punchy, long and detailed, story-driven, step-by-step, etc."
  },

  "strengths": [
    "Communication or thinking strength you see in my messages",
    "Another strength",
    "Another strength"
  ],

  "blind_spots": [
    "Potential weakness, bias, or blind spot in how I communicate",
    "Another blind spot"
  ],

  "content_preferences": {
    "default_post_types": [
      "What types of content fit me best (e.g., teaching threads, rants, how-to guides, reflections, stories)."
    ],
    "opinion_style": "How I tend to express opinions: cautious, bold, provocative, heavily caveated, etc.",
    "story_patterns": [
      "Any recurring storytelling pattern you notice (e.g., 'problem → insight → practical tip')."
    ]
  },

  "language_patterns": {
    "common_phrases": [
      "Short phrases, transitions, or patterns I use a lot.",
      "Try to include 3–10 examples."
    ],
    "signature_expressions": [
      "Expressions that feel uniquely 'me' or very characteristic of how I talk."
    ],
    "things_to_avoid_saying": [
      "Phrases or tones that do NOT sound like me and should generally be avoided."
    ]
  },

  "platform_guidance": {
    "generic": {
      "post_length_hint": "Rough guidance: do I sound better in short punchy posts, long essays, threads, or somewhere in between?",
      "call_to_action_style": "If and how I naturally ask people to respond, reflect, or take action."
    }
  },

  "safety_and_boundaries": {
    "do": [
      "List of 5–10 'DO' rules for writing as this persona (e.g., 'do explain the why, not just the what')."
    ],
    "dont": [
      "List of 5–10 'DON'T' rules (e.g., 'don't be condescending', 'don't oversell')."
    ],
    "off_limits": [
      "Topics, tones, or behaviors that clearly do not align with how I show up in the history."
    ]
  }
}

Rules for your final response:
- Respond with VALID JSON ONLY.
- Do NOT wrap it in backticks or markdown.
- Do NOT add any explanation before or after the JSON.
- Stay within this exact schema and key set.
- Fill every field with your best inference, even if imperfect, based solely on my history.

Now reply with a short acknowledgment that you are ready to receive my history. Then wait for me to paste multiple chunks of content, followed by the line:

END_OF_HISTORY
`;
