<template>
  <aside class="asrp-root" aria-label="云脑智能面板">
    <CloudBrainPanelHeader
      class="asrp-root__header"
      title="云脑智能面板"
      leading-icon="🧠"
      :summary-text="cloudBrainSummaryText"
      @refresh="onCloudBrainRefresh"
      @export="onCloudBrainExport"
      @pin="onCloudBrainPin"
    />

    <nav class="asrp-root__tabs" role="tablist" aria-label="异常分析视图">
      <button v-for="tab in tabs" :key="tab.key" type="button" role="tab" class="asrp-root__tab"
        :class="{ 'is-active': activeTab === tab.key }" :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key">
        {{ tab.label }}
      </button>
    </nav>

    <div class="asrp-root__body custom-scrollbar" role="tabpanel">
      <!-- 总览 -->
      <AnomalySignsRightPanelOverviewTab v-show="activeTab === 'overview'" :overview-stats="overviewStats"
        :overview-html="overviewHtml" :overview-date="overviewDate" :has-briefing="hasBriefing"
        :show-report-detail="showReportDetail" />
      <!-- 深度研判 -->
      <AnomalySignsRightPanelDeepTab v-show="activeTab === 'deep'" :content="deepJudgment" />
      <!-- 假设验证 -->
      <AnomalySignsRightPanelHypothesisTab v-show="activeTab === 'hypothesis'" :panel="hypothesisPanel" />
    </div>

    <el-dialog
      v-model="briefingDialogVisible"
      plain
      class="article-read-dialog"
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      title="异常征候简报详情">
      <SituationReportDialog
        variant="briefing"
        heading="异常征候简报"
        :load-state="briefingState"
        :briefing="briefingData"
        :error="briefingError"
        @regenerate="doGenerateBriefing"
        @close="briefingDialogVisible = false"
      />
    </el-dialog>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import CloudBrainPanelHeader from "@/components/situation/cloudBrainPanel/CloudBrainPanelHeader.vue";
import { getAnomalyStats } from "@/api/anomalies";
import type { AnomalyStats } from "@/api/anomalies";
import SituationReportDialog from "@/components/Dialogs/SituationReportDialog.vue";
import AnomalySignsRightPanelOverviewTab from "@/components/anomaly/anomalySigns/AnomalySignsRightPanelOverviewTab.vue";
import AnomalySignsRightPanelDeepTab from "@/components/anomaly/anomalySigns/AnomalySignsRightPanelDeepTab.vue";
import AnomalySignsRightPanelHypothesisTab from "@/components/anomaly/anomalySigns/AnomalySignsRightPanelHypothesisTab.vue";
import { useBriefing } from "@/composables/useBriefing";
import { mockAnomalyDeepJudgment, mockAnomalyHypothesisPanel } from "@/mock/anomalySignsRightPanel";
import type { AnomalySignsRightPanelTab } from "@/types/anomalySignsRightPanel";

const tabs: { key: AnomalySignsRightPanelTab; label: string }[] = [
  { key: "overview", label: "总览" },
  { key: "deep", label: "深度研判" },
  { key: "hypothesis", label: "假设验证" },
];

/** 当前选中的主 Tab */
const activeTab = ref<AnomalySignsRightPanelTab>("overview");

const overviewStats = ref<AnomalyStats | null>(null);

/** 深度研判 / 假设验证：当前为设计稿 Mock，后续可接选中事件与 agentResult */
const deepJudgment = ref(mockAnomalyDeepJudgment);
const hypothesisPanel = ref(mockAnomalyHypothesisPanel);

const {
  briefingDialogVisible,
  briefingState,
  briefingData,
  briefingError,
  overviewHtml,
  overviewDate,
  hasBriefing,
  showReportDetail,
  doGenerateBriefing,
} = useBriefing();

/** 顶栏「复制摘要」：优先简报纯文本，否则统计摘要 */
const cloudBrainSummaryText = computed(() => {
  if (overviewHtml.value) {
    return overviewHtml.value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const s = overviewStats.value;
  if (!s) return "异常征候云脑面板（暂无摘要）";
  const pending = s.status?.pending ?? s.status?.["待研判"] ?? 0;
  const confirmed = s.status?.confirmed ?? s.status?.["已确认"] ?? 0;
  return `异常总数 ${s.total}，待研判 ${pending}，已确认 ${confirmed}。`;
});

const reloadOverviewStats = async () => {
  try {
    overviewStats.value = await getAnomalyStats();
  } catch (error) {
    console.error("[AnomalySignsRightPanel] 获取异常统计失败:", error);
    overviewStats.value = null;
    throw error;
  }
};

const onCloudBrainRefresh = async () => {
  try {
    await reloadOverviewStats();
    ElMessage.success("已刷新异常征候云脑面板");
  } catch {
    ElMessage.error("刷新失败，请稍后重试");
  }
};

const onCloudBrainExport = () => {
  ElMessage.info("云脑面板导出（Mock，待接业务）");
};

const onCloudBrainPin = () => {
  ElMessage.info("已固定云脑面板（Mock）");
};

onMounted(() => {
  void reloadOverviewStats();
});
</script>

<style scoped lang="scss">
.asrp-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 12px;
  color: #e5e7eb;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid #2d3a4d;
  border-right: none;
  border-radius: 8px 0 0 8px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  user-select: none;
}

.asrp-root__header {
  margin: -4px -2px 10px;
  padding-left: 2px;
  padding-right: 2px;
}

.asrp-root__tabs {
  display: flex;
  flex-shrink: 0;
  gap: 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #2d3a4d;
}

.asrp-root__tab {
  position: relative;
  flex: 1;
  padding: 9px 6px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: #e5e7eb;
  }

  &.is-active {
    font-weight: 600;
    color: #93c5fd;
  }

  &.is-active::after {
    content: "";
    position: absolute;
    right: 8px;
    bottom: -1px;
    left: 8px;
    height: 2px;
    background: #3b82f6;
    border-radius: 2px 2px 0 0;
  }
}

.asrp-root__body {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4d64;
}
</style>