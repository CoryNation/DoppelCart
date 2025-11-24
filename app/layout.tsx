import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "DoppleCart - AI Influencer Management",
  description: "Push a cart full of AI influencers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background min-h-screen flex flex-col font-sans antialiased">
        <ThemeProvider>
          <div className="flex-1">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}

