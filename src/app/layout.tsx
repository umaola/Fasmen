import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import { FirebaseAnalytics } from "@/components/FirebaseAnalytics";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FASMEN — Learn from private instructors",
  description: "A trusted marketplace for private instructors to teach and students to learn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
