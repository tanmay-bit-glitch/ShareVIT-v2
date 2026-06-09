import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "ShareVIT — Student Resource Sharing Platform | VIT Pune",
  description: "ShareVIT is the go-to resource sharing platform for VIT Pune students. Buy, sell, rent, donate, exchange books, electronics & more. Share notes, PYQs, assignments, and connect with fellow students.",
  keywords: "ShareVIT, VIT Pune, student marketplace, notes sharing, PYQ, assignments, student resources",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShareVIT",
  },
};

export const viewport = {
  themeColor: "#0f1729",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <ClientLayout>{children}</ClientLayout>
        <Script 
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="beforeInteractive"
        />
        <SpeedInsights />
      </body>
    </html>
  );
}
