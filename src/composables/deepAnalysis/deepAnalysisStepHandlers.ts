import type { DeepAnalysisUiStep } from "@/constants/deepAnalysisUiSteps";

/**
 * 各步点击「确认并继续」时的业务钩子（当前为空实现，仅留扩展点）。
 * @param step - 当前步骤配置
 * @param stepIndex - 0~7
 */
export async function runDeepAnalysisStepConfirm(
  step: DeepAnalysisUiStep,
  stepIndex: number,
): Promise<void> {
  switch (step.key) {
    case "intent_infer":
      // TODO: 意图推断阶段确认（与 analysisStore 意图分析进度对齐）
      return;
    case "intent_prune":
      // TODO: 意图剪枝确认
      return;
    case "relation_expand":
      // TODO: 关联扩展确认
      return;
    case "plan_generate":
      // TODO: 方案生成确认
      return;
    case "plan_profile":
      // TODO: 方案画像确认 / proceedToBluePlan 收尾
      return;
    case "plan_verify":
      // TODO: 方案核验确认
      return;
    case "red_defense":
      // TODO: 红方防御确认 / proceedToRedPlan
      return;
    case "compare_filter":
      // TODO: 对比筛选定稿
      return;
    default:
      void stepIndex;
  }
}