import { WorkerTaskClient } from "./workerTaskClient";

export interface CameraSnapshotInput {
  lon: number;
  lat: number;
  height: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  roll: number;
  timestamp: number;
}

export interface CameraSnapshotOutput {
  lonText: string;
  latText: string;
  heightText: string;
  xyzText: string;
  attitudeText: string;
  speedText: string;
}

/**
 * 创建“相机信息处理”Worker 客户端。
 *
 * 说明：
 * - 该 Worker 不直接依赖 Cesium，只处理纯数值。
 * - 可把格式化和速度估算从主线程移走，降低 UI 线程负担。
 */
export function createCameraMetricsWorkerClient() {
  const worker = new Worker(new URL("../../../workers/camera-metrics.worker.ts", import.meta.url), {
    type: "module",
  });

  const taskClient = new WorkerTaskClient<CameraSnapshotInput, CameraSnapshotOutput>(worker);

  return {
    analyze(snapshot: CameraSnapshotInput) {
      return taskClient.request(snapshot, 3000);
    },
    dispose() {
      taskClient.dispose();
    },
  };
}
