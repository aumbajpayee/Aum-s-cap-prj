// app/(root)/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

type CategoryBucket = {
  key: string;
  label: string;
  amount: number;
};

type TimelinePoint = {
  date: string;
  total: number;
};

type MerchantBucket = {
  name: string;
  amount: number;
};

type AnalyticsResponse = {
  ok: boolean;
  rangeDays: number;
  categories: CategoryBucket[];
  timeline: TimelinePoint[];
  merchants: MerchantBucket[];
  totalSpend: number;
  error?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  food_dining: "#1D4ED8", // blue
  shopping_retail: "#F97316", // orange
  transport_travel: "#22C55E", // green
  bills_utilities: "#EAB308", // yellow
  other: "#6B7280", // gray
};

const FALLBACK_COLORS = ["#1D4ED8", "#F97316", "#22C55E", "#EAB308", "#6B7280"];

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7" | "30" | "60">("30");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (r: "7" | "30" | "60") => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/analytics/spending?range=${r}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as AnalyticsResponse;

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load analytics");
      }

      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "7" | "30" | "60";
    setRange(value);
  };

  const hasData = !!data && data.totalSpend > 0;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Spending Analytics</h1>
          <p className="text-sm text-gray-600">
            Visualize where your money goes over time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Date Range:</label>
          <select
            value={range}
            onChange={handleRangeChange}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
          </select>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-gray-600">Loading analytics…</p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && data && !hasData && (
        <div className="rounded-lg border p-4 text-sm text-gray-600">
          No spending data available yet for this period.
        </div>
      )}

      {!loading && !error && data && hasData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Doughnut: Category breakdown */}
          <section className="col-span-1 rounded-lg border p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              Spending by Category
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categories}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {data.categories.map((c, index) => {
                      const color =
                        CATEGORY_COLORS[c.key] ||
                        FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                      return <Cell key={c.key} fill={color} />;
                    })}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: any, _name: any, props: any) => {
                      const amount = Number(value || 0);
                      const total = data.totalSpend || 1;
                      const pct = (amount / total) * 100;
                      return [
                        `$${amount.toFixed(2)} (${pct.toFixed(1)}%)`,
                        props?.payload?.label || "Category",
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-gray-700">
              {data.categories.map((c, index) => {
                const color =
                  CATEGORY_COLORS[c.key] ||
                  FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                const pct =
                  data.totalSpend > 0
                    ? (c.amount / data.totalSpend) * 100
                    : 0;

                return (
                  <li key={c.key} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {c.label}
                    </span>
                    <span>
                      ${c.amount.toFixed(2)}{" "}
                      <span className="text-gray-500">
                        ({pct.toFixed(1)}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Line chart: Spending over time */}
          <section className="col-span-1 rounded-lg border p-4 lg:col-span-2">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              Spending Over Time
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <RechartsTooltip
                    formatter={(value: any) =>
                      [`$${Number(value || 0).toFixed(2)}`, "Total spent"]
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#1D4ED8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Bar chart: Top merchants */}
          <section className="col-span-1 rounded-lg border p-4 lg:col-span-3">
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              Top Merchants
            </h2>
            {data.merchants.length === 0 ? (
              <p className="text-sm text-gray-600">
                No merchant data for this period.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.merchants}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={11} />
                    <RechartsTooltip
                      formatter={(value: any) =>
                        [`$${Number(value || 0).toFixed(2)}`, "Total spent"]
                      }
                    />
                    <Bar dataKey="amount" fill="#22C55E" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
