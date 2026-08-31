import type { IntegrationAppearanceFormState } from "@/lib/integrations/theme";

export const INTEGRATION_PREVIEW_MESSAGE_TYPE =
  "swing-integration-preview" as const;

export type IntegrationPreviewMessage = {
  type: typeof INTEGRATION_PREVIEW_MESSAGE_TYPE;
  appearance: IntegrationAppearanceFormState;
};

export function createIntegrationPreviewMessage(
  appearance: IntegrationAppearanceFormState,
): IntegrationPreviewMessage {
  return {
    type: INTEGRATION_PREVIEW_MESSAGE_TYPE,
    appearance,
  };
}

export function isIntegrationPreviewMessage(
  data: unknown,
): data is IntegrationPreviewMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const message = data as Partial<IntegrationPreviewMessage>;

  return (
    message.type === INTEGRATION_PREVIEW_MESSAGE_TYPE &&
    typeof message.appearance === "object" &&
    message.appearance !== null
  );
}

function encodeBase64Url(value: string) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  return atob(padded);
}

export function serializeAppearanceParam(
  appearance: IntegrationAppearanceFormState,
): string {
  return encodeBase64Url(JSON.stringify(appearance));
}

export function parseAppearanceParam(
  raw: string | undefined | null,
): IntegrationAppearanceFormState | null {
  if (!raw?.trim()) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(raw.trim())) as IntegrationAppearanceFormState;
  } catch {
    return null;
  }
}

/** @deprecated Use serializeAppearanceParam */
export function serializeDisplayConfigParam(
  appearance: IntegrationAppearanceFormState,
) {
  return serializeAppearanceParam(appearance);
}

/** @deprecated Use parseAppearanceParam */
export function parseDisplayConfigParam(raw: string | undefined | null) {
  return parseAppearanceParam(raw);
}

export function buildPreviewEmbedUrl(
  embedUrl: string,
  appearance: IntegrationAppearanceFormState,
) {
  const url = new URL(embedUrl);
  url.searchParams.set("preview", "1");
  url.searchParams.set("appearance", serializeAppearanceParam(appearance));
  return url.toString();
}

export function postIntegrationPreviewConfig(
  targetWindow: Window | null | undefined,
  origin: string,
  appearance: IntegrationAppearanceFormState,
) {
  targetWindow?.postMessage(createIntegrationPreviewMessage(appearance), origin);
}
