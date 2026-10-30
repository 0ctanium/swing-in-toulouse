import "@/load-env";

import { get } from "@vercel/blob";
import { eq, like } from "drizzle-orm";

import { db } from "@/db";
import { sources } from "@/db/schema";
import { env } from "@/env";
import { icalBlobPath, uploadIcalBlob } from "@/lib/sources/blob";

/**
 * One-off, for the move off Vercel: copies every iCal file still referenced by a Vercel Blob
 * URL into the S3 bucket and stores the object key instead. Needs BLOB_READ_WRITE_TOKEN (read)
 * and the S3_* variables (write). Safe to run again: rows already holding a key are skipped.
 */
async function main() {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required to read the Vercel Blob store.");
  }

  const legacy = await db.query.sources.findMany({
    where: like(sources.icalBlobUrl, "https://%"),
    columns: { id: true, name: true, icalBlobUrl: true },
  });

  console.info(`${legacy.length} source(s) still on Vercel Blob`);

  for (const source of legacy) {
    const result = await get(source.icalBlobUrl!, {
      access: "private",
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      console.error(`  ${source.name}: cannot read ${source.icalBlobUrl}`);
      continue;
    }
    const content = Buffer.from(await new Response(result.stream).arrayBuffer());
    const { url: key } = await uploadIcalBlob(source.id, content);
    await db
      .update(sources)
      .set({ icalBlobUrl: key })
      .where(eq(sources.id, source.id));
    console.info(`  ${source.name}: ${content.length} bytes → ${icalBlobPath(source.id)}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
