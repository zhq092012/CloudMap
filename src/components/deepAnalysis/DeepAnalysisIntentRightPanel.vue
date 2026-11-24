<template>
  <div class="da-panel w-100 shrink-0 h-full font-sans">
    <div class="da-panel-title mb-4">
      意图详情
    </div>

    <div class="grid grid-cols-1 gap-3 mb-4">
      <button
        :disabled="!isIntentSelected"
        class="da-btn da-btn--primary da-btn--block"
        @click="planAnalysis"
      >
        方案画像分析
      </button>
    </div>

    <div v-if="isIntentSelected" class="da-card da-card--green mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="da-dot bg-[var(--green)]"></span>
        <span class="text-[12px] text-[var(--green)] font-semibold tracking-wide">当前选中 · 意图节点</span>
      </div>
      <div class="text-[var(--text)] font-medium text-[13px] leading-relaxed">
        {{ store.selectedNode.text || store.selectedNode.title || "未命名节点" }}
      </div>
      <div class="flex items-center gap-4 mt-2.5 text-[12px] text-[var(--text-muted)]">
        <span>ID:
          <span class="text-[var(--text-2)] font-mono">{{ store.selectedNode.id }}</span></span>
        <span v-if="store.selectedNode.itemId">关联项:
          <span class="text-[var(--text-2)] font-mono">{{ store.selectedNode.itemId }}</span></span>
      </div>
    </div>

    <div class="flex items-center gap-5 text-[12px] text-[var(--text-muted)] mb-3 font-medium">
      <div class="flex items-center gap-1.5">
        <span>置信度</span>
        <span class="text-[var(--green)] font-bold font-mono text-[13px] tracking-normal glow-text">
          {{ nodeConfidenceText }}
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <span>状态</span>
        <span
          class="font-bold text-[13px]"
          :class="[
            store.selectedNode?.deleteStatus == '1'
              ? 'text-[var(--orange)] glow-text-orange'
              : 'text-[var(--green)] glow-text',
          ]"
        >
          {{ store.selectedNode?.deleteStatus == "1" ? "已剪枝" : "活跃" }}
        </span>
      </div>
    </div>

    <div
      v-if="store.selectedNode?.deleteStatus == '1'"
      class="px-3 pb-3 pt-2.5 bg-[rgba(245,158,11,0.06)] text-[12px] border-t border-[rgba(245,158,11,0.25)] rounded-b-md"
    >
      <div class="text-[#fbbf24] font-semibold mb-1.5 flex items-center gap-1.5">
        <el-icon><Warning /></el-icon>
        <span>剪枝理由：</span>
      </div>
      <div class="text-[var(--text-2)] leading-relaxed font-sans pl-4">
        {{ store.selectedNode?.deleteReason || "未提供具体剪枝理由" }}
      </div>
    </div>

    <div class="da-section">
      <div class="da-section-head">
        <span>行动分析</span>
      </div>
      <div class="da-card da-card--sunken space-y-3 text-[12px]">
        <div v-if="resultDataText?.summary">
          <div class="da-kv-label">方案摘要</div>
          <div class="da-block">
            {{ resultDataText?.summary || "" }}
          </div>
        </div>
        <DetailSectionAccordion v-if="resultDataText?.details" :detail="resultDataText?.details" />
        <div v-else-if="outputJsonEntries.length > 0" class="space-y-3">
          <div v-for="entry in outputJsonEntries" :key="entry.key">
            <div class="da-kv-label">{{ entry.label }}</div>
            <div class="da-block leading-relaxed break-words">
              {{ entry.value }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Warning } from "@element-plus/icons-vue";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { useAgentStore } from "@/store/modules/agentStore";
import DetailSectionAccordion from "@/components/analysis/DetailSectionAccordion.vue";
import { useDeepAnalysisNodeData } from "@/composables/deepAnalysis/useDeepAnalysisNodeData";
import { useDeepAnalysisOutputJsonEntries } from "@/composables/deepAnalysis/useDeepAnalysisOutputJsonEntries";

const store = useAnalysisStore();
const agentStore = useAgentStore();
const { resultDataText, nodeConfidenceText } = useDeepAnalysisNodeData();
const { outputJsonEntries } = useDeepAnalysisOutputJsonEntries(resultDataText);

/**
 * 计算当前选中是否为意图节点。
 * 返回 boolean。作用：控制「方案画像分析」按钮是否可用。
 */
const isIntentSelected = computed(() => {
  const node = store.selectedNode;
  return !!node && (node.type === "Intent" || node._type === "Intent");
});

const planAnalysis = async () => {
  const selectedIntents = store.rawNodes
    .filter((n: { type?: string; _selected?: boolean }) => n.type === "Intent" && n._selected)
    .map((n: { id: string }) => n.id);
  const intentIds =
    selectedIntents.length > 0 ? selectedIntents : [store.selectedNode?.id];
  if (!intentIds[0]) return;
  agentStore.setCurrentTaskType("蓝方方案");
  await store.proceedToBluePlan(intentIds);
};
</script>

<style scoped>
.glow-text {
  text-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
}

.tracking-wide {
  letter-spacing: 0.05em;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>