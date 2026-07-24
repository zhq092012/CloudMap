import * as Cesium from "cesium";

export interface CesiumPerformancePresetOptions {
  /**
   * 目标帧率，Cesium 会尽量以该频率驱动渲染。
   */
  targetFrameRate?: number;
  /**
   * 渲染分辨率比例，< 1.0 时可显著降低 GPU 压力。
   */
  resolutionScale?: number;
  /**
   * 是否启用 requestRenderMode（推荐开启，静止场景可显著省电）。
   */
  requestRenderMode?: boolean;
}

/**
 * 为 Viewer 应用一套通用性能优化预设。
 *
 * 设计思路：
 * 1. 优先降低“空闲帧”渲染消耗（requestRenderMode）
 * 2. 按需降低分辨率，换取稳定帧率
 * 3. 默认关闭阴影、MSAA 等重成本特性
 */
export function applyCesiumPerformancePreset(viewer: Cesium.Viewer, options: CesiumPerformancePresetOptions = {}): void {
  const scene = viewer.scene;

  scene.requestRenderMode = options.requestRenderMode ?? true;
  scene.maximumRenderTimeChange = 1.0;

  scene.postProcessStages.fxaa.enabled = true;

  // 关闭阴影通常能大幅减少 GPU 负载。
  viewer.shadows = false;

  // resolutionScale 越小越省性能，但会降低清晰度。
  viewer.resolutionScale = Cesium.Math.clamp(options.resolutionScale ?? 1.0, 0.5, 1.0);

  viewer.targetFrameRate = options.targetFrameRate ?? 60;

  // 地形深度测试在复杂场景中开销较高，默认关闭，业务需精确遮挡时再开启。
  scene.globe.depthTestAgainstTerrain = false;
}

export interface TilesetPerformanceOptions {
  maximumScreenSpaceError?: number;
  skipLevelOfDetail?: boolean;
  dynamicScreenSpaceError?: boolean;
}

/**
 * 对 3DTileset 应用常见性能参数。
 */
export function applyTilesetPerformanceOptions(tileset: Cesium.Cesium3DTileset, options: TilesetPerformanceOptions = {}): void {
  tileset.maximumScreenSpaceError = options.maximumScreenSpaceError ?? 24;
  tileset.skipLevelOfDetail = options.skipLevelOfDetail ?? true;
  tileset.dynamicScreenSpaceError = options.dynamicScreenSpaceError ?? true;
}

export interface AdaptiveScreenErrorOptions {
  lowFps?: number;
  highFps?: number;
  minError?: number;
  maxError?: number;
  adjustStep?: number;
  sampleWindowMs?: number;
}

/**
 * 创建一个“自适应屏幕空间误差”控制器。
 *
 * 工作方式：
 * 1. 每隔一段时间统计当前帧率
 * 2. 低于阈值时提升 maximumScreenSpaceError（降画质换性能）
 * 3. 高于阈值时降低 maximumScreenSpaceError（提画质）
 *
 * 返回销毁函数，页面卸载时务必调用。
 */
export function createAdaptiveScreenSpaceErrorController(viewer: Cesium.Viewer, tileset: Cesium.Cesium3DTileset, options: AdaptiveScreenErrorOptions = {}): () => void {
  const lowFps = options.lowFps ?? 25;
  const highFps = options.highFps ?? 50;
  const minError = options.minError ?? 8;
  const maxError = options.maxError ?? 64;
  const adjustStep = options.adjustStep ?? 2;
  const sampleWindowMs = options.sampleWindowMs ?? 1200;

  let lastSampleTime = performance.now();
  let frameCount = 0;
  let disposed = false;
  const postRenderEvent = viewer.scene.postRender;

  const onPostRender = () => {
    if (disposed || viewer.isDestroyed()) {
      return;
    }

    frameCount += 1;
    const now = performance.now();
    const elapsed = now - lastSampleTime;
    if (elapsed < sampleWindowMs) {
      return;
    }

    const fps = (frameCount * 1000) / elapsed;
    frameCount = 0;
    lastSampleTime = now;

    if (fps < lowFps) {
      tileset.maximumScreenSpaceError = Math.min(maxError, tileset.maximumScreenSpaceError + adjustStep);
      viewer.scene.requestRender();
      return;
    }

    if (fps > highFps) {
      tileset.maximumScreenSpaceError = Math.max(minError, tileset.maximumScreenSpaceError - adjustStep);
      viewer.scene.requestRender();
    }
  };

  postRenderEvent.addEventListener(onPostRender);
  return () => {
    if (disposed) {
      return;
    }
    disposed = true;
    postRenderEvent.removeEventListener(onPostRender);
  };
}
