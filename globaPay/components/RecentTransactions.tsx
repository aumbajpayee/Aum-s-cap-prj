"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TransactionsFilter, { type TxFilters } from "./TransactionsFilter";

type Tx = {
  transaction_id: string;
  account_id?: string | null;
  date: string;
  name: string | null;
  amount: number; // Plaid: expenses > 0, refunds/credits < 0
  iso_currency_code?: string | null;
  account_label?: string | null;
  mask?: string | null;
  pending?: boolean;
};

function localeFor(code?: string | null) {
  switch (code) {
    case "CAD": return "en-CA";
    case "USD": return "en-US";
    default:    return undefined;
  }
}
function formatMoney(amount: number, code?: string | null) {
  const loc = localeFor(code);
  try {
    return new Intl.NumberFormat(loc, { style: "currency", currency: code || "USD" })
      .format(Math.abs(amount));
  } catch {
    return `${Math.abs(amount).toFixed(2)} ${code || ""}`;
  }
}

export default function RecentTransactions() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busyMore, setBusyMore] = useState(false);

  // Only changes when user hits "Apply" in the filter
  const [filters, setFilters] = useState<TxFilters>({ type: "all" });

  async function fetchPage(nextOffset = 0, replace = nextOffset === 0) {
    const params = new URLSearchParams();
    params.set("limit", "10");
    params.set("offset", String(nextOffset));
    if (filters.q) params.set("q", filters.q);
    if (filters.startDate) params.set("start", filters.startDate);
    if (filters.endDate) params.set("end", filters.endDate);
    if (filters.type && filters.type !== "all") params.set("type", filters.type);
    if (filters.accountId) params.set("accountId", filters.accountId);

    const r = await fetch(`/api/plaid/transactions?` + params.toString(), { cache: "no-store" });
    let j: any = null;
    try {
      j = await r.json();
    } catch {
      throw new Error("Server returned an unexpected response");
    }

    if (r.status === 404 && j?.reason === "NO_LINKED_BANK") {
      setErr("NO_LINKED_BANK");
      setLoading(false);
      return;
    }
    if (!r.ok || !j?.ok) throw new Error(j?.error || "Failed to load");

    if (replace) setTxs(j.transactions);
    else setTxs(prev => [...prev, ...j.transactions]);

    setOffset(j.nextOffset ?? nextOffset);
    setHasMore(Boolean(j.hasMore));
  }

  // Initial load + whenever user clicks Apply (changes `filters`)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        await fetchPage(0, true);
      } catch (e: any) {
        setErr(e.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const filteredForCsv = useMemo(() => txs, [txs]);

  function downloadCSV() {
    const rows = [
      ["Date", "Merchant", "Amount", "Currency", "Account", "Mask", "Pending"],
      ...filteredForCsv.map(t => [
        t.date,
        t.name || "",
        String(t.amount),
        t.iso_currency_code || "",
        t.account_label || "",
        t.mask ? `****${t.mask}` : "",
        t.pending ? "yes" : "no",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="text-sm text-gray-500">Loading recent transactions…</div>;

  if (err === "NO_LINKED_BANK") {
    return (
      <div className="rounded-lg border p-4">
        <div className="text-sm text-gray-600">
          No bank account linked.{" "}
          <Link href="/link-bank" className="text-blue-600 underline">
            Link a Bank
          </Link>{" "}
          to see your transactions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <TransactionsFilter
          value={filters}
          onApply={setFilters}
          onReset={() => setFilters({ type: "all" })}
          compact
        />
        <button onClick={downloadCSV} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
          Download CSV
        </button>
      </div>

      {err && <div className="text-sm text-red-600">Error: {err}</div>}
      {!err && txs.length === 0 && (
        <div className="text-sm text-gray-500">No transactions match your filters.</div>
      )}

      {txs.map((t) => {
        const isOutflow = (t.amount ?? 0) > 0;
        const isInflow = (t.amount ?? 0) < 0;
        return (
          <div key={t.transaction_id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0">
              <div className="font-medium truncate">
                {t.name || "Unknown Merchant"}{" "}
                {t.pending ? <span className="ml-2 text-xs text-amber-600">(pending)</span> : null}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(t.date).toLocaleDateString()} • {t.account_label || "Account"}{" "}
                {t.mask ? `••••${t.mask}` : ""}
              </div>
            </div>
            <div className="ml-3 shrink-0 text-right">
              <div
                className={`font-semibold ${isOutflow ? "text-red-600" : isInflow ? "text-green-600" : "text-gray-700"}`}
                aria-label={isOutflow ? "Expense" : isInflow ? "Deposit" : "Neutral"}
              >
                {isOutflow ? "−" : isInflow ? "+" : ""}
                {formatMoney(t.amount, t.iso_currency_code)}
              </div>
              <div
                className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                  isOutflow
                    ? "border-red-200 bg-red-50 text-red-600"
                    : isInflow
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                {isOutflow ? "Expense" : isInflow ? "Deposit" : "Pending"}
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <Link
          href={{
            pathname: "/transaction-history",
            query: {
              q: filters.q || "",
              start: filters.startDate || "",
              end: filters.endDate || "",
              type: filters.type || "all",
              accountId: filters.accountId || "",
            },
          }}
          className="inline-block rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          onClick={() => setBusyMore(true)}
        >
          {busyMore ? "Opening…" : "Load more → full history"}
        </Link>
      )}
    </div>
  );
}
