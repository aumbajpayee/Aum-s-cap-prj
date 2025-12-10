// app/api/plaid/transactions/route.ts

import { NextResponse } from "next/server";
import { Query } from "node-appwrite"; // ✅ correct Query import
import { plaidClient } from "@/lib/plaid";
import { requireUserId } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/appwrite.server";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const BANK_SECRETS_COLLECTION_ID =
  process.env.APPWRITE_BANK_SECRETS_COLLECTION_ID ?? "bank_secrets";

type NormalizedTx = {
  transaction_id: string;
  account_id: string;
  date: string; // yyyy-mm-dd
  name: string | null;
  amount: number;
  iso_currency_code: string | null;
  account_label: string | null;
  mask: string | null;
  pending: boolean;
};

function parseYMD(ymd: string | null): Date | null {
  if (!ymd) return null;
  // Ensure we always get a valid Date, even if string has no leading zeros
  const d = new Date(ymd + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // pagination (client-side over merged list)
    const limit = Math.max(
      1,
      Math.min(50, Number(url.searchParams.get("limit") ?? 10))
    );
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));

    // filters from query
    const q = (url.searchParams.get("q") || "").trim().toLowerCase() || null;
    const startStr = url.searchParams.get("start") || null; // yyyy-mm-dd
    const endStr = url.searchParams.get("end") || null; // yyyy-mm-dd
    const type = url.searchParams.get("type") || "all"; // all | expense | income
    const accountId = url.searchParams.get("accountId") || null;

    const userId = await requireUserId();

    // 1) Fetch ALL linked banks for this user
    const { database } = await createAdminClient();
    const secrets = await database.listDocuments(
      DB_ID,
      BANK_SECRETS_COLLECTION_ID,
      [Query.equal("userId", userId)]
    );

    if (!secrets.total) {
      return NextResponse.json(
        { ok: false, reason: "NO_LINKED_BANK" },
        { status: 404 }
      );
    }

    // 2) Base date window (e.g., last 60 days)
    const endD = new Date();
    const startD = new Date();
    startD.setDate(endD.getDate() - 60);

    const start_date = startD.toISOString().slice(0, 10);
    const end_date = endD.toISOString().slice(0, 10);

    const allTx: NormalizedTx[] = [];

    // 3) For each bank, pull transactions and normalize
    for (const doc of secrets.documents as any[]) {
      const access_token = doc.plaidAccessToken as string;

      // 3a) accounts for label/mask enrichment
      const accountsRes = await plaidClient.accountsGet({ access_token });
      const acctMap = new Map<
        string,
        { label: string | null; mask: string | null }
      >(
        accountsRes.data.accounts.map((a) => [
          a.account_id,
          {
            mask: a.mask ?? null,
            label:
              a.name ??
              a.official_name ??
              a.subtype ??
              a.type ??
              "Account",
          },
        ])
      );

      // 3b) fetch transactions for this bank
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
        const meta = acctMap.get(t.account_id);
        allTx.push({
          transaction_id: t.transaction_id,
          account_id: t.account_id,
          date: t.date,
          name: t.name ?? null,
          amount: t.amount,
          iso_currency_code: t.iso_currency_code ?? null,
          account_label: meta?.label ?? null,
          mask: meta?.mask ?? null,
          pending: Boolean(t.pending),
        });
      }
    }

    // 4) Apply filters (search/date/type/account) – with proper Date comparison
    let list = allTx;

    if (q) {
      list = list.filter((t) =>
        (t.name || "").toLowerCase().includes(q)
      );
    }

    const startDate = parseYMD(startStr);
    const endDate = parseYMD(endStr);

    if (startDate) {
      list = list.filter((t) => {
        const td = parseYMD(t.date);
        return td ? td >= startDate : true;
      });
    }

    if (endDate) {
      // inclusive end date
      list = list.filter((t) => {
        const td = parseYMD(t.date);
        return td ? td <= endDate : true;
      });
    }

    if (type === "expense") {
      list = list.filter((t) => (t.amount ?? 0) > 0);
    } else if (type === "income") {
      list = list.filter((t) => (t.amount ?? 0) < 0);
    }

    if (accountId) {
      list = list.filter((t) => t.account_id === accountId);
    }

    // 5) Newest first
    list.sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );

    // 6) Paginate on the merged list
    const total = list.length;
    const page = list.slice(offset, offset + limit);
    const nextOffset = offset + page.length;
    const hasMore = nextOffset < total;

    return NextResponse.json({
      ok: true,
      transactions: page,
      nextOffset,
      hasMore,
    });
  } catch (err: any) {
    const msg =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      "Unexpected server error";

    console.error("transactions GET error:", err?.response?.data ?? err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
