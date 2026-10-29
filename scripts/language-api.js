// Optional unattended transport; native subagent file handoffs use the same plans.
import { validateOutput, validatePlan } from "./vietnamese-copyedit.js";

export async function requestCopyedit(
  plan,
  { apiKey, fetcher = fetch, timeoutMs = 60000 } = {},
) {
  validatePlan(plan);
  if (!apiKey) {
    throw new Error(
      "Set OPENAI_API_KEY for unattended API runs; native subagent packets work without it.",
    );
  }
  const body = {
    model: plan.model,
    reasoning: { effort: plan.reasoning },
    store: false,
    max_output_tokens: 16000,
    instructions: plan.instructions + "\n\n" + plan.styleGuide,
    input: JSON.stringify({
      conditions: plan.conditions,
      reviewTargets: plan.reviewTargets,
      edits: plan.edits,
      pairs: plan.pairs,
      evidence: plan.evidence,
      factFields: plan.factFields,
      maxEditsPerCondition: plan.policy.maxEditsPerCondition,
    }),
    text: {
      format: {
        type: "json_schema",
        name: `vi_medical_${plan.phase}`,
        strict: true,
        schema: plan.schema,
      },
    },
  };
  let response;
  try {
    response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error(
      "Model request outcome unknown after network failure/timeout. Do not retry automatically; inspect the API run before using a new run ID.",
    );
  }
  if (!response.ok) {
    throw new Error(
      `Model API returned HTTP ${response.status}; stopped without logging credentials or the response body.`,
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Model returned an unreadable response; no edits accepted.",
    );
  }
  if (data.status !== "completed") {
    throw new Error("Model response incomplete or failed; no edits accepted.");
  }
  const messages = (data.output || []).filter((x) => x.type === "message")
    .flatMap((x) => x.content || []);
  if (messages.some((x) => x.type === "refusal")) {
    throw new Error("Model refused the request; no edits accepted.");
  }
  const raw = messages.filter((x) => x.type === "output_text").map((x) =>
    x.text
  ).join("");
  let output;
  try {
    output = JSON.parse(raw);
  } catch {
    throw new Error("Model returned invalid JSON; no edits accepted.");
  }
  validateOutput(plan, output);
  return {
    output,
    transport: {
      kind: "openai_responses",
      requestedModel: plan.model,
      actualModel: data.model,
      responseId: data.id,
      usage: data.usage ?? null,
    },
  };
}
