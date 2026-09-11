/**
 * 通用可释放资源接口。
 *
 * 约定：所有创建“外部资源”（如 WebGL 上下文对象、事件监听、RAF 循环）的工具，
 * 都应尽量提供 `dispose` 能力，便于页面切换时统一清理，避免内存泄漏。
 */
export interface Disposable {
  dispose: () => void;
}

/**
 * 可选清理函数类型。
 *
 * 用于那些“可能需要清理、也可能无需清理”的返回结构，
 * 例如：某些桥接同步在关闭开关时不注册任何监听器，此时无需 disposer。
 */
export type MaybeDispose = (() => void) | undefined;

/**
 * 标准经纬高结构。
 *
 * - 经度 `lon`：角度制，范围通常为 [-180, 180]
 * - 纬度 `lat`：角度制，范围通常为 [-90, 90]
 * - 高程 `height`：单位米，参考 WGS84 椭球面
 */
export interface LngLatHeight {
  lon: number;
  lat: number;
  height: number;
}

/**
 * 标准成功/失败结果结构。
 *
 * 工具层建议尽量“返回结果 + 错误信息”，而不是无条件抛异常，
 * 这样上层页面可以按场景决定提示方式（toast、日志或忽略）。
 */
export interface ToolResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}
