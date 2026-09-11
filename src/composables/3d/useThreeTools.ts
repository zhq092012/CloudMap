import { onBeforeUnmount, shallowRef } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  createRenderer,
  createSceneWithHelpers,
  createPerspectiveCamera,
  setupOrbitControls,
  resizeRendererToDisplaySize,
  createRafLoop,
  disposeObject3DTree,
} from "@/utils/3d/three";
import type { CreateRendererOptions } from "@/utils/3d/three/renderer";
import type { WebGPURenderer } from "three/webgpu";

type SupportedRenderer = THREE.WebGLRenderer | WebGPURenderer;
type ThreeToolsInitResult = {
  renderer: SupportedRenderer;
  scene: THREE.Scene;
  scene2?: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  ready: Promise<void>;
};

type UseThreeToolsInitParams = {
  container: HTMLElement;
  rendererType?: CreateRendererOptions["rendererType"];
  rendererOptions?: Omit<CreateRendererOptions, "rendererType">;
  sceneOptions?: Parameters<typeof createSceneWithHelpers>[0];
  cameraOptions?: Parameters<typeof createPerspectiveCamera>[0];
  controlsOptions?: Parameters<typeof setupOrbitControls>[2];
};
/**
 * 提供用于初始化和管理 Three.js 场景、相机、渲染器和控制器的工具函数。
 * @returns 包含初始化、渲染循环和销毁函数的对象。
 */
export function useThreeTools() {
  const renderer = shallowRef<SupportedRenderer | null>(null);
  const scene = shallowRef<THREE.Scene | null>(null);
  const scene2 = shallowRef<THREE.Scene | null>(null);
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null);
  const controls = shallowRef<OrbitControls | null>(null);
  const container = shallowRef<HTMLElement | null>(null);

  let stopLoop: (() => void) | null = null;
  let resizeHandler: (() => void) | null = null;

  function init(params: UseThreeToolsInitParams): ThreeToolsInitResult {
    container.value = params.container;

    // 创建场景
    scene.value = createSceneWithHelpers(params.sceneOptions);
    scene2.value = createSceneWithHelpers(params.sceneOptions);

    //创建相机
    camera.value = createPerspectiveCamera({
      aspect:
        params.container.clientWidth /
        Math.max(1, params.container.clientHeight),
      near: params.cameraOptions?.near ?? 0.1,
      far: params.cameraOptions?.far ?? 1000,
      position: params.cameraOptions?.position ?? [0, 2.6, 4.5],
    });

    //创建渲染器
    renderer.value = createRenderer({
      rendererType: params.rendererType ?? "webgl",
      ...(params.rendererOptions ?? {}),
    });
    // 将渲染器的 DOM 元素添加到容器中
    params.container.appendChild(renderer.value.domElement);

    // 设置轨道控制器
    controls.value = setupOrbitControls(
      camera.value,
      renderer.value.domElement,
      params.controlsOptions,
    );

    // 监听窗口大小变化以调整渲染器和相机
    const onResize = () => {
      if (!renderer.value || !camera.value || !container.value) return;
      resizeRendererToDisplaySize(
        renderer.value,
        camera.value,
        container.value,
      );
    };

    // 如果使用 WebGPU 渲染器，等待其初始化完成后再调整大小
    let ready = Promise.resolve();
    if (params.rendererType === "webgpu") {
      ready = (renderer.value as WebGPURenderer).init().then(() => {
        onResize();
      });
    } else {
      onResize();
    }
    // 保存 resize 事件处理函数以便后续移除
    resizeHandler = onResize;
    window.addEventListener("resize", onResize);

    return {
      renderer: renderer.value,
      scene: scene.value,
      scene2: scene2.value,
      camera: camera.value,
      controls: controls.value,
      ready,
    };
  }

  function startRenderLoop(
    renderFn: (deltaSec: number, elapsedSec: number) => void,
  ) {
    const loop = createRafLoop((delta, elapsed) => {
      renderFn(delta, elapsed);
    });
    stopLoop = loop.stop;
    loop.start();
    return loop;
  }

  /**
   * 销毁 Three.js 相关资源并清理 DOM 元素。
   */
  function destroy() {
    // 停止渲染循环
    stopLoop?.();
    stopLoop = null;

    // 移除窗口 resize 事件监听器
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    // 销毁控制器
    controls.value?.dispose();

    // 销毁场景中的所有对象
    if (scene.value) {
      disposeObject3DTree(scene.value);
    }
    if (scene2.value) {
      disposeObject3DTree(scene2.value);
    }
    // 销毁渲染器并移除其 DOM 元素
    renderer.value?.dispose();
    // 从 DOM 中移除渲染器的 canvas 元素
    if (renderer.value?.domElement.parentElement) {
      renderer.value.domElement.parentElement.removeChild(
        renderer.value.domElement,
      );
    }
    // 清空引用
    renderer.value = null;
    scene.value = null;
    scene2.value = null;
    camera.value = null;
    controls.value = null;
    container.value = null;
  }

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    init,
    startRenderLoop,
    destroy,
  };
}
