import * as THREE from "three";

export type UniformMap = Record<string, THREE.IUniform>;

/**
 * 创建可更新的 uniforms 仓库。
 *
 * 设计目标：
 * 1. 统一管理 uniform，避免散落在组件多个作用域。
 * 2. 提供安全写入，减少拼写错误导致的 silent failure。
 */
export function createUniformStore<T extends UniformMap>(initial: T) {
  const uniforms = initial;

  return {
    uniforms,
    setUniformSafe<K extends keyof T>(name: K, value: T[K]["value"]) {
      uniforms[name].value = value;
    },
    patch(values: Partial<Record<keyof T, unknown>>) {
      (Object.keys(values) as Array<keyof T>).forEach((key) => {
        if (!uniforms[key]) return;
        uniforms[key].value = values[key] as T[keyof T]["value"];
      });
    },
  };
}

/**
 * 同步相机位置到 uniforms。
 */
export function syncCameraUniforms(params: { camera: THREE.Camera; uniforms: UniformMap; cameraPositionKey?: string }): void {
  const key = params.cameraPositionKey ?? "uCameraPosition";
  const target = params.uniforms[key];
  if (!target) {
    return;
  }

  const camera = params.camera as THREE.PerspectiveCamera;
  if ((target.value as THREE.Vector3)?.copy) {
    (target.value as THREE.Vector3).copy(camera.position);
  }
}
