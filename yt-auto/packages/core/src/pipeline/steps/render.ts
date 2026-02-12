import * as path from "node:path";
import { renderVideo } from "../../ffmpeg/index.js";
import type { PipelineContext } from "../runner.js";

/**
 * Step 3: Render video using FFmpeg.
 */
export async function renderStep(ctx: PipelineContext): Promise<void> {
  ctx.log("Rendering video…");

  const outputPath = path.join(ctx.jobDir, `render.${ctx.spec!.output.format}`);

  await renderVideo({
    spec: ctx.spec!,
    jobDir: ctx.jobDir,
    outputPath,
    onProgress(percent) {
      ctx.log(`  ⏳ ${percent}%`);
    },
  });

  ctx.outputs.videoPath = outputPath;
  ctx.log(`  ✓ Rendered → ${path.basename(outputPath)}`);
}
