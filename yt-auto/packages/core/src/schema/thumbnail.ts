import { z } from "zod";
import { LayerSchema } from "./scene.js";

export const ThumbnailSchema = z.object({
  enabled: z.boolean().default(true),
  width: z.number().int().positive().default(1280),
  height: z.number().int().positive().default(720),
  source: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("scene"),
      sceneId: z.string(),
      timestamp: z.number().min(0).default(0),
    }),
    z.object({
      type: z.literal("custom"),
      background: z.union([
        z.object({ type: z.literal("color"), value: z.string() }),
        z.object({ type: z.literal("image"), src: z.string() }),
      ]),
    }),
  ]).default({ type: "scene", sceneId: "", timestamp: 0 }),
  overlays: z.array(LayerSchema).default([]),
}).default({});

export type Thumbnail = z.infer<typeof ThumbnailSchema>;
