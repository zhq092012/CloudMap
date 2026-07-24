import * as Cesium from "cesium";

export interface SyncClockTickOptions {
  viewer: Cesium.Viewer;
  onTick: (secondsDifference: number) => void;
}

/**
 * 用 Cesium Clock 驱动外部动画更新。
 *
 * 返回值为取消同步函数。
 */
export function syncClockTick(options: SyncClockTickOptions): () => void {
  const clock = options.viewer.clock;
  if (!clock) {
    return () => {
      // 在极端场景下 viewer 可能已被销毁，返回空清理函数保证调用安全。
    };
  }

  let disposed = false;
  let lastTime = clock.currentTime;
  const onTickEvent = clock.onTick;

  const handler = () => {
    // 清理后不再执行任何同步逻辑，避免竞态导致的异常访问。
    if (disposed) {
      return;
    }

    const current = clock.currentTime;
    const delta = Cesium.JulianDate.secondsDifference(current, lastTime);
    lastTime = current;
    options.onTick(Math.max(0, delta));
  };

  onTickEvent.addEventListener(handler);
  return () => {
    if (disposed) {
      return;
    }
    disposed = true;
    onTickEvent.removeEventListener(handler);
  };
}
