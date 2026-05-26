/**
 * UMBRIS · font loaders.
 *
 * Re-exports next/font loaders configured for the three UMBRIS typefaces.
 * Apply the returned `variable` to your <html> tag so the CSS custom
 * properties --font-albertus / --font-eb-garamond / --font-berkeley-mono
 * resolve.
 *
 * BRAND BOOK calls for:
 *   · Display: Albertus           (paid, Monotype)
 *   · Body:    EB Garamond italic (free, Google Fonts)
 *   · Mono:    Berkeley Mono      (paid, Klim Type)
 *
 * THIS FILE ships free-tier substitutes that are visually close:
 *   · Display: Marcellus           ← closest free face to Albertus
 *   · Body:    EB Garamond italic  ← matches brand book exactly
 *   · Mono:    IBM Plex Mono       ← closest free face to Berkeley Mono
 *
 * When licences are acquired, swap by loading Albertus / Berkeley Mono
 * locally and updating the variable bindings below.
 */

import { Marcellus, EB_Garamond, IBM_Plex_Mono } from "next/font/google";

export const albertus = Marcellus({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-albertus",
  display: "swap",
});

export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const berkeleyMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-berkeley-mono",
  display: "swap",
});

/**
 * Convenience: a single string of all three variable class names,
 * ready to paste onto <html className={umbrisFonts}>.
 */
export const umbrisFonts =
  `${albertus.variable} ${ebGaramond.variable} ${berkeleyMono.variable}`;
