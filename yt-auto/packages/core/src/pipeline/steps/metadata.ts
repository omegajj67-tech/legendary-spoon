import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { PipelineContext } from "../runner.js";

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  duration: number;
  resolution: string;
  createdAt: string;
  files: {
    video: string;
    thumbnail?: string;
  };
}

/**
 * Step 5: Write meta.json with video metadata.
 */
export async function metadataStep(ctx: PipelineContext): Promise<void> {
  ctx.log("Writing meta.json…");

  const spec = ctx.spec!;
  const totalDuration = spec.scenes.reduce((sum, s) => sum + s.duration, 0);

  // Try to read existing meta.json for user-defined fields
  const metaPath = path.join(ctx.jobDir, "meta.json");
  let existing: Partial<VideoMetadata> = {};
  try {
    const raw = await fs.readFile(metaPath, "utf-8");
    existing = JSON.parse(raw);
  } catch { /* no existing meta */ }

  const meta: VideoMetadata = {
    title: existing.title ?? spec.title ?? "Untitled",
    description: existing.description ?? "",
    tags: existing.tags ?? [],
    duration: totalDuration,
    resolution: `${spec.output.width}x${spec.output.height}`,
    createdAt: new Date().toISOString(),
    files: {
      video: ctx.outputs.videoPath ? path.basename(ctx.outputs.videoPath) : "",
      thumbnail: ctx.outputs.thumbPath ? path.basename(ctx.outputs.thumbPath) : undefined,
    },
  };

  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf-8");
  ctx.log(`  ✓ meta.json written`);
}
