#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import chalk from "chalk";
import { runPipeline, type StepName } from "./pipeline/index.js";
import { parseSpec } from "./schema/index.js";

const program = new Command();

program
  .name("yt-auto")
  .description("YouTube video automation pipeline — JSON spec to rendered video")
  .version("0.1.0");

// ── render ────────────────────────────────────────────────────────
program
  .command("render")
  .description("Run the full render pipeline for a job directory")
  .argument("<job-dir>", "Path to the job directory containing spec.json")
  .option("--until <step>", "Stop after this step (validate|resolve-assets|render|thumbnail|metadata)")
  .option("--skip <steps>", "Comma-separated steps to skip", "")
  .action(async (jobDir: string, opts: { until?: string; skip: string }) => {
    const resolvedDir = path.resolve(jobDir);

    try {
      await fs.access(path.join(resolvedDir, "spec.json"));
    } catch {
      console.error(chalk.red(`Error: spec.json not found in ${resolvedDir}`));
      process.exit(1);
    }

    const skip = opts.skip ? opts.skip.split(",").map((s) => s.trim()) as StepName[] : [];

    try {
      await runPipeline({
        jobDir: resolvedDir,
        until: opts.until as StepName | undefined,
        skip,
        logger: (msg) => console.log(msg),
      });
    } catch {
      process.exit(1);
    }
  });

// ── validate ──────────────────────────────────────────────────────
program
  .command("validate")
  .description("Validate a spec.json file without rendering")
  .argument("<spec-path>", "Path to spec.json")
  .action(async (specPath: string) => {
    const resolved = path.resolve(specPath);

    try {
      const raw = await fs.readFile(resolved, "utf-8");
      const json = JSON.parse(raw);
      const spec = parseSpec(json);

      console.log(chalk.green("✓ spec.json is valid"));
      console.log(`  Scenes:     ${spec.scenes.length}`);
      console.log(`  Audio:      ${spec.audio.tracks.length} track(s)`);
      console.log(`  Subtitles:  ${spec.subtitles.length} entry/entries`);
      console.log(`  Output:     ${spec.output.width}×${spec.output.height} ${spec.output.format}`);
      console.log(`  Thumbnail:  ${spec.thumbnail.enabled ? "enabled" : "disabled"}`);
    } catch (err) {
      if (err instanceof SyntaxError) {
        console.error(chalk.red(`Invalid JSON: ${err.message}`));
      } else if (err instanceof Error && err.message.includes("Zod")) {
        console.error(chalk.red(`Schema validation failed:`));
        console.error(err.message);
      } else {
        console.error(chalk.red(`Error: ${err instanceof Error ? err.message : err}`));
      }
      process.exit(1);
    }
  });

// ── init ──────────────────────────────────────────────────────────
program
  .command("init")
  .description("Initialize a new project or job directory")
  .argument("<path>", "Path to create")
  .option("--type <type>", "Type: project or job", "job")
  .action(async (targetPath: string, opts: { type: string }) => {
    const resolved = path.resolve(targetPath);

    if (opts.type === "project") {
      const dirs = [
        "inputs",
        "assets/images",
        "assets/videos",
        "assets/music",
        "assets/fonts",
        "jobs",
      ];
      for (const dir of dirs) {
        await fs.mkdir(path.join(resolved, dir), { recursive: true });
      }
      await fs.writeFile(
        path.join(resolved, "inputs", "topics.txt"),
        "# Add your video topics here, one per line\n",
      );
      console.log(chalk.green(`✓ Project initialized at ${resolved}`));
      console.log("  Created: inputs/, assets/{images,videos,music,fonts}/, jobs/");
    } else {
      await fs.mkdir(resolved, { recursive: true });

      const exampleSpec = {
        version: "1.0",
        title: "My Video",
        output: { width: 1920, height: 1080, fps: 30, format: "mp4" },
        scenes: [
          {
            id: "intro",
            duration: 5,
            background: { type: "color", value: "#1a1a2e" },
            layers: [
              {
                type: "text",
                content: "Hello World",
                style: { font: "../../assets/fonts/NotoSansKR-Regular.ttf", size: 64, color: "#FFFFFF" },
                position: { x: "center", y: "center" },
              },
            ],
            transition: { type: "crossfade", duration: 0.5 },
          },
        ],
        audio: { tracks: [] },
        subtitles: [],
        thumbnail: { enabled: true, source: { type: "scene", sceneId: "intro", timestamp: 2 } },
      };

      const exampleMeta = {
        title: "My Video",
        description: "Video description here",
        tags: ["tag1", "tag2"],
      };

      await fs.writeFile(path.join(resolved, "spec.json"), JSON.stringify(exampleSpec, null, 2) + "\n");
      await fs.writeFile(path.join(resolved, "meta.json"), JSON.stringify(exampleMeta, null, 2) + "\n");

      console.log(chalk.green(`✓ Job initialized at ${resolved}`));
      console.log("  Created: spec.json, meta.json");
    }
  });

// ── info ──────────────────────────────────────────────────────────
program
  .command("info")
  .description("Show info about a spec.json")
  .argument("<spec-path>", "Path to spec.json")
  .action(async (specPath: string) => {
    const resolved = path.resolve(specPath);
    const raw = await fs.readFile(resolved, "utf-8");
    const spec = parseSpec(JSON.parse(raw));

    const totalDuration = spec.scenes.reduce((sum, s) => sum + s.duration, 0);
    const mins = Math.floor(totalDuration / 60);
    const secs = Math.round(totalDuration % 60);

    console.log(chalk.bold("Video Spec Info"));
    console.log("─".repeat(40));
    console.log(`Title:       ${spec.title ?? "(untitled)"}`);
    console.log(`Duration:    ${mins}m ${secs}s (${totalDuration}s)`);
    console.log(`Resolution:  ${spec.output.width}×${spec.output.height}`);
    console.log(`FPS:         ${spec.output.fps}`);
    console.log(`Codec:       ${spec.output.codec} (CRF ${spec.output.crf}, ${spec.output.preset})`);
    console.log(`Scenes:      ${spec.scenes.length}`);
    spec.scenes.forEach((s, i) => {
      const layerTypes = s.layers.map((l) => l.type).join(", ") || "none";
      console.log(`  ${i + 1}. [${s.id}] ${s.duration}s — layers: ${layerTypes}`);
    });
    console.log(`Audio:       ${spec.audio.tracks.length} track(s)`);
    spec.audio.tracks.forEach((t, i) => {
      console.log(`  ${i + 1}. [${t.type}] ${t.src} vol=${t.volume}`);
    });
    console.log(`Subtitles:   ${spec.subtitles.length} entry/entries`);
    console.log(`Thumbnail:   ${spec.thumbnail.enabled ? "enabled" : "disabled"}`);
  });

program.parse();
