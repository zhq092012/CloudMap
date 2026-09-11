export interface RafLoop {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isRunning: () => boolean;
}

/**
 * 创建一个可暂停/恢复的 RAF 动画循环。
 */
export function createRafLoop(callback: (deltaSec: number, elapsedSec: number) => void): RafLoop {
  let rafId = 0;
  let running = false;
  let paused = false;
  let startTs = 0;
  let lastTs = 0;

  const tick = (ts: number) => {
    // 如果没有运行，直接返回
    if (!running) {
      return;
    }

    // 如果暂停了，更新 lastTs 以避免时间跳变
    if (paused) {
      lastTs = ts;
      rafId = requestAnimationFrame(tick); // 继续请求下一帧，但不调用回调函数
      return;
    }

    // 初始化 startTs 和 lastTs
    if (!startTs) {
      startTs = ts;
      lastTs = ts;
    }

    // 计算时间增量和总运行时间
    const deltaSec = (ts - lastTs) / 1000;
    // 注意：elapsedSec 是从 startTs 开始计算的总时间，而不是从上次 tick 计算的增量时间
    const elapsedSec = (ts - startTs) / 1000;
    // 更新 lastTs 为当前时间戳
    lastTs = ts;
    // 调用回调函数，传入增量时间和总运行时间
    callback(deltaSec, elapsedSec);
    // 请求下一帧
    rafId = requestAnimationFrame(tick);
  };

  return {
    // 启动动画循环
    start() {
      if (running) return;
      running = true;
      paused = false;
      startTs = 0;
      lastTs = 0;
      rafId = requestAnimationFrame(tick);
    },
    // 停止动画循环
    stop() {
      if (!running) return;
      running = false;
      paused = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
    },
    // 暂停动画循环
    pause() {
      paused = true;
    },
    // 恢复动画循环
    resume() {
      paused = false;
    },
    // 检查动画循环是否正在运行
    isRunning() {
      return running;
    },
  };
}
