import { onMounted, ref } from "vue";
import MarkdownIt from "markdown-it";
import { getTodayBriefing, getLatestBriefing, generateBriefing } from "@/api/briefings";
import type { AnomalyBriefing } from "@/api/briefings";
import { extractOverview } from "@/utils/briefingExtract";

/**
 * 异常态势简报概览渲染器
 * 渲染为纯函数，跨调用共享安全；行为与既有 WarningRightPanel 的 overviewMd 逐字一致
 */
const overviewMd = new MarkdownIt({ html: false, linkify: true, breaks: true });

export function useBriefing() {
  /**
   * 简报详情弹窗状态
   */
  const briefingDialogVisible = ref(false);
  /**
   * 简报状态
   */
  const briefingState = ref<"loading" | "generating" | "ready" | "error">("loading");
  /**
   * 简报数据
   */
  const briefingData = ref<AnomalyBriefing | null>(null);
  /**
   * 简报错误
   */
  const briefingError = ref("");

  /**
   * 卡片总览展示状态
   */
  const overviewHtml = ref("");
  const overviewDate = ref<string | null>(null);
  const hasBriefing = ref(false);

  /**
   * 重置简报概览
   */
  const resetOverview = () => {
    overviewHtml.value = "";
    overviewDate.value = null;
    hasBriefing.value = false;
  };

  /**
   * 加载简报概览
   */
  const loadOverview = async () => {
    try {
      const b = await getLatestBriefing();
      if (b) {
        const overview = extractOverview(b.content);
        overviewHtml.value = overviewMd.render(overview);
        overviewDate.value = overview ? b.briefingDate : null;
        hasBriefing.value = overview !== "";
      } else {
        resetOverview();
      }
    } catch {
      resetOverview();
    }
  };

  /**
   * 加载简报
   */
  const loadBriefing = async () => {
    briefingState.value = "loading";
    briefingError.value = "";
    try {
      const b = await getTodayBriefing();
      if (b) {
        briefingData.value = b;
        briefingState.value = "ready";
        return;
      }
      await doGenerateBriefing();
    } catch (e) {
      briefingError.value = e instanceof Error ? e.message : "加载简报失败";
      briefingState.value = "error";
    }
  };

  /**
   * 生成简报
   */
  const doGenerateBriefing = async () => {
    briefingState.value = "generating";
    briefingError.value = "";
    try {
      const res = await generateBriefing();
      if (res.briefing) {
        briefingData.value = res.briefing;
        briefingState.value = "ready";
        await loadOverview();
      } else {
        briefingError.value = res.error || "简报生成失败";
        briefingState.value = "error";
      }
    } catch (e) {
      briefingError.value = e instanceof Error ? e.message || "简报生成失败" : "简报生成失败";
      briefingState.value = "error";
    }
  };

  /**
   * 显示简报详情
   */
  const showReportDetail = () => {
    briefingDialogVisible.value = true;
    loadBriefing();
  };

  /**
   * 挂载时加载简报
   */
  onMounted(loadOverview);

  return {
    briefingDialogVisible,
    briefingState,
    briefingData,
    briefingError,
    overviewHtml,
    overviewDate,
    hasBriefing,
    loadOverview,
    loadBriefing,
    doGenerateBriefing,
    showReportDetail,
  };
}
