import type { EventOverridePatch } from "@/lib/events/overrides.types";

export type MasterOverrideSyncedFields = {
  title: string;
  description: string | null;
  organizationId: string | null;
  venueId: string | null;
  categories: string[] | null;
  status: "published" | "cancelled";
  sourceUrl: string | null;
};

export type MasterOverrideFormState = {
  title: string;
  description: string;
  organizationId: string;
  venueId: string;
  categories: string;
  status: "published" | "cancelled";
  sourceUrl: string;
  notes: string;
};

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function parseCategories(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .sort();
}

function categoriesEqual(
  left: string[] | null | undefined,
  right: string[] | null | undefined,
) {
  return (
    JSON.stringify(parseCategories((left ?? []).join(", "))) ===
    JSON.stringify(parseCategories((right ?? []).join(", ")))
  );
}

export function buildMasterOverridePatch(
  form: MasterOverrideFormState,
  synced: MasterOverrideSyncedFields,
): EventOverridePatch {
  const patch: EventOverridePatch = {};

  const title = form.title.trim();
  if (title && title !== synced.title.trim()) {
    patch.title = title;
  }

  const description = normalizeText(form.description);
  if (description !== normalizeText(synced.description)) {
    patch.description = description;
  }

  const organizationId = form.organizationId || null;
  if (organizationId !== synced.organizationId) {
    patch.organizationId = organizationId;
  }

  const venueId = form.venueId || null;
  if (venueId !== synced.venueId) {
    patch.venueId = venueId;
  }

  const parsedCategories = parseCategories(form.categories);
  if (!categoriesEqual(parsedCategories, synced.categories)) {
    patch.categories = parsedCategories;
  }

  if (form.status !== synced.status) {
    patch.status = form.status;
  }

  const sourceUrl = normalizeText(form.sourceUrl);
  if (sourceUrl !== normalizeText(synced.sourceUrl)) {
    patch.sourceUrl = sourceUrl;
  }

  const notes = normalizeText(form.notes);
  if (notes) {
    patch.notes = notes;
  }

  return patch;
}

export function hasReviewableMasterChanges(patch: EventOverridePatch) {
  return Object.entries(patch).some(([key, value]) => {
    if (key === "notes") {
      return false;
    }

    return value !== undefined;
  });
}

/** @deprecated Use hasReviewableMasterChanges */
export function hasMasterOverrideChanges(patch: EventOverridePatch) {
  return hasReviewableMasterChanges(patch);
}

export function hasMasterOverrideChangesFromForm(
  form: MasterOverrideFormState,
  synced: MasterOverrideSyncedFields,
) {
  return hasReviewableMasterChanges(buildMasterOverridePatch(form, synced));
}
