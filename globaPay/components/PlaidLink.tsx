'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from "react-plaid-link";

type Props = {
  variant?: 'primary' | 'secondary';
  onLinked?: () => void; // optional callback after success
};

export default function PlaidLink({ variant = 'primary', onLinked }: Props) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 1) Get a link_token from your server
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        const res = await fetch('/api/plaid/create-link-token', { method: 'POST' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to create link token');
        if (!cancelled) setLinkToken(json.link_token);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || 'Failed to create link token');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Configure Plaid Link
  const onSuccess = useCallback(
    async (public_token: string) => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ public_token }),
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to exchange token');

        // optional: tell parent to refresh balances/transactions
        onLinked?.();
      } catch (e: any) {
        setErr(e.message || 'Linking failed');
      } finally {
        setLoading(false);
      }
    },
    [onLinked]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess,
    onExit: () => {},
  });

  if (err) {
    return <div className="text-sm text-red-600">Plaid error: {err}</div>;
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading || !linkToken}
      className={`px-4 py-2 rounded-md text-white disabled:opacity-60 ${
        variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600'
      }`}
    >
      {loading ? 'Linking…' : 'Link Bank Account'}
    </button>
  );
}
