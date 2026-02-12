import { spawn } from "node:child_process";
import * as path from "node:path";
import type { Spec } from "../schema/index.js";
import { buildFiltergraph } from "./filtergraph.js";

export interface RenderOptions {
  spec: Spec;
  jobDir: string;
  outputPath: string;
  onProgress?: (percent: number) => void;
}

/**
 * Render a spec to a video file using FFmpeg.
 * Returns a promise that resolves when rendering is complete.
 */
export async function renderVideo(opts: RenderOptions): Promise<void> {
  const { spec, jobDir, outputPath, onProgress } = opts;
  const fg = buildFiltergraph(spec, jobDir);

  const totalDuration = spec.scenes.reduce((sum, s) => sum + s.duration, 0);

  const args: string[] = ["-y"];

  // Input files
  for (const input of fg.inputs) {
    args.push("-i", input);
  }

  // Filter complex
  args.push("-filter_complex", fg.filterComplex);

  // Map outputs
  args.push("-map", `[${fg.mapVideo}]`, "-map", `[${fg.mapAudio}]`);

  // Encoding settings
  args.push(
    "-c:v", spec.output.codec,
    "-preset", spec.output.preset,
    "-crf", String(spec.output.crf),
    "-c:a", "aac",
    "-b:a", "192k",
    "-r", String(spec.output.fps),
    "-s", `${spec.output.width}x${spec.output.height}`,
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
  );

  args.push(outputPath);

  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, {
      cwd: jobDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderr = "";

    proc.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;

      // Parse progress from FFmpeg output
      const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (timeMatch && onProgress) {
        const [, hh, mm, ss] = timeMatch;
        const elapsed = parseInt(hh) * 3600 + parseInt(mm) * 60 + parseInt(ss);
        onProgress(Math.min(100, Math.round((elapsed / totalDuration) * 100)));
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}\n${stderr.slice(-2000)}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn FFmpeg: ${err.message}`));
    });
  });
}

/**
 * Extract a single frame from a video at a given timestamp.
 */
export async function extractFrame(opts: {
  videoPath: string;
  timestamp: number;
  outputPath: string;
  width?: number;
  height?: number;
}): Promise<void> {
  const { videoPath, timestamp, outputPath, width = 1280, height = 720 } = opts;

  const args = [
    "-y",
    "-ss", String(timestamp),
    "-i", videoPath,
    "-vframes", "1",
    "-s", `${width}x${height}`,
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg frame extraction failed (code ${code})\n${stderr.slice(-1000)}`));
    });
    proc.on("error", (err) => reject(new Error(`Failed to spawn FFmpeg: ${err.message}`)));
  });
}

/**
 * Generate a thumbnail with text overlays using FFmpeg.
 */
export async function renderThumbnail(opts: {
  spec: Spec;
  jobDir: string;
  basePath: string;       // either extracted frame or custom background
  outputPath: string;
}): Promise<void> {
  const { spec, jobDir, basePath, outputPath } = opts;
  const thumb = spec.thumbnail;
  const W = thumb.width;
  const H = thumb.height;

  const filters: string[] = [`[0]scale=${W}:${H}`];

  // Add text overlays from thumbnail config
  for (const layer of thumb.overlays) {
    if (layer.type === "text") {
      const escaped = layer.content
        .replace(/\\/g, "\\\\\\\\")
        .replace(/'/g, "'\\\\\\''")
        .replace(/:/g, "\\\\:");
      const s = layer.style;
      filters.push(
        `drawtext=text='${escaped}':fontsize=${s.size}:fontcolor=${s.color}:borderw=${s.outline}:x=(W-text_w)/2:y=(H-text_h)/2`
      );
    }
  }

  const args = [
    "-y",
    "-i", basePath,
    "-vf", filters.join(","),
    "-frames:v", "1",
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { cwd: jobDir, stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Thumbnail generation failed (code ${code})\n${stderr.slice(-1000)}`));
    });
    proc.on("error", (err) => reject(new Error(`Failed to spawn FFmpeg: ${err.message}`)));
  });
}
