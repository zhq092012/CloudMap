import { onBeforeUnmount, ref } from "vue";
import type {
  ViewportCamera,
  ViewportRenderer,
} from "@/utils/3d/three/renderer";
import { resizeRendererToDisplaySize } from "@/utils/3d/three/renderer";

type OverlayCorner = "top-left" | "top-right";

type MountOverlayOptions = {
  corner?: OverlayCorner;
  offset?: number;
  zIndex?: number;
};

export function useThreeViewport() {
  const containerRef = ref<HTMLElement | null>(null);

  const mountedElements = new Set<HTMLElement>();
  let resizeObserver: ResizeObserver | null = null;

  function getContainer() {
    return containerRef.value;
  }

  function appendRenderer(renderer: ViewportRenderer) {
    const container = getContainer();
    if (!container) return;

    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);
  }

  function mountOverlay(
    element: HTMLElement,
    options: MountOverlayOptions = {},
  ) {
    const container = getContainer();
    if (!container) return;

    const offset = options.offset ?? 12;
    const corner = options.corner ?? "top-left";

    element.style.position = "absolute";
    element.style.top = `${offset}px`;
    element.style.left = corner === "top-left" ? `${offset}px` : "auto";
    element.style.right = corner === "top-right" ? `${offset}px` : "auto";
    element.style.zIndex = String(options.zIndex ?? 20);

    container.appendChild(element);
    mountedElements.add(element);
  }

  function observeRenderer(renderer: ViewportRenderer, camera: ViewportCamera) {
    const container = getContainer();
    if (!container) return () => {};

    const resize = () => {
      resizeRendererToDisplaySize(renderer, camera, container);
    };

    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    return () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
    };
  }

  function cleanupMountedElements() {
    mountedElements.forEach((element) => {
      if (element.parentElement) {
        element.parentElement.removeChild(element);
      }
    });
    mountedElements.clear();
  }

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    cleanupMountedElements();
  });

  return {
    containerRef,
    appendRenderer,
    mountOverlay,
    observeRenderer,
    cleanupMountedElements,
  };
}
