// lib/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const env = (process.env.PLAID_ENV || "sandbox") as keyof typeof PlaidEnvironments;

const configuration = new Configuration({
  basePath: PlaidEnvironments[env],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
      "PLAID-SECRET": process.env.PLAID_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

// Optional helpers (strings are fine; cast to any when passing)
export const plaidProducts = (process.env.PLAID_PRODUCTS || "transactions")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export const plaidCountryCodes = (process.env.PLAID_COUNTRY_CODES || "US,CA")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
