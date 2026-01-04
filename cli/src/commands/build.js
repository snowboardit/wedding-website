import fg from "fast-glob";
import pLimit from "p-limit";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { ensureDir, writeJson, cleanDir } from "../lib/fs.js";
import { fileStemHash } from "../lib/hash.js";
import { buildManifestItem, finalizeManifest } from "../lib/manifest.js";
import { processImage, stripMetadata } from "../lib/image.js";

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

  let id = 1;

  await Promise.all(
    files.map((rel) =>
      limit(async () => {
        const srcPath = path.join(inputDir, rel),
          ext = ".jpg",
          // deterministic-ish name derived from relative path (stable across runs if files don't move)
          name = `${fileStemHash(rel)}${ext}`,
          thumbOut = path.join(thumbDir, name),
          largeOut = path.join(largeDir, name);

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
          index: id++,
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
          // Optional: you can derive alt from filename if you want
          alt: "wedding photo credit greenimagingphotovideo.com",
        });

        manifestItems.push(item);
      }),
    ),
  );

  // Stable ordering (since parallel processing scrambles push order)
  manifestItems.sort((a, b) => a.id - b.id);

  const manifest = finalizeManifest(manifestItems);

  await writeJson(manifestPath, manifest);

  console.log(`Built ${manifestItems.length} images`);
  console.log(`- Thumbs: ${thumbDir}`);
  console.log(`- Large:  ${largeDir}`);
  console.log(`- Manifest: ${manifestPath}`);
}
