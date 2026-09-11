import * as Cesium from "cesium";

export interface FlyToLngLatOptions {
  lon: number;
  lat: number;
  height?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  duration?: number;
}

/**
 * 飞行到指定经纬高。
 */
export function flyToLngLat(viewer: Cesium.Viewer, options: FlyToLngLatOptions): void {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(options.lon, options.lat, options.height ?? 1000),
    duration: options.duration ?? 0,
    orientation: {
      heading: Cesium.Math.toRadians(options.heading ?? 0),
      pitch: Cesium.Math.toRadians(options.pitch ?? -30),
      roll: Cesium.Math.toRadians(options.roll ?? 0),
    },
  });
}

/**
 * 计算标准 HeadingPitchRange。
 */
export function computeHeadingPitchRange(params: { headingDeg?: number; pitchDeg?: number; radius: number; rangeScale?: number }): Cesium.HeadingPitchRange {
  return new Cesium.HeadingPitchRange(Cesium.Math.toRadians(params.headingDeg ?? 0), Cesium.Math.toRadians(params.pitchDeg ?? 0), params.radius * (params.rangeScale ?? 0));
}

/**
 * 让相机拟合包围球。
 */
export function fitBoundingSphere(
  viewer: Cesium.Viewer,
  boundingSphere: Cesium.BoundingSphere,
  options: {
    headingDeg?: number;
    pitchDeg?: number;
    rangeScale?: number;
    duration?: number;
  } = {},
): void {
  viewer.camera.flyToBoundingSphere(boundingSphere, {
    duration: options.duration ?? 0,
    offset: computeHeadingPitchRange({
      headingDeg: options.headingDeg,
      pitchDeg: options.pitchDeg,
      radius: boundingSphere.radius,
      rangeScale: options.rangeScale,
    }),
  });
}
