import { computed, type ComputedRef } from "vue";

const OUTPUT_FIELD_LABELS: Record<string, string> = {
  name: "事件名称",
  title: "标题",
  type: "事件类型",
  asset_type: "资产类型",
  location: "地理位置",
  relatedEntities: "关联实体",
  source: "情报来源",
  threatLevel: "威胁度",
  threatScore: "威胁度",
  deviationScore: "偏离度",
  confidence: "置信度",
  analysisReason: "研判理由",
  description: "描述",
  analysis: "分析",
  finding: "发现",
  report: "报告",
};

/**
 * 意图节点等无 summary/details 时，将 output_json 其余字段转为键值列表行。
 */
export function useDeepAnalysisOutputJsonEntries(
  resultDataText: ComputedRef<Record<string, unknown>>,
) {
  const outputJsonEntries = computed(() => {
    const obj = resultDataText.value;
    if (!obj) return [];
    const score = (obj as Record<string, unknown>).threatScore;
    const scoreText =
      typeof score === "number" && Number.isFinite(score)
        ? String(Math.round(score * 10) / 10)
        : null;
    return Object.entries(obj)
      .filter(
        ([k, v]) =>
          k !== "summary" &&
          k !== "details" &&
          k !== "threatScore" &&
          v !== null &&
          v !== undefined &&
          String(v).trim() !== "",
      )
      .map(([k, v]) => {
        let value: string = typeof v === "object" ? JSON.stringify(v) : String(v);
        if (k === "threatLevel" && scoreText) {
          const s = String(v).trim();
          value = /^\d+(\.\d+)?$/.test(s)
            ? ` ${scoreText}`
            : `${s}（${scoreText}）`;
        }
        return { key: k, label: OUTPUT_FIELD_LABELS[k] || k, value };
      });
  });

  return { outputJsonEntries };
}