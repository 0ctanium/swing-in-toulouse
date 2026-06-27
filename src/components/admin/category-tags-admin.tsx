"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { CategoryTagAliasesDialog } from "@/components/admin/category-tag-aliases-dialog";
import { CategoryTagPageDialog } from "@/components/admin/category-tag-page-dialog";
import { CategoryTagTypeSelect } from "@/components/admin/category-tag-type-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminCategoryTagsListResult } from "@/lib/event-category-tags/admin";
import { isPublishableTagType } from "@/lib/event-category-tags/publishable";

type CategoryTagsAdminProps = {
  data: AdminCategoryTagsListResult;
};

export function CategoryTagsAdmin({ data }: CategoryTagsAdminProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(data.search);
  const [pageDialogRow, setPageDialogRow] =
    useState<AdminCategoryTagsListResult["rows"][number] | null>(null);
  const [aliasesDialogRow, setAliasesDialogRow] =
    useState<AdminCategoryTagsListResult["rows"][number] | null>(null);

  useEffect(() => {
    setSearchInput(data.search);
  }, [data.search]);

  const pushQuery = useCallback(
    (next: { page?: number; search?: string }) => {
      const params = new URLSearchParams();
      const page = next.page ?? data.page;
      const search = next.search ?? data.search;

      if (page > 1) {
        params.set("page", String(page));
      }

      if (search) {
        params.set("search", search);
      }

      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/admin/settings?${query}` : "/admin/settings");
      });
    },
    [data.page, data.search, router],
  );

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    pushQuery({ page: 1, search: searchInput.trim() });
  }

  const from = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const to = Math.min(data.page * data.pageSize, data.total);

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={submitSearch}
      >
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="tag-search" className="text-xs font-medium">
            Rechercher un tag
          </label>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              id="tag-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Nom du tag…"
              className="pl-8"
            />
          </div>
        </div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          Rechercher
        </Button>
        {data.search ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              setSearchInput("");
              pushQuery({ page: 1, search: "" });
            }}
          >
            Effacer
          </Button>
        ) : null}
      </form>

      <p className="text-muted-foreground text-sm">
        {data.total === 0
          ? "Aucun tag"
          : `${data.total} tag${data.total > 1 ? "s" : ""}`}
        {data.search ? ` correspondant à « ${data.search} »` : ""}
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead className="w-48">Type</TableHead>
              <TableHead className="w-36">Alias</TableHead>
              <TableHead className="w-40">Page publique</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground h-24 text-center"
                >
                  Aucun tag trouvé.
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <CategoryTagTypeSelect
                      name={row.name}
                      value={row.tagType}
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setAliasesDialogRow(row)}
                    >
                      {row.aliases.length > 0
                        ? `${row.aliases.length} alias`
                        : "Configurer"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {isPublishableTagType(row.tagType) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setPageDialogRow(row)}
                      >
                        {row.isPublished ? "Publiée" : "Configurer"}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {from}–{to} sur {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || isPending}
              onClick={() => pushQuery({ page: data.page - 1 })}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages || isPending}
              onClick={() => pushQuery({ page: data.page + 1 })}
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}

      {aliasesDialogRow ? (
        <CategoryTagAliasesDialog
          key={aliasesDialogRow.name}
          row={aliasesDialogRow}
          open
          onOpenChange={(open) => {
            if (!open) {
              setAliasesDialogRow(null);
            }
          }}
        />
      ) : null}

      {pageDialogRow ? (
        <CategoryTagPageDialog
          key={pageDialogRow.name}
          row={pageDialogRow}
          open
          onOpenChange={(open) => {
            if (!open) {
              setPageDialogRow(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
