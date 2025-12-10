// app/api/plaid/accounts/route.ts
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { plaidClient } from "@/lib/plaid";
import { createAdminClient } from "@/lib/appwrite.server";
import { requireUserId } from "@/lib/serverAuth";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const BANK_COLLECTION_ID =
  process.env.APPWRITE_BANK_SECRETS_COLLECTION_ID ?? "bank_secrets";

if (!DB_ID || !BANK_COLLECTION_ID) {
  throw new Error("Missing Appwrite DB/collection envs for accounts route");
}

export async function GET() {
  try {
    // 1️⃣ Who is logged in?
    const userId = await requireUserId();

    // 2️⃣ Get all linked banks for this user
    const { database } = await createAdminClient();
    const bankDocs = await database.listDocuments(DB_ID, BANK_COLLECTION_ID, [
      Query.equal("userId", userId),
    ]);

    if (bankDocs.total === 0) {
      return NextResponse.json({
        ok: true,
        accounts: [],
        totalBalance: 0,
      });
    }

    // 3️⃣ For each bank, call Plaid and collect accounts + balances
    const allAccounts: any[] = [];
    for (const doc of bankDocs.documents as any[]) {
      const accessToken = doc.plaidAccessToken as string;
      const institutionName = (doc.institutionName as string) ?? "Bank";
      const institutionId =
        (doc.institutionId as string | undefined) ?? null;

      const res = await plaidClient.accountsBalanceGet({
        access_token: accessToken,
      });

      for (const a of res.data.accounts) {
        allAccounts.push({
          accountId: a.account_id,
          name: a.name || a.official_name || "Account",
          subtype: a.subtype || a.type || "checking",
          mask: a.mask || null,
          currentBalance: a.balances.current ?? 0,
          isoCurrencyCode:
            a.balances.iso_currency_code ||
            a.balances.iso_currency_code ||
            null,
          institutionName,
          institutionId, // ✅ expose which bank doc this belongs to
        });
      }
    }

    const totalBalance = allAccounts.reduce(
      (sum, a) => sum + (Number(a.currentBalance) || 0),
      0
    );

    return NextResponse.json({
      ok: true,
      accounts: allAccounts,
      totalBalance,
    });
  } catch (err: any) {
    console.error("Error fetching multiple-bank accounts:", err);
    const msg =
      err?.response?.data?.error_message ||
      err?.message ||
      "Failed to fetch accounts";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
