import * as Cesium from "cesium";

/**
 * 从屏幕坐标拾取地表/模型笛卡尔坐标。
 *
 * 优先使用 `pickPosition`（可拾取模型深度），
 * 失败时回退到椭球拾取，提升通用性。
 */
export function pickCartesian(
  viewer: Cesium.Viewer,
  windowPosition: Cesium.Cartesian2,
): Cesium.Cartesian3 | null {
  const scene = viewer.scene;

  if (scene.pickPositionSupported) {
    const picked = scene.pickPosition(windowPosition);
    if (Cesium.defined(picked)) {
      return picked;
    }
  }

  const ray = viewer.camera.getPickRay(windowPosition);
  if (!ray) {
    return null;
  }

  const globePicked = scene.globe.pick(ray, scene);
  return Cesium.defined(globePicked) ? globePicked : null;
}

/**
 * 读取要素拾取结果。
 */
export function pickFeatureInfo(
  viewer: Cesium.Viewer,
  windowPosition: Cesium.Cartesian2,
): unknown {
  return viewer.scene.pick(windowPosition);
}

/**
 * 将屏幕坐标转地理坐标。
 */
export function screenToGlobe(
  viewer: Cesium.Viewer,
  windowPosition: Cesium.Cartesian2,
): { lon: number; lat: number; height: number } | null {
  const cartesian = pickCartesian(viewer, windowPosition);
  if (!cartesian) {
    return null;
  }

  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    lon: Cesium.Math.toDegrees(cartographic.longitude),
    lat: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height,
  };
}

/**
 * 创建一个开发辅助工具，用于在地图上点击时，在控制台打印出所点击位置的经纬度。
 * 这个函数对于快速获取坐标进行调试非常有用。
 *
 * @param viewer - Cesium.Viewer 实例。
 * @returns 返回一个销毁函数。调用此函数可以移除点击事件监听，避免内存泄漏。
 *
 * @example
 * onMounted(() => {
 *   const viewer = new Cesium.Viewer('cesiumContainer');
 *   // 在开发环境下启用
 *   if (import.meta.env.DEV) {
 *     const destroyPicker = createCoordinatePickingTool(viewer);
 *     onUnmounted(() => {
 *       destroyPicker(); // 组件卸载时清理
 *     });
 *   }
 * });
 */
export function createCoordinatePickingTool(viewer: Cesium.Viewer): () => void {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
    const globePosition = screenToGlobe(viewer, event.position);
    if (globePosition) {
      const cameraHeight = viewer.camera.positionCartographic.height;
      console.log(
        `[Cesium 坐标拾取] lon: ${globePosition.lon.toFixed(6)}, lat: ${globePosition.lat.toFixed(6)}, height: ${cameraHeight.toFixed(2)}`,
      );
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return () => {
    handler.destroy();
  };
}
