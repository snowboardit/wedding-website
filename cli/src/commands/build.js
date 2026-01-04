import fg from "fast-glob";
import pLimit from "p-limit";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { ensureDir, writeJson, cleanDir } from "../lib/fs.js";
import { fileStemHash } from "../lib/hash.js";
import { buildManifestItem, finalizeManifest } from "../lib/manifest.js";
import { processImage, stripMetadata } from "../lib/image.js";

const buildOrderKey = (rel, processedIndex) => {
  // rel is relative path from fg; use basename for filename-based ordering
  const base = path.basename(rel),
    // Match: Lareau_Wedding-458 (optionally with extension; glob gives rel with extension)
    m = base.match(/^Lareau_Wedding-(\d+)(?:\.[^.]+)?$/i);

  // Items that match come first (group 0), ordered by numeric suffix.
  // Non-matching come after (group 1), ordered by "processedIndex" (stable discovery order).
  return m
    ? { group: 0, n: Number(m[1]), order: 0 }
    : { group: 1, n: Number.POSITIVE_INFINITY, order: processedIndex };
};

export async function build(opts) {
  const inputDir = path.resolve(opts.input),
    outputDir = path.resolve(opts.output),
    thumbDir = path.join(outputDir, "thumb"),
    largeDir = path.join(outputDir, "large"),
    manifestPath = path.join(outputDir, "gallery.json"),
    thumbSize = Number(opts.thumbSize),
    largeSize = Number(opts.largeSize),
    thumbQuality = Number(opts.thumbQuality),
    largeQuality = Number(opts.largeQuality),
    concurrency = Number(opts.concurrency),
    baseUrl = String(opts.baseUrl || "").replace(/\/$/, ""),
    pattern = String(opts.pattern),
    strip = Boolean(!opts.keepMetadata);

  await ensureDir(outputDir);
  await ensureDir(thumbDir);
  await ensureDir(largeDir);

  const files = await fg(pattern, {
      cwd: inputDir,
      onlyFiles: true,
      dot: false,
    }),
    limit = pLimit(concurrency),
    manifestItems = [];

  if (files.length === 0) {
    console.error(`No images matched pattern "${pattern}" in ${inputDir}`);
    process.exitCode = 1;
    return;
  }

  // Optional: blow away previous outputs (keeps the CLI honest/reproducible)
  // Comment out if you prefer incremental builds.
  await cleanDir(thumbDir);
  await cleanDir(largeDir);

  let count = 1;

  await Promise.all(
    files.map((rel, processedIndex) =>
      limit(async () => {
        const srcPath = path.join(inputDir, rel),
          ext = ".jpg",
          // deterministic-ish name derived from relative path (stable across runs if files don't move)
          name = `${fileStemHash(rel)}${ext}`,
          thumbOut = path.join(thumbDir, name),
          largeOut = path.join(largeDir, name),
          orderKey = buildOrderKey(rel, processedIndex);

        const thumbInfo = await processImage({
          srcPath,
          outPath: thumbOut,
          longEdge: thumbSize,
          quality: thumbQuality,
        });

        const largeInfo = await processImage({
          srcPath,
          outPath: largeOut,
          longEdge: largeSize,
          quality: largeQuality,
        });

        if (strip) {
          await stripMetadata(thumbOut);
          await stripMetadata(largeOut);
        }

        const item = buildManifestItem({
          identifier: uuidv4(),
          name,
          // Use baseUrl if provided; otherwise paths relative to where you host "out/"
          thumb: {
            url: baseUrl ? `${baseUrl}/thumb/${name}` : `thumb/${name}`,
            w: thumbInfo.width,
            h: thumbInfo.height,
          },
          large: {
            url: baseUrl ? `${baseUrl}/large/${name}` : `large/${name}`,
            w: largeInfo.width,
            h: largeInfo.height,
          },
          alt: "",
        });

        item.__order = orderKey;

        manifestItems.push(item);
        console.log(`processed ${count}/${files.length}`);
        count++;
      }),
    ),
  );

  // Stable filename ordering:
  // 1) Lareau_Wedding-### first, numeric asc
  // 2) everything else after, in discovery/processed order
  manifestItems.sort((a, b) => {
    const ao = a.__order,
      bo = b.__order;

    if (ao.group !== bo.group) return ao.group - bo.group;
    if (ao.group === 0 && ao.n !== bo.n) return ao.n - bo.n;
    return ao.order - bo.order;
  });

  for (const item of manifestItems) delete item.__order;
  for (const itm of manifestItems) console.log(itm);

  const manifest = finalizeManifest(manifestItems);

  await writeJson(manifestPath, manifest);

  console.log();
  console.log(`Built ${manifestItems.length} images`);
  console.log(`- Thumbs: ${thumbDir}`);
  console.log(`- Large:  ${largeDir}`);
  console.log(`- Manifest: ${manifestPath}`);
}
