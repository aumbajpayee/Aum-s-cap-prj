// lib/mfa.ts
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite.server";

const DB_ID = process.env.APPWRITE_DATABASE_ID!;
const MFA_COLLECTION_ID =
  process.env.APPWRITE_MFA_CODES_COLLECTION_ID || "mfa_codes";

if (!DB_ID) {
  throw new Error("APPWRITE_DATABASE_ID is not set");
}

function generate6DigitCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function createMfaChallenge(userId: string, email: string) {
  const { database } = await createAdminClient();

  const code = generate6DigitCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // +5 mins

  // Optionally: delete previous unused codes for this user
  try {
    const existing = await database.listDocuments(DB_ID, MFA_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.equal("used", false),
    ]);

    await Promise.all(
      existing.documents.map((doc: any) =>
        database.updateDocument(DB_ID, MFA_COLLECTION_ID, doc.$id, {
          used: true,
        })
      )
    );
  } catch (err) {
    console.warn("Failed to invalidate old MFA codes:", err);
  }

  const doc = await database.createDocument(
    DB_ID,
    MFA_COLLECTION_ID,
    "unique()",
    {
      userId,
      code,
      expiresAt,
      used: false,
    }
  );

  await sendMfaEmail(email, code);

  return doc;
}

export async function verifyMfaCode(userId: string, code: string) {
  const { database } = await createAdminClient();

  const res = await database.listDocuments(DB_ID, MFA_COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.equal("code", code),
    Query.equal("used", false),
  ]);

  if (!res.total) {
    throw new Error("INVALID_CODE");
  }

  const doc: any = res.documents[0];

  const now = new Date();
  const exp = new Date(doc.expiresAt);

  if (exp.getTime() < now.getTime()) {
    // mark as used/expired
    await database.updateDocument(DB_ID, MFA_COLLECTION_ID, doc.$id, {
      used: true,
    });
    throw new Error("EXPIRED_CODE");
  }

  // mark as used (success)
  await database.updateDocument(DB_ID, MFA_COLLECTION_ID, doc.$id, {
    used: true,
  });

  return true;
}

async function sendMfaEmail(email: string, code: string) {
  // 👉 Here you plug in your real email integration.
  // For now, we log it so you can see it in the server console for testing.
  console.log(`MFA code for ${email}: ${code}`);

  // Example idea (pseudo):
  // const { messaging } = await createAdminClient();
  // await messaging.createEmail(
  //   ... use your Appwrite email setup to send the code ...
  // );
}
