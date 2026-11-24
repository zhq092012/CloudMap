<template>
  <!-- 左侧工作区顶部：8 步条 +「确认并继续」 -->
  <header class="da-step-bar">
    <div class="da-step-rail custom-scrollbar">
      <button
        v-for="step in stepsApi.steps"
        :key="step.key"
        type="button"
        class="da-step-pill"
        :class="{
          'is-active': step.index === currentStepIndex,
          'is-done': step.index < currentStepIndex,
        }"
        @click="stepsApi.goToStep(step.index)"
      >
        <span class="da-step-num">{{ step.index + 1 }}</span>
        <span class="da-step-title">{{ step.title }}</span>
      </button>
    </div>

    <div class="da-step-actions">
      <span class="da-step-progress">
        {{ currentStepIndex + 1 }}/{{ stepsApi.totalSteps }}
      </span>
      <button
        type="button"
        class="da-btn da-btn--primary da-btn--sm"
        :disabled="confirming"
        @click="stepsApi.confirmAndContinue()"
      >
        {{ confirming ? "处理中…" : isLastStep ? "完成" : "确认并继续" }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { deepAnalysisUiStepsKey } from "@/components/deepAnalysis/deepAnalysisUiStepsKey";

const stepsApi = inject(deepAnalysisUiStepsKey);
if (!stepsApi) {
  throw new Error("DeepAnalysisStepBar 必须在 DeepAnalysisWorkspace 内使用");
}

const currentStepIndex = computed(() => stepsApi.currentStepIndex.value);
const confirming = computed(() => stepsApi.confirming.value);
const isLastStep = computed(() => stepsApi.isLastStep.value);
</script>

<style scoped lang="scss">
.da-step-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 8px 12px;
  flex-shrink: 0;
  background: var(--bg-sunken);
  border-bottom: 1px solid var(--border);
}

.da-step-rail {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.da-step-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover {
    border-color: var(--border-strong);
    color: var(--text);
  }

  &.is-active {
    color: var(--accent-text);
    background: rgba(59, 130, 246, 0.14);
    border-color: rgba(59, 130, 246, 0.55);
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.15);
  }

  &.is-done {
    color: var(--green);
    border-color: rgba(16, 185, 129, 0.35);
  }
}

.da-step-num {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 700;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.15);
  color: inherit;
}

.is-active .da-step-num {
  background: rgba(59, 130, 246, 0.35);
}

.da-step-title {
  font-weight: 600;
  white-space: nowrap;
}

.da-step-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.da-step-progress {
  font-size: 12px;
  font-family: ui-monospace, monospace;
  color: var(--text-faint);
}

.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
</style>