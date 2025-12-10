"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import BankCard from "./BankCard";

interface RightSidebarProps {
  user: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string; // 👈 add this
  } | null;
  banks?: any[];
  transactions?: any[];
}

export default function RightSidebar({ user, banks }: RightSidebarProps) {
  if (!user) return null;

  const firstInitial = user.firstName?.[0] ?? "U";
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

  return (
    <aside className="right-sidebar">
      {/* Profile */}
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />
        <div className="profile">
          <div className="profile-img relative overflow-hidden">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="Profile photo"
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-blue-500 flex items-center justify-center w-full h-full">
                {firstInitial}
              </span>
            )}
          </div>

          <div className="profile-details">
            <Link href="/profile">
              <h1 className="profile-name hover:underline cursor-pointer">
                {fullName || "Guest User"}
              </h1>
            </Link>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>
      </section>

      {/* Banks */}
      <section className="banks">
        <div className="flex w-full justify-between items-center">
          <h2 className="header-2">My Banks</h2>

          <Link href="/my-banks" className="flex gap-2 items-center">
            <Image src="/icons/plus.svg" width={20} height={20} alt="add" />
            <span className="text-14 font-semibold text-gray-600">
              Add Bank
            </span>
          </Link>
        </div>

        {banks && banks.length > 0 ? (
          <div className="relative mt-4 flex flex-col items-center justify-center gap-5">
            {/* Main Card */}
            <div className="relative z-10 w-full">
              <BankCard
                key={banks[0].id ?? 0}
                account={banks[0]}
                userName={fullName}
                showBalance={false}
              />
            </div>

            {/* Second card, offset */}
            {banks[1] && (
              <div className="absolute right-0 top-8 z-0 w-[90%]">
                <BankCard
                  key={banks[1].id ?? 1}
                  account={banks[1]}
                  userName={fullName}
                  showBalance={false}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No banks linked yet. Click “Add Bank” to connect an account.
          </p>
        )}
      </section>
    </aside>
  );
}
