import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Lazy Bread PDX",
  description: "Organic Sourdough Cottage Bakery - Handcrafted sourdough focaccia made with organic ingredients in Portland, Oregon.",
  keywords: "sourdough, focaccia, organic bread, Portland bakery, artisanal bread",
  authors: [{ name: "Lazy Bread PDX" }],
  creator: "Lazy Bread PDX",
  publisher: "Lazy Bread PDX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Removed icons from metadata to avoid conflicts with Safari
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lazy Bread PDX',
  },
  other: {
    'msapplication-TileColor': '#8B4513',
    'theme-color': '#8B4513',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Simple favicon setup for Safari */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.png" />
        
        {/* Safari meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Lazy Bread PDX" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className="antialiased"
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <div className="flex-grow">
              <Header />
              <main className="pt-20 pb-10">
                <div className="container mx-auto">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
