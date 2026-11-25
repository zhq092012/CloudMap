/**
 * 云脑智能面板（RightPanel）各区块的 Mock 数据与类型定义。
 * 后续接入真实 API 时，可在此文件旁新增 adapter 或改为从 composable 拉取。
 */

/** 潜在异常研判：指标摘要 */
export interface PotentialAnomalyMetrics {
  /** 近 24 小时新增待研判数量 */
  newIn24h: number;
  /** 战例相似度（百分比展示） */
  caseSimilarityPct: number;
  /** 全部确认影响条数 */
  confirmedImpactCount: number;
}

/** 潜在异常研判：置顶高亮条目 */
export interface PotentialAnomalyFeatured {
  id: string;
  title: string;
  deviation: number;
  durationDays: number;
  indicatorHits: number;
  confidencePct: number;
}

/** 潜在异常研判：待研判列表项 */
export interface PotentialAnomalyTopItem {
  id: string;
  title: string;
  category: string;
  durationDays: number;
  location: string;
  score: number;
}

/** 潜在异常研判区块数据 */
export interface PotentialAnomalyPanelData {
  pendingCount: number;
  featured: PotentialAnomalyFeatured;
  metrics: PotentialAnomalyMetrics;
  topItems: PotentialAnomalyTopItem[];
  /** 未列入 Top 3 的其余待研判数量 */
  morePendingCount: number;
}

/** 能力维度对比：单侧分数 */
export interface CapabilityDimensionScore {
  /** 维度名称，如「侦察监视」 */
  name: string;
  blue: number;
  red: number;
  /** 蓝相对红的差值（正为蓝方领先） */
  delta: number;
  /** 趋势方向，用于展示箭头与颜色 */
  trend: "up" | "down" | "flat";
}

/** 能力变化历史快照时间点 */
export interface CapabilitySnapshot {
  id: string;
  label: string;
  /** 是否为当前选中快照 */
  isCurrent?: boolean;
}

/** 能力变化区块数据 */
export interface CapabilityChangePanelData {
  /** 默认展示维度（通常等于最新快照） */
  dimensions: CapabilityDimensionScore[];
  snapshots: CapabilitySnapshot[];
  /** 各历史快照下的维度得分，键为 snapshot.id */
  dimensionsBySnapshot: Record<string, CapabilityDimensionScore[]>;
}

const clampScore = (n: number, min = 42, max = 98) => Math.min(max, Math.max(min, Math.round(n)));

/**
 * 根据最新快照维度 Mock 生成近 N 次历史快照数据（越早整体能力略低，带小幅波动）。
 * @param terminal - 最新快照维度
 * @param snapshots - 时间轴快照列表（按时间升序）
 */
export const buildCapabilityDimensionsBySnapshot = (
  terminal: CapabilityDimensionScore[],
  snapshots: CapabilitySnapshot[],
): Record<string, CapabilityDimensionScore[]> => {
  const out: Record<string, CapabilityDimensionScore[]> = {};
  const last = snapshots.length - 1;
  snapshots.forEach((snap, index) => {
    if (index === last) {
      out[snap.id] = terminal.map((row) => ({ ...row }));
      return;
    }
    const progress = last <= 0 ? 1 : index / last;
    out[snap.id] = terminal.map((row, dimIdx) => {
      const regress = (1 - progress) * (5 + (dimIdx % 4) * 1.5);
      const blueNoise = Math.sin(index * 0.85 + dimIdx * 0.6) * 2.5;
      const redNoise = Math.cos(index * 0.65 + dimIdx * 0.45) * 2.2;
      const blue = clampScore(row.blue - regress + blueNoise);
      const red = clampScore(row.red - regress * 0.9 + redNoise);
      const gap = blue - red;
      const delta = Math.abs(gap);
      let trend: CapabilityDimensionScore["trend"] = "flat";
      if (gap > 2) trend = "up";
      else if (gap < -2) trend = "down";
      return { name: row.name, blue, red, delta, trend };
    });
  });
  return out;
};

/** 态势报告卡片元数据 */
export interface SituationReportPanelData {
  reportId: string;
  title: string;
  generatedAt: string;
  author: string;
  coverage: string;
  period: string;
  confidencePct: number;
  recommendationTotal: number;
  recommendationPending: number;
  summary: string;
}

/** 重点关注条目严重等级 */
export type KeyFocusSeverity = "urgent" | "high" | "medium" | "low";

/** 重点关注列表项 */
export interface KeyFocusItem {
  id: string;
  icon: string;
  title: string;
  time: string;
  sourceLine: string;
  severity: KeyFocusSeverity;
  tags: string[];
  /** 是否已加入研判篮 */
  inBasket?: boolean;
}

/** 重点关注区块数据 */
export interface KeyFocusPanelData {
  items: KeyFocusItem[];
}

/** 云脑智能面板 Mock 聚合 */
export interface CloudBrainPanelMock {
  potentialAnomaly: PotentialAnomalyPanelData;
  capabilityChange: CapabilityChangePanelData;
  situationReport: SituationReportPanelData;
  keyFocus: KeyFocusPanelData;
}

/** 默认 Mock：与设计稿示例一致 */
export const cloudBrainPanelMock: CloudBrainPanelMock = {
  potentialAnomaly: {
    pendingCount: 5,
    featured: {
      id: "PA-20261021-006",
      title: "霍尔木兹海峡货轮 AIS 静默",
      deviation: 74,
      durationDays: 3,
      indicatorHits: 6,
      confidencePct: 76,
    },
    metrics: {
      newIn24h: 5,
      caseSimilarityPct: 79,
      confirmedImpactCount: 6,
    },
    topItems: [
      {
        id: "top-1",
        title: "伊朗东北部地面部队集结",
        category: "调动",
        durationDays: 4,
        location: "马什哈德",
        score: 68,
      },
      {
        id: "top-2",
        title: "西海岸雷达站电子干扰增强",
        category: "电子",
        durationDays: 5,
        location: "布什尔",
        score: 63,
      },
      {
        id: "top-3",
        title: "纳坦兹化工区夜间用电异常",
        category: "后勤",
        durationDays: 2,
        location: "纳坦兹",
        score: 61,
      },
    ],
    morePendingCount: 0,
  },
  capabilityChange: (() => {
    const snapshots: CapabilitySnapshot[] = [
      { id: "snap-1", label: "09-28" },
      { id: "snap-2", label: "10-05" },
      { id: "snap-3", label: "10-12" },
      { id: "snap-4", label: "10-14" },
      { id: "snap-5", label: "10-18" },
      { id: "snap-6", label: "10-20" },
      { id: "snap-7", label: "10-21", isCurrent: true },
    ];
    const dimensions: CapabilityDimensionScore[] = [
      { name: "侦察监视", blue: 88, red: 76, delta: 12, trend: "up" },
      { name: "精确打击", blue: 82, red: 79, delta: 3, trend: "flat" },
      { name: "防空反导", blue: 74, red: 71, delta: 3, trend: "flat" },
      { name: "电子战", blue: 81, red: 72, delta: 9, trend: "up" },
      { name: "弹药保障", blue: 63, red: 65, delta: 2, trend: "flat" },
      { name: "机动投送", blue: 77, red: 73, delta: 4, trend: "up" },
      { name: "持续保障", blue: 58, red: 63, delta: 5, trend: "down" },
      { name: "指挥控制", blue: 86, red: 85, delta: 1, trend: "flat" },
    ];
  return {
      dimensions,
      snapshots,
      dimensionsBySnapshot: buildCapabilityDimensionsBySnapshot(dimensions, snapshots),
    };
  })(),
  situationReport: {
    reportId: "RPT-20261021-1430",
    title: "10-21 14:30 中东战区综合态势报告",
    generatedAt: "10-21 14:30",
    author: "云脑·态势生成",
    coverage: "中东战区 · 扎哈尔 / 阿巴斯港 / 霍尔木兹",
    period: "10-15 ~ 10-21",
    confidencePct: 86,
    recommendationTotal: 6,
    recommendationPending: 6,
    summary:
      "扎哈尔方向 ISR 侦察强度连续 6 日上升，7 项行为指标越限，建议提升该区监视等级并优先研判 2 项高偏离潜在异常。",
  },
  keyFocus: {
    items: [
      {
        id: "kf-1",
        icon: "⚔",
        title: "扎哈尔外围空域对峙",
        time: "14:22",
        sourceLine: "来源：冲突升级 · 红方 2 架次战斗机进入争议空域",
        severity: "urgent",
        tags: ["升级", "中东·扎哈尔"],
        inBasket: true,
      },
      {
        id: "kf-2",
        icon: "⬡",
        title: "新确认异常",
        time: "09:40",
        sourceLine: "来源：异常 ANO-20261021-003 · 已确认",
        severity: "urgent",
        tags: ["关联异常 2 项"],
        inBasket: true,
      },
      {
        id: "kf-3",
        icon: "△",
        title: "岸基防空前推部署",
        time: "13:50",
        sourceLine: "来源：威胁评估 · 新增 2 套 S-300 阵地",
        severity: "high",
        tags: ["中东·阿巴斯港"],
      },
      {
        id: "kf-4",
        icon: "🔥",
        title: "扎哈尔热点升温",
        time: "11:20",
        sourceLine: "来源：热点追踪 · 热力值 94（+12）",
        severity: "high",
        tags: ["扎哈尔"],
      },
      {
        id: "kf-5",
        icon: "◎",
        title: "高可信情报待核实",
        time: "12:35",
        sourceLine: "来源：情报 HUM-012 · 待现场核实",
        severity: "medium",
        tags: ["核实"],
      },
      {
        id: "kf-6",
        icon: "✕",
        title: "日态势报告已生成",
        time: "08:00",
        sourceLine: "来源：报告 RPT-20261021-0800",
        severity: "low",
        tags: ["报告"],
      },
    ],
  },
};