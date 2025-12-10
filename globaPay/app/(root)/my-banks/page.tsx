// app/(root)/my-banks/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import UnlinkBankButton from "@/components/UnlinkBankButton";

// ---------- Types ----------
type UiAccount = {
  accountId: string;
  name: string;
  subtype?: string | null;
  mask?: string | null;
  currentBalance: number;
  isoCurrencyCode?: string | null;
  institutionName?: string | null;
  institutionId?: string | null; // ✅ for unlinking
};

// ---------- Helpers ----------
function localeFor(code?: string | null): string {
  const c = (code || "").toUpperCase();
  if (c === "CAD") return "en-CA";
  if (c === "USD") return "en-US";
  if (c === "EUR") return "de-DE";
  return "en-US";
}

function money(n: number | null | undefined, code?: string | null) {
  const val = Number(n ?? 0);
  try {
    return new Intl.NumberFormat(localeFor(code), {
      style: "currency",
      currency: code || "USD",
      maximumFractionDigits: 2,
    }).format(val);
  } catch {
    return `${val.toFixed(2)} ${code || ""}`;
  }
}

async function absUrl(path: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
}

async function getAccounts(): Promise<UiAccount[]> {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const url = await absUrl("/api/plaid/accounts");

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie },
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // Non-JSON – let checks below handle it
  }

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "Failed to load accounts");
  }

  return json.accounts as UiAccount[];
}

// ---------- Page ----------
export default async function MyBanksPage() {
  let accounts: UiAccount[] = [];

  try {
    accounts = await getAccounts();
  } catch (e: any) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">My Banks</h1>
        <p className="text-sm text-red-600">
          Error: {e?.message ?? "Unable to load accounts."}
        </p>
      </main>
    );
  }

  const hasBanks = accounts.length > 0;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Banks</h1>
        <Link
          href="/link-bank"
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          + Link another bank
        </Link>
      </header>

      {!hasBanks ? (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-gray-700">
            You don&apos;t have any linked banks yet.{" "}
            <Link href="/link-bank" className="text-blue-600 underline">
              Click here to link your first bank.
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {accounts.map((a) => {
            const code = a.isoCurrencyCode ?? "USD";
            const current = money(a.currentBalance, code);

            return (
              <li
                key={a.accountId}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {a.name || "Account"}{" "}
                    <span className="ml-1 text-xs text-gray-500">
                      {a.subtype ? a.subtype : "—"}
                      {a.institutionName ? ` • ${a.institutionName}` : ""}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {a.name || "—"} • {a.mask ? `••••${a.mask}` : "—"}
                  </div>
                </div>

                <div className="ml-4 flex items-center">
                  <div className="text-right">
                    <div className="font-semibold">{current}</div>
                  </div>

                  {/* ✅ Remove / unlink bank */}
                  <UnlinkBankButton institutionId={a.institutionId} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
