import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Dancing_Script } from "next/font/google";
import "./globals.css";
import ClientProviders from "./components/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DrawSpace",
  description: "A shared space to think visually.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ overscrollBehavior: "none" }}>
      <body
        // style={{ overscrollBehavior: "none" }}
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${dancingScript.variable}  antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
