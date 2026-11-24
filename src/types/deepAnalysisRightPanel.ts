/**
 * 深度分析工作区右栏（步骤 / 对象）Tab 内容数据结构。
 * 结构固定，各步或各节点类型仅字段取值不同。
 */

/** 右栏 Tab 标识 */
export type DeepAnalysisRightPanelTab = "step" | "object";

/** 步骤阶段展示状态（顶栏 meta 用） */
export type DeepAnalysisStepPhaseStatus = "awaiting" | "running" | "done";

/** 步骤详情：键值区块（输入 / 输出） */
export interface DeepAnalysisStepSectionKeyValue {
  /** 区块类型 */
  kind: "keyValue";
  /** 区块标题，如「输入」 */
  title: string;
  /** 标签—值行 */
  rows: readonly {
    /** 左侧标签 */
    label: string;
    /** 右侧展示文案 */
    value: string;
  }[];
}

/** 步骤详情：要点列表（处理 / 图谱变化） */
export interface DeepAnalysisStepSectionBullets {
  kind: "bullets";
  title: string;
  items: readonly {
    /** 行首强调词，如「新增」 */
    emphasis?: string;
    /** 正文 */
    text: string;
  }[];
}

/** 步骤详情：Agent 链路 */
export interface DeepAnalysisStepSectionPipeline {
  kind: "pipeline";
  title: string;
  /** 从左到右的 Agent 名称 */
  agents: readonly string[];
  /** 未启动等后缀说明，如「方案生成Agent (待启动)」 */
  pendingSuffix?: string;
}

/** 步骤详情：明细表摘要（宽表走主区弹窗） */
export interface DeepAnalysisStepSectionTables {
  kind: "tables";
  title: string;
  /** 栏内展示规则说明 */
  hint: string;
  /** 可展开短表元数据 */
  entries: readonly {
    /** 表名 */
    title: string;
    /** 行数 */
    rowCount: number;
    /** 列数 */
    colCount: number;
  }[];
}

/** 步骤 Tab 内单块内容 */
export type DeepAnalysisStepSection =
  | DeepAnalysisStepSectionKeyValue
  | DeepAnalysisStepSectionBullets
  | DeepAnalysisStepSectionPipeline
  | DeepAnalysisStepSectionTables;

/** 「步骤」Tab 完整视图模型 */
export interface DeepAnalysisStepPanelContent {
  /** 顶栏：步骤序号（1 起） */
  displayIndex: number;
  /** 顶栏：步骤标题 */
  stepTitle: string;
  /** 顶栏：阶段状态英文键，展示为 awaiting 等 */
  phaseStatus: DeepAnalysisStepPhaseStatus;
  /** 主标题（通常与 stepTitle 一致） */
  headline: string;
  /** 副标题说明 */
  subtitle: string;
  /** 自上而下固定顺序区块 */
  sections: readonly DeepAnalysisStepSection[];
}

/** 「对象」Tab 指标卡 */
export interface DeepAnalysisObjectMetricCard {
  /** 大号数值，如 74% */
  value: string;
  /** 卡下标签 */
  label: string;
}

/** 「对象」Tab 基本信息行 */
export interface DeepAnalysisObjectInfoRow {
  label: string;
  value: string;
  /** 值高亮样式 */
  valueTone?: "default" | "active";
}

/** 「对象」Tab 底栏操作 */
export interface DeepAnalysisObjectPanelAction {
  id: string;
  label: string;
  /** primary 为实心按钮，link 为文字链 */
  variant: "primary" | "link";
}

/** 「对象」Tab 完整视图模型 */
export interface DeepAnalysisObjectPanelContent {
  /** 是否为空态（未选中图谱节点） */
  empty: boolean;
  /** 空态提示 */
  emptyHint?: string;
  /** 面包屑，如「意图 › H5」 */
  breadcrumb?: string;
  /** 节点主标题 */
  title?: string;
  /** 置信度 / 贡献度等一行摘要 */
  statsLine?: string;
  /** 三张指标卡 */
  metrics?: readonly DeepAnalysisObjectMetricCard[];
  /** 基本信息区块标题 */
  basicInfoTitle?: string;
  basicInfo?: readonly DeepAnalysisObjectInfoRow[];
  /** 概述区块标题 */
  overviewTitle?: string;
  overview?: string;
  /** 关联根节点标题 */
  relatedRootsTitle?: string;
  relatedRoots?: readonly string[];
  /** 底栏操作 */
  actions?: readonly DeepAnalysisObjectPanelAction[];
}

/** 按 UI 步骤 key 索引的步骤详情内容 */
export type DeepAnalysisStepPanelContentByKey = Readonly<
  Record<string, DeepAnalysisStepPanelContent>
>;