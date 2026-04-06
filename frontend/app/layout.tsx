import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "../styles/globals.css";
import { LoadingSplash } from "@/components/LoadingSplash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinSage Dashboard",
  description: "Smart personal finance assistant",
  icons: {
    icon: "/Logolight.png",
    shortcut: "/Logolight.png",
    apple: "/Logolight.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <Suspense fallback={<LoadingSplash label="Loading app..." />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
