import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

