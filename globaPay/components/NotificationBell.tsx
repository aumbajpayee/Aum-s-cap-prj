// components/NotificationBell.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchCount = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setCount(json.count ?? 0);
      } else {
        setCount(0);
      }
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000); // poll every 30s
    return () => clearInterval(id);
  }, []);

  // When on notifications page and it refreshes, we'll be re-mounted,
  // and the polling above will re-run.
  useEffect(() => {
    if (pathname === "/notifications") {
      fetchCount();
    }
  }, [pathname]);

  const onClick = () => {
    router.push("/notifications");
  };

  const showBadge = !loading && (count ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-gray-100"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5 text-gray-700" />
      {showBadge && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
