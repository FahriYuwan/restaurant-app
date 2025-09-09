import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import PWAInstaller from '@/components/PWAInstaller';

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cafe Order - Pesan Langsung dari Meja Anda",
  description: "Aplikasi pemesanan cafe yang memungkinkan pelanggan memesan langsung dari meja mereka dengan QR code",
  manifest: "/manifest.json",
  themeColor: "#D97706",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cafe Order",
  },
  openGraph: {
    type: "website",
    siteName: "Cafe Order",
    title: "Cafe Order - Pesan Langsung dari Meja Anda",
    description: "Aplikasi pemesanan cafe yang memungkinkan pelanggan memesan langsung dari meja mereka dengan QR code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cafe Order" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#D97706" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50`}>
        {children}
        <PWAInstaller />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
