// app/api/news/route.ts
import { NextResponse } from "next/server";

const NEWS_API_KEY = process.env.FINANCIAL_NEWS_API_KEY;
const NEWS_BASE_URL =
  process.env.FINANCIAL_NEWS_BASE_URL ||
  "https://newsapi.org/v2/top-headlines?category=business&language=en";

type RawArticle = {
  title: string;
  url: string;
  source?: { name?: string };
  publishedAt?: string;
};

type NewsArticle = {
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO string
};

export async function GET() {
  try {
    if (!NEWS_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing FINANCIAL_NEWS_API_KEY env var" },
        { status: 500 }
      );
    }

    const url = `${NEWS_BASE_URL}&apiKey=${NEWS_API_KEY}`;

    const res = await fetch(url, {
      // revalidate every 10 minutes so we don’t spam the API in dev/demo
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("News API error:", res.status, text);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch financial news" },
        { status: 502 }
      );
    }

    const json = await res.json();

    const rawArticles: RawArticle[] = json.articles ?? [];

    const articles: NewsArticle[] = rawArticles
      .map((a) => ({
        title: a.title || "Untitled article",
        url: a.url,
        source: a.source?.name || "Unknown source",
        publishedAt: a.publishedAt || new Date().toISOString(),
      }))
      // newest first
      .sort((a, b) =>
        a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0
      )
      .slice(0, 10); // keep it small and clean for the dashboard

    return NextResponse.json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      articles,
    });
  } catch (err: any) {
    console.error("GET /api/news error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected error fetching news" },
      { status: 500 }
    );
  }
}
