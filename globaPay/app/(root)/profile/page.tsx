// app/(root)/profile/page.tsx
import ProfileForm from "@/components/ProfileForm";
import { getCurrentUserDoc } from "@/lib/actions/user.actions";

export default async function ProfilePage() {
  const userDoc = await getCurrentUserDoc();

  if (!userDoc) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Profile</h1>
        <p className="text-gray-600">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Read-only section */}
      <div className="rounded-xl border p-6 bg-white">
        <h1 className="text-xl font-semibold mb-1">Account</h1>
        <p className="text-sm text-gray-500">Basic account details</p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Full Name:</span>{" "}
            {userDoc.firstName && userDoc.lastName
        ? `${userDoc.firstName} ${userDoc.lastName}`
        : "—"}
          </div>
          <div>
            <span className="text-gray-500">Email:</span> {userDoc.email}
          </div>
          <div>
            <span className="text-gray-500">User ID:</span> {userDoc.userId}
          </div>
        </div>
      </div>

      {/* Editable info */}
      <ProfileForm userDoc={userDoc} />
    </div>
  );
}
