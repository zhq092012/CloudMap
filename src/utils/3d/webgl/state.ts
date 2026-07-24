/**
 * 轻量 WebGL 状态缓存。
 *
 * 作用：减少重复 `enable/disable` 调用，避免不必要的状态抖动。
 * 注意：它不是完整状态机，只覆盖常见开关。
 */
export function createWebGLStateCache(gl: WebGLRenderingContext | WebGL2RenderingContext) {
  let blendEnabled: boolean | null = null;
  let depthTestEnabled: boolean | null = null;
  let cullFaceEnabled: boolean | null = null;

  return {
    setBlend(enabled: boolean) {
      if (blendEnabled === enabled) return;
      blendEnabled = enabled;
      if (enabled) gl.enable(gl.BLEND);
      else gl.disable(gl.BLEND);
    },
    setDepthTest(enabled: boolean) {
      if (depthTestEnabled === enabled) return;
      depthTestEnabled = enabled;
      if (enabled) gl.enable(gl.DEPTH_TEST);
      else gl.disable(gl.DEPTH_TEST);
    },
    setCullFace(enabled: boolean) {
      if (cullFaceEnabled === enabled) return;
      cullFaceEnabled = enabled;
      if (enabled) gl.enable(gl.CULL_FACE);
      else gl.disable(gl.CULL_FACE);
    },
    resetCache() {
      blendEnabled = null;
      depthTestEnabled = null;
      cullFaceEnabled = null;
    },
  };
}
