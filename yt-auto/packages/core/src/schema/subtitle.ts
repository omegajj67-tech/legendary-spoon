import { z } from "zod";

const SubtitleEntrySchema = z.object({
  start: z.number().min(0),
  end: z.number().positive(),
  text: z.string().min(1),
  style: z.object({
    font: z.string().default("../../assets/fonts/NotoSansKR-Regular.ttf"),
    size: z.number().positive().default(32),
    color: z.string().default("#FFFFFF"),
    outline: z.number().min(0).default(2),
    outlineColor: z.string().default("#000000"),
    shadow: z.number().min(0).default(1),
    position: z.enum(["bottom", "top", "center"]).default("bottom"),
    marginV: z.number().default(40),
  }).default({}),
}).refine((s) => s.end > s.start, {
  message: "Subtitle end time must be after start time",
});

export const SubtitlesSchema = z.array(SubtitleEntrySchema).default([]);

export type SubtitleEntry = z.infer<typeof SubtitleEntrySchema>;
