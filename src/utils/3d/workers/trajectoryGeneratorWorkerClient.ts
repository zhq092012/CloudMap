import { WorkerTaskClient } from "./workerTaskClient";
import type { WorkerTrajectory } from "../cesium/trajectory";

export interface GenerateOptions {
  seed?: number;
  trajectoryCount: number;
  pointsPerTrajectory: number;
  bounds?: { west: number; south: number; east: number; north: number };
}

export default class TrajectoryGeneratorWorkerClient {
  private client: WorkerTaskClient<GenerateOptions, WorkerTrajectory[]>;

  constructor() {
    const worker = new Worker(new URL("../../../workers/trajectory-generator.worker.ts", import.meta.url), {
      type: "module",
    });

    this.client = new WorkerTaskClient<GenerateOptions, WorkerTrajectory[]>(worker);
  }

  async generate(options: GenerateOptions, timeoutMs = 30000): Promise<WorkerTrajectory[]> {
    return this.client.request({ ...options }, timeoutMs);
  }

  destroy() {
    this.client.dispose();
  }
}
