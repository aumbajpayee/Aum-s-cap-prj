// app/api/notifications/mark-all-read/route.ts
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite.server";
import { requireUserId } from "@/lib/serverAuth";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const NOTIFS_COLLECTION_ID =
  process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID ?? "notifications";

export async function POST() {
  try {
    const userId = await requireUserId();
    const { database } = await createAdminClient();

    // grab unread notifications for this user
    const res = await database.listDocuments(
      DB_ID,
      NOTIFS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("isRead", false),
      ]
    );

    // mark each as read
    await Promise.all(
      res.documents.map((doc: any) =>
        database.updateDocument(DB_ID, NOTIFS_COLLECTION_ID, doc.$id, {
          isRead: true,
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("mark-all-read error:", err?.response?.data ?? err);
    const msg =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to mark notifications read";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
