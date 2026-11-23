/**
 * 地图底部「节点统计分类」浮层 Mock 数据与类型。
 */

/** 顶部分类统计（热点 / 冲突 / 情报） */
export interface MapNodeCategoryStat {
  /** 唯一键 */
  key: "hotspot" | "conflict" | "intel";
  /** 中文标题 */
  title: string;
  /** 英文副标题 */
  subtitle: string;
  /** 当前数量 */
  value: number;
  /** 24h 增量（展示为 +N） */
  delta: number;
  /** 底部彩色分段条颜色（从左到右） */
  barColors: string[];
}

/** 列表筛选 Tab */
export interface MapNodeFilterTab {
  id: string;
  label: string;
  count: number;
  /** 是否高亮选中 */
  active?: boolean;
}

/** 报告建议待办条 */
export interface MapNodeReportTodo {
  reportId: string;
  pendingCount: number;
  /** 示例建议文案 */
  suggestions: Array<{
    id: string;
    action: string;
    targetLabel: string;
  }>;
}

/** 列表行类型 */
export type MapNodeRowKind = "hotspot" | "conflict" | "intel";

/** 单条地图节点列表项 */
export interface MapNodeListItem {
  id: string;
  kind: MapNodeRowKind;
  icon: string;
  title: string;
  /** 副标题/描述 */
  subtitle?: string;
  /** 右侧主标签，如「94 热点」 */
  badge: string;
  /** 冲突类时间 */
  time?: string;
  /** 是否可选中（批量操作） */
  selectable?: boolean;
}

/** 聚合 Mock */
export interface MapNodeDockMock {
  categories: MapNodeCategoryStat[];
  filterTabs: MapNodeFilterTab[];
  reportTodo: MapNodeReportTodo;
  listItems: MapNodeListItem[];
  /** 列表总条数（与 Tab「全部」一致） */
  totalCount: number;
}

export const mapNodeDockMock: MapNodeDockMock = {
  categories: [
    {
      key: "hotspot",
      title: "热点追踪",
      subtitle: "HOTSPOT",
      value: 8,
      delta: 1,
      barColors: ["#f97316", "#eab308", "#22c55e", "#06b6d4"],
    },
    {
      key: "conflict",
      title: "冲突监控",
      subtitle: "CONFLICT",
      value: 12,
      delta: 3,
      barColors: ["#22c55e", "#14b8a6", "#3b82f6"],
    },
    {
      key: "intel",
      title: "情报聚合",
      subtitle: "INTEL",
      value: 156,
      delta: 24,
      barColors: ["#06b6d4", "#3b82f6", "#1d4ed8", "#7c3aed"],
    },
  ],
  filterTabs: [
    { id: "all", label: "全部", count: 42, active: true },
    { id: "high-risk", label: "高危", count: 7 },
    { id: "threat-high", label: "高威胁", count: 3 },
    { id: "threat-mid", label: "中威胁", count: 13 },
    { id: "threat-low", label: "低威胁", count: 7 },
    { id: "untreated", label: "未处置", count: 38 },
    { id: "24h", label: "近 24 小时", count: 14 },
  ],
  reportTodo: {
    reportId: "RPT-20261021-1430",
    pendingCount: 5,
    suggestions: [
      { id: "s1", action: "提升监视等级 MONITOR", targetLabel: "查看该条" },
      { id: "s2", action: "排除 EXCLUDE", targetLabel: "查看该条" },
    ],
  },
  totalCount: 42,
  listItems: [
    {
      id: "n1",
      kind: "hotspot",
      icon: "▣",
      title: "扎哈尔核设施",
      subtitle: "热力值 94 · 趋势 ↑ 上升",
      badge: "94 热点",
      selectable: true,
    },
    {
      id: "n2",
      kind: "hotspot",
      icon: "◉",
      title: "阿巴斯港",
      subtitle: "热力值 86 · 趋势 ↑ 上升",
      badge: "86 热点",
      selectable: true,
    },
    {
      id: "n3",
      kind: "conflict",
      icon: "⚡",
      title: "扎哈尔外围空域对峙",
      badge: "高 冲突",
      time: "14:22",
      selectable: true,
    },
    {
      id: "n4",
      kind: "conflict",
      icon: "⚡",
      title: "贾夫尔基地东侧交火",
      badge: "高 冲突",
      time: "13:05",
      selectable: true,
    },
    {
      id: "n5",
      kind: "intel",
      icon: "◇",
      title: "霍尔木兹航道商船异常聚集",
      subtitle: "来源：AIS · 置信 78%",
      badge: "情报",
      selectable: true,
    },
  ],
};

/** 底部 Dock 展开时占位高度（用于抬高右侧地图开关） */
export const MAP_NODE_DOCK_RESERVE_PX = 248;

/** 底部 Dock 收起时占位高度（仅顶部分类统计，ResizeObserver 未就绪时的回退值） */
export const MAP_NODE_DOCK_RESERVE_COLLAPSED_PX = 92;

/** Dock 顶沿与右侧图层开关之间的额外间距 */
export const MAP_NODE_DOCK_CLEARANCE_GAP_PX = 20;