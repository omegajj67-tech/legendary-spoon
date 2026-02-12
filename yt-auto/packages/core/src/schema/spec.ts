import { z } from "zod";
import { OutputConfigSchema } from "./output.js";
import { SceneSchema } from "./scene.js";
import { AudioSchema } from "./audio.js";
import { SubtitlesSchema } from "./subtitle.js";
import { ThumbnailSchema } from "./thumbnail.js";

export const SpecSchema = z.object({
  version: z.string().default("1.0"),
  title: z.string().optional(),
  output: OutputConfigSchema.default({}),
  scenes: z.array(SceneSchema).min(1, "At least one scene is required"),
  audio: AudioSchema.default({}),
  subtitles: SubtitlesSchema,
  thumbnail: ThumbnailSchema,
});

export type Spec = z.infer<typeof SpecSchema>;

/** Parse and validate a raw JSON object against the Spec schema. */
export function parseSpec(raw: unknown): Spec {
  return SpecSchema.parse(raw);
}
