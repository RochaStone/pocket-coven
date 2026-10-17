import type { Metadata, Viewport } from "next";
import { Fredoka, Quicksand, Cormorant_Garamond } from "next/font/google";
import { ServiceWorker } from "@/components/game/ServiceWorker";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const body = Quicksand({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });
const luxe = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-luxe", weight: ["500", "600"], style: ["italic", "normal"] });

export const metadata: Metadata = {
  title: "Rocha's Pocket Coven",
  description: "Baby Merwitch Edition. A pocket-sized seashell world for five witches.",
  appleWebApp: { capable: true, title: "Pocket Coven", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffd6ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${luxe.variable}`}>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
