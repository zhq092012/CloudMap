import * as Cesium from "cesium";

export interface LoadTilesetOptions {
  url: string;
  /**
   * 最大屏幕空间误差，数值越小细节越高，但性能开销越大。
   */
  maximumScreenSpaceError?: number;
}

export interface FocusTilesetOptions {
  heading?: number;
  pitch?: number;
  rangeScale?: number;
  duration?: number;
}

/**
 * 从 URL 加载 3D Tiles。
 */
export async function loadTileset(options: LoadTilesetOptions): Promise<Cesium.Cesium3DTileset> {
  const maxError = options.maximumScreenSpaceError ?? 16;
  const tileset = await Cesium.Cesium3DTileset.fromUrl(options.url, {
    maximumScreenSpaceError: maxError,
  });
  tileset.maximumScreenSpaceError = maxError;
  return tileset;
}

/**
 * 聚焦到 tileset。
 *
 * 这里基于 tileset 包围球估算观察距离，避免不同模型尺度下相机距离不合适。
 */
export function focusTileset(viewer: Cesium.Viewer, tileset: Cesium.Cesium3DTileset, options: FocusTilesetOptions = {}): void {
  const heading = Cesium.Math.toRadians(options.heading ?? 0);
  const pitch = Cesium.Math.toRadians(options.pitch ?? -20);
  const rangeScale = options.rangeScale ?? 4;
  const range = tileset.boundingSphere.radius * rangeScale;
  const duration = options.duration ?? 0;

  viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
    duration,
    offset: new Cesium.HeadingPitchRange(heading, pitch, range),
  });
}

/**
 * 根据锚点经纬度对 tileset 做高度偏移。
 *
 * 工作原理：
 * 1. 计算“锚点地表坐标”和“锚点目标高度坐标”
 * 2. 两者相减得到世界坐标下的平移向量
 * 3. 用平移矩阵乘以原始模型矩阵，得到新的 modelMatrix
 *
 * 这样能保证偏移逻辑稳定，且不会丢失模型原始姿态。
 */
export function offsetTilesetHeight(params: { tileset: Cesium.Cesium3DTileset; baseModelMatrix?: Cesium.Matrix4; anchorLon: number; anchorLat: number; height: number }): Cesium.Matrix4 {
  const { tileset, anchorLon, anchorLat, height } = params;
  const surface = Cesium.Cartesian3.fromDegrees(anchorLon, anchorLat, 0);
  const offset = Cesium.Cartesian3.fromDegrees(anchorLon, anchorLat, height);
  const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());

  const baseMatrix = params.baseModelMatrix ?? Cesium.Matrix4.clone(tileset.modelMatrix, new Cesium.Matrix4());
  const offsetMatrix = Cesium.Matrix4.fromTranslation(translation);
  const result = Cesium.Matrix4.multiply(offsetMatrix, baseMatrix, new Cesium.Matrix4());
  tileset.modelMatrix = result;
  return result;
}
