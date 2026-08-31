import { embedAgendaUrl } from "@/lib/site";

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildEmbedSnippet(input: {
  integrationId: string;
  organizationName: string;
  integrationName: string;
}) {
  const url = embedAgendaUrl(input.integrationId);
  const title = escapeHtmlAttribute(
    `${input.integrationName} — ${input.organizationName}`,
  );

  return {
    url,
    snippet: `<iframe
  src="${url}"
  title="${title}"
  width="100%"
  height="720"
  style="border:0;"
  loading="lazy"
></iframe>`,
  };
}
