import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-avant",
  display: "swap",
});


const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});


export const metadata: Metadata = {
  title: {
    template: "%s | Cipher Drop", 
    default: "Cipher Drop | End-to-End Encrypted Ephemeral Chat", 
  },
  description: "Military-grade, self-destructing, true end-to-end encrypted messaging. Trust no one. Nothing is saved.",
  keywords: ["encrypted chat", "ephemeral messaging", "secure communication", "E2EE"],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <body className="antialiased selection:bg-neon-cyan selection:text-obsidian">
        <Navbar />
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}