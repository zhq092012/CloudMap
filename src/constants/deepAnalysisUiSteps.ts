/** 深度分析页顶部 8 步 UI 所用右栏面板类型（暂复用既有四类面板，后续可按步拆组件） */
export type DeepAnalysisStepPanelKind =
  | "intent"
  | "attack"
  | "defense"
  | "evaluation";

/** 单步 UI 配置 */
export interface DeepAnalysisUiStep {
  /** 从 0 起的步骤序号，展示为 1~8 */
  index: number;
  /** 稳定标识，供 stepHandlers 与各步业务挂钩 */
  key: string;
  /** 顶栏展示标题 */
  title: string;
  /** 当前步右栏「分析面板」复用的面板类型 */
  panelKind: DeepAnalysisStepPanelKind;
  /**
   * 本步待接入能力说明（仅文档/占位，不参与逻辑）
   * 后续在各步 handler 与专属组件中实现
   */
  implementationNote: string;
}

/** 深度分析工作区 8 步（与设计稿顶栏一致） */
export const DEEP_ANALYSIS_UI_STEPS: readonly DeepAnalysisUiStep[] = [
  {
    index: 0,
    key: "intent_infer",
    title: "意图推断",
    panelKind: "intent",
    implementationNote: "左栏：本次分析组；图谱：意图/源点；右栏：意图详情与方案画像入口",
  },
  {
    index: 1,
    key: "intent_prune",
    title: "意图剪枝",
    panelKind: "intent",
    implementationNote: "右栏：剪枝理由与确认剪枝结果；图谱高亮被剪枝节点",
  },
  {
    index: 2,
    key: "relation_expand",
    title: "关联扩展",
    panelKind: "intent",
    implementationNote: "关联情报扩展、图谱增量节点展示（待接 API）",
  },
  {
    index: 3,
    key: "plan_generate",
    title: "方案生成",
    panelKind: "attack",
    implementationNote: "触发蓝方方案生成；左栏筛选 Attack 节点",
  },
  {
    index: 4,
    key: "plan_profile",
    title: "方案画像",
    panelKind: "attack",
    implementationNote: "蓝方作战方案画像详情；确认后进入防御推演",
  },
  {
    index: 5,
    key: "plan_verify",
    title: "方案核验",
    panelKind: "defense",
    implementationNote: "红方防御方案生成与核验",
  },
  {
    index: 6,
    key: "red_defense",
    title: "红方防御",
    panelKind: "defense",
    implementationNote: "防御方案比对、进入评价阶段",
  },
  {
    index: 7,
    key: "compare_filter",
    title: "对比筛选",
    panelKind: "evaluation",
    implementationNote: "Evaluation 排序与推荐方案定稿",
  },
] as const;