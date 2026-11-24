/**
 * 异常征候右侧「云脑智能面板」Tab 与视图模型类型。
 */

/** 右栏主 Tab：总览 | 深度研判 | 假设验证 */
export type AnomalySignsRightPanelTab =
  /** 态势统计与简报总览 */
  | "overview"
  /** 单事件深度研判与证据链 */
  | "deep"
  /** 假设—验证步骤列表 */
  | "hypothesis";

/** 研判页键值元数据一行 */
export interface AnomalyDeepMetaRow {
  /** 字段标签 */
  label: string;
  /** 展示值 */
  value: string;
}

/** 可能成因及置信度 */
export interface AnomalyCauseHypothesis {
  /** 成因简述 */
  label: string;
  /** 0–100 置信度 */
  confidence: number;
  /** 进度条语义色 */
  tone: "danger" | "warn" | "info" | "muted";
}

/** 关联证据条目 */
export interface AnomalyEvidenceItem {
  /** 证据标题或数据源 */
  title: string;
  /** 摘要说明 */
  detail: string;
}

/** 「深度研判」Tab 视图模型 */
export interface AnomalyDeepJudgmentView {
  /** 事件标题 */
  title: string;
  /** 角标文案，如「高威胁」 */
  levelLabel: string;
  /** 角标语义色 */
  levelTone: "danger" | "warn" | "info";
  /** 元数据网格 */
  meta: AnomalyDeepMetaRow[];
  /** 综合研判正文 */
  narrative: string;
  /** 可能成因列表 */
  causes: AnomalyCauseHypothesis[];
  /** 证据链 */
  evidences: AnomalyEvidenceItem[];
  /** 智能建议正文 */
  recommendation: string;
  /** 主操作按钮文案 */
  actionLabel: string;
}

/** 假设验证步骤状态 */
export type AnomalyHypothesisStatus =
  /** 已验证成立 */
  | "verified"
  /** 已证伪 */
  | "rejected"
  /** 进行中 */
  | "running"
  /** 待验证 */
  | "pending";

/** 单条假设—验证步骤 */
export interface AnomalyHypothesisStep {
  /** 步骤编号展示，如 H1 */
  code: string;
  /** 假设标题 */
  title: string;
  /** 验证逻辑说明 */
  logic: string;
  /** 当前状态 */
  status: AnomalyHypothesisStatus;
  /** 结果摘要 */
  resultSummary: string;
  /** 引用数据源说明 */
  dataSource: string;
}

/** 「假设验证」Tab 视图模型 */
export interface AnomalyHypothesisPanelView {
  /** 关联事件摘要 */
  contextTitle: string;
  /** 步骤列表 */
  steps: AnomalyHypothesisStep[];
  /** 底部智能建议 */
  recommendation: string;
}

/** 总览 Tab 时间桶统计（近时段异常数） */
export interface AnomalyOverviewTimeBucket {
  /** 横轴标签 */
  label: string;
  /** 计数 */
  value: number;
}

/** 总览 Tab 可折叠区块 */
export interface AnomalyOverviewFoldSection {
  /** 区块标题 */
  title: string;
  /** 默认是否展开 */
  defaultOpen: boolean;
  /** 段落列表 */
  paragraphs: string[];
}