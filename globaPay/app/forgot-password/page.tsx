"use client";

import { useState } from "react";
import { account } from "@/lib/appwrite.client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    setLoading(true);

    try {
      const origin = window.location.origin;
      const url = `${origin}/reset-password`;

      // Support both old/new SDK method names
      const createRecovery =
        (account as any).createRecovery ??
        (account as any).createPasswordRecovery;

      if (!createRecovery) {
        throw new Error("This Appwrite SDK version has no recovery method.");
      }

      await createRecovery.call(account, email, url);

      setOk(
        "If an account exists for that email, a reset link has been sent. Please check your inbox."
      );
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <h1 className="text-2xl font-semibold mb-6">Forgot Password</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-700">Email</span>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-green-600">{ok}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
