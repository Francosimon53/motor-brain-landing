import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Motor Brain — AI SOAP Notes & Assessments for BCBAs | HIPAA Compliant",
  description:
    "Finish session notes in 2 minutes. Send a voice note, get a complete SOAP note in 30 seconds. AI-powered assessments that insurance approves on the first try. Built for BCBAs.",
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
