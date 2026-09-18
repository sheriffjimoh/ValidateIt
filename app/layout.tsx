import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ValidateIt — Find the gaps in your market",
  description:
    "Read what users are complaining about in competing apps before you build anything.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
      <body className={`${inter.className} bg-white text-black antialiased`}>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
