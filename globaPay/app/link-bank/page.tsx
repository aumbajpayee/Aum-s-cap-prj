"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlaidLink } from "react-plaid-link";

export default function LinkBankPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);

  const router = useRouter();

  // 1) Get a link_token from our backend
  useEffect(() => {
    const getLinkToken = async () => {
      try {
        setError(null);

        const res = await fetch("/api/plaid/create-link-token", {
          method: "POST",
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.link_token) {
          throw new Error(data.error || "Failed to create link token");
        }

        setLinkToken(data.link_token);
      } catch (err: any) {
        console.error("create-link-token error:", err);
        setError(err.message || "Failed to initialise Plaid Link");
      }
    };

    getLinkToken();
  }, []);

  // 2) What happens when Plaid returns a public_token
  const onSuccess = async (public_token: string, metadata: any) => {
    try {
      setIsExchanging(true);
      setError(null);

      const res = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token, metadata }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to exchange token");
      }

      // ✅ Success – go back to home/dashboard
      router.push("/");
    } catch (err: any) {
      console.error("Exchange error:", err);
      setError(err.message || "Failed to exchange token");
    } finally {
      setIsExchanging(false);
    }
  };

  // 3) Plaid hook – always pass a config; just use an empty token until ready
  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess,
    onExit: (err) => {
      if (err) {
        console.warn("Plaid exited with error:", err);
        setError(
          (err as any).display_message ||
            (err as any).message ||
            "Plaid Link exited"
        );
      }
    },
  });

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-4">Link a bank account</h1>
      <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
        Connect another bank account securely using Plaid. You can link multiple
        institutions and we&apos;ll pull balances for all of them.
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {!linkToken && !error && (
        <p className="text-gray-500 mb-4">Initialising Plaid…</p>
      )}

      <button
        type="button"
        disabled={!ready || !linkToken || isExchanging}
        onClick={() => open()}
        className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
      >
        {isExchanging ? "Linking…" : "Link a bank"}
      </button>
    </main>
  );
}
