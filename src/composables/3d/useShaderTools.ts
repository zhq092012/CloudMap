import { createUniformStore } from "@/utils/3d/shader";

/**
 * Shader 通用组合式封装。
 *
 * 主要提供：
 * - 统一 uniform 仓库
 * - 时间推进（`uTime`）
 */
export function useShaderTools<T extends Record<string, { value: unknown }>>(initialUniforms: T) {
  const store = createUniformStore(initialUniforms);

  function tickTime(elapsedSec: number, key = "uTime") {
    const target = store.uniforms[key];
    if (!target) {
      return;
    }
    target.value = elapsedSec;
  }

  return {
    uniforms: store.uniforms,
    setUniformSafe: store.setUniformSafe,
    patchUniforms: store.patch,
    tickTime,
  };
}
