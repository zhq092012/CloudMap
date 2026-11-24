<template>
  <div class="da-step-panel">
    <nav class="da-step-panel__tabs" role="tablist" aria-label="分析面板视图">
      <button
        type="button"
        role="tab"
        class="da-step-panel__tab"
        :class="{ 'is-active': activeTab === 'step' }"
        :aria-selected="activeTab === 'step'"
        @click="activeTab = 'step'"
      >
        步骤
      </button>
      <button
        type="button"
        role="tab"
        class="da-step-panel__tab"
        :class="{ 'is-active': activeTab === 'object' }"
        :aria-selected="activeTab === 'object'"
        @click="activeTab = 'object'"
      >
        对象
      </button>
    </nav>

    <div class="da-step-panel__body" role="tabpanel">
      <DeepAnalysisRightPanelStepTab
        v-show="activeTab === 'step'"
        :content="stepPanelContent"
      />
      <DeepAnalysisRightPanelObjectTab
        v-show="activeTab === 'object'"
        :content="objectPanelContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";
import { deepAnalysisUiStepsKey } from "@/components/deepAnalysis/deepAnalysisUiStepsKey";
import DeepAnalysisRightPanelStepTab from "@/components/deepAnalysis/rightPanel/DeepAnalysisRightPanelStepTab.vue";
import DeepAnalysisRightPanelObjectTab from "@/components/deepAnalysis/rightPanel/DeepAnalysisRightPanelObjectTab.vue";
import { useDeepAnalysisRightPanelContent } from "@/composables/deepAnalysis/useDeepAnalysisRightPanelContent";
import type { DeepAnalysisRightPanelTab } from "@/types/deepAnalysisRightPanel";

const stepsApi = inject(deepAnalysisUiStepsKey);
if (!stepsApi) {
  throw new Error("DeepAnalysisStepPanel 必须在 DeepAnalysisWorkspace 内使用");
}

/** 当前 Tab：步骤 | 对象 */
const activeTab = ref<DeepAnalysisRightPanelTab>("step");

const { stepPanelContent, objectPanelContent } = useDeepAnalysisRightPanelContent(
  stepsApi.currentStep,
);
</script>

<style scoped>
.da-step-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--bg-panel, #111827);
}

.da-step-panel__tabs {
  display: flex;
  flex-shrink: 0;
  gap: 0;
  padding: 0 14px;
  border-bottom: 1px solid #2d3a4d;
}

.da-step-panel__tab {
  position: relative;
  padding: 10px 14px 9px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.da-step-panel__tab:hover {
  color: #9ca3af;
}

.da-step-panel__tab.is-active {
  color: #f3f4f6;
}

.da-step-panel__tab.is-active::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 2px;
  background: #f3f4f6;
  border-radius: 2px 2px 0 0;
}

.da-step-panel__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.da-step-panel__body > * {
  flex: 1;
  min-height: 0;
}
</style>