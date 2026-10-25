"use client";

import { useEffect, useRef } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

// MediaPipe pose (open source, runs in the browser). Wasm and model are fetched once, then cached.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 29], [29, 31], [28, 30], [30, 32],
];

let landmarker: Promise<PoseLandmarker> | null = null;
function load() {
  landmarker ??= (async () => {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const fs = await FilesetResolver.forVisionTasks(WASM);
    return PoseLandmarker.createFromOptions(fs, {
      baseOptions: { modelAssetPath: MODEL },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  })().catch((e) => {
    landmarker = null;
    throw e;
  });
  return landmarker;
}

export function PoseOverlay({ video, onError }: { video: HTMLVideoElement | null; onError?: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!video) return;
    let stop = false;
    let raf = 0;
    let lastT = -1;

    load()
      .then((lm) => {
        const tick = () => {
          if (stop) return;
          const c = canvas.current;
          if (c && video.videoWidth && video.currentTime !== lastT) {
            lastT = video.currentTime;
            c.width = video.videoWidth;
            c.height = video.videoHeight;
            const ctx = c.getContext("2d")!;
            ctx.clearRect(0, 0, c.width, c.height);
            const pose = lm.detectForVideo(video, performance.now()).landmarks[0];
            if (pose) {
              ctx.lineWidth = Math.max(3, c.width / 180);
              ctx.strokeStyle = "#22d3ee";
              ctx.fillStyle = "#ffffff";
              for (const [a, b] of BONES) {
                ctx.beginPath();
                ctx.moveTo(pose[a].x * c.width, pose[a].y * c.height);
                ctx.lineTo(pose[b].x * c.width, pose[b].y * c.height);
                ctx.stroke();
              }
              for (const i of [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
                ctx.beginPath();
                ctx.arc(pose[i].x * c.width, pose[i].y * c.height, ctx.lineWidth * 0.9, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => onError?.());

    return () => {
      stop = true;
      cancelAnimationFrame(raf);
    };
  }, [video, onError]);

  // object-contain on the video means the canvas must use the same fit.
  return <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full object-contain" aria-hidden="true" />;
}
