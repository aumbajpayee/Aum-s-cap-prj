// app/api/plaid/unlink-bank/route.ts
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { plaidClient } from "@/lib/plaid";
import { createAdminClient } from "@/lib/appwrite.server";
import { requireUserId } from "@/lib/serverAuth";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const BANK_COLLECTION_ID =
  process.env.APPWRITE_BANK_SECRETS_COLLECTION_ID ?? "bank_secrets";

if (!DB_ID || !BANK_COLLECTION_ID) {
  throw new Error("Missing envs for unlink-bank route");
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => null);

    const institutionId = body?.institutionId as string | undefined;
    if (!institutionId) {
      return NextResponse.json(
        { ok: false, error: "Missing institutionId" },
        { status: 400 }
      );
    }

    const { database } = await createAdminClient();

    // Find all bank docs for this user + institution
    const docs = await database.listDocuments(
      DB_ID,
      BANK_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("institutionId", institutionId)]
    );

    if (!docs.total) {
      return NextResponse.json(
        { ok: false, error: "Bank not found" },
        { status: 404 }
      );
    }

    for (const doc of docs.documents as any[]) {
      const accessToken = doc.plaidAccessToken as string | undefined;

      // Optional: remove item from Plaid as well
      if (accessToken) {
        try {
          await plaidClient.itemRemove({ access_token: accessToken });
        } catch (err) {
          console.warn("Plaid itemRemove failed, continuing:", err);
        }
      }

      // Remove from Appwrite so your UI no longer sees it
      await database.deleteDocument(DB_ID, BANK_COLLECTION_ID, doc.$id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("unlink-bank error:", err?.response?.data ?? err);
    const msg =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to unlink bank";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
