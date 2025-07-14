import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/hooks/use-cart";

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
        className="antialiased"
      >
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
            <CartProvider>
              <Header />
              <main className="pt-20 pb-10">
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
