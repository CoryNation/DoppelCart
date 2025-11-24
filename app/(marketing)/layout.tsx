import Footer from "@/components/marketing/Footer";
import { MainNav } from "@/components/layout/MainNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MainNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

