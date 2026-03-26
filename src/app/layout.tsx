import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({ subsets: ["latin"], weight: ["100", "400", "600", "800", "900"], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "WealthFlow | The Sovereign Ledger",
  description: "Personal finance and betting tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
      </head>
      <body className={`${inter.variable} bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen pb-32`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
