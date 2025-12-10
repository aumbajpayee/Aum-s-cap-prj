// components/UnlinkBankButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlinkBankButton({
  institutionId,
}: {
  institutionId?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const disabled = !institutionId || loading;

  const handleClick = async () => {
    if (!institutionId || loading) return;

    const ok = window.confirm(
      "This will unlink this bank and hide all its accounts and transactions. Continue?"
    );
    if (!ok) return;

    try {
      setLoading(true);
      const res = await fetch("/api/plaid/unlink-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId }),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        alert(json?.error || "Failed to unlink bank");
        return;
      }

      // Refresh the server component (My Banks) to show updated list
      router.refresh();
    } catch (err) {
      console.error("unlink-bank UI error:", err);
      alert("Something went wrong while unlinking bank.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className="ml-3 rounded-md border px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? "Removing..." : "Remove bank"}
    </button>
  );
}
