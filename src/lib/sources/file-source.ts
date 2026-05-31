import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sources } from "@/db/schema";
import { syncSource } from "@/lib/ical/sync";
import { generateSourceSlug } from "@/lib/slug";
import { deleteIcalBlob, uploadIcalBlob } from "@/lib/sources/blob";
import { readAndValidateIcalFile } from "@/lib/sources/ical-file";
import {
  getOrganizationById,
  resolveUniqueSourceSlug,
} from "@/lib/sources/admin";
import {
  normalizeSourceCategories,
  parseSourceFormFields,
} from "@/lib/sources/schemas";

type CreateFileSourceFields = ReturnType<typeof parseSourceFormFields>;

export async function createIcalFileSource(
  fields: CreateFileSourceFields,
  file: File,
) {
  if (!fields.name) {
    throw new Error("Le nom est requis.");
  }

  const organizationId = fields.organizationId ?? null;

  if (organizationId) {
    const organization = await getOrganizationById(organizationId);

    if (!organization) {
      throw new Error("Organisateur introuvable.");
    }
  }

  const validatedFile = await readAndValidateIcalFile(file);
  const baseSlug = fields.slug?.trim() || generateSourceSlug(fields.name);
  const slug = await resolveUniqueSourceSlug(baseSlug);
  const defaultCategories = normalizeSourceCategories(fields.defaultCategories);
  const uploadedAt = new Date();

  const [created] = await db
    .insert(sources)
    .values({
      name: fields.name.trim(),
      slug,
      type: "ical-file",
      url: null,
      organizationId,
      defaultLocationRaw: fields.defaultLocationRaw?.trim() || null,
      ...(defaultCategories !== undefined ? { defaultCategories } : {}),
      isActive: fields.isActive ?? true,
    })
    .returning();

  let uploadedBlobUrl: string | null = null;

  try {
    const blob = await uploadIcalBlob(created.id, validatedFile.buffer);
    uploadedBlobUrl = blob.url;

    const [updated] = await db
      .update(sources)
      .set({
        icalBlobUrl: blob.url,
        icalFileName: validatedFile.fileName,
        icalFileSize: validatedFile.fileSize,
        icalContentHash: validatedFile.contentHash,
        icalUploadedAt: uploadedAt,
      })
      .where(eq(sources.id, created.id))
      .returning();

    const sourceWithOrg = await db.query.sources.findFirst({
      where: eq(sources.id, updated.id),
      with: { organization: true },
    });

    if (!sourceWithOrg) {
      throw new Error("Source introuvable après création.");
    }

    try {
      const stats = await syncSource(sourceWithOrg);
      return { source: updated, sync: { stats, error: null as null } };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Synchronisation impossible.";

      return {
        source: updated,
        sync: { stats: null, error: message },
      };
    }
  } catch (error) {
    await deleteIcalBlob(uploadedBlobUrl).catch(() => undefined);
    await db.delete(sources).where(eq(sources.id, created.id));
    throw error;
  }
}

export async function replaceIcalFileSource(sourceId: string, file: File) {
  const existing = await db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
  });

  if (!existing) {
    throw new Error("Source introuvable.");
  }

  if (existing.type !== "ical-file") {
    throw new Error("Cette source n'accepte pas de fichier iCal.");
  }

  const validatedFile = await readAndValidateIcalFile(file);
  const uploadedAt = new Date();

  const blob = await uploadIcalBlob(existing.id, validatedFile.buffer);
  const previousBlobUrl = existing.icalBlobUrl;

  const [updated] = await db
    .update(sources)
    .set({
      icalBlobUrl: blob.url,
      icalFileName: validatedFile.fileName,
      icalFileSize: validatedFile.fileSize,
      icalContentHash: validatedFile.contentHash,
      icalUploadedAt: uploadedAt,
    })
    .where(eq(sources.id, existing.id))
    .returning();

  if (previousBlobUrl && previousBlobUrl !== blob.url) {
    await deleteIcalBlob(previousBlobUrl).catch(() => undefined);
  }

  const sourceWithOrg = await db.query.sources.findFirst({
    where: eq(sources.id, updated.id),
    with: { organization: true },
  });

  if (!sourceWithOrg) {
    throw new Error("Source introuvable après mise à jour.");
  }

  try {
    const stats = await syncSource(sourceWithOrg);
    return { source: updated, sync: { stats, error: null as null } };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synchronisation impossible.";

    return {
      source: updated,
      sync: { stats: null, error: message },
    };
  }
}
