import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://canada-business-launchpad-start.aideptus2apple.chatgpt.site",
  ),
  title: "Canada Business Launchpad | Ontario Pilot",
  description:
    "Startup steps, useful services and your own progress. A simple Ontario business launch checklist for small teams.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    title: "Canada Business Launchpad | Ontario Pilot",
    description:
      "Your startup steps, related services and personal progress in one place.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Canada Business Launchpad | Ontario Pilot",
    description:
      "Your startup steps, related services and personal progress in one place.",
    images: ["/og.png"],
  },
};

export default async function LocalizedRootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "zh") notFound();

  return (
    <html lang={locale === "zh" ? "zh-Hans" : "en-CA"}>
      <body>{children}</body>
    </html>
  );
}
