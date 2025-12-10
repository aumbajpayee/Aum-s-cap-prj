// app/(root)/notifications/page.tsx
import { headers } from "next/headers";
import MarkAllNotificationsReadButton from "@/components/MarkAllNotificationsReadButton";

async function absUrl(path: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
}

async function getNotifications() {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  const url = await absUrl("/api/notifications");

  const res = await fetch(url, {
    cache: "no-store",
    headers: { cookie },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "Failed to load notifications");
  }

  return json.notifications as any[];
}

export default async function NotificationsPage() {
  let notifications: any[] = [];

  try {
    notifications = await getNotifications();
  } catch (err: any) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-red-600">
          {err?.message || "Unable to load notifications."}
        </p>
      </main>
    );
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <MarkAllNotificationsReadButton disabled={!hasUnread} />
      </header>

      {notifications.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-gray-600">
          You&apos;re all caught up!
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const isUnread = !n.isRead;
            const date = n.timestamp
              ? new Date(n.timestamp).toLocaleString()
              : "";

            return (
              <li
                key={n.$id}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  isUnread ? "bg-blue-50 border-blue-200" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {n.message || "Notification"}
                  </span>
                  <span className="ml-3 text-[11px] uppercase tracking-wide text-gray-500">
                    {n.type}
                  </span>
                </div>
                {date && (
                  <div className="mt-1 text-xs text-gray-500">
                    {date}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
