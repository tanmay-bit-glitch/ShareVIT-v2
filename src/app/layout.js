import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "ShareVIT — Student Resource Sharing Platform | VIT Pune",
  description: "ShareVIT is the go-to resource sharing platform for VIT Pune students. Buy, sell, rent, donate, exchange books, electronics & more. Share notes, PYQs, assignments, and connect with fellow students.",
  keywords: "ShareVIT, VIT Pune, student marketplace, notes sharing, PYQ, assignments, student resources",
};

// Force desktop view on mobile phones
export const viewport = {
  width: 1024,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
