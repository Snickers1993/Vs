import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import AuthButtons from "@/components/AuthButtons";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VetBlurbs",
  description: "Sleek workspace to craft and reuse veterinary discharge blurbs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-violet-100 via-blue-50 to-teal-100 min-h-screen`}
      >
        <Providers>
          <div className="glass-strong sticky top-0 z-40 w-full">
            <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-4 group">
                <Image
                  src="/logo.png"
                  alt="VetBlurbs logo"
                  width={432}
                  height={108}
                  className="h-[6.75rem] w-auto"
                />
                <div className="leading-tight">
                  <div className="text-2xl font-semibold tracking-tight text-slate-900 group-hover:underline">VetBlurbs</div>
                  <div className="text-sm text-slate-600">Discharge builder & workspace</div>
                </div>
              </Link>
              <AuthButtons />
            </div>
          </div>
          {children}
          <footer className="fixed inset-x-0 bottom-0 glass-strong">
            <div className="mx-auto max-w-7xl px-6 py-2 text-center text-xs text-slate-600">
              Last Updated: VetHackz Inc.  Nic Anders 9-3 TM
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
