"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { account } from "@/lib/appwrite.client";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get("userId") || "";
  const secret = searchParams.get("secret") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);

    try {
      await account.updateRecovery(userId, secret, password, confirm);
      setOk("Password updated. Redirecting to sign in…");
      setTimeout(() => router.push("/sign-in"), 1200);
    } catch (err: any) {
      setError(err?.message ?? "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <h1 className="text-2xl font-semibold mb-6">Reset your password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-700">New Password</span>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Confirm Password</span>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-green-600">{ok}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
