import * as THREE from "three";

export interface SceneHelperOptions {
  background?: number | THREE.Color;
  addAxes?: boolean;
  axesSize?: number;
  addGrid?: boolean;
  gridSize?: number;
  gridDivisions?: number;
  fog?: THREE.Fog | THREE.FogExp2;
}

/**
 * 创建带可选辅助对象的场景。
 */
export function createSceneWithHelpers(
  options: SceneHelperOptions = {},
): THREE.Scene {
  const scene = new THREE.Scene();
  if (typeof options.background === "number") {
    scene.background = new THREE.Color(options.background);
  } else if (options.background instanceof THREE.Color) {
    scene.background = options.background;
  } else {
    scene.background = new THREE.Color(0x202020);
  }

  if (options.addAxes) {
    scene.add(new THREE.AxesHelper(options.axesSize ?? 2));
  }

  if (options.addGrid) {
    const grid = new THREE.GridHelper(
      options.gridSize ?? 10,
      options.gridDivisions ?? 10,
      0x888888,
      0x444444,
    );
    grid.position.y = 0.001;
    scene.add(grid);
  }

  return scene;
}

/**
 * 创建透视相机。
 * @param params {
 * fov - 视野角度，默认为 45 度。
 * aspect - 画布的宽高比，通常为容器的宽度除以高度。
 * near - 近裁剪面距离，默认为 0.1。
 * far - 远裁剪面距离，默认为 1000。
 * position - 相机位置的数组 [x, y, z]，默认为 [0, 2.6, 4.5]。}
 * 
 * @returns 创建的透视相机实例。

 */
export function createPerspectiveCamera(params: {
  fov?: number;
  aspect?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
}): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    params.fov ?? 45,
    params.aspect,
    params.near ?? 0.1,
    params.far ?? 1000,
  );
  if (params.position) {
    camera.position.set(
      params.position[0],
      params.position[1],
      params.position[2],
    );
  }
  return camera;
}
