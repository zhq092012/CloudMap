import { ref } from "vue";

/** 画布节点类型：点击后允许弹出完整方案/报告 */
const PLAN_NODE_TYPES = new Set(["Attack", "Defense", "Evaluation"]);

/**
 * 右栏共用：方案名/排序行点击后打开 AnalysisNodeDetailDialog。
 */
export function useDeepAnalysisNodeDetailDialog() {
  const detailDialogVisible = ref(false);
  const detailDialogNode = ref<Record<string, unknown> | null>(null);

  const openDetailDialog = (node: { type?: string } | null | undefined) => {
    const t = node?.type;
    if (!t || !PLAN_NODE_TYPES.has(t)) return;
    detailDialogNode.value = node as Record<string, unknown>;
    detailDialogVisible.value = true;
  };

  return {
    detailDialogVisible,
    detailDialogNode,
    openDetailDialog,
  };
}