import type { Spec } from "../schema/index.js";
import { validateStep } from "./steps/validate.js";
import { resolveAssetsStep } from "./steps/resolve-assets.js";
import { renderStep } from "./steps/render.js";
import { thumbnailStep } from "./steps/thumbnail.js";
import { metadataStep } from "./steps/metadata.js";

export interface PipelineContext {
  jobDir: string;
  spec: Spec | null;
  outputs: {
    videoPath?: string;
    thumbPath?: string;
  };
  log: (msg: string) => void;
}

export type StepName = "validate" | "resolve-assets" | "render" | "thumbnail" | "metadata";

interface PipelineOptions {
  jobDir: string;
  /** Run only up to this step (inclusive). Default: run all. */
  until?: StepName;
  /** Skip these steps. */
  skip?: StepName[];
  /** Custom logger. Defaults to console.log. */
  logger?: (msg: string) => void;
}

const STEPS: { name: StepName; fn: (ctx: PipelineContext) => Promise<void> }[] = [
  { name: "validate",       fn: validateStep },
  { name: "resolve-assets",  fn: resolveAssetsStep },
  { name: "render",          fn: renderStep },
  { name: "thumbnail",       fn: thumbnailStep },
  { name: "metadata",        fn: metadataStep },
];

/**
 * Run the full render pipeline for a job directory.
 */
export async function runPipeline(opts: PipelineOptions): Promise<PipelineContext> {
  const log = opts.logger ?? console.log;
  const skip = new Set(opts.skip ?? []);

  const ctx: PipelineContext = {
    jobDir: opts.jobDir,
    spec: null,
    outputs: {},
    log,
  };

  log(`\n▶ Pipeline started for: ${opts.jobDir}\n`);
  const startTime = Date.now();

  for (const step of STEPS) {
    if (skip.has(step.name)) {
      log(`⊘ Skipping: ${step.name}`);
      continue;
    }

    log(`● Step: ${step.name}`);
    const t0 = Date.now();

    try {
      await step.fn(ctx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`\n✗ Pipeline failed at "${step.name}": ${msg}\n`);
      throw err;
    }

    log(`  (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);

    if (opts.until === step.name) {
      log(`◼ Stopped after "${step.name}" (--until flag)`);
      break;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`✓ Pipeline complete (${elapsed}s total)\n`);

  return ctx;
}
