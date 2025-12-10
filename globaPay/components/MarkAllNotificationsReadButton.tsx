// components/MarkAllNotificationsReadButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MarkAllNotificationsReadButton({
  disabled,
}: {
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (disabled || loading) return;
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        alert(json?.error || "Failed to mark notifications read.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Updating…" : "Mark All Read"}
    </button>
  );
}
