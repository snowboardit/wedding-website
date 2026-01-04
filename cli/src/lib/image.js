import sharp from "sharp";
import { exiftool } from "exiftool-vendored";

export async function processImage({ srcPath, outPath, longEdge, quality }) {
  // rotate() respects EXIF orientation
  const pipeline = sharp(srcPath).rotate();

  const meta = await pipeline.metadata();

  // Resize so the long edge = longEdge (fit inside)
  const resized = pipeline.resize({
    width: meta.width >= meta.height ? longEdge : undefined,
    height: meta.height > meta.width ? longEdge : undefined,
    fit: "inside",
    withoutEnlargement: true,
  });

  // JPEG output: progressive for better UX
  await resized
    .jpeg({
      quality,
      progressive: true,
      // You can enable mozjpeg: true if your sharp build supports it reliably
    })
    .toFile(outPath);

  // Read dimensions of output
  const outMeta = await sharp(outPath).metadata();

  return { width: outMeta.width, height: outMeta.height };
}

export async function stripMetadata(filePath) {
  // Remove ALL metadata, including GPS. Overwrite in place.

export async function fileMeta(filePath) {
  const tags = await exiftool.read(filePath);
  return tags;
}
