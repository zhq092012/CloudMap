import * as THREE from "three";

/**
 * 深度释放材质，包括材质上的贴图引用。
 */
export function disposeMaterialDeep(material: THREE.Material): void {
  const candidate = material as unknown as Record<string, unknown>;
  Object.keys(candidate).forEach((key) => {
    const value = candidate[key];
    if (value && typeof value === "object" && "isTexture" in (value as object)) {
      (value as THREE.Texture).dispose();
    }
  });
  material.dispose();
}

/**
 * 释放对象树中的几何、材质、贴图。
 */
export function disposeObject3DTree(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach(disposeMaterialDeep);
    } else if (material) {
      disposeMaterialDeep(material);
    }
  });
}

/**
 * 仅释放纹理对象。
 */
export function disposeTextureIfAny(texture?: THREE.Texture | null): void {
  texture?.dispose();
}
