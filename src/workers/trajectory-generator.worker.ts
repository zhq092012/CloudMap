/* eslint-disable no-restricted-globals */
import type { WorkerTrajectory, WorkerTrajectoryPoint } from "../utils/3d/cesium/trajectory";

interface GeneratePayload {
  seed: number;
  trajectoryCount: number;
  pointsPerTrajectory: number;
  bounds?: { west: number; south: number; east: number; north: number };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInRange(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}

self.addEventListener("message", (ev) => {
  const msg = ev.data as { id?: number; payload?: GeneratePayload };

  if (!msg || typeof msg !== "object" || typeof msg.id !== "number" || !msg.payload) {
    return;
  }

  try {
    const p = msg.payload;
    const rng = mulberry32(p.seed || Date.now());

    const bounds = p.bounds || { west: -74.03, south: 40.7, east: -73.9, north: 40.82 };

    const out: WorkerTrajectory[] = [];

    for (let i = 0; i < p.trajectoryCount; i += 1) {
      const points: WorkerTrajectoryPoint[] = [];
      let lon = randomInRange(rng, bounds.west, bounds.east);
      let lat = randomInRange(rng, bounds.south, bounds.north);
      let h = randomInRange(rng, 0, 200);

      for (let j = 0; j < p.pointsPerTrajectory; j += 1) {
        lon += randomInRange(rng, -0.002, 0.002);
        lat += randomInRange(rng, -0.0015, 0.0015);
        h += randomInRange(rng, -1.5, 1.5);

        points.push({ lon, lat, height: h });
      }

      out.push({ id: i, points, colorH: Math.floor(rng() * 360) });
    }

    self.postMessage({ id: msg.id, result: out });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "轨迹生成失败";
    self.postMessage({ id: msg.id, error: errorMessage });
  }
});
