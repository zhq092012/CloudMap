import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export interface OrbitControlOptions {
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  maxPolarAngle?: number;
  target?: [number, number, number];
}

/**
 * 统一初始化 OrbitControls。
 */
export function setupOrbitControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
  options: OrbitControlOptions = {},
): OrbitControls {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = options.enableDamping ?? true; // 默认启用阻尼以获得更平滑的交互体验
  controls.dampingFactor = options.dampingFactor ?? 0.08; // 默认阻尼系数，数值越大阻尼效果越明显
  controls.minDistance = options.minDistance ?? 100; // 默认最小距离，防止相机过于靠近目标
  controls.maxDistance = options.maxDistance ?? 1000; // 默认最大距离，防止相机过于远离目标
  controls.maxPolarAngle = options.maxPolarAngle ?? Math.PI * 0.49; // 默认最大极角，防止相机翻转
  controls.target.set(...(options.target ?? [0, 1, 0])); // 默认目标位置，通常设置在场景中心略高的位置
  return controls;
}
