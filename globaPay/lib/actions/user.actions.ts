"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite.server";
import { cookies } from "next/headers";
import { parseStringify } from "../utils";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
} = process.env;

// ----------------- SIGN UP -----------------
export const signUp = async ({ password, ...userData }: any) => {
  const { email, firstName, lastName } = userData;

  try {
    const { account, database } = await createAdminClient();

    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    // 1. Create Appwrite Auth user
    const newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      fullName
    );

    if (!newUserAccount) throw new Error("Error creating user");

    // 2. Create user document in DB (match schema, including hasLinkedBank)
    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        stripeCustomerId: "", // placeholder
        stripeCustomerUrl: "", // placeholder
        hasLinkedBank: false, // start with no bank
      }
    );

    // 3. Create session
    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    // 4. Return new user so AuthForm sees it
    return parseStringify(newUser);
  } catch (error) {
    console.error("SignUp Error", error);
    return null;
  }
};

// ----------------- SIGN IN -----------------
export const signIn = async ({ email, password }: any) => {
  try {
    const { account } = await createAdminClient();

    // 1. Create session
    const session = await account.createEmailPasswordSession(email, password);

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    // 2. Return minimal user/session info
    return { success: true, session };
  } catch (error) {
    console.error("SignIn Error", error);
    return null;
  }
};

// ----------------- GET LOGGED IN USER -----------------
export const getLoggedInUser = async () => {
  try {
    // 1) Use session client to know WHICH user is logged in
    const { account } = await createSessionClient();
    const authUser = await account.get(); // Appwrite Auth user

    const prefs: any = (authUser as any).prefs || {};
    const avatarUrl = prefs.avatarUrl ?? null;

    // 2) Use ADMIN client to query the Users collection
    const { database } = await createAdminClient();

    let dbUser: any = null;
    try {
      const userDocs = await database.listDocuments(
        DATABASE_ID!,
        USER_COLLECTION_ID!,
        [Query.equal("userId", authUser.$id)]
      );

      if (userDocs.total > 0) {
        dbUser = userDocs.documents[0];
      }
    } catch (innerErr) {
      console.error("getLoggedInUser DB lookup error:", innerErr);
    }

    // 3) If we found a user document, merge it with auth + avatarUrl
    if (dbUser) {
      const merged = {
        ...dbUser,
        authId: authUser.$id,
        email: dbUser.email ?? authUser.email,
        avatarUrl, // ✅ from prefs
      };

      return parseStringify(merged);
    }

    // 4) Fallback: minimal user from auth record
    const [firstName = "Guest", ...rest] = (authUser.name || "").split(" ");
    const lastName = rest.join(" ");

    return {
      $id: authUser.$id,
      firstName,
      lastName,
      email: authUser.email,
      avatarUrl,
    };
  } catch (error) {
    console.error("getLoggedInUser Error", error);
    return null;
  }
};


/** Get the logged-in user’s document from your Users collection */
export async function getCurrentUserDoc() {
  try {
    const { account } = await createSessionClient(); // uses cookie session
    const me = await account.get(); // Appwrite Auth user

    const { database } = await createAdminClient(); // admin to query DB
    const res = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal("userId", me.$id)]
    );

    return res.documents?.[0] || null; // return the user doc (or null)
  } catch (err) {
    console.error("getCurrentUserDoc error:", err);
    return null;
  }
}

/** Update selected profile fields on the user document */
export async function updateUserProfile(
  documentId: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    postalCode: string;
  }>
) {
  try {
    const { database } = await createAdminClient();
    const updated = await database.updateDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      documentId,
      data
    );
    return updated;
  } catch (err) {
    console.error("updateUserProfile error:", err);
    return null;
  }
}
