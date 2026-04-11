import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AEC Project Hub",
  description: "AEC Colombia — Project Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`h-full ${inter.variable} ${manrope.variable}`}>
      <body className="h-full flex antialiased">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
