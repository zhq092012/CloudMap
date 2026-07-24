export interface WebGLCapabilities {
  isWebGL2: boolean;
  version: string;
  renderer: string;
  vendor: string;
  extensions: string[];
}

/**
 * 检测 WebGL 上下文。
 */
export function detectWebGLContext(canvas: HTMLCanvasElement): WebGL2RenderingContext | WebGLRenderingContext | null {
  const gl2 = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
  const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
  const experimental = canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
  return gl2 || gl || experimental;
}

/**
 * 获取扩展列表。
 */
export function getWebGLExtensions(gl: WebGLRenderingContext | WebGL2RenderingContext): string[] {
  return gl.getSupportedExtensions() ?? [];
}

/**
 * 获取常见能力信息。
 */
export function getWebGLCapabilities(gl: WebGLRenderingContext | WebGL2RenderingContext): WebGLCapabilities {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? "unknown") : "unknown";
  const vendor = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? "unknown") : "unknown";

  return {
    isWebGL2: typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext,
    version: String(gl.getParameter(gl.VERSION) ?? "unknown"),
    renderer,
    vendor,
    extensions: getWebGLExtensions(gl),
  };
}

/**
 * 断言浏览器支持 WebGL2。
 */
export function assertWebGL2Support(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const context = canvas.getContext("webgl2");
  if (!context) {
    throw new Error("当前环境不支持 WebGL2，请升级浏览器或驱动。");
  }
  return context;
}
