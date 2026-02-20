import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Motor Brain — Clinical AI for ABA Agencies | HIPAA Compliant",
  description:
    "Clinical queries, documentation, and a private knowledge base for BCBAs and RBTs. HIPAA-compliant by design with embedded PHI sanitization and BAA included.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} font-sans antialiased bg-gray-950 text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
