import RecentTransactions from "@/components/RecentTransactions";
import Link from "next/link";

export default function TransactionHistoryPage() {
  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transaction History</h1>
        <Link href="/" className="text-sm text-blue-600 underline">Back to Dashboard</Link>
      </div>

      {/* Reuse the same component: on this page the user can “Load more” repeatedly */}
      <RecentTransactions />
      {/* Tip: if you want different page-size here, you can clone RecentTransactions into a History version with limit=25 */}
    </main>
  );
}
