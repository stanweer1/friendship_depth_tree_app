import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grove — a living tree of the people in your photos",
  description:
    "Grove reads your photos, grows a branch for each person in your life, and makes it fruitier with every shared memory. Connect Google Photos or your camera roll, then share the tree.",
  applicationName: "Grove",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Grove",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1210",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full bg-dusk font-sans text-cream">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
