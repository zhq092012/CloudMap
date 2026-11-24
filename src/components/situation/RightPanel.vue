<template>
  <div
    class="w-95 h-full absolute right-0 top-0 z-1000 bg-[#111827]/95 border-l border-[#2d3a4d] text-[#e5e7eb] flex flex-col font-sans select-none backdrop-blur-sm overflow-hidden">
    <div class="shrink-0 px-2.5 pt-2.5 pb-2 border-b border-[#2d3a4d]">
      <h2 class="text-[13.5px] font-bold tracking-wider text-[#e5e7eb] flex items-center gap-1.5">
        🧠 云脑智能面板
      </h2>
    </div>

    <div class="rp-sections flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2.5 py-2 space-y-2">
      <PotentialAnomalySection :data="panelMock.potentialAnomaly" @action="onPotentialAnomalyAction" />
      <CapabilityChangeSection :data="panelMock.capabilityChange" @export="onCapabilityExport" />
      <SituationReportSection
        :data="panelMock.situationReport"
        :has-briefing="hasBriefing"
        :overview-html="overviewHtml"
        :overview-date="overviewDate"
        @view-detail="showReportDetail"
        @map-locate="onSituationMapLocate"
        @export="onSituationExport"
        @regenerate="doGenerateBriefing"
      />
      <KeyFocusSection :data="panelMock.keyFocus" @dismiss="onKeyFocusDismiss" />
      <CommandTerminalSection class="rp-terminal-section" />
    </div>

    <el-dialog
      v-model="briefingDialogVisible"
      plain
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      title="态势监控简报详情">
      <BriefingDialog
        heading="态势监控简报"
        :state="briefingState"
        :briefing="briefingData"
        :error="briefingError"
        @regenerate="doGenerateBriefing"
        @close="briefingDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import BriefingDialog from "@/components/Dialogs/BriefingDialog.vue";
import PotentialAnomalySection from "@/components/situation/cloudBrainPanel/PotentialAnomalySection.vue";
import CapabilityChangeSection from "@/components/situation/cloudBrainPanel/CapabilityChangeSection.vue";
import SituationReportSection from "@/components/situation/cloudBrainPanel/SituationReportSection.vue";
import KeyFocusSection from "@/components/situation/cloudBrainPanel/KeyFocusSection.vue";
import CommandTerminalSection from "@/components/situation/cloudBrainPanel/CommandTerminalSection.vue";
import { cloudBrainPanelMock } from "@/mock/cloudBrainPanel";
import { useBriefing } from "@/composables/useBriefing";

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

/** 云脑智能面板各 section 的 Mock 数据（后续可改为 API） */
const panelMock = ref(cloudBrainPanelMock);

/** 潜在异常区块按钮占位交互 */
const onPotentialAnomalyAction = (key: string) => {
  const labels: Record<string, string> = {
    "open-monitor": "打开监测模块",
    "view-all": "查看全部列表",
    "locate-featured": "定位 featured 异常",
    "locate-max-deviation": "定位最高偏离",
  };
  ElMessage.info(`${labels[key] ?? key}（Mock，待接业务）`);
};

const onCapabilityExport = () => {
  ElMessage.info("能力变化导出（Mock，待接业务）");
};

const onSituationMapLocate = () => {
  ElMessage.info("地图定位（Mock，待接业务）");
};

const onSituationExport = () => {
  ElMessage.info("态势报告导出（Mock，待接业务）");
};

/** 从重点关注列表移除条目（Mock 本地态） */
const onKeyFocusDismiss = (id: string) => {
  panelMock.value = {
    ...panelMock.value,
    keyFocus: {
      items: panelMock.value.keyFocus.items.filter((it) => it.id !== id),
    },
  };
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4d64;
}

.rp-sections {
  flex: 1 1 auto;
  min-height: 0;
}

/** 指挥终端固定在滚动列表最底部，避免被 flex 挤没 */
.rp-terminal-section {
  flex-shrink: 0;
  margin-bottom: 4px;
}
</style>