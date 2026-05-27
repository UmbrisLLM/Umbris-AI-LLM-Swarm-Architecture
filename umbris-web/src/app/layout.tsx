import type { Metadata } from "next";
import { umbrisFonts } from "@umbris/design/fonts";
import { Nav } from "@/components/Nav";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "UMBRIS · Ars Memoriae",
  description:
    "A hermetic-cosmic multi-agent LLM convocation for collective reasoning. De Umbris Idearum · Ex umbris in lumen.",
  metadataBase: new URL("https://umbrisai.com"),
  openGraph: {
    title: "UMBRIS · Ars Memoriae",
    description:
      "Nine planetary intelligences argue on a shared substrate. The vision is what their shadows agree on.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={umbrisFonts}>
      <body className="bg-umbris-void text-umbris-lunar font-serif">
        <SmoothScroll />
        <Nav />
        {children}
      </body>
    </html>
  );
}
