/**
 * 地图资源图标图例（Mock / 说明文案）。
 */

/** 单条图例项 */
export interface MapResourceLegendItem {
  id: string;
  /** 展示用符号，如 ▲ ■ */
  symbol: string;
  label: string;
  /** 符号颜色 class 后缀 */
  tone?: "default" | "warn" | "orange";
}

export const mapResourceLegendItems: MapResourceLegendItem[] = [
  { id: "facility", symbol: "▲", label: "设施", tone: "default" },
  { id: "equipment", symbol: "■", label: "装备", tone: "default" },
  { id: "troop", symbol: "◆", label: "部队", tone: "default" },
  { id: "society", symbol: "⬡", label: "社会", tone: "default" },
  { id: "intel", symbol: "○", label: "情报", tone: "default" },
  { id: "potential", symbol: "▲", label: "潜在异常", tone: "warn" },
  { id: "anomaly", symbol: "◆", label: "异常 / 异常簇", tone: "orange" },
];