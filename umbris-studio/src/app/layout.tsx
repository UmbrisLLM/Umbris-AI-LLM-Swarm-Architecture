import type { Metadata } from "next";
import { umbrisFonts } from "@umbris/design/fonts";
import { EngineProvider } from "@/components/providers/EngineProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "UMBRIS Studio",
  description:
    "The convocation, given form. Desktop HUD for the UMBRIS planetary convocation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={umbrisFonts}>
      <body className="bg-umbris-void text-umbris-lunar font-serif">
        <EngineProvider>{children}</EngineProvider>
      </body>
    </html>
  );
}
