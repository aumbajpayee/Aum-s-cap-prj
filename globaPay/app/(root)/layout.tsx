import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import MobileNav from "@/components/MobileNav";
import NotificationBell from "@/components/NotificationBell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // For now we keep the mock user – your Sidebar/MobileNav already use this.
  const loggedIn = { firstName: "Steve", lastName: "Jobs" };

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={loggedIn} />

      <div className="flex size-full flex-col">
        <div className="flex justify-between items-center w-full px-4 py-2 border-b bg-white">
          <Image
            src="/icons/logo.svg"
            width={30}
            height={30}
            alt="Globapay logo"
          />
          <div className="flex items-center gap-4">
            <NotificationBell />
            <MobileNav user={loggedIn} />
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}
