import { readFile } from "node:fs/promises";
import { join } from "node:path";

const FONT_URLS = {
  fraunces600:
    "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcaRyjDg.ttf",
  dmSans400:
    "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf",
  dmSans500:
    "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf",
} as const;

export type OgAssets = {
  fraunces600: ArrayBuffer;
  dmSans400: ArrayBuffer;
  dmSans500: ArrayBuffer;
  logoDataUrl: string;
};

let assetsPromise: Promise<OgAssets> | null = null;

async function loadAssets(): Promise<OgAssets> {
  const logoPath = join(process.cwd(), "public/web-app-manifest-512x512.png");
  const [fraunces600, dmSans400, dmSans500, logoBuffer] = await Promise.all([
    fetch(FONT_URLS.fraunces600).then((response) => response.arrayBuffer()),
    fetch(FONT_URLS.dmSans400).then((response) => response.arrayBuffer()),
    fetch(FONT_URLS.dmSans500).then((response) => response.arrayBuffer()),
    readFile(logoPath),
  ]);

  return {
    fraunces600,
    dmSans400,
    dmSans500,
    logoDataUrl: `data:image/png;base64,${logoBuffer.toString("base64")}`,
  };
}

export function loadOgAssets() {
  assetsPromise ??= loadAssets();
  return assetsPromise;
}
