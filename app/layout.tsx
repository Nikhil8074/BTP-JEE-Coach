import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JEE Coach Advanced AI",
  description: "Next-Generation AI Tutor powering the sharpest Joint Entrance Examination minds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css" />
        <script src="https://tikzjax.com/v1/tikzjax.js" async></script>
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased selection:bg-violet-600/40 font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
