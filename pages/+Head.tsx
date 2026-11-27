// https://vike.dev/Head

import logoUrl from "../assets/logo.svg";
import geistFontUrl from "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url";
import { THEME_BOOTSTRAP_SCRIPT } from "../src/theme";

export function Head() {
  return (
    <>
      {/* Sets the dark/light class before first paint to avoid a flash of the wrong theme */}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />

      <link rel="icon" href={logoUrl} />
      {/* Belső alkalmazás: ne indexeljék a keresők */}
      <meta name="robots" content="noindex, nofollow" />

      <link rel="preload" href={geistFontUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
    </>
  );
}
