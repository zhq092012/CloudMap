import { onBeforeUnmount, shallowRef } from "vue";
import * as Cesium from "cesium";
import { createViewer, safeDestroyViewer, loadTileset, offsetTilesetHeight, focusTileset } from "@/utils/3d/cesium";

export function useCesiumTools() {
  const viewer = shallowRef<Cesium.Viewer | null>(null);
  const tileset = shallowRef<Cesium.Cesium3DTileset | null>(null);
  const baseTilesetModelMatrix = shallowRef<Cesium.Matrix4 | null>(null);

  function initViewer(options: { container: string | HTMLElement; viewerOptions?: Partial<Cesium.Viewer.ConstructorOptions>; ionToken?: string }) {
    if (viewer.value && !viewer.value.isDestroyed()) {
      return viewer.value;
    }
    viewer.value = createViewer(options);
    return viewer.value;
  }
  /**
   * 添加3D Tiles模型到场景中
   * @param url 模型的URL
   * @param maximumScreenSpaceError 最大屏幕空间误差
   * @returns 加载的3D Tiles模型
   */
  async function addTileset(url: string, maximumScreenSpaceError = 16) {
    if (!viewer.value) {
      throw new Error("Viewer 尚未初始化，无法加载 tileset。");
    }
    const nextTileset = await loadTileset({ url, maximumScreenSpaceError });
    viewer.value.scene.primitives.add(nextTileset);
    tileset.value = nextTileset;
    baseTilesetModelMatrix.value = Cesium.Matrix4.clone(nextTileset.modelMatrix, new Cesium.Matrix4());
    return nextTileset;
  }
  /**
   * 设置3D Tiles模型的高度偏移
   * @param anchorLon 模型的经度中心
   * @param anchorLat 模型的纬度中心
   * @param height 高度偏移值，单位为米
   * @returns
   */
  function setTilesetHeight(anchorLon: number, anchorLat: number, height: number) {
    if (!tileset.value) {
      return null;
    }
    return offsetTilesetHeight({
      tileset: tileset.value,
      baseModelMatrix: baseTilesetModelMatrix.value ?? undefined,
      anchorLon,
      anchorLat,
      height,
    });
  }

  function focusCurrentTileset(options?: { heading?: number; pitch?: number; rangeScale?: number; duration?: number }) {
    if (!viewer.value || !tileset.value) {
      return Promise.resolve();
    }
    return focusTileset(viewer.value, tileset.value, options);
  }

  function destroy() {
    safeDestroyViewer(viewer.value);
    viewer.value = null;
    tileset.value = null;
    baseTilesetModelMatrix.value = null;
  }

  onBeforeUnmount(() => {
    destroy();
  });

  return {
    viewer,
    tileset,
    baseTilesetModelMatrix,
    initViewer,
    addTileset,
    setTilesetHeight,
    focusCurrentTileset,
    destroy,
  };
}
