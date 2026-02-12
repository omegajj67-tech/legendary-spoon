import * as path from "node:path";
import * as fs from "node:fs/promises";
import { extractFrame, renderThumbnail } from "../../ffmpeg/index.js";
import type { PipelineContext } from "../runner.js";

/**
 * Step 4: Generate thumbnail image.
 */
export async function thumbnailStep(ctx: PipelineContext): Promise<void> {
  const thumb = ctx.spec!.thumbnail;

  if (!thumb.enabled) {
    ctx.log("Thumbnail generation skipped (disabled).");
    return;
  }

  ctx.log("Generating thumbnail…");

  const thumbPath = path.join(ctx.jobDir, "thumb.png");
  let basePath: string;

  if (thumb.source.type === "scene") {
    // Extract a frame from the rendered video
    if (!ctx.outputs.videoPath) {
      throw new Error("Cannot generate scene-based thumbnail: video not yet rendered");
    }
    const framePath = path.join(ctx.jobDir, "_thumb_frame.png");
    await extractFrame({
      videoPath: ctx.outputs.videoPath,
      timestamp: thumb.source.timestamp,
      outputPath: framePath,
      width: thumb.width,
      height: thumb.height,
    });
    basePath = framePath;
  } else {
    // Custom background
    const bg = thumb.source.background;
    if (bg.type === "image") {
      basePath = path.isAbsolute(bg.src) ? bg.src : path.resolve(ctx.jobDir, bg.src);
    } else {
      // Create a solid color image via FFmpeg
      basePath = path.join(ctx.jobDir, "_thumb_bg.png");
      const { spawn } = await import("node:child_process");
      await new Promise<void>((resolve, reject) => {
        const proc = spawn("ffmpeg", [
          "-y", "-f", "lavfi", "-i",
          `color=c=${bg.value}:s=${thumb.width}x${thumb.height}:d=1`,
          "-frames:v", "1", basePath,
        ], { stdio: "pipe" });
        proc.on("close", (code) => code === 0 ? resolve() : reject(new Error("Failed to create thumb bg")));
        proc.on("error", reject);
      });
    }
  }

  await renderThumbnail({
    spec: ctx.spec!,
    jobDir: ctx.jobDir,
    basePath,
    outputPath: thumbPath,
  });

  // Clean up temp files
  for (const tmp of ["_thumb_frame.png", "_thumb_bg.png"]) {
    try { await fs.unlink(path.join(ctx.jobDir, tmp)); } catch { /* noop */ }
  }

  ctx.outputs.thumbPath = thumbPath;
  ctx.log(`  ✓ Thumbnail → thumb.png`);
}
