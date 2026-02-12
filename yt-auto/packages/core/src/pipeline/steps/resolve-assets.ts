import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { PipelineContext } from "../runner.js";

/**
 * Step 2: Verify that all referenced asset files exist.
 */
export async function resolveAssetsStep(ctx: PipelineContext): Promise<void> {
  ctx.log("Resolving asset paths…");

  const missing: string[] = [];

  async function check(src: string) {
    const resolved = path.isAbsolute(src) ? src : path.resolve(ctx.jobDir, src);
    try {
      await fs.access(resolved);
    } catch {
      missing.push(src);
    }
  }

  for (const scene of ctx.spec!.scenes) {
    const bg = scene.background;
    if (bg.type === "image" || bg.type === "video") {
      await check(bg.src);
    }
    for (const layer of scene.layers) {
      if ("src" in layer && typeof layer.src === "string") {
        await check(layer.src);
      }
    }
  }

  for (const track of ctx.spec!.audio.tracks) {
    await check(track.src);
  }

  if (missing.length > 0) {
    ctx.log(`  ✗ Missing assets:\n${missing.map((m) => `    - ${m}`).join("\n")}`);
    throw new Error(`Missing ${missing.length} asset(s): ${missing.join(", ")}`);
  }

  ctx.log(`  ✓ All assets resolved`);
}
