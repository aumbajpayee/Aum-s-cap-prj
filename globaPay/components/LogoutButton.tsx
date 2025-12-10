"use client";

import Image from "next/image";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/sign-in";
  }

  return (
    <button
      onClick={handleLogout}
      className="
        flex items-center gap-3 px-4 py-3 
        text-gray-700 hover:text-white 
        hover:bg-bank-gradient 
        rounded-lg transition-all w-full
      "
    >
      <Image
        src="/icons/logout.svg"
        width={20}
        height={20}
        alt="Logout Icon"
        className="text-gray-700 group-hover:text-white"
      />

      <span className="font-medium">Logout</span>
    </button>
  );
}
