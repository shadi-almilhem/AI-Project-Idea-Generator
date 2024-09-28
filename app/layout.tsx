import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";

import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AI Project Idea Generator",
  description:
    "AI Project Idea Generator is a tool designed to help you brainstorm and expand on your project ideas using artificial intelligence. Simply enter your initial idea, and the AI will provide you with detailed suggestions, potential improvements, and innovative angles to explore. Perfect for students, developers, and anyone looking to spark creativity and innovation.\nMade by Shadi Al Milhem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
