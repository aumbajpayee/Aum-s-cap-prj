// app/api/profile/photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { createSessionClient, createAdminClient } from "@/lib/appwrite.server";

// We only need Storage + Account + bucket configs now
const BUCKET_ID = process.env.APPWRITE_BUCKET_USER_PHOTOS!;
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT!;

export async function POST(req: NextRequest) {
  try {
    // 1) Read file from multipart/form-data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // 2) Get current user session (Appwrite Account)
    const { account } = await createSessionClient();
    const me = await account.get();
    const userId = me.$id;

    // 3) Upload file to Appwrite Storage (admin client)
    const { storage } = await createAdminClient();
    const created = await storage.createFile(BUCKET_ID, ID.unique(), file as any);

    const fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${created.$id}/view?project=${PROJECT_ID}`;

    // 4) Store avatar URL in user preferences (no strict schema!)
    await account.updatePrefs({
      avatarUrl: fileUrl,
    });

    console.log(
      `Profile photo updated for user ${userId}, stored in prefs.avatarUrl`
    );

    return NextResponse.json({ ok: true, url: fileUrl });
  } catch (err: any) {
    console.error("profile photo upload error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
