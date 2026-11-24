import type { InjectionKey } from "vue";
import type { DeepAnalysisUiStepsApi } from "@/composables/deepAnalysis/useDeepAnalysisUiSteps";

/** provide/inject：深度分析页 8 步 UI 状态 */
export const deepAnalysisUiStepsKey: InjectionKey<DeepAnalysisUiStepsApi> = Symbol(
  "deepAnalysisUiSteps",
);