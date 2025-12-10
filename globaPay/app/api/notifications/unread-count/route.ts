// app/api/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite.server";
import { requireUserId } from "@/lib/serverAuth";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const NOTIFS_COLLECTION_ID =
  process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID ?? "notifications";

export async function GET() {
  try {
    const userId = await requireUserId();
    const { database } = await createAdminClient();

    const res = await database.listDocuments(
      DB_ID,
      NOTIFS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("isRead", false),
      ]
    );

    return NextResponse.json({ ok: true, count: res.total });
  } catch (err: any) {
    console.error("unread-count error:", err?.response?.data ?? err);
    const msg =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load unread count";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
