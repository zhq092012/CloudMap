import type {
  AnomalyDeepJudgmentView,
  AnomalyHypothesisPanelView,
  AnomalyOverviewFoldSection,
  AnomalyOverviewTimeBucket,
} from "@/types/anomalySignsRightPanel";

/**
 * 深度研判 Tab 默认 Mock（无选中事件或接口未返回 agentResult 时使用）。
 */
export const mockAnomalyDeepJudgment: AnomalyDeepJudgmentView = {
  title: "东地中海空中加油编队异常偏离",
  levelLabel: "高威胁",
  levelTone: "danger",
  meta: [
    { label: "异常 ID", value: "ANM-20251124-087" },
    { label: "资产类型", value: "飞机轨迹" },
    { label: "综合威胁度", value: "87" },
    { label: "状态", value: "已确认 · 分析中" },
    { label: "区域", value: "东地中海 · 33.2°N 34.8°E" },
    { label: "持续时长", value: "2h 18m" },
  ],
  narrative:
    "云脑多 Agent 在对近 24 小时编队加油轨迹进行链式比对后，识别出受油机相对预置航线出现持续向西偏置，同时伴随高度层异常波动与 IFF 间歇缺失。该模式与历史上「掩护加油」前置机动相似，但缺乏对应 NOTAM 与民用航路通告支撑。综合 SIGINT、ADS-B 稀疏点与开源图像时序，倾向判定为有意航线伪装，需结合假设验证进一步排除设备故障与环境扰动。",
  causes: [
    { label: "战术机动 / 航线伪装", confidence: 78, tone: "danger" },
    { label: "导航设备间歇故障", confidence: 55, tone: "warn" },
    { label: "气象绕航与流场扰动", confidence: 34, tone: "info" },
    { label: "数据稀疏导致解算偏差", confidence: 12, tone: "muted" },
  ],
  evidences: [
    {
      title: "ADS-B 轨迹簇",
      detail: "30 分钟内 4 次有效点，平均偏航 12.4 nm，高度抖动 σ=1.8k ft",
    },
    {
      title: "SIGINT 快照",
      detail: "受油机应答机模式 S 间歇关闭，加油机保持稳定巡航",
    },
    {
      title: "开源图像",
      detail: " Planet 近实时切片显示编队缩阶队形，与基线加油训练区不一致",
    },
    {
      title: "历史基线",
      detail: "同机型 90 日基线偏航 P95 = 3.1 nm，当前偏离超阈 4.0σ",
    },
  ],
  recommendation:
    "建议优先启动 H1/H2 假设验证，并联动态势监控对加油走廊划设临时警戒区；若 H3 证伪战术意图，再降级为设备维护工单。",
  actionLabel: "发起联动诊断",
};

/**
 * 假设验证 Tab 默认 Mock。
 */
export const mockAnomalyHypothesisPanel: AnomalyHypothesisPanelView = {
  contextTitle: "东地中海空中加油编队异常偏离",
  steps: [
    {
      code: "H1",
      title: "战术机动导致航线偏置",
      logic: "若偏航与加油窗口、掩护区时间窗重合，且 IFF 间歇与编组队形同步，则支持战术伪装假设。",
      status: "verified",
      resultSummary: "编队在加油窗口内完成两次大幅偏航，IFF 关闭时段与偏航峰值对齐。",
      dataSource: "ADS-B + 任务时间轴",
    },
    {
      code: "H2",
      title: "导航设备间歇故障",
      logic: "若仅单平台高度抖动且无编组队形协同变化，则更倾向设备故障。",
      status: "running",
      resultSummary: "受油机高度层异常显著，但加油机轨迹稳定，需补采维护日志。",
      dataSource: "轨迹解算 + 运维工单（待接入）",
    },
    {
      code: "H3",
      title: "气象绕航合理性",
      logic: "对比 ECMWF 风场与 NOTAM，若无绕航必要则降低气象解释权重。",
      status: "pending",
      resultSummary: "等待气象 Agent 回写 6h 风场叠图结论。",
      dataSource: "气象 API / Agent",
    },
    {
      code: "H4",
      title: "开源报道与行动一致性",
      logic: "若区域无对应演习通报且媒体无相关报道，则提高隐蔽机动概率。",
      status: "rejected",
      resultSummary: "查到民船 WARN 通告与演习无关，不支持公开演习解释。",
      dataSource: "开源情报检索",
    },
  ],
  recommendation:
    "H1 已验证，建议进入深度分析工作区执行蓝/红推演；完成 H2/H3 前保持威胁等级不降。",
};

/**
 * 总览 Tab 近时段分布 Mock（接口无细分时段时使用）。
 */
export const mockAnomalyOverviewTimeBuckets: AnomalyOverviewTimeBucket[] = [
  { label: "0-4h", value: 3 },
  { label: "4-8h", value: 5 },
  { label: "8-12h", value: 2 },
  { label: "12-16h", value: 4 },
  { label: "16-20h", value: 1 },
  { label: "20-24h", value: 2 },
];

/**
 * 总览 Tab 底部折叠说明 Mock。
 */
export const mockAnomalyOverviewSections: AnomalyOverviewFoldSection[] = [
  {
    title: "片段基本信息",
    defaultOpen: false,
    paragraphs: [
      "本面板汇总近 24 小时异常征候统计与云脑简报摘要；深度研判与假设验证默认展示当前优先级最高事件。",
      "左侧列表勾选后可批量确认或加入深度分析，右栏数据随全局统计接口刷新。",
    ],
  },
  {
    title: "智能建议",
    defaultOpen: true,
    paragraphs: [
      "当前高威胁事件占比偏高，建议优先处理「已确认」分组中带编队/轨迹突变的条目。",
      "可一键生成简报并在「深度研判」查看多 Agent 证据链，再在「假设验证」跟踪 H 系列结论。",
    ],
  },
];