import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://canada-business-launchpad-demo-2026.aideptus3.chatgpt.site",
  ),
  title: "Canada Business Launchpad | Ontario Pilot",
  description:
    "A source-backed planning and progress workspace for starting and operating an Ontario small business.",
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
      "Your verified Ontario business plan, in one workspace. External Demo MVP v0.1.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Canada Business Launchpad | Ontario Pilot",
    description:
      "Your verified Ontario business plan, in one workspace. External Demo MVP v0.1.",
    images: ["/og.png"],
  },
};

export default function EnglishRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-CA">
      <body>{children}</body>
    </html>
  );
}
