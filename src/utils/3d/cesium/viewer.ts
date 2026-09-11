import * as Cesium from "cesium";

export interface CreateViewerOptions {
  /**
   * Viewer 容器，支持 CSS 选择器或 DOM 元素。
   */
  container: string | HTMLElement;
  /**
   * Viewer 配置覆盖项。
   */
  viewerOptions?: Partial<Cesium.Viewer.ConstructorOptions>;
}

/**
 * 推荐的 Viewer 默认配置。
 *
 * 设计思路参考 Cesium 官方 Sandcastle 常见模板：
 * 默认关闭多数 UI 控件，保留纯场景渲染能力，便于业务层按需开启。
 */
export const DEFAULT_VIEWER_OPTIONS: Cesium.Viewer.ConstructorOptions = {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  navigationHelpButton: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  scene3DOnly: true,
  shouldAnimate: true,
};

function resolveContainer(container: string | HTMLElement): HTMLElement {
  if (typeof container === "string") {
    const element = document.querySelector<HTMLElement>(container);
    if (!element) {
      throw new Error(`Cesium 容器不存在: ${container}`);
    }
    return element;
  }

  return container;
}

/**
 * 创建 Cesium Viewer。
 *
 * @throws 当容器不存在时抛出异常。
 */
export function createViewer(options: CreateViewerOptions): Cesium.Viewer {
  const container = resolveContainer(options.container);
  const MATERIAL_URL = import.meta.env.VITE_CESIUM_MATERIAL_URL;

  const viewer = new Cesium.Viewer(container, {
    ...DEFAULT_VIEWER_OPTIONS,
    ...options.viewerOptions,
  });
  if (options.viewerOptions?.baseLayer === false) {
    // 设置默认图层
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: `${MATERIAL_URL}/{z}/{x}/{y}.png`, // 瓦片 URL 模板
        credit: "credit", // 版权信息
      }),
    );
  }

  return viewer;
}

/**
 * 安全销毁 Viewer。
 *
 * 说明：Cesium 的 `destroy()` 在重复调用时会报错，
 * 因此这里做幂等保护，确保重复调用也安全。
 */
export function safeDestroyViewer(
  viewer: Cesium.Viewer | null | undefined,
): void {
  if (!viewer || viewer.isDestroyed()) {
    return;
  }
  viewer.destroy();
}

/**
 * 合并默认 viewer 配置，供上层在“先计算配置再初始化”时使用。
 */
export function setViewerDefaultOptions(
  viewerOptions?: Partial<Cesium.Viewer.ConstructorOptions>,
): Cesium.Viewer.ConstructorOptions {
  return {
    ...DEFAULT_VIEWER_OPTIONS,
    ...(viewerOptions ?? {}),
  };
}
