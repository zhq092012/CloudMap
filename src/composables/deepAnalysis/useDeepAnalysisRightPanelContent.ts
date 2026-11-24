import { computed, type Ref } from "vue";
import { storeToRefs } from "pinia";
import type { DeepAnalysisUiStep } from "@/constants/deepAnalysisUiSteps";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { deepAnalysisRightPanelStepMock } from "@/mock/deepAnalysisRightPanelSteps";
import {
  deepAnalysisObjectPanelEmpty,
  deepAnalysisObjectPanelIntentMock,
} from "@/mock/deepAnalysisRightPanelObject";
import type {
  DeepAnalysisObjectPanelContent,
  DeepAnalysisStepPanelContent,
} from "@/types/deepAnalysisRightPanel";

/**
 * 根据当前 UI 步骤与图谱选中节点，组装右栏「步骤 / 对象」Tab 视图模型（现阶段以 Mock 为主）。
 * @param currentStep - 注入的当前步骤 Ref
 */
export function useDeepAnalysisRightPanelContent(currentStep: Ref<DeepAnalysisUiStep>) {
  const analysisStore = useAnalysisStore();
  const { selectedNode } = storeToRefs(analysisStore);

  /**
   * 当前步「步骤」Tab 内容。
   * 若 key 未配置 Mock，抛出明确错误以便开发期发现遗漏。
   */
  const stepPanelContent = computed((): DeepAnalysisStepPanelContent => {
    const key = currentStep.value.key;
    const content = deepAnalysisRightPanelStepMock[key];
    if (!content) {
      throw new Error(
        `deepAnalysisRightPanelStepMock 缺少步骤 key="${key}"，请在 mock 中补齐「步骤」Tab 数据`,
      );
    }
    return content;
  });

  /**
   * 「对象」Tab 内容：无选中节点为空态；有选中时暂用意图样例 Mock，
   * 并用图谱节点 id / 标题覆盖部分字段（不编造缺失的置信度等数值）。
   */
  const objectPanelContent = computed((): DeepAnalysisObjectPanelContent => {
    const node = selectedNode.value;
    if (!node) {
      return deepAnalysisObjectPanelEmpty;
    }

    const nodeId = String(node.id ?? "");
    const nodeTitle = String(node.text ?? node.title ?? "未命名节点");
    const typeLabel =
      node.type === "Attack" || node._type === "Attack"
        ? "方案"
        : node.type === "Defense" || node._type === "Defense"
          ? "防御"
          : node.type === "Evaluation" || node._type === "Evaluation"
            ? "评价"
            : "意图";

    const confidence =
      typeof node.confidence === "number" && !Number.isNaN(node.confidence)
        ? `${Math.round(node.confidence)}%`
        : undefined;

    const base = deepAnalysisObjectPanelIntentMock;
    return {
      ...base,
      empty: false,
      breadcrumb: `${typeLabel} › ${nodeId || "—"}`,
      title: nodeTitle,
      statsLine: confidence
        ? `置信度 ${confidence} · 贡献度 38%`
        : base.statsLine,
      basicInfo: [
        { label: `${typeLabel} ID`, value: nodeId || "—" },
        { label: "名称", value: nodeTitle },
        ...(base.basicInfo?.slice(2) ?? []),
      ],
      metrics: confidence
        ? [
            { value: confidence, label: "置信度" },
            ...(base.metrics?.slice(1) ?? []),
          ]
        : base.metrics,
    };
  });

  return {
    stepPanelContent,
    objectPanelContent,
  };
}