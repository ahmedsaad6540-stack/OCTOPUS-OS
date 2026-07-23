import test from "node:test";
import assert from "node:assert/strict";
import { VideoEngine } from "./VideoEngine.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execAsync = promisify(exec);

test("Real FFmpeg Video Rendering Test", async (t) => {
  const engine = new VideoEngine();
  let videoUrl: string = "";

  await t.test("Generate a real MP4 using FFmpeg", async () => {
    // Generate the video
    videoUrl = await engine.renderVideo(
      { title: "Test", hook: "Test", body: [], callToAction: "Test" },
      []
    );
    assert.ok(videoUrl, "Video URL should be returned");
    assert.match(videoUrl, /\.mp4$/, "Video URL should end with .mp4");
  });

  await t.test("Verify MP4 properties using FFprobe", async () => {
    // Extract local file path from URL
    const fileName = videoUrl.split("/").pop();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const localFilePath = path.resolve(__dirname, "../../../../public/renders", fileName!);

    // Check file exists and size > 0
    const stat = await fs.stat(localFilePath);
    assert.ok(stat.size > 0, "File size must be greater than zero");

    // Run ffprobe
    const cmd = `ffprobe -v error -show_entries format=duration -show_streams -of json "${localFilePath}"`;
    const { stdout } = await execAsync(cmd);
    const probeData = JSON.parse(stdout);

    // exit code = 0 (implied by execAsync not throwing)
    // duration > 0
    const duration = parseFloat(probeData.format?.duration || "0");
    assert.ok(duration > 0, `Duration should be > 0, got ${duration}`);

    // at least one video stream exists
    const videoStreams = probeData.streams?.filter((s: any) => s.codec_type === "video") || [];
    assert.ok(videoStreams.length > 0, "At least one video stream exists");

    // valid codec exists (h264/libx264 mapped to h264 usually)
    assert.equal(videoStreams[0].codec_name, "h264", "Codec should be h264");

    // width and height are valid
    assert.equal(videoStreams[0].width, 1080, "Width should be 1080");
    assert.equal(videoStreams[0].height, 1920, "Height should be 1920");
  });
});
