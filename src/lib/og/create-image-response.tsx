import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

import type { OgAssets } from "@/lib/og/assets";
import { ogSize } from "@/lib/og/palette";

export function createOgImageResponse(
  element: ReactElement,
  assets: OgAssets,
) {
  return new ImageResponse(element, {
    ...ogSize,
    fonts: [
      {
        name: "Fraunces",
        data: assets.fraunces600,
        weight: 600,
        style: "normal",
      },
      {
        name: "DM Sans",
        data: assets.dmSans400,
        weight: 400,
        style: "normal",
      },
      {
        name: "DM Sans",
        data: assets.dmSans500,
        weight: 500,
        style: "normal",
      },
    ],
  });
}
