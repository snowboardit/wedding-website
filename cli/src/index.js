import path from "node:path";
import { Command } from "commander";
import { build } from "./commands/build.js";
import { fileMeta } from "./lib/image.js";

const program = new Command();

program
  .name("wg")
  .description(
    "Generate web-optimized wedding gallery assets (thumb/large + manifest).",
  )
  .version("0.1.0");

program
  .command("build")
  .description("Build gallery derivatives and manifest.")
  .option("-i, --input <dir>", "Input directory of originals", "./originals")
  .option("-o, --output <dir>", "Output directory", "./out")
  .option("--thumb-size <px>", "Thumbnail long-edge in pixels", "720")
  .option("--large-size <px>", "Large long-edge in pixels", "2400")
  .option("--thumb-quality <n>", "Thumbnail JPEG quality", "75")
  .option("--large-quality <n>", "Large JPEG quality", "82")
  .option("--concurrency <n>", "Max concurrent image jobs", "6")
  .option(
    "--base-url <url>",
    "Base URL prefix for manifest items (e.g. https://cdn.example.com/wedding)",
    "",
  )
  .option("--keep-metadata", "keep EXIF metadata in outputs")
  .option(
    "--pattern <glob>",
    "Glob pattern for originals",
    "**/*.{jpg,jpeg,png,JPG,JPEG,PNG}",
  )
  .action(async (opts) => {
    try {
      await build(opts);
      process.exit(0);
    } catch (err) {
      console.error("something went wrong buidling", err);
      process.exit(1);
    }
  });

program
  .command("meta")
  .description("Get metadata from image")
  .option("-i, --input <file>", "Input path of image")
  .action(async (opts) => {
    try {
      const input = path.resolve(opts.input);
      console.log(await fileMeta(input));
      process.exit(0);
    } catch (err) {
      console.error("something went wrong getting metadata", err);
      process.exit(1);
    }
  });

program.parse(process.argv);
