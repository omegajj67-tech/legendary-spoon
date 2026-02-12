import { z } from "zod";

export const OutputConfigSchema = z.object({
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  fps: z.number().positive().default(30),
  format: z.enum(["mp4", "webm", "mov"]).default("mp4"),
  codec: z.enum(["libx264", "libx265", "libvpx-vp9"]).default("libx264"),
  crf: z.number().int().min(0).max(51).default(23),
  preset: z
    .enum(["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"])
    .default("medium"),
});

export type OutputConfig = z.infer<typeof OutputConfigSchema>;
