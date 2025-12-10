"use client";

import { useState, useRef } from "react";

export default function ProfileForm({ userDoc }: { userDoc: any }) {
  const [isEditing, setIsEditing] = useState(false);

  const [formValues, setFormValues] = useState({
    firstName: userDoc.firstName || "",
    lastName: userDoc.lastName || "",
    address1: userDoc.address1 || "",
    city: userDoc.city || "",
    state: userDoc.state || "",
    postalCode: userDoc.postalCode || "",
  });

  // 👇 avatar state for this page
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    userDoc.avatarUrl || undefined
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    console.log("Saving profile changes:", formValues);
    // 🔹 Later: call your backend (updateUserProfile) here
    setIsEditing(false);
  };

  // ---------- PHOTO UPLOAD HANDLERS ----------

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);

      const res = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Upload failed");
      }

      // ✅ Update local avatar preview
      setAvatarUrl(json.url);
    } catch (err: any) {
      console.error("Profile photo upload error:", err);
      setUploadError(err?.message || "Failed to upload profile photo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fullName = `${formValues.firstName} ${formValues.lastName}`.trim() || "User";

  return (
    <div className="rounded-xl border p-6 bg-white">
      {/* Header row with title + edit button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Your Profile</h2>
          <p className="text-sm text-gray-500">
            View and update your personal information.
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:underline"
          >
            ✏️ Edit
          </button>
        ) : null}
      </div>

      {/* Avatar + name section */}
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar circle */}
        <div className="h-20 w-20 rounded-full overflow-hidden border flex items-center justify-center bg-gray-50 text-xl font-semibold text-gray-600">
          {avatarUrl ? (
            // use plain img so we don't need next/image here
            <img
              src={avatarUrl}
              alt="Profile photo"
              className="h-full w-full object-cover"
            />
          ) : (
            fullName.charAt(0).toUpperCase()
          )}
        </div>

        {/* Name + upload button */}
        <div className="flex flex-col">
          <span className="font-semibold">{fullName}</span>
          <span className="text-sm text-gray-500">{userDoc.email}</span>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePickFile}
              disabled={isUploading}
              className="text-xs text-blue-600 hover:underline disabled:opacity-60"
            >
              {isUploading
                ? "Uploading..."
                : avatarUrl
                ? "Change photo"
                : "Upload photo"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {uploadError && (
            <p className="mt-1 text-[11px] text-red-500">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* First Name (read-only for now) */}
        <div>
          <label className="text-gray-500 block">First Name</label>
          <span>{formValues.firstName || "—"}</span>
        </div>

        {/* Last Name (read-only for now) */}
        <div>
          <label className="text-gray-500 block">Last Name</label>
          <span>{formValues.lastName || "—"}</span>
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="text-gray-500 block">Address</label>
          {isEditing ? (
            <input
              name="address1"
              value={formValues.address1}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          ) : (
            <span>{formValues.address1 || "—"}</span>
          )}
        </div>

        {/* City */}
        <div>
          <label className="text-gray-500 block">City</label>
          {isEditing ? (
            <input
              name="city"
              value={formValues.city}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          ) : (
            <span>{formValues.city || "—"}</span>
          )}
        </div>

        {/* State */}
        <div>
          <label className="text-gray-500 block">State</label>
          {isEditing ? (
            <input
              name="state"
              value={formValues.state}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          ) : (
            <span>{formValues.state || "—"}</span>
          )}
        </div>

        {/* Postal Code */}
        <div>
          <label className="text-gray-500 block">Postal Code</label>
          {isEditing ? (
            <input
              name="postalCode"
              value={formValues.postalCode}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          ) : (
            <span>{formValues.postalCode || "—"}</span>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Save Changes
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-md border px-4 py-2 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
