import type { DeepAnalysisObjectPanelContent } from "@/types/deepAnalysisRightPanel";

/** 未选中图谱节点时的对象 Tab 空态 */
export const deepAnalysisObjectPanelEmpty: DeepAnalysisObjectPanelContent = {
  empty: true,
  emptyHint: "请在中间图谱中选择一个节点，「对象」Tab 将展示该节点的固定结构详情。",
};

/**
 * 意图类节点 Mock（设计稿 H5 样例）。
 * 后续由 store.selectedNode + adapter 生成同结构数据。
 */
export const deepAnalysisObjectPanelIntentMock: DeepAnalysisObjectPanelContent = {
  empty: false,
  breadcrumb: "意图 › H5",
  title: "侦察与电磁前移构成一体化战前准备",
  statsLine: "置信度 74% · 贡献度 38%",
  metrics: [
    { value: "74%", label: "置信度" },
    { value: "38%", label: "单根贡献度" },
    { value: "44%", label: "证据重叠" },
  ],
  basicInfoTitle: "基本信息",
  basicInfo: [
    { label: "意图 ID", value: "H5" },
    {
      label: "名称",
      value: "侦察与电磁前移构成一体化战前准备",
    },
    { label: "穷举层级", value: "L1 组内组合" },
    { label: "状态", value: "活跃", valueTone: "active" },
  ],
  overviewTitle: "意图概述",
  overview: "空中侦察与地面电磁活动在同一时间窗内耦合",
  relatedRootsTitle: "关联根节点",
  relatedRoots: ["ANO-20261021-002", "ANO-20261021-003"],
  actions: [
    { id: "prune_intent", label: "剪枝该意图", variant: "primary" },
    { id: "view_in_main", label: "在主区查看明细", variant: "link" },
  ],
};