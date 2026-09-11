import * as Cesium from "cesium";
import * as THREE from "three";

/**
 * 将 Cesium 相机位置与方向同步到 Three 相机。
 *
 * 说明：
 * - 这里做的是“世界坐标直接映射”，适合 debug 与基础叠加。
 * - 对于严格地理配准场景，还需要根据业务定义统一坐标原点和缩放。
 */
export function syncCameraFromCesium(viewer: Cesium.Viewer, threeCamera: THREE.PerspectiveCamera): void {
  const c = viewer.camera;

  threeCamera.position.set(c.positionWC.x, c.positionWC.y, c.positionWC.z);

  const dir = c.directionWC;
  const up = c.upWC;

  const target = new THREE.Vector3(c.positionWC.x + dir.x, c.positionWC.y + dir.y, c.positionWC.z + dir.z);

  threeCamera.up.set(up.x, up.y, up.z);
  threeCamera.lookAt(target);
  threeCamera.updateProjectionMatrix();
}
