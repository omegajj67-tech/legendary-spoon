import { z } from "zod";

// ── Position & Size ───────────────────────────────────────────────
const PositionSchema = z.object({
  x: z.union([z.number(), z.enum(["center", "left", "right"])]),
  y: z.union([z.number(), z.enum(["center", "top", "bottom"])]),
});

const SizeSchema = z.object({
  width: z.union([z.number().positive(), z.literal("auto")]),
  height: z.union([z.number().positive(), z.literal("auto")]),
});

// ── Animation ─────────────────────────────────────────────────────
const AnimationSchema = z.object({
  enter: z.enum(["fadeIn", "slideUp", "slideDown", "slideLeft", "slideRight", "zoomIn", "none"]).default("none"),
  exit: z.enum(["fadeOut", "slideUp", "slideDown", "slideLeft", "slideRight", "zoomOut", "none"]).default("none"),
  enterDuration: z.number().positive().default(0.5),
  exitDuration: z.number().positive().default(0.5),
});

// ── Layers ────────────────────────────────────────────────────────
const TextLayerSchema = z.object({
  type: z.literal("text"),
  content: z.string().min(1),
  start: z.number().min(0).default(0),
  duration: z.number().positive().optional(),
  style: z.object({
    font: z.string().default("NotoSansKR"),
    size: z.number().positive().default(48),
    color: z.string().default("#FFFFFF"),
    outline: z.number().min(0).default(0),
    outlineColor: z.string().default("#000000"),
    shadow: z.number().min(0).default(0),
    bold: z.boolean().default(false),
    italic: z.boolean().default(false),
    lineSpacing: z.number().default(1.2),
    align: z.enum(["left", "center", "right"]).default("center"),
  }).default({}),
  position: PositionSchema.default({ x: "center", y: "center" }),
  animation: AnimationSchema.default({}),
});

const ImageLayerSchema = z.object({
  type: z.literal("image"),
  src: z.string().min(1),
  start: z.number().min(0).default(0),
  duration: z.number().positive().optional(),
  position: PositionSchema.default({ x: "center", y: "center" }),
  size: SizeSchema.default({ width: "auto", height: "auto" }),
  opacity: z.number().min(0).max(1).default(1),
  animation: AnimationSchema.default({}),
});

const VideoLayerSchema = z.object({
  type: z.literal("video"),
  src: z.string().min(1),
  start: z.number().min(0).default(0),
  duration: z.number().positive().optional(),
  trim: z.object({
    from: z.number().min(0).default(0),
    to: z.number().positive().optional(),
  }).default({}),
  position: PositionSchema.default({ x: "center", y: "center" }),
  size: SizeSchema.default({ width: "auto", height: "auto" }),
  opacity: z.number().min(0).max(1).default(1),
  mute: z.boolean().default(true),
});

const ShapeLayerSchema = z.object({
  type: z.literal("shape"),
  shape: z.enum(["rect", "circle", "rounded-rect"]),
  position: PositionSchema.default({ x: "center", y: "center" }),
  size: SizeSchema,
  color: z.string().default("#000000"),
  opacity: z.number().min(0).max(1).default(0.5),
  borderRadius: z.number().min(0).default(0),
  start: z.number().min(0).default(0),
  duration: z.number().positive().optional(),
});

export const LayerSchema = z.discriminatedUnion("type", [
  TextLayerSchema,
  ImageLayerSchema,
  VideoLayerSchema,
  ShapeLayerSchema,
]);

export type Layer = z.infer<typeof LayerSchema>;

// ── Background ────────────────────────────────────────────────────
const BackgroundSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("color"), value: z.string() }),
  z.object({ type: z.literal("image"), src: z.string() }),
  z.object({
    type: z.literal("video"),
    src: z.string(),
    trim: z.object({
      from: z.number().min(0).default(0),
      to: z.number().positive().optional(),
    }).default({}),
  }),
  z.object({
    type: z.literal("gradient"),
    colors: z.array(z.string()).min(2),
    direction: z.enum(["horizontal", "vertical", "diagonal"]).default("vertical"),
  }),
]);

// ── Transition ────────────────────────────────────────────────────
const TransitionSchema = z.object({
  type: z.enum(["none", "crossfade", "wipe-left", "wipe-right", "wipe-up", "wipe-down", "fade-black"]).default("none"),
  duration: z.number().positive().default(0.5),
});

// ── Scene ─────────────────────────────────────────────────────────
export const SceneSchema = z.object({
  id: z.string().min(1),
  duration: z.number().positive(),
  background: BackgroundSchema.default({ type: "color", value: "#000000" }),
  layers: z.array(LayerSchema).default([]),
  transition: TransitionSchema.default({}),
});

export type Scene = z.infer<typeof SceneSchema>;
