import * as Cesium from "cesium";

export interface WorkerTrajectoryPoint {
  lon: number;
  lat: number;
  height: number;
}

export interface WorkerTrajectory {
  id: number;
  points: WorkerTrajectoryPoint[];
  colorH: number;
}

export interface TrajectoryCartesian {
  id: string;
  positions: Cesium.Cartesian3[];
  color: Cesium.Color;
}

export interface TrajectoryRenderStats {
  mode: string;
  trajectoryCount: number;
  totalPointCount: number;
}

export interface TrajectoryRendererHandle {
  destroy(): void;
  getStats(): TrajectoryRenderStats;
}

/**
 * 将 Worker 输出的轨迹数据转换为 Cesium 可直接渲染的笛卡尔坐标。
 */
export function convertWorkerTrajectoriesToCartesian(data: WorkerTrajectory[]): TrajectoryCartesian[] {
  const result: TrajectoryCartesian[] = [];

  for (const item of data) {
    const positions: Cesium.Cartesian3[] = [];

    for (const p of item.points) {
      const validLon = Number.isFinite(p.lon);
      const validLat = Number.isFinite(p.lat);
      const validHeight = Number.isFinite(p.height);
      if (!validLon || !validLat || !validHeight) {
        continue;
      }

      positions.push(Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height));
    }

    result.push({
      id: String(item.id),
      positions,
      color: buildColorFromHue(item.colorH),
    });
  }

  return result;
}

function buildColorFromHue(colorH: number): Cesium.Color {
  if (!Number.isFinite(colorH)) {
    return Cesium.Color.CYAN;
  }

  let hue = colorH;
  if (Math.abs(hue) > 1) {
    hue = (hue % 360) / 360;
  }

  hue = ((hue % 1) + 1) % 1;
  return Cesium.Color.fromHsl(hue, 0.85, 0.55, 1);
}

/**
 * 朴素 Entity 渲染器：每条轨迹一个 polyline + 一个点（头部），点位置使用 CallbackProperty 实时更新。
 */
export function createNaiveTrajectoryEntityRenderer(viewer: Cesium.Viewer, trajectories: WorkerTrajectory[]): TrajectoryRendererHandle {
  const cartesianTrajectories = convertWorkerTrajectoriesToCartesian(trajectories);
  const stats: TrajectoryRenderStats = {
    mode: "naive-entity",
    trajectoryCount: cartesianTrajectories.length,
    totalPointCount: cartesianTrajectories.reduce((sum, t) => sum + t.positions.length, 0),
  };

  const dataSource = new Cesium.CustomDataSource("trajectory-naive-renderer");
  void viewer.dataSources.add(dataSource);

  const headIndices = cartesianTrajectories.map(() => 0);
  let disposed = false;

  for (let i = 0; i < cartesianTrajectories.length; i += 1) {
    const trajectory = cartesianTrajectories[i];
    if (trajectory.positions.length === 0) {
      continue;
    }

    dataSource.entities.add({
      id: "trajectory-line-" + trajectory.id,
      polyline: {
        positions: trajectory.positions,
        width: 2,
        material: trajectory.color,
      },
    });

    dataSource.entities.add({
      id: "trajectory-head-" + trajectory.id,
      position: new Cesium.CallbackPositionProperty(() => {
        const currentIndex = headIndices[i];
        const current = trajectory.positions[currentIndex];
        if (current) {
          return current;
        }
        return trajectory.positions[trajectory.positions.length - 1];
      }, false),
      point: {
        pixelSize: 7,
        color: trajectory.color,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.9),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  const postRenderEvent = viewer.scene.postRender;
  const onPostRender = () => {
    if (disposed || viewer.isDestroyed()) {
      return;
    }

    for (let i = 0; i < cartesianTrajectories.length; i += 1) {
      const len = cartesianTrajectories[i].positions.length;
      if (len <= 1) {
        headIndices[i] = 0;
        continue;
      }
      headIndices[i] = (headIndices[i] + 1) % len;
    }

    viewer.scene.requestRender();
  };

  postRenderEvent.addEventListener(onPostRender);

  return {
    destroy: () => {
      if (disposed) {
        return;
      }
      disposed = true;

      postRenderEvent.removeEventListener(onPostRender);

      if (!viewer.isDestroyed()) {
        viewer.dataSources.remove(dataSource, true);
      }
    },
    getStats: () => ({ ...stats }),
  };
}

/**
 * 优化 Primitive 渲染器：用 PolylineCollection 与 PointPrimitiveCollection 批量渲染，降低 Entity 系统开销。
 */
export function createOptimizedTrajectoryPrimitiveRenderer(viewer: Cesium.Viewer, trajectories: WorkerTrajectory[]): TrajectoryRendererHandle {
  const cartesianTrajectories = convertWorkerTrajectoriesToCartesian(trajectories);
  const stats: TrajectoryRenderStats = {
    mode: "optimized-primitive",
    trajectoryCount: cartesianTrajectories.length,
    totalPointCount: cartesianTrajectories.reduce((sum, t) => sum + t.positions.length, 0),
  };

  const rootCollection = new Cesium.PrimitiveCollection();
  const polylineCollection = rootCollection.add(new Cesium.PolylineCollection()) as Cesium.PolylineCollection;
  const pointCollection = rootCollection.add(new Cesium.PointPrimitiveCollection()) as Cesium.PointPrimitiveCollection;
  viewer.scene.primitives.add(rootCollection);

  const headIndices = cartesianTrajectories.map(() => 0);
  const heads: Array<Cesium.PointPrimitive | undefined> = [];

  for (let i = 0; i < cartesianTrajectories.length; i += 1) {
    const trajectory = cartesianTrajectories[i];
    const len = trajectory.positions.length;

    if (len >= 2) {
      polylineCollection.add({
        positions: trajectory.positions,
        width: 2,
        material: Cesium.Material.fromType("Color", {
          color: trajectory.color,
        }),
      });
    }

    if (len >= 1) {
      const head = pointCollection.add({
        position: trajectory.positions[0],
        pixelSize: 7,
        color: trajectory.color,
        outlineColor: Cesium.Color.BLACK.withAlpha(0.9),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
      heads.push(head);
    } else {
      heads.push(undefined);
    }
  }

  let disposed = false;
  const postRenderEvent = viewer.scene.postRender;

  const onPostRender = () => {
    if (disposed || viewer.isDestroyed()) {
      return;
    }

    for (let i = 0; i < cartesianTrajectories.length; i += 1) {
      const trajectory = cartesianTrajectories[i];
      const len = trajectory.positions.length;
      const headPrimitive = heads[i];

      if (!headPrimitive || len === 0) {
        continue;
      }

      if (len > 1) {
        headIndices[i] = (headIndices[i] + 1) % len;
      } else {
        headIndices[i] = 0;
      }

      headPrimitive.position = trajectory.positions[headIndices[i]];
    }

    viewer.scene.requestRender();
  };

  postRenderEvent.addEventListener(onPostRender);

  return {
    destroy: () => {
      if (disposed) {
        return;
      }
      disposed = true;

      postRenderEvent.removeEventListener(onPostRender);

      if (!viewer.isDestroyed()) {
        const scenePrimitives = viewer.scene.primitives;
        if (scenePrimitives.contains(rootCollection)) {
          scenePrimitives.remove(rootCollection);
        } else if (!rootCollection.isDestroyed()) {
          rootCollection.destroy();
        }
      } else if (!rootCollection.isDestroyed()) {
        rootCollection.destroy();
      }
    },
    getStats: () => ({ ...stats }),
  };
}
