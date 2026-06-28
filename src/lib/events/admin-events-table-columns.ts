export const ADMIN_EVENTS_TABLE_COLUMNS = [
  { id: "title", label: "Événement", hideable: false },
  { id: "date", label: "Date", hideable: true },
  { id: "org", label: "Organisateur", hideable: true },
  { id: "venue", label: "Lieu", hideable: true },
  { id: "categories", label: "Catégories", hideable: true },
  { id: "status", label: "État", hideable: true },
  { id: "actions", label: "Actions", hideable: false },
] as const;

export type AdminEventsTableColumnId =
  (typeof ADMIN_EVENTS_TABLE_COLUMNS)[number]["id"];

export const DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS: AdminEventsTableColumnId[] =
  ["title", "date", "org", "venue", "categories", "status", "actions"];

const STORAGE_KEY = "admin-events-table-columns";

export function readAdminEventsVisibleColumns(): AdminEventsTableColumnId[] {
  if (typeof window === "undefined") {
    return DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS;
    }

    const allowed = new Set<AdminEventsTableColumnId>(
      ADMIN_EVENTS_TABLE_COLUMNS.map((column) => column.id),
    );
    const visible = parsed.filter(
      (value): value is AdminEventsTableColumnId =>
        typeof value === "string" && allowed.has(value as AdminEventsTableColumnId),
    );

    if (!visible.includes("title") || !visible.includes("actions")) {
      return DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS;
    }

    return visible.length > 0 ? visible : DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS;
  } catch {
    return DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS;
  }
}

export function writeAdminEventsVisibleColumns(
  columns: AdminEventsTableColumnId[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
}
