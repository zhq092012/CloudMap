import { computed, type ComputedRef } from "vue";
import { storeToRefs } from "pinia";
import { useAnalysisStore } from "@/store/modules/analysisStore";

/** 深度递归解析 nodeData 中可能嵌套的 JSON 字符串 */
function normalizeObjectLikeValue(value: unknown): unknown {
  if (value == null) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return value;
    try {
      const parsed = JSON.parse(trimmed);
      return normalizeObjectLikeValue(parsed);
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeObjectLikeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeObjectLikeValue(item),
      ]),
    );
  }

  return value;
}

/** 将 selectedNode.nodeData 解析为可展示的对象；解析失败时退回原始字符串 */
function parseSelectedNodeData(
  nodeData: unknown,
  deepNormalize: boolean,
): Record<string, unknown> {
  if (nodeData == null) return {};

  try {
    const obj = typeof nodeData === "string" ? JSON.parse(nodeData) : nodeData;
    const payload = deepNormalize ? normalizeObjectLikeValue(obj) : obj;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }
    return { value: payload };
  } catch {
    return { value: typeof nodeData === "string" ? nodeData : String(nodeData) };
  }
}

export interface UseDeepAnalysisNodeDataOptions {
  /** 是否对 details 等字段做递归 JSON 解析（攻击/防御/意图面板需要） */
  deepNormalize?: boolean;
}

/**
 * 右栏面板共用：当前选中节点的 nodeData 解析与置信度文案。
 */
export function useDeepAnalysisNodeData(
  options: UseDeepAnalysisNodeDataOptions = {},
): {
  resultDataText: ComputedRef<Record<string, unknown> & { summary?: string; details?: string }>;
  nodeConfidenceText: ComputedRef<string>;
} {
  const { deepNormalize = true } = options;
  const store = useAnalysisStore();
  const { selectedNode } = storeToRefs(store);

  const resultDataText = computed(
    () =>
      parseSelectedNodeData(selectedNode.value?.nodeData, deepNormalize) as Record<
        string,
        unknown
      > & { summary?: string; details?: string },
  );

  const nodeConfidenceText = computed(() => {
    const c = selectedNode.value?.confidence;
    if (c == null || !Number.isFinite(Number(c))) return "N/A";
    return `${Math.round(Number(c))}%`;
  });

  return { resultDataText, nodeConfidenceText };
}