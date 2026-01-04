import { Command } from "commander";
import { build } from "./commands/build.js";

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
  .option("--thumb-size <px>", "Thumbnail long-edge in pixels", "480")
  .option("--large-size <px>", "Large long-edge in pixels", "2400")
  .option("--thumb-quality <n>", "Thumbnail JPEG quality", "75")
  .option("--large-quality <n>", "Large JPEG quality", "82")
  .option("--concurrency <n>", "Max concurrent image jobs", "6")
  .option(
    "--base-url <url>",
    "Base URL prefix for manifest items (e.g. https://cdn.example.com/wedding)",
    "",
  )
  .option("--keep-metadata", "Do not remove EXIF metadata from outputs")
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

program.parse(process.argv);
