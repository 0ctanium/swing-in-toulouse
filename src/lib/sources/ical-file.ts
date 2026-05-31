import { createHash } from "node:crypto";

import { parseIcalContent } from "@/lib/ical/parser";

import { MAX_ICAL_FILE_SIZE_BYTES } from "./blob";

export function hashIcalContent(content: Buffer) {
  return createHash("sha256").update(content).digest("hex");
}

export function assertIcalFileExtension(fileName: string) {
  if (!fileName.toLowerCase().endsWith(".ics")) {
    throw new Error("Seuls les fichiers .ics sont acceptés.");
  }
}

export async function readAndValidateIcalFile(file: File) {
  if (file.size > MAX_ICAL_FILE_SIZE_BYTES) {
    throw new Error("Le fichier iCal dépasse la taille maximale de 10 Mo.");
  }

  assertIcalFileExtension(file.name);

  const buffer = Buffer.from(await file.arrayBuffer());
  const content = buffer.toString("utf8");
  const events = await parseIcalContent(content);

  if (events.length === 0) {
    throw new Error("Le fichier iCal ne contient aucun événement valide.");
  }

  return {
    buffer,
    contentHash: hashIcalContent(buffer),
    eventCount: events.length,
    fileName: file.name,
    fileSize: file.size,
  };
}
