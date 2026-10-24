import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LoadingBar } from "@/components/loading";

export const metadata: Metadata = {
  title: { default: "SurjoSangstha — সহজ কিস্তিতে বিশ্বস্ত কেনাকাটা", template: "%s | SurjoSangstha" },
  description: "SurjoSangstha: দৈনিক, সাপ্তাহিক ও মাসিক কিস্তিতে ইলেকট্রনিক্স, ফার্নিচার, মোবাইল ও গৃহস্থালি পণ্য। ক্যাশ, ক্যাশ অন ডেলিভারি ও কিস্তিতে কেনার সুবিধা।",
  manifest: "/manifest.json",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
