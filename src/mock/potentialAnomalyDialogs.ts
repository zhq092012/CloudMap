/**
 * 潜在异常详情 / 完整列表弹窗 Mock 数据（云脑面板）。
 */

/** 行为基线对比表行 */
export interface PotentialAnomalyBaselineRow {
  /** 指标名称 */
  indicator: string;
  /** 当前值 */
  current: string;
  /** 基线值 */
  baseline: string;
  /** 偏离百分比展示文案 */
  deviationPct: string;
  /** Z 分数 */
  zScore: string;
  /** 状态标签，如「异常」 */
  status: string;
}

/** 历史匹配表行 */
export interface PotentialAnomalyHistoryMatchRow {
  caseId: string;
  caseName: string;
  time: string;
  similarity: string;
  commonFeatures: string;
}

/** 事件时间线行 */
export interface PotentialAnomalyTimelineRow {
  time: string;
  event: string;
  source: string;
}

/** 详情弹窗完整数据 */
export interface PotentialAnomalyDetail {
  id: string;
  title: string;
  deviation: number;
  confidencePct: number;
  durationDays: number;
  region: string;
  indicatorHits: number;
  typeLabel: string;
  regionDetail: string;
  firstSeen: string;
  lastActive: string;
  statusLabel: string;
  relatedEntities: string;
  sourceIntel: string;
  summary: string;
  baselineRows: PotentialAnomalyBaselineRow[];
  historyRows: PotentialAnomalyHistoryMatchRow[];
  timelineRows: PotentialAnomalyTimelineRow[];
  relatedAnomalies: string;
  relatedReports: string;
  impactNote: string;
}

/** 完整列表行 */
export interface PotentialAnomalyListRow {
  id: string;
  title: string;
  typeLabel: string;
  region: string;
  deviation: number;
  confidencePct: number;
  durationDays: number;
}

const hormuzDetail: PotentialAnomalyDetail = {
  id: "PA-20261021-006",
  title: "霍尔木兹海峡货轮 AIS 静默",
  deviation: 74,
  confidencePct: 76,
  durationDays: 3,
  region: "霍尔木兹海峡",
  indicatorHits: 6,
  typeLabel: "通信",
  regionDetail: "霍尔木兹海峡（半径 68km）",
  firstSeen: "10-19 05:50",
  lastActive: "10-21 12:40",
  statusLabel: "待研判",
  relatedEntities: "EQ-SHIP-207、FAC-PORT-012",
  sourceIntel: "AIS-003、OSINT-061",
  summary:
    "该异常于 10-19 首次标注，基于航线—识别信号联合基线模型命中 6 项指标。综合电子侦察与开源影像，历史战例相似度约 79%，仍需人工确认后方可归类为已确认异常。",
  baselineRows: [
    {
      indicator: "AIS 广播间隔",
      current: "0次/4h",
      baseline: "48次/4h",
      deviationPct: "+633%",
      zScore: "4.8",
      status: "异常",
    },
    {
      indicator: "航速方差",
      current: "0.02",
      baseline: "1.24",
      deviationPct: "+1500%",
      zScore: "5.1",
      status: "异常",
    },
    {
      indicator: "锚地停留时长",
      current: "38h",
      baseline: "6h",
      deviationPct: "+533%",
      zScore: "3.9",
      status: "异常",
    },
    {
      indicator: "伴随护航密度",
      current: "低",
      baseline: "中",
      deviationPct: "+120%",
      zScore: "2.7",
      status: "异常",
    },
  ],
  historyRows: [
    {
      caseId: "CASE-2019-041",
      caseName: "阿曼湾商船失联",
      time: "2019-08",
      similarity: "81%",
      commonFeatures: "AIS静默+异常锚泊",
    },
    {
      caseId: "CASE-2023-112",
      caseName: "霍尔木兹夜间封航",
      time: "2023-11",
      similarity: "76%",
      commonFeatures: "航道封锁前兆",
    },
  ],
  timelineRows: [
    { time: "10-19 05:50", event: "AIS 信号连续缺失超阈", source: "AIS-003" },
    { time: "10-19 18:20", event: "卫星影像显示非常规停泊", source: "SAT-IMINT-21" },
    { time: "10-20 09:05", event: "周边舰艇密度上升", source: "OSINT-061" },
    { time: "10-21 12:40", event: "静默状态持续，偏离度升至 74", source: "云脑基线引擎" },
  ],
  relatedAnomalies: "无",
  relatedReports: "RPT-20261021-1430",
  impactNote: "若确认，将影响 2 个实体关联监测任务，并提升该区域护航优先级。",
};

/** 其余条目沿用主体字段，复用同结构简版详情 */
const detailVariants: Record<string, Partial<PotentialAnomalyDetail>> = {
  "PA-20261021-009": {
    id: "PA-20261021-009",
    title: "伊朗东北部地面部队集结",
    deviation: 68,
    confidencePct: 71,
    durationDays: 4,
    region: "马什哈德",
    typeLabel: "调动",
    regionDetail: "马什哈德战区（半径 52km）",
    indicatorHits: 5,
    summary: "多源机动迹象与后勤保障波动同时越线，需与战例库 CASE-2022-087 对照研判。",
  },
  "PA-20261021-015": {
    id: "PA-20261021-015",
    title: "西海岸雷达站电子干扰增强",
    deviation: 63,
    confidencePct: 74,
    durationDays: 5,
    region: "布什尔",
    typeLabel: "电子",
    regionDetail: "布什尔海岸（半径 40km）",
    indicatorHits: 4,
    summary: "电磁频谱占用率显著偏离和平时期基线，与历史演习前扰动模式部分吻合。",
  },
  "PA-20261021-011": {
    id: "PA-20261021-011",
    title: "纳坦兹化工区夜间用电异常",
    deviation: 61,
    confidencePct: 68,
    durationDays: 2,
    region: "纳坦兹",
    typeLabel: "后勤",
    regionDetail: "纳坦兹工业走廊",
    indicatorHits: 3,
    summary: "夜间负荷曲线与过去 30 日均值偏离明显，尚待排除季节性检修因素。",
  },
  "PA-20261021-013": {
    id: "PA-20261021-013",
    title: "南部港口舆论账号协同发声",
    deviation: 55,
    confidencePct: 62,
    durationDays: 9,
    region: "阿巴斯港",
    typeLabel: "舆论",
    regionDetail: "阿巴斯港舆情圈层",
    indicatorHits: 3,
    summary: "多账号发帖节律与叙事主题高度同步，相似度未达自动确认门槛。",
  },
};

/**
 * 按编号获取潜在异常详情 Mock。
 * @param id - 异常编号
 */
export const getPotentialAnomalyDetail = (id: string): PotentialAnomalyDetail | undefined => {
  if (id === hormuzDetail.id) return hormuzDetail;
  const patch = detailVariants[id];
  if (!patch) return undefined;
  return { ...hormuzDetail, ...patch, id: patch.id ?? id, title: patch.title ?? id };
};

/** 待研判完整列表 Mock（与设计稿 5 条一致） */
export const potentialAnomalyListMock: PotentialAnomalyListRow[] = [
  {
    id: "PA-20261021-006",
    title: "霍尔木兹海峡货轮 AIS 静默",
    typeLabel: "通信",
    region: "霍尔木兹海峡",
    deviation: 74,
    confidencePct: 76,
    durationDays: 3,
  },
  {
    id: "PA-20261021-009",
    title: "伊朗东北部地面部队集结",
    typeLabel: "调动",
    region: "马什哈德",
    deviation: 68,
    confidencePct: 71,
    durationDays: 4,
  },
  {
    id: "PA-20261021-015",
    title: "西海岸雷达站电子干扰增强",
    typeLabel: "电子",
    region: "布什尔",
    deviation: 63,
    confidencePct: 74,
    durationDays: 5,
  },
  {
    id: "PA-20261021-011",
    title: "纳坦兹化工区夜间用电异常",
    typeLabel: "后勤",
    region: "纳坦兹",
    deviation: 61,
    confidencePct: 68,
    durationDays: 2,
  },
  {
    id: "PA-20261021-013",
    title: "南部港口舆论账号协同发声",
    typeLabel: "舆论",
    region: "阿巴斯港",
    deviation: 55,
    confidencePct: 62,
    durationDays: 9,
  },
];