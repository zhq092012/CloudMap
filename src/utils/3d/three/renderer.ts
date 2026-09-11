import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";

export interface ViewportRenderer {
  domElement: HTMLCanvasElement;
  setSize(width: number, height: number, updateStyle?: boolean): void;
}

export interface ViewportCamera {
  aspect: number;
  updateProjectionMatrix(): void;
}

export interface CreateRendererOptions {
  rendererType?: "webgl" | "webgpu";
  /**
   * 是否启用抗锯齿，默认为 true。
   */
  antialias?: boolean;
  /**
   * 是否启用 alpha 通道，默认为 false，通常在需要透明背景时设置为 true。
   */
  alpha?: boolean;
  /**
   * 设备像素比上限，常见值 2。
   */
  pixelRatioCap?: number;

  /**
   * 是否开启阴影贴图，默认为 false。
   */
  shadows?: boolean;
}

/**
 * 创建 Three 渲染器并配置常用参数。
 */
export function createRenderer(
  options: CreateRendererOptions = {},
): THREE.WebGLRenderer | WebGPURenderer {
  const RendererCtor =
    options.rendererType === "webgpu" ? WebGPURenderer : THREE.WebGLRenderer;

  const renderer = new RendererCtor({
    antialias: options.antialias ?? true,
    alpha: options.alpha ?? false,
  });

  if (options.shadows) {
    renderer.shadowMap.enabled = true;
  }

  setRendererQuality(renderer, options.pixelRatioCap ?? 2);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

/**
 * 统一设置渲染质量。
 */
export function setRendererQuality(
  renderer: { setPixelRatio(pixelRatio: number): void },
  pixelRatioCap = 2,
): void {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
}

/**
 * 根据容器大小更新渲染器与摄像机。
 *
 * @returns 是否发生了实际尺寸变化。
 */
export function resizeRendererToDisplaySize(
  renderer: ViewportRenderer,
  camera: ViewportCamera,
  container: HTMLElement,
): boolean {
  const width = container.clientWidth;
  const height = Math.max(1, container.clientHeight);

  const changed =
    renderer.domElement.width !== width ||
    renderer.domElement.height !== height;
  if (!changed) {
    return false;
  }

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  return true;
}
