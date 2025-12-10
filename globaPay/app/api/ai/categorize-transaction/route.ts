// app/api/ai/categorize-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  categorizeTransactionsAI,
  AICategorizeInput,
} from "@/lib/aiCategorizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const txs = body?.transactions;

    if (!Array.isArray(txs)) {
      return NextResponse.json(
        { ok: false, error: "transactions array is required" },
        { status: 400 }
      );
    }

    // Normalize whatever your frontend sends into AICategorizeInput
    const cleaned: AICategorizeInput[] = txs.map((raw: any) => ({
      id: String(raw.id ?? raw.transaction_id),
      name: String(raw.name ?? raw.merchant_name ?? "Unknown"),
      amount: Number(raw.amount ?? 0),
      date: String(raw.date ?? raw.authorized_date ?? ""),
      merchantName: raw.merchant_name ?? raw.merchantName ?? null,
      plaidCategory: raw.category ?? raw.plaidCategory ?? null,
    }));

    const categorized = await categorizeTransactionsAI(cleaned);

    return NextResponse.json({ ok: true, transactions: categorized });
  } catch (err) {
    console.error("AI categorize route error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to categorize transactions" },
      { status: 500 }
    );
  }
}