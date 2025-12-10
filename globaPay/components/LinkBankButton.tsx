"use client";
import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function LinkBankButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1) Ask your server for a link_token
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/plaid/create-link-token", { method: "POST" });
        const d = await r.json();
        setLinkToken(d.link_token);
      } catch (e) {
        console.error("Failed to create link token", e);
        alert("Could not start bank linking. Please try again.");
      }
    })();
  }, []);

  // 2) Handler: when Plaid returns public_token, exchange it on server
  const onSuccess = async (public_token: string) => {
    try {
      setLoading(true);
      const r = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      if (!r.ok) throw new Error("Exchange failed");
      // Done → go to dashboard (or wherever)
      window.location.href = "/";
    } catch (e) {
      console.error(e);
      alert("Bank linking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess,
  });

  return (
    <button
      className="px-4 py-2 rounded bg-blue-900 text-white disabled:opacity-50"
      disabled={!ready || loading}
      onClick={() => open()}
    >
      {loading ? "Linking..." : "Link Bank Account"}
    </button>
  );
}
