export async function callChatModel(options: {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model?: string;
  temperature?: number;
  responseFormatType?: "json_object" | "text";
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing from environment variables.");
  }

  const model = options.model || process.env.OPENAI_MODEL_DEFAULT || "gpt-4.1-mini";
  const temperature = options.temperature ?? 0.7;

  try {
    const requestBody: Record<string, unknown> = {
      model,
      temperature,
      messages: options.messages,
    };

    if (options.responseFormatType === "json_object") {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OpenAI API error:", {
        status: response.status,
        statusText: response.statusText,
        errorPreview: errorBody.substring(0, 200),
      });
      throw new Error(`OpenAI API request failed with status ${response.status}`);
    }

    const json = await response.json();

    if (!json.choices || !Array.isArray(json.choices) || json.choices.length === 0) {
      console.error(
        "Invalid OpenAI response structure:",
        JSON.stringify(json).substring(0, 500)
      );
      throw new Error("OpenAI API returned unexpected response structure.");
    }

    const content = json.choices[0]?.message?.content;

    if (content === undefined || content === null) {
      console.error(
        "OpenAI API response missing content field:",
        JSON.stringify(json).substring(0, 500)
      );
      throw new Error("OpenAI API response missing content field.");
    }

    if (typeof content === "string" && content.trim() === "") {
      console.error("OpenAI returned empty content");
      throw new Error("OpenAI API returned empty response.");
    }

    return content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

export async function callPersonaBuilderModel(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string> {
  return callChatModel({
    messages,
    model: process.env.OPENAI_MODEL_PERSONA || "gpt-4.1-mini",
    temperature: 0.7,
    responseFormatType: "json_object",
  });
}

