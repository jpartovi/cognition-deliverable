import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./(components-navbar)/navbar";
import { ModeToggle } from "./(components-navbar)/mode-toggle";
import { Providers } from "./providers";
import { DevinApiKeyPopover } from "./(components-navbar)/devin-api-key-popover";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitHub Ticket Manager",
  description: "Jude's Cognition Deliverable",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="border-b">
              <div className="flex h-16 items-center px-4">
                <Navbar className="mx-6" />
                <div className="ml-auto flex items-center space-x-4">
                  <DevinApiKeyPopover />
                  <ModeToggle />
                </div>
              </div>
            </header>
            <main className="flex-1 space-y-6 p-10 pb-16">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
