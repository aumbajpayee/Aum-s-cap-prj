'use client'

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { sidebarLinks } from "@/constants"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();

  return (
    // ✅ Changed from w-full max-w-[264px] to w-fit for proper alignment
    <section className="w-fit">
      <Sheet>
        <SheetTrigger>
          <Image
            src="/icons/hamburger.svg"
            width={30}
            height={30}
            alt="menu"
            className="cursor-pointer"
          />
        </SheetTrigger>

        <SheetContent side="left" className="border-none bg-white p-0">
          {/* Accessible title for screen readers */}
          <SheetHeader>
            <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
          </SheetHeader>

          {/* Logo and App Name */}
          <Link href="/" className="cursor-pointer flex items-center gap-1 px-4 pt-4">
            <Image 
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt="GlobaPay"
            />
            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">GlobaPay</h1>
          </Link>

          {/* Nav + Footer */}
          <div className="flex h-full flex-col justify-between px-4 pb-6">
            <nav className="flex flex-col gap-6 pt-10 text-white">
              {sidebarLinks.map((item) => {
                const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);

                return (
                  <SheetClose asChild key={item.route}>
                    <Link
                      href={item.route}
                      className={cn('mobilenav-sheet_close w-full flex items-center gap-3', {
                        'bg-bank-gradient': isActive
                      })}
                    >
                      <Image 
                        src={item.imgURL}
                        alt={item.label}
                        width={20}
                        height={20}
                        className={cn({
                          'brightness-[3] invert-0': isActive
                        })}
                      />
                      <p className={cn("text-16 font-semibold text-black-2", {
                        "text-white": isActive
                      })}>
                        {item.label}
                      </p>
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-6 border-t border-gray-200 text-sm text-gray-500">
              © 2025 GlobaPay. All rights reserved.
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default MobileNav;
