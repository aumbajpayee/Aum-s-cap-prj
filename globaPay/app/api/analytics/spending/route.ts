// app/api/analytics/spending/route.ts

import { NextResponse } from "next/server";
import { Query } from "node-appwrite";

import { plaidClient } from "@/lib/plaid";
import { createAdminClient } from "@/lib/appwrite.server";
import { requireUserId } from "@/lib/serverAuth";
import {
  categorizeTransactionsAI,
  AICategorizeInput,
} from "@/lib/aiCategorizer";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const BANK_SECRETS_COLLECTION_ID =
  process.env.APPWRITE_BANK_SECRETS_COLLECTION_ID ?? "bank_secrets";

// ---------------- Types for response ----------------

type CategoryKey =
  | "food_dining"
  | "shopping_retail"
  | "transport_travel"
  | "bills_utilities"
  | "other";

type CategoryBucket = {
  key: CategoryKey;
  label: string;
  amount: number;
};

type TimelinePoint = {
  date: string; // yyyy-mm-dd
  total: number;
};

type MerchantBucket = {
  name: string;
  amount: number;
};

// These are the 5 fixed buckets the UI already expects
const CATEGORY_DEFS: { key: CategoryKey; label: string }[] = [
  { key: "food_dining", label: "Food & Dining" },
  { key: "shopping_retail", label: "Shopping & Retail" },
  { key: "transport_travel", label: "Transport & Travel" },
  { key: "bills_utilities", label: "Bills & Utilities" },
  { key: "other", label: "Other / Uncategorized" },
];

// ---------------- Route handler ----------------

export async function GET(req: Request) {
  try {
    // -------- 1) Parse date range (7 / 30 / 60 days) --------
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range") || "30";

    let rangeDays = 30;
    if (rangeParam === "7") rangeDays = 7;
    else if (rangeParam === "60") rangeDays = 60;

    // -------- 2) Who is this user? --------
    const userId = await requireUserId();

    // -------- 3) Find their linked bank secrets --------
    const { database } = await createAdminClient();
    const secrets = await database.listDocuments(
      DB_ID,
      BANK_SECRETS_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );

    // No linked banks → return empty analytics
    if (!secrets.total) {
      return NextResponse.json(
        {
          ok: true,
          rangeDays,
          categories: CATEGORY_DEFS.map((c) => ({
            ...c,
            amount: 0,
          })),
          timeline: [] as TimelinePoint[],
          merchants: [] as MerchantBucket[],
          totalSpend: 0,
        },
        { status: 200 }
      );
    }

    // -------- 4) Build date range --------
    const endD = new Date();
    const startD = new Date();
    startD.setDate(endD.getDate() - rangeDays);

    const start_date = startD.toISOString().slice(0, 10);
    const end_date = endD.toISOString().slice(0, 10);

    // -------- 5) Prepare aggregators --------
    const categoryMap = new Map<CategoryKey, number>();
    CATEGORY_DEFS.forEach((c) => categoryMap.set(c.key, 0));

    const timelineMap = new Map<string, number>();
    const merchantMap = new Map<string, number>();

    // We'll collect all transactions, then call AI once
    const allTxs: AICategorizeInput[] = [];

    // -------- 6) Fetch Plaid transactions for each linked bank --------
    for (const doc of secrets.documents as any[]) {
      const access_token = doc.plaidAccessToken as string;

      const txRes = await plaidClient.transactionsGet({
        access_token,
        start_date,
        end_date,
        options: {
          count: 250,
          offset: 0,
        },
      });

      const txs = txRes.data.transactions ?? [];

      for (const t of txs) {
        const amount: number = t.amount;

        // Plaid: expenses > 0, credits < 0 — only count expenses
        if (!Number.isFinite(amount) || amount <= 0) continue;

        allTxs.push({
          id: t.transaction_id,
          name: t.name ?? "Unknown",
          amount: t.amount,
          date: t.date,
          merchantName: t.merchant_name ?? null,
          plaidCategory: t.category ?? null,
        });
      }
    }

    // If still nothing, return empty shape
    if (!allTxs.length) {
      return NextResponse.json(
        {
          ok: true,
          rangeDays,
          categories: CATEGORY_DEFS.map((c) => ({
            ...c,
            amount: 0,
          })),
          timeline: [] as TimelinePoint[],
          merchants: [] as MerchantBucket[],
          totalSpend: 0,
        },
        { status: 200 }
      );
    }

    // -------- 7) AI categorization (single batch call) --------
    const aiResults = await categorizeTransactionsAI(allTxs);
    // aiResults: [{ id, name, amount, date, merchantName, plaidCategory, aiCategory }]

    // -------- 8) Aggregate using AI categories --------
    for (const tx of aiResults) {
      const amount = tx.amount;
      const date = tx.date;
      const merchantName = tx.merchantName ?? "Unknown Merchant";

      // Map AI categories → your 5 fixed buckets
      let catKey: CategoryKey;

      switch (tx.aiCategory) {
        case "Food & Drinks":
          catKey = "food_dining";
          break;
        case "Shopping & Lifestyle":
          catKey = "shopping_retail";
          break;
        case "Transport & Travel":
          catKey = "transport_travel";
          break;
        case "Bills & Subscriptions":
          catKey = "bills_utilities";
          break;
        default:
          catKey = "other";
      }

      // Category totals
      categoryMap.set(catKey, (categoryMap.get(catKey) || 0) + amount);

      // Timeline totals (per day)
      timelineMap.set(date, (timelineMap.get(date) || 0) + amount);

      // Merchant totals
      merchantMap.set(
        merchantName,
        (merchantMap.get(merchantName) || 0) + amount
      );
    }

    // -------- 9) Convert Maps → arrays for the frontend --------

    const categories: CategoryBucket[] = CATEGORY_DEFS.map((c) => ({
      ...c,
      amount: Number((categoryMap.get(c.key) || 0).toFixed(2)),
    }));

    const totalSpend = categories.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    const timeline: TimelinePoint[] = Array.from(timelineMap.entries())
      .map(([date, total]) => ({
        date,
        total: Number(total.toFixed(2)),
      }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    const merchants: MerchantBucket[] = Array.from(merchantMap.entries())
      .map(([name, amount]) => ({
        name,
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // -------- 10) Final response --------
    return NextResponse.json({
      ok: true,
      rangeDays,
      categories,
      timeline,
      merchants,
      totalSpend: Number(totalSpend.toFixed(2)),
    });
  } catch (err: any) {
    console.error("analytics/spending error:", err?.response?.data ?? err);

    const msg =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to build analytics";

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}