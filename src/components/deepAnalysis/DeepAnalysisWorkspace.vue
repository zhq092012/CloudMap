<template>
  <!-- 深度分析左侧主工作区：顶栏步骤 + 底栏左（分析栏）中（图谱）右（分析面板） -->
  <section class="da-workspace">
    <DeepAnalysisStepBar />

    <div class="da-workspace-body">
      <CollapsibleSidePanel
        v-model:collapsed="leftCollapsed"
        side="left"
        layout="flex"
        :width="380"
        label="分析栏"
        aria-label="深度分析栏"
      >
        <DeepAnalysisLeftPanel />
      </CollapsibleSidePanel>

      <div class="da-col-graph">
        <DeepAnalysisMain />
      </div>

      <CollapsibleSidePanel
        v-model:collapsed="rightCollapsed"
        side="right"
        layout="flex"
        :width="400"
        label="分析面板"
        aria-label="步骤与对象分析面板"
      >
        <DeepAnalysisStepPanel />
      </CollapsibleSidePanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import { provide, ref } from "vue";
import DeepAnalysisStepBar from "@/components/deepAnalysis/DeepAnalysisStepBar.vue";
import DeepAnalysisStepPanel from "@/components/deepAnalysis/DeepAnalysisStepPanel.vue";
import DeepAnalysisLeftPanel from "@/components/deepAnalysis/DeepAnalysisLeftPanel.vue";
import DeepAnalysisMain from "@/components/deepAnalysis/DeepAnalysisMain.vue";
import CollapsibleSidePanel from "@/components/layout/CollapsibleSidePanel.vue";
import { useDeepAnalysisUiSteps } from "@/composables/deepAnalysis/useDeepAnalysisUiSteps";
import { deepAnalysisUiStepsKey } from "@/components/deepAnalysis/deepAnalysisUiStepsKey";

/** 左侧「深度分析栏」是否收起 */
const leftCollapsed = ref(false);
/** 右侧步骤/对象面板是否收起 */
const rightCollapsed = ref(false);

const stepsApi = useDeepAnalysisUiSteps();
provide(deepAnalysisUiStepsKey, stepsApi);
stepsApi.syncAnalysisTypeFromUiStep();
</script>

<style scoped lang="scss">
.da-workspace {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: var(--bg);
}

.da-workspace-body {
  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--bg);
}

.da-col-graph {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.da-workspace :deep(.da-panel--left) {
  width: 100%;
  height: 100%;
}
</style>