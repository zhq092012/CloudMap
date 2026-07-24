import * as Cesium from "cesium";
import * as THREE from "three";

/**
 * Cesium 坐标转 Three 向量。
 */
export function cesiumToThreeVector(cartesian: Cesium.Cartesian3): THREE.Vector3 {
  return new THREE.Vector3(cartesian.x, cartesian.y, cartesian.z);
}

/**
 * Three 向量转 Cesium 坐标。
 */
export function threeToCesiumCartesian(vector: THREE.Vector3): Cesium.Cartesian3 {
  return new Cesium.Cartesian3(vector.x, vector.y, vector.z);
}

/**
 * 获取参考点的 ENU 局部坐标系矩阵。
 */
export function localEnuFrame(anchor: Cesium.Cartesian3): Cesium.Matrix4 {
  return Cesium.Transforms.eastNorthUpToFixedFrame(anchor);
}
