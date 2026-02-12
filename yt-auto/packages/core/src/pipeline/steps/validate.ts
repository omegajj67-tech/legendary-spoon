import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseSpec, type Spec } from "../../schema/index.js";
import type { PipelineContext } from "../runner.js";

/**
 * Step 1: Read and validate spec.json against Zod schema.
 */
export async function validateStep(ctx: PipelineContext): Promise<void> {
  ctx.log("Validating spec.json…");

  const specPath = path.join(ctx.jobDir, "spec.json");
  const raw = await fs.readFile(specPath, "utf-8");
  const json = JSON.parse(raw);

  ctx.spec = parseSpec(json);

  ctx.log(`  ✓ ${ctx.spec.scenes.length} scene(s), ${ctx.spec.audio.tracks.length} audio track(s)`);
  ctx.log(`  ✓ Output: ${ctx.spec.output.width}×${ctx.spec.output.height} @ ${ctx.spec.output.fps}fps ${ctx.spec.output.format}`);
}
