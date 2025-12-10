// components/TransactionsFilter.tsx
"use client";
import { useEffect, useState } from "react";

type Account = {
  account_id: string;
  name?: string | null;
  mask?: string | null;
};

export type TxFilters = {
  q?: string;
  startDate?: string; // yyyy-mm-dd
  endDate?: string;   // yyyy-mm-dd
  type?: "all" | "expense" | "income";
  accountId?: string;
};

export default function TransactionsFilter({
  value,
  onApply,
  onReset,
  compact = false,
}: {
  value: TxFilters;                 // currently applied filters
  onApply: (v: TxFilters) => void;  // called only when user clicks Apply
  onReset?: () => void;
  compact?: boolean;
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [draft, setDraft] = useState<TxFilters>(value);

  useEffect(() => setDraft(value), [JSON.stringify(value)]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/plaid/accounts", { cache: "no-store" });
        const j = await r.json();
        if (j?.ok && Array.isArray(j.accounts)) {
          const mapped: Account[] = j.accounts
            .map((a: any) => ({
              account_id: a.accountId || a.account_id, // ✅ map new shape
              name: a.name ?? null,
              mask: a.mask ?? null,
            }))
            .filter((a: Account) => !!a.account_id);
          setAccounts(mapped);
        }
      } catch {
        // ignore; dropdown will just be empty
      }
    })();
  }, []);

  const set = (k: keyof TxFilters, v: any) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  return (
    <div
      className={`mb-3 flex flex-wrap items-end gap-2 ${
        compact ? "text-sm" : ""
      }`}
    >
      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Search</label>
        <input
          value={draft.q || ""}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Merchant…"
          className="w-48 rounded-md border px-3 py-2"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">From</label>
        <input
          type="date"
          value={draft.startDate || ""}
          onChange={(e) => set("startDate", e.target.value)}
          className="rounded-md border px-3 py-2"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">To</label>
        <input
          type="date"
          value={draft.endDate || ""}
          onChange={(e) => set("endDate", e.target.value)}
          className="rounded-md border px-3 py-2"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Type</label>
        <select
          value={draft.type || "all"}
          onChange={(e) =>
            set("type", e.target.value as TxFilters["type"])
          }
          className="rounded-md border px-3 py-2"
        >
          <option value="all">All</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500">Account</label>
        <select
          value={draft.accountId || ""}
          onChange={(e) => set("accountId", e.target.value)}
          className="rounded-md border px-3 py-2"
        >
          <option value="">All accounts</option>
          {accounts.map((a) => (
            <option key={a.account_id} value={a.account_id}>
              {(a.name || "Account")} {a.mask ? `••••${a.mask}` : ""}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => onApply(draft)}
        className="rounded-md border px-3 py-2 hover:bg-gray-50"
      >
        Apply
      </button>

      <button
        onClick={() => {
          setDraft({ type: "all" });
          onApply({ type: "all" });
          onReset?.();
        }}
        className="rounded-md border px-3 py-2 hover:bg-gray-50"
      >
        Reset
      </button>
    </div>
  );
}
