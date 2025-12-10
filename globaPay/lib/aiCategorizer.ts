// lib/aiCategorizer.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_CATEGORIES = [
  "Food & Drinks",
  "Transport & Travel",
  "Shopping & Lifestyle",
  "Bills & Subscriptions",
  "Other",
] as const;

export type AICategory = (typeof AI_CATEGORIES)[number];

export interface AICategorizeInput {
  id: string;
  name: string;
  amount: number;
  date: string;
  merchantName?: string | null;
  plaidCategory?: string[] | string | null;
}

export interface AICategorizeOutput extends AICategorizeInput {
  aiCategory: AICategory;
}

/**
 * Calls OpenAI once for a batch of transactions and returns the same
 * list, with an extra aiCategory field per transaction.
 *
 * If OPENAI_API_KEY is missing or the call fails, everything falls
 * back safely to "Other".
 */
export async function categorizeTransactionsAI(
  txs: AICategorizeInput[]
): Promise<AICategorizeOutput[]> {
  // No key? Just fall back gracefully.
  if (!process.env.OPENAI_API_KEY) {
    console.warn("No OPENAI_API_KEY set – categorizing as 'Other'");
    return txs.map((t) => ({ ...t, aiCategory: "Other" }));
  }

  if (!txs.length) return [];

  const systemPrompt = `You are a financial transaction categorization assistant.

Your job is to assign EACH transaction to EXACTLY ONE of these five categories:
1. Food & Drinks
2. Transport & Travel
3. Shopping & Lifestyle
4. Bills & Subscriptions
5. Other

Rules:
- Output MUST be JSON only.
- For each transaction you are given, choose ONE category.
- Allowed category values are EXACTLY:
  "Food & Drinks", "Transport & Travel", "Shopping & Lifestyle", "Bills & Subscriptions", "Other".
- If you are unsure, choose "Other".

Return JSON in this shape:
{
  "items": [
    { "id": "tx-id-1", "category": "Food & Drinks" },
    { "id": "tx-id-2", "category": "Other" },
    ...
  ]
}`;

  const userPayload = txs.map((t) => ({
    id: t.id,
    name: t.name,
    amount: t.amount,
    date: t.date,
    merchantName: t.merchantName ?? null,
    plaidCategory: t.plaidCategory ?? null,
  }));

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is the array of transactions:\n${JSON.stringify(
            userPayload
          )}`,
        },
      ],
      max_tokens: 600,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty AI response");

    // Expected: { items: [ { id, category }, ... ] }
    let parsed: { items: { id: string; category: AICategory }[] };

    try {
      parsed = JSON.parse(content) as any;
    } catch (e) {
      console.warn("AI JSON parse failed, raw content:", content);
      throw e;
    }

    const byId = new Map<string, AICategory>();
    for (const item of parsed.items ?? []) {
      if (
        item &&
        typeof item.id === "string" &&
        AI_CATEGORIES.includes(item.category)
      ) {
        byId.set(item.id, item.category);
      }
    }

    return txs.map((t) => ({
      ...t,
      aiCategory: byId.get(t.id) ?? ("Other" as AICategory),
    }));
  } catch (err) {
    console.error("categorizeTransactionsAI error:", err);
    // Safe fallback: label everything as Other
    return txs.map((t) => ({ ...t, aiCategory: "Other" }));
  }
}