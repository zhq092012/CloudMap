import { onBeforeUnmount } from "vue";
import * as THREE from "three";
import { useCesiumTools } from "./useCesiumTools";
import { useThreeTools } from "./useThreeTools";
import { syncCameraFromCesium, syncClockTick } from "@/utils/3d/bridge";

/**
 * Cesium + Three 混合场景封装。
 *
 * 当前实现聚焦于“相机与时钟同步”的基础能力，
 * 为后续叠加 Three 特效（粒子、后处理等）预留接口。
 */
export function useHybridScene() {
  const cesium = useCesiumTools();
  const three = useThreeTools();

  let stopClockSync: (() => void) | null = null;

  function init(params: { cesiumContainer: HTMLElement; threeContainer: HTMLElement; cesiumViewerOptions?: Parameters<typeof cesium.initViewer>[0]["viewerOptions"] }) {
    const viewer = cesium.initViewer({
      container: params.cesiumContainer,
      viewerOptions: params.cesiumViewerOptions,
    });

    const threeRuntime = three.init({
      container: params.threeContainer,
      sceneOptions: {
        background: 0x000000,
      },
      cameraOptions: {
        position: [0, 0, 1],
      },
    });

    stopClockSync = syncClockTick({
      viewer,
      onTick: () => {
        if (!threeRuntime.camera) return;
        syncCameraFromCesium(viewer, threeRuntime.camera as THREE.PerspectiveCamera);
      },
    });

    return {
      viewer,
      ...threeRuntime,
    };
  }

  function destroy() {
    stopClockSync?.();
    stopClockSync = null;
    three.destroy();
    cesium.destroy();
  }

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    cesium,
    three,
    init,
    destroy,
  };
}
