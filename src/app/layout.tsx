import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Kisan Lens — Crop Disease & Management for Indian Farmers",
  description:
    "Identify and manage crop diseases with confidence. Free guide to 8 major crops and 30+ diseases — in English and Hindi, mobile-first, works offline.",
  keywords: [
    "crop disease",
    "Indian farming",
    "plant disease identification",
    "agriculture",
    "Kisan",
    "Krishi",
  ],
  authors: [{ name: "Kisan Lens" }],
  openGraph: {
    title: "Kisan Lens — Crop Disease & Management",
    description: "Identify and manage crop diseases. Free for Indian farmers.",
    type: "website",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html
      lang={routing.defaultLocale}
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider
          messages={messages}
          locale={routing.defaultLocale}
        >
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
