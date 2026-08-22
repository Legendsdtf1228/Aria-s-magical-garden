import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "./components/PwaRegister";

export const metadata: Metadata = {
  title: "Aria's Color Garden",
  applicationName: "Aria's Color Garden",
  description:
    "A warm bilingual English and Spanish preschool garden — colors, animals, shapes, counting, feeding friends, and movement.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Aria's Garden",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Aria's Color Garden",
    description: "Bilingual preschool learning garden for Aria",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Aria's Color Garden",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Aria's Color Garden",
    description: "Bilingual preschool learning garden",
    images: ["/icons/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-180.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#7ec86a" },
    { media: "(prefers-color-scheme: dark)", color: "#7ec86a" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="codex-preview" content="development" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Aria's Garden" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#7ec86a" />
        <meta name="msapplication-TileColor" content="#7ec86a" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-180.png" />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
