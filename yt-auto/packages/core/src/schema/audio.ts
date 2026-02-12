import { z } from "zod";

const AudioTrackSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["bgm", "tts", "sfx", "voiceover"]),
  src: z.string().min(1),
  start: z.number().min(0).default(0),
  duration: z.number().positive().optional(),
  volume: z.number().min(0).max(2).default(1),
  fadeIn: z.number().min(0).default(0),
  fadeOut: z.number().min(0).default(0),
  loop: z.boolean().default(false),
  trim: z.object({
    from: z.number().min(0).default(0),
    to: z.number().positive().optional(),
  }).default({}),
});

export type AudioTrack = z.infer<typeof AudioTrackSchema>;

export const AudioSchema = z.object({
  tracks: z.array(AudioTrackSchema).default([]),
  master: z.object({
    volume: z.number().min(0).max(2).default(1),
    normalize: z.boolean().default(false),
  }).default({}),
});

export type Audio = z.infer<typeof AudioSchema>;
