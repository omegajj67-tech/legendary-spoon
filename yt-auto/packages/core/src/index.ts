// @yt-auto/core — public API

export { parseSpec, SpecSchema, OutputConfigSchema, SceneSchema, LayerSchema, AudioSchema, SubtitlesSchema, ThumbnailSchema } from "./schema/index.js";
export type { Spec, OutputConfig, Scene, Layer, Audio, AudioTrack, SubtitleEntry, Thumbnail } from "./schema/index.js";

export { runPipeline } from "./pipeline/index.js";
export type { PipelineContext, StepName } from "./pipeline/index.js";

export { buildFiltergraph, renderVideo, extractFrame, renderThumbnail } from "./ffmpeg/index.js";
export type { RenderOptions } from "./ffmpeg/index.js";
