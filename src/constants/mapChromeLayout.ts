/** 地图页左/右侧栏展开宽度（与 CollapsibleSidePanel width 一致） */
export const MAP_SIDE_PANEL_LEFT_WIDTH = 360;
export const MAP_SIDE_PANEL_RIGHT_WIDTH = 380;
/** 侧栏与地图浮层控件之间的间隙 */
export const MAP_CHROME_GAP_PX = 12;
/** 侧栏收起后的窄条宽度 */
export const MAP_SIDE_RAIL_PX = 36;

/**
 * 根据左右侧栏收起状态生成地图浮层控件使用的 CSS 变量（挂在页面根节点）。
 * @param leftCollapsed - 左侧栏是否收起
 * @param rightCollapsed - 右侧栏是否收起
 */
export function mapChromeLayoutVars(
  leftCollapsed: boolean,
  rightCollapsed: boolean,
): Record<string, string> {
  const leftPx =
    (leftCollapsed ? MAP_SIDE_RAIL_PX : MAP_SIDE_PANEL_LEFT_WIDTH) + MAP_CHROME_GAP_PX;
  const rightPx =
    (rightCollapsed ? MAP_SIDE_RAIL_PX : MAP_SIDE_PANEL_RIGHT_WIDTH) + MAP_CHROME_GAP_PX;
  return {
    "--map-chrome-left": `${leftPx}px`,
    "--map-chrome-right": `${rightPx}px`,
  };
}