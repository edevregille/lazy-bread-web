import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/hooks/use-cart";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lazy Bread PDX",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
            <CartProvider>
              <Header />
              <main className="pt-20 pb-10 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto">
                  {children}
                </div>
              </main>
              <Footer />
            </CartProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
