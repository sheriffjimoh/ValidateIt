import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://validateit.site"),
  title: {
    default: "ValidateIt | AI Market Validation from App Reviews",
    template: "%s | ValidateIt",
  },
  description:
    "Find validated product opportunities from competitor reviews. Analyze App Store and Google Play feedback with AI, uncover market gaps, and build what users need.",
  applicationName: "ValidateIt",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://validateit.site",
    siteName: "ValidateIt",
    title: "ValidateIt | AI Market Validation from App Reviews",
    description:
      "Turn competitor reviews into product opportunities. Find market gaps with AI analysis of App Store and Google Play feedback.",
    locale: "en_US",
    images: [{ url: "/logo.png", width: 1600, height: 1600, alt: "ValidateIt" }],
  },
  twitter: {
    card: "summary",
    title: "ValidateIt | AI Market Validation from App Reviews",
    description:
      "Analyze App Store and Google Play reviews with AI to find product opportunities users are asking for.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink font-sans antialiased min-h-screen">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
