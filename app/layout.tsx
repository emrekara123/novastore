import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovaStore - Modern E-Commerce",
  description: "Your go-to store for everything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col`}>
        <CartProvider>
          <Header />
          <CartDrawer />
          <main className="flex-grow">
            {children}
          </main>
        </CartProvider>
        
        {/* SUPSIS AI LIVE CHAT WIDGET */}
        <Script
          id="supsis-embed-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.supsis = window.supsis || function () {
                (supsis.q = supsis.q || []).push(arguments);
              };
              supsis.l = +new Date();
            `,
          }}
        />
        <Script
          id="supsis-embed-loader"
          src="https://emrekara.visitor.supsis.live/static/js/loader.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
