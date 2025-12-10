// components/FinancialNews.tsx
"use client";

import { useEffect, useState } from "react";

type NewsArticle = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
};

type ApiResponse =
  | { ok: true; articles: NewsArticle[] }
  | { ok: false; error: string };

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / (1000 * 60));

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hour${diffH === 1 ? "" : "s"} ago`;

  const diffD = Math.floor(diffH / 24);
  return `${diffD} day${diffD === 1 ? "" : "s"} ago`;
}

export default function FinancialNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchNews() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/news");
        const json: ApiResponse = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(
            !json.ok && "error" in json ? json.error : "Failed to load news"
          );
        }

        if (!cancelled) {
          setArticles(json.articles);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("FinancialNews error:", err);
          setError("Unable to load news right now. Please try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNews();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Latest Financial News
        </h2>
        <span className="text-xs text-slate-500">Updated live</span>
      </header>

      {loading && (
        <p className="py-6 text-sm text-slate-500">Loading latest headlines…</p>
      )}

      {!loading && error && (
        <p className="py-6 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && articles.length === 0 && (
        <p className="py-6 text-sm text-slate-500">
          No financial news available at the moment.
        </p>
      )}

      {!loading && !error && articles.length > 0 && (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.url}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1 rounded-lg px-2 py-1 hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-900 line-clamp-2">
                  {a.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{a.source}</span>
                  <span>•</span>
                  <span>{timeAgo(a.publishedAt)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
