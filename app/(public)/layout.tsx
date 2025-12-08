import { HeaderWrapper } from "@/features/header";
import { FooterWrapper } from "@/features/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderWrapper />
      <main className="flex-1">{children}</main>
      <FooterWrapper />
    </>
  );
}

