import { Source_Serif_4, Inter } from "next/font/google";

export const passageFont = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-passage",
  display: "swap",
});

export const uiFont = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});
