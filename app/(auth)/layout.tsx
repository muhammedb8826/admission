import Image from "next/image";
import Link from "next/link";
import { fetchGlobalData, EMPTY_GLOBAL_DATA } from "@/features/header/services/global.service";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let copyright = EMPTY_GLOBAL_DATA.footer.copyRight;

  try {
    const globalData = await fetchGlobalData();
    copyright = globalData.footer.copyRight;
  } catch (error) {
    console.warn("Failed to fetch global data for copyright:", error);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="mb-8">
            <Link href="/" aria-label="Go to home page">
              <Image
                src="/images/logo/Dembidolo_University.png"
                alt="Dembi Dollo University Logo"
                width={100}
                height={80}
                className="h-auto w-auto object-contain max-w-40 cursor-pointer"
                priority
              />
            </Link>
          </div>
          {children}
        </div>
        <div className="w-full py-4 text-center">
          <p className="text-xs text-muted-foreground">
            {copyright}
          </p>
        </div>
      </div>
    </main>
  );
}

