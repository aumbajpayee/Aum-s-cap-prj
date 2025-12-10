// app/api/plaid/exchange-public-token/route.ts
import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { plaidClient } from "@/lib/plaid";
import { requireUserId } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/appwrite.server";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const BANK_SECRETS_COLLECTION_ID =
  process.env.APPWRITE_BANK_SECRETS_COLLECTION_ID ?? "bank_secrets";
const NOTIFS_COLLECTION_ID =
  process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID ?? "notifications";

if (!DB_ID || !BANK_SECRETS_COLLECTION_ID) {
  throw new Error("Missing required Appwrite envs for Plaid exchange route.");
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);

    const public_token = body?.public_token as string | undefined;
    const metadata = body?.metadata;

    if (!public_token) {
      return NextResponse.json(
        { ok: false, error: "Missing public_token" },
        { status: 400 }
      );
    }

    // 1) Exchange public_token -> access_token
    const exchangeRes = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeRes.data.access_token;
    const itemId = exchangeRes.data.item_id;

    // 2) Bank meta from Plaid Link metadata
    const institutionName =
      metadata?.institution?.name ?? "Unknown institution";
    const institutionId =
      metadata?.institution?.institution_id ?? "unknown";

    // 3) Appwrite admin client
    const { database } = await createAdminClient();

    // 4) Check if this Plaid item is already linked for this user
    const existing = await database.listDocuments(
      DB_ID,
      BANK_SECRETS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("plaidItemId", itemId)]
    );

    if (existing.total > 0) {
      const doc = existing.documents[0];

      const updated = await database.updateDocument(
        DB_ID,
        BANK_SECRETS_COLLECTION_ID,
        doc.$id,
        {
          plaidAccessToken: accessToken,
          institutionName,
          institutionId,
        }
      );

      // Optional: we treat this as no-op, no new notification
      return NextResponse.json({
        ok: true,
        status: "already_linked",
        bank: updated,
      });
    }

    // 5) Create new bank_secret document (append, not overwrite)
    const created = await database.createDocument(
      DB_ID,
      BANK_SECRETS_COLLECTION_ID,
      "unique()",
      {
        userId,
        plaidItemId: itemId,
        plaidAccessToken: accessToken,
        institutionName,
        institutionId,
      }
    );

    // 6) 🔔 Create notification: bank linked
    try {
      await database.createDocument(
        DB_ID,
        NOTIFS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          type: "bank_linked",
          message: `Bank linked successfully: ${institutionName}`,
          timestamp: new Date().toISOString(),
          isRead: false,
        }
      );
    } catch (err) {
      console.warn("Failed to create bank_linked notification:", err);
    }

    return NextResponse.json({ ok: true, status: "linked", bank: created });
  } catch (err: any) {
    console.error("exchange-public-token ERROR:", err?.response?.data ?? err);

    const message =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to exchange token";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
