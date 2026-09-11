import * as Cesium from "cesium";
import type { LngLatHeight } from "@/types/3d-utils";

/**
 * 经纬高转笛卡尔坐标。
 */
export function lngLatHeightToCartesian(input: LngLatHeight): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(input.lon, input.lat, input.height);
}

/**
 * 笛卡尔转经纬高。
 */
export function cartesianToLngLatHeight(cartesian: Cesium.Cartesian3): LngLatHeight {
  const c = Cesium.Cartographic.fromCartesian(cartesian); // 这里的经纬度是弧度，需要转换成度
  return {
    lon: Cesium.Math.toDegrees(c.longitude), //将经纬度从弧度转成度
    lat: Cesium.Math.toDegrees(c.latitude),
    height: c.height,
  };
}

/**
 * 以 ENU 局部坐标系计算世界偏移。
 *
 * @param anchor 参考点
 * @param localOffset 局部偏移（东、北、上，单位米）
 */
export function eastNorthUpOffset(anchor: Cesium.Cartesian3, localOffset: Cesium.Cartesian3): Cesium.Cartesian3 {
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(anchor);
  return Cesium.Matrix4.multiplyByPointAsVector(enu, localOffset, new Cesium.Cartesian3());
}
