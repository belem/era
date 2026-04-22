import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { StudentProvider } from "@/hooks/useStudent";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "跬步 — Classical Chinese Poetry",
  description:
    "A beautifully designed, scientifically-backed poetry memorization platform rooted in traditional Chinese aesthetics.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={inter.variable}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://chinese-fonts-cdn.deno.dev/packages/jhlst/dist/京華老宋体v2_002/result.css" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0071e3" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-dvh flex flex-col bg-bg text-text antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
            <StudentProvider>
              {children}
              <Footer />
              <ServiceWorkerRegistrar />
            </StudentProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
