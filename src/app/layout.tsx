import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="sticky top-0 z-40 w-full border-b bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="mx-auto max-w-7xl px-6 py-6 flex items-center gap-4">
            <img
              src="/logo.png"
              alt="VetBlurbs logo"
              className="h-[6.75rem] w-auto"
            />
            <div className="leading-tight">
              <div className="text-2xl font-semibold tracking-tight text-slate-900">VetBlurbs</div>
              <div className="text-sm text-slate-600">Discharge builder & workspace</div>
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
