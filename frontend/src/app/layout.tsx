import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { ToastProvider } from "@/components/ui/Toast";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import ChatBubble from "@/components/chat/ChatBubble";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Jenni Khoe Makeup Artist | Luxury Bridal & Event MUA Jakarta",
    template: "%s | Jenni Khoe MUA",
  },
  description:
    "Exclusive luxury makeup artist service for weddings, pre-weddings, graduations, and special occasions in Jakarta. Professional bridal makeup by Jenni Khoe.",
  keywords: ["makeup artist jakarta", "bridal makeup", "wedding makeup", "MUA Jakarta", "jenni khoe", "graduation makeup", "bridesmaid makeup"],
  openGraph: {
    title: "Jenni Khoe Makeup Artist | Luxury Bridal & Event MUA",
    description: "Exclusive luxury makeup artist service for weddings and special occasions in Jakarta.",
    url: "https://jenni-khoe-mua.vercel.app",
    siteName: "Jenni Khoe MUA",
    locale: "id_ID",
    type: "website",
  },
  robots: { index: true, follow: true },
};



export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FDFBF7',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${plusJakarta.variable} ${cinzel.variable} antialiased selection:bg-luxury-rose-gold/20 selection:text-luxury-rose-gold-dark`}
      >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Jenni Khoe MUA",
            "description": "Layanan makeup profesional untuk bridal, graduation, dan wedding di Jakarta",
            "url": "https://jenni-khoe-mua.vercel.app",
            "telephone": "+62-812-3456-7890",
            "address": { "@type": "PostalAddress", "addressLocality": "Jakarta", "addressCountry": "ID" },
            "priceRange": "Rp 750.000 - Rp 8.500.000",
            "areaServed": "Jakarta dan sekitarnya",
            "hasOfferCatalog": {
              "@type": "OfferCatalog", "name": "Layanan Makeup",
              "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Bridal Premium" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Bridal Basic" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Graduation Makeup" } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Bridesmaid Makeup" } }
              ]
            }
          })
        }}
      />
        <SmoothScrollProvider>
          <ToastProvider>{children}</ToastProvider>
        </SmoothScrollProvider>
            <FloatingWhatsApp />
      <ChatBubble />
    </body>
    </html>
  );
}