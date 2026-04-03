import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pawn Finance App",
  description: "Finance and pawn shop operations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[var(--color-page)] text-[var(--color-ink)]">
        {children}
      </body>
    </html>
  );
}
