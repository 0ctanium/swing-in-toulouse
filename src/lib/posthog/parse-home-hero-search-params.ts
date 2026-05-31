function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value == null) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
}

export type ParsedHomeHeroSearchParams = {
  hero?: string;
  art?: string;
  showPreview: boolean;
};

export function parseHomeHeroSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ParsedHomeHeroSearchParams {
  return {
    hero: firstSearchParam(searchParams.hero),
    art: firstSearchParam(searchParams.art),
    showPreview: firstSearchParam(searchParams["hero-preview"]) === "1",
  };
}
