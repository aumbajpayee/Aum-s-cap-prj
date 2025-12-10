// app/api/plaid/create-link-token/route.ts
import { NextResponse } from "next/server";
import { plaidClient, plaidProducts, plaidCountryCodes } from "@/lib/plaid";
import { requireUserId } from "@/lib/serverAuth";

export async function POST() {
  const userId = await requireUserId();

  const resp = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "GlobaPay",
    products: plaidProducts as any,          // e.g., ["transactions"]
    country_codes: plaidCountryCodes as any, // e.g., ["US","CA"]
    language: "en",
  });

  return NextResponse.json({ link_token: resp.data.link_token });
}
