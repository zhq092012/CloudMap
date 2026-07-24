interface CameraSnapshotInput {
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

interface CameraSnapshotOutput {
  lonText: string;
  latText: string;
  heightText: string;
  xyzText: string;
  attitudeText: string;
  speedText: string;
}

interface WorkerTaskEnvelope<T> {
  id: number;
  payload: T;
}

let previous: CameraSnapshotInput | null = null;

function fmt(value: number, fractionDigits = 6): string {
  return Number.isFinite(value) ? value.toFixed(fractionDigits) : "NaN";
}

function fmtLon(value: number): string {
  const dir = value >= 0 ? "E" : "W";
  return `${fmt(Math.abs(value), 6)}°${dir}`;
}

function fmtLat(value: number): string {
  const dir = value >= 0 ? "N" : "S";
  return `${fmt(Math.abs(value), 6)}°${dir}`;
}

function fmtAxis(value: number, axisName: string): string {
  const direction = value >= 0 ? "正向" : "负向";
  return `${axisName}=${fmt(Math.abs(value), 2)}(${direction})`;
}

function normalizeHeading(deg: number): number {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
}

self.onmessage = (event: MessageEvent<WorkerTaskEnvelope<CameraSnapshotInput>>) => {
  const { id, payload } = event.data;

  try {
    let speed = 0;
    if (previous) {
      const dx = payload.x - previous.x;
      const dy = payload.y - previous.y;
      const dz = payload.z - previous.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const dt = Math.max(1e-3, (payload.timestamp - previous.timestamp) / 1000);
      speed = distance / dt;
    }

    const result: CameraSnapshotOutput = {
      lonText: fmtLon(payload.lon),
      latText: fmtLat(payload.lat),
      heightText: `${fmt(payload.height, 2)} m`,
      xyzText: `${fmtAxis(payload.x, "x")}, ${fmtAxis(payload.y, "y")}, ${fmtAxis(payload.z, "z")}`,
      attitudeText: `heading=${fmt(normalizeHeading(payload.heading), 2)}°, pitch=${fmt(Math.abs(payload.pitch), 2)}°(${payload.pitch >= 0 ? "上仰" : "下俯"}), roll=${fmt(payload.roll, 2)}°`,
      speedText: `${fmt(speed, 2)} m/s`,
    };

    previous = payload;

    self.postMessage({
      id,
      result,
    });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : "Worker 处理失败",
    });
  }
};
