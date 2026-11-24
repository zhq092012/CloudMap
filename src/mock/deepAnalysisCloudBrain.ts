/**
 * 深度分析页右侧「云脑智能分析」栏 Mock 数据（设计稿占位，后续接 Agent 流 / 简报 API）。
 */

/** Agent 执行行状态 */
export type DeepAnalysisAgentRunStatus = "done" | "running" | "pending";

/** 实时执行追踪中单条 Agent 状态 */
export interface DeepAnalysisAgentRunLine {
  /** Agent 名称 */
  agent: string;
  /** 展示用状态文案，如「已完成」 */
  label: string;
  /** 状态枚举，用于样式 */
  status: DeepAnalysisAgentRunStatus;
}

/** 云脑栏 Mock 聚合 */
export interface DeepAnalysisCloudBrainMock {
  /** 顶栏是否展示实时指示 */
  live: boolean;
  /** 智能分析区块 */
  intelligentAnalysis: {
    /** 区块内小标题 */
    subtitle: string;
    /** 要点列表 */
    bullets: readonly string[];
  };
  /** 实时执行追踪 */
  executionTracking: {
    lines: readonly DeepAnalysisAgentRunLine[];
    /** 区块底部补充说明 */
    footer: string;
  };
  /** 建议动作列表 */
  suggestedActions: readonly string[];
  /** 关键依据摘要列表 */
  keyEvidence: readonly string[];
  /** 智能终端入口文案 */
  terminalCta: string;
  /** 底栏主操作 */
  footerActions: readonly {
    /** 稳定 id，便于后续接事件 */
    id: string;
    /** 按钮文案 */
    label: string;
  }[];
}

/** 深度分析云脑栏默认 Mock */
export const deepAnalysisCloudBrainMock: DeepAnalysisCloudBrainMock = {
  live: true,
  intelligentAnalysis: {
    subtitle: "中间结论与置信度归因",
    bullets: [
      "候选结论按质量保留，条数不设上限",
      "判定口径：置信度 / 贡献度 / 证据重叠",
      "归因结果已同步至主区图谱",
    ],
  },
  executionTracking: {
    lines: [
      { agent: "证据聚合 Agent", label: "已完成", status: "done" },
      { agent: "质量判定 Agent", label: "已完成", status: "done" },
      { agent: "归因分析 Agent", label: "进行中", status: "running" },
    ],
    footer: "结论回写到主区图谱",
  },
  suggestedActions: [
    "展开主区图谱查看结论与置信度",
    "对比相邻环节的产出差异",
    "需要深挖时，用智能终端追问本环节上下文",
  ],
  keyEvidence: [
    "命中指标、基线越限项与证据来源已归集",
    "依据权重与出处可追溯，明细走主区居中弹窗",
  ],
  terminalCta: "展开云脑对话",
  footerActions: [
    { id: "view_agent_chain", label: "查看 Agent 链路" },
    { id: "terminal_followup", label: "智能终端追问" },
  ],
};