import * as Cesium from "cesium";

export interface ClickPositionInfo {
  lon: number;
  lat: number;
  height: number;
  x: number;
  y: number;
  z: number;
}

/**
 * 创建鼠标左键点击拾取工具。
 *
 * 功能：
 * 1. 点击地图后尽量拾取精确位置（优先模型深度）
 * 2. 回调输出经纬高 + 世界坐标 xyz
 *
 * 返回销毁函数，务必在页面卸载时调用。
 */
export function createMouseClickPositionPicker(viewer: Cesium.Viewer, onPick: (info: ClickPositionInfo) => void): () => void {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  handler.setInputAction((event: { position: Cesium.Cartesian2 }) => {
    const scene = viewer.scene;
    const position = event.position;

    let cartesian: Cesium.Cartesian3 | undefined;
    if (scene.pickPositionSupported) {
      cartesian = scene.pickPosition(position) as Cesium.Cartesian3 | undefined;
    }

    if (!cartesian) {
      const ray = viewer.camera.getPickRay(position);
      if (ray) {
        cartesian = scene.globe.pick(ray, scene) as Cesium.Cartesian3 | undefined;
      }
    }

    if (!cartesian) {
      return;
    }

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    onPick({
      lon: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
      x: cartesian.x,
      y: cartesian.y,
      z: cartesian.z,
    });
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  return () => {
    handler.destroy();
  };
}

export interface CameraStateInfo {
  lon: number;
  lat: number;
  height: number;
  x: number;
  y: number;
  z: number;
  heading: number;
  pitch: number;
  roll: number;
}

export interface CameraListenerOptions {
  /**
   * 回调节流时间，防止高频触发导致 UI 抖动。
   */
  throttleMs?: number;
}

/**
 * 监听相机变化并输出经纬高 + xyz + 姿态角。
 *
 * 返回销毁函数，页面卸载时必须调用。
 */
export function createCameraStateListener(viewer: Cesium.Viewer, onChange: (state: CameraStateInfo) => void, options: CameraListenerOptions = {}): () => void {
  const throttleMs = options.throttleMs ?? 120;
  let lastEmitTime = 0;
  let disposed = false;
  const changedEvent = viewer.camera.changed;

  const handler = () => {
    if (disposed || viewer.isDestroyed()) {
      return;
    }

    const now = performance.now();
    if (now - lastEmitTime < throttleMs) {
      return;
    }
    lastEmitTime = now;

    const camera = viewer.camera;
    const position = camera.positionWC;
    const cartographic = Cesium.Cartographic.fromCartesian(position);

    onChange({
      lon: Cesium.Math.toDegrees(cartographic.longitude),
      lat: Cesium.Math.toDegrees(cartographic.latitude),
      height: cartographic.height,
      x: position.x,
      y: position.y,
      z: position.z,
      heading: Cesium.Math.toDegrees(camera.heading),
      pitch: Cesium.Math.toDegrees(camera.pitch),
      roll: Cesium.Math.toDegrees(camera.roll),
    });
  };

  changedEvent.addEventListener(handler);
  handler();

  return () => {
    if (disposed) {
      return;
    }
    disposed = true;
    changedEvent.removeEventListener(handler);
  };
}
