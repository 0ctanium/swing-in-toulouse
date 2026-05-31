export type AdminCategoryTagsQuery = {
  page: number;
  search: string;
};

export function parseAdminCategoryTagsSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): AdminCategoryTagsQuery {
  const pageRaw = searchParams.page;
  const pageValue = Array.isArray(pageRaw) ? pageRaw[0] : pageRaw;
  const page = Math.max(1, Number.parseInt(pageValue ?? "1", 10) || 1);

  const searchRaw = searchParams.search;
  const searchValue = Array.isArray(searchRaw) ? searchRaw[0] : searchRaw;

  return {
    page,
    search: searchValue?.trim() ?? "",
  };
}
