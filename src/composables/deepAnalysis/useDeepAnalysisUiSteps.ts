import { computed, ref } from "vue";
import {
  DEEP_ANALYSIS_UI_STEPS,
  type DeepAnalysisStepPanelKind,
  type DeepAnalysisUiStep,
} from "@/constants/deepAnalysisUiSteps";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { runDeepAnalysisStepConfirm } from "@/composables/deepAnalysis/deepAnalysisStepHandlers";

function panelKindToAnalysisType(
  kind: DeepAnalysisStepPanelKind,
): "default" | "attack" | "defense" | "evaluation" {
  switch (kind) {
    case "intent":
      return "default";
    case "attack":
      return "attack";
    case "defense":
      return "defense";
    case "evaluation":
      return "evaluation";
  }
}

/**
 * 深度分析页顶栏 8 步 UI 状态：当前步、确认并继续、与 store.analysisType 同步。
 */
export function useDeepAnalysisUiSteps() {
  const analysisStore = useAnalysisStore();
  const currentStepIndex = ref(0);
  const confirming = ref(false);

  const steps = DEEP_ANALYSIS_UI_STEPS;
  const totalSteps = steps.length;

  /**
   * 计算当前步骤配置。
   * 返回 DeepAnalysisUiStep。作用：顶栏高亮与右栏分析面板选型。
   */
  const currentStep = computed(
    (): DeepAnalysisUiStep => steps[currentStepIndex.value] ?? steps[0],
  );

  /**
   * 计算是否为最后一步。
   * 返回 boolean。最后一步按钮文案为「完成」。
   */
  const isLastStep = computed(() => currentStepIndex.value >= totalSteps - 1);

  /**
   * 将当前 UI 步的 panelKind 同步到 analysisStore.analysisType，
   * 使既有四类右栏面板无需立刻拆分。
   */
  const syncAnalysisTypeFromUiStep = () => {
    analysisStore.analysisType = panelKindToAnalysisType(currentStep.value.panelKind);
  };

  /**
   * 用户点击「确认并继续」：执行当前步钩子后进入下一步（最后一步仅执行钩子）。
   */
  const confirmAndContinue = async () => {
    if (confirming.value) return;
    confirming.value = true;
    try {
      await runDeepAnalysisStepConfirm(currentStep.value, currentStepIndex.value);
      if (!isLastStep.value) {
        currentStepIndex.value += 1;
        syncAnalysisTypeFromUiStep();
      }
    } finally {
      confirming.value = false;
    }
  };

  /**
   * 允许用户点击顶栏切换查看某步（仅 UI，不自动跑后端阶段）。
   * @param index - 0~7
   */
  const goToStep = (index: number) => {
    if (index < 0 || index >= totalSteps) return;
    currentStepIndex.value = index;
    syncAnalysisTypeFromUiStep();
  };

  return {
    steps,
    totalSteps,
    currentStepIndex,
    currentStep,
    isLastStep,
    confirming,
    confirmAndContinue,
    goToStep,
    syncAnalysisTypeFromUiStep,
  };
}

export type DeepAnalysisUiStepsApi = ReturnType<typeof useDeepAnalysisUiSteps>;