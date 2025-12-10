// app/api/transfers/route.ts
import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite.server";
import { requireUserId } from "@/lib/serverAuth";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const NOTIFS_COLLECTION_ID =
  process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID ?? "notifications";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));

    const {
      sourceBank,
      recipientEmail,
      recipientAccount,
      amount,
      note,
    } = body as {
      sourceBank?: string;
      recipientEmail?: string;
      recipientAccount?: string;
      amount?: string;
      note?: string;
    };

    const { database } = await createAdminClient();

    const prettyAmount = amount ? `$${amount}` : "a transfer";

    await database.createDocument(
      DB_ID,
      NOTIFS_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        type: "transfer_initiated",
        message: `Transfer of ${prettyAmount} to ${recipientEmail || "recipient"} has been initiated.`,
        timestamp: new Date().toISOString(),
        isRead: false,
      }
    );

    // In a real app, you'd also persist the transfer itself.
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("transfer API error:", err?.response?.data ?? err);
    const msg =
      err?.response?.data?.error_message ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to submit transfer";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
