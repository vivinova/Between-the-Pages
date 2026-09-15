import type { Metadata } from "next";
import { passageFont, uiFont } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Between the Pages",
    template: "%s — Between the Pages",
  },
  description:
    "A private journal connected to The Library, an anonymous shared space for the passages you choose to leave behind.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${passageFont.variable} ${uiFont.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
