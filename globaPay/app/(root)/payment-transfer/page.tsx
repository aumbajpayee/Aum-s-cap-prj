// app/(root)/payment-transfer/page.tsx
"use client";

import { useEffect, useState } from "react";

type BankAccount = {
  account_id: string;
  name: string | null;
  mask: string | null;
};

const PaymentTransferPage = () => {
  const [form, setForm] = useState({
    sourceBank: "",
    note: "",
    recipientEmail: "",
    recipientAccount: "",
    amount: "",
  });

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch bank accounts for dropdown
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/plaid/accounts", { cache: "no-store" });
        const json = await res.json();

        if (json?.ok && Array.isArray(json.accounts)) {
          const mapped = json.accounts.map((a: any) => ({
            account_id: a.accountId || a.account_id,
            name: a.name ?? "Account",
            mask: a.mask ?? null,
          }));
          setAccounts(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    })();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    try {
      setLoading(true);

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Transfer failed");
      }

      setStatus("Transfer submitted. Check Notifications for details.");
      setForm({
        sourceBank: "",
        note: "",
        recipientEmail: "",
        recipientAccount: "",
        amount: "",
      });
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Payment Transfer</h1>
      <p className="text-gray-600 mb-4">
        Please provide any specific details or notes related to the payment transfer.
      </p>

      {status && <p className="mb-3 text-sm text-green-600">{status}</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Transfer Details */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Transfer details</h2>

          <div className="space-y-4">

            {/* Source Bank Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Source Bank
              </label>

              <select
                name="sourceBank"
                value={form.sourceBank}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Select a bank...</option>

                {accounts.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.name} {acc.mask ? `••••${acc.mask}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transfer Amount (CAD)
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="e.g. 250.00"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Add any relevant information about the transfer..."
                className="w-full border rounded-md px-3 py-2"
                rows={4}
              />
            </div>

          </div>
        </section>

        {/* Recipient Details */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Bank account details</h2>

          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient's Email Address
              </label>
              <input
                type="email"
                name="recipientEmail"
                value={form.recipientEmail}
                onChange={handleChange}
                placeholder="john@gmail.com"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient's Bank Account Number
              </label>
              <input
                type="text"
                name="recipientAccount"
                value={form.recipientAccount}
                onChange={handleChange}
                placeholder="Enter account number"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

          </div>
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Transferring..." : "Transfer Funds"}
        </button>

      </form>
    </div>
  );
};

export default PaymentTransferPage;
