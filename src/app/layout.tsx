import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import GoogleAnalytics from "@/components/GoogleAnalytics";

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
    'msapplication-TileColor': '#B87D6A',
    'theme-color': '#B87D6A',
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
        <Script
          id="dd-rum-sync"
          src="https://www.datadoghq-browser-agent.com/us1/v6/datadog-rum.js"
          type="text/javascript"
          strategy="beforeInteractive"
        />
        <Script id="datadog-rum">
          {`
            window.DD_RUM && window.DD_RUM.init({
              applicationId: "${process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID || ''}",
              clientToken: "${process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN || ''}",
              site: "${process.env.NEXT_PUBLIC_DD_SITE || ''}",
              service: "${process.env.NEXT_PUBLIC_DD_SERVICE || ''}",
              env: "${process.env.NEXT_PUBLIC_DD_ENV || ''}",
              version: "${process.env.NEXT_PUBLIC_DD_VERSION || ''}",
              sessionSampleRate: 100,
              sessionReplaySampleRate: 20,
              trackUserInteractions: true,
              trackResources: true,
              trackLongTasks: true,
              defaultPrivacyLevel: "mask-user-input",
            });
          `}
        </Script>
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
          <GoogleAnalytics />
        </AuthProvider>
      </body>
    </html>
  );
}
