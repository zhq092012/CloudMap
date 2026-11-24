<template>
  <div
    class="da-panel w-[400px] shrink-0 h-full font-sans">
    <div class="da-panel-title mb-4">
      方案对比核验结果
    </div>

    


    <!-- 选中节点信息卡片 -->
    <div v-if="
      analysisStore.selectedNode &&
      (analysisStore.selectedNode.type === 'Evaluation' ||
        analysisStore.selectedNode._type === 'Evaluation')
    " class="da-card da-card--accent mb-4 animate-fade-in">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0"></span>
        <span class="text-[12px] text-[#3b82f6] font-semibold tracking-wider">当前选中 · 核验评估节点</span>
      </div>
      <div class="text-[var(--text)] font-medium text-[13px] leading-relaxed tracking-wide cursor-pointer hover:text-[var(--accent-text)]"
        title="点击查看完整报告" @click="openDetailDialog(analysisStore.selectedNode)">
        {{
          analysisStore.selectedNode.text || analysisStore.selectedNode.title || "未命名节点"
        }}
      </div>
      <div class="flex items-center gap-4 mt-2 text-[11.5px] text-gray-400">
        <span>ID:
          <span class="text-gray-300 font-mono">{{
            analysisStore.selectedNode.id
          }}</span></span>
      </div>
    </div>

    <div v-if="analysisStore.selectedNode.summary" class="da-card da-card--sunken mb-4">
      <div class="flex items-center gap-1.5 text-gray-400 font-semibold mb-1.5 text-xs">
        <el-icon class="text-xs">
          <Document />
        </el-icon>
        <span>评估摘要</span>
      </div>
      <div class="text-gray-200 text-xs leading-relaxed font-sans tracking-wide pl-6">
        {{ resultDataText?.summary }}
      </div>
    </div>

    <!-- 综合评分 -->
    <div class="da-card mb-4" :class="
      analysisStore.selectedNode?.isRecommended ? 'da-card--green' : 'da-card--accent'
    ">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-gray-400 font-medium">综合评分</span>
          <span class="text-[#10b981] font-bold font-mono text-lg glow-green">
            {{ analysisStore.selectedNode.confidence ? Math.round(analysisStore.selectedNode.confidence) : 'N/A' }}%
          </span>
        </div>
        <div v-if="analysisStore.selectedNode?.isRecommended"
          class="px-2 py-1 bg-[rgba(16,185,129,0.14)] border border-[rgba(16,185,129,0.4)] rounded text-[#34d399] text-[11.5px] font-bold">
          ★ 推荐候选方案
        </div>
      </div>
      <div class="w-full h-2 bg-slate-800 rounded-sm overflow-hidden">
        <div class="h-full bg-[#10b981] rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.45)]"
          :style="{ width: (analysisStore.selectedNode.confidence || 0) + '%' }"></div>
      </div>
      <div class="mt-3 space-y-2 text-xs text-gray-300">
        <div class="flex items-start">
          <span class="text-gray-500 w-20 shrink-0">风险等级</span>
          <span class="font-mono font-bold" :class="[
            analysisStore.selectedNode.riskLevel === 'CRITICAL' ? 'text-red-400' :
            analysisStore.selectedNode.riskLevel === 'HIGH' ? 'text-orange-400' :
            analysisStore.selectedNode.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
            'text-emerald-400'
          ]">
            {{ resultDataText?.riskLevel || 'MEDIUM' }}
          </span>
        </div>
        <div class="flex items-start">
          <span class="text-gray-500 w-20 shrink-0">是否推荐</span>
          <span class="text-gray-200">{{ resultDataText?.isRecommended ? '推荐' : '不推荐' }}</span>
        </div>
      </div>
    </div>

    


    <!-- 评估矩阵 -->
    


    <!-- 评估详情折叠 -->
    

    <DetailSectionAccordion :detail="resultDataText?.details" />

    <!-- 方案排序 -->
    <div v-if="analysisStore.rawNodes.filter((n: any) => n.type === 'Evaluation').length > 1"
      class="border border-[#2d3a4d] bg-[#1a2332]/60 rounded p-3 mb-4 mt-4">
      <div class="text-xs font-semibold text-gray-300 mb-3">红方方案排序</div>
      <div v-for="(n, i) in sortedEvalNodes" :key="n.id"
        class="flex items-center justify-between py-1.5 px-2 rounded mb-1 cursor-pointer"
        title="点击查看完整报告" @click="openDetailDialog(n)"
        :class="[
          n.isRecommended ? 'bg-[#10b981]/10 border border-[#10b981]/30' :
          n._selected ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/30' :
          'bg-transparent hover:bg-[#0d1117]'
        ]">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-[11.5px] font-bold"
            :class="[
              i === 0 ? 'bg-[#10b981]/30 text-[#10b981]' :
              i === 1 ? 'bg-[#9ca3af]/30 text-[#9ca3af]' :
              i === 2 ? 'bg-[#f59e0b]/30 text-[#f59e0b]' :
              'bg-[#2d3a4d] text-gray-400'
            ]">
            {{ i + 1 }}
          </span>
          <span class="text-xs text-gray-200 truncate max-w-48">{{ n.text }}</span>
          <span v-if="n.isRecommended" class="text-[#10b981] text-[11.5px]">★推荐</span>
        </div>
        <span class="text-xs font-mono font-bold"
          :class="Number(n.confidence) > 70 ? 'text-[#10b981]' : Number(n.confidence) > 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'">
          {{ Math.round(Number(n.confidence)) }}%
        </span>
      </div>
    </div>

    <AnalysisNodeDetailDialog v-model:visible="detailDialogVisible" :node="detailDialogNode" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Document } from "@element-plus/icons-vue";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import DetailSectionAccordion from "@/components/analysis/DetailSectionAccordion.vue";
import AnalysisNodeDetailDialog from "@/components/analysis/analysisNodeDetailDialog.vue";
import { useDeepAnalysisNodeData } from "@/composables/deepAnalysis/useDeepAnalysisNodeData";
import { useDeepAnalysisNodeDetailDialog } from "@/composables/deepAnalysis/useDeepAnalysisNodeDetailDialog";

const analysisStore = useAnalysisStore();
const { resultDataText } = useDeepAnalysisNodeData({ deepNormalize: false });
const { detailDialogVisible, detailDialogNode, openDetailDialog } =
  useDeepAnalysisNodeDetailDialog();

/**
 * 计算画布中 Evaluation 节点按置信度降序列表。
 * 返回节点数组。作用：右栏「红方方案排序」展示与点击打开详情。
 */
const sortedEvalNodes = computed(() =>
  [...analysisStore.rawNodes]
    .filter((n) => (n as { type?: string }).type === "Evaluation")
    .sort(
      (a, b) =>
        Number((b as { confidence?: number }).confidence || 0) -
        Number((a as { confidence?: number }).confidence || 0),
    ),
);
</script>

<style scoped>
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

.glow-green {
  text-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #111827;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4d64;
}

:deep(.custom-inference-accordion) {
  border: none !important;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.custom-inference-accordion .el-collapse-item) {
  background-color: #1a2332 !important;
  border: 1px solid #2d3a4d !important;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.custom-inference-accordion .el-collapse-item__header) {
  background-color: #1a2332 !important;
  color: #ffffff !important;
  height: 42px !important;
  line-height: 42px !important;
  padding: 0 16px !important;
  border-bottom: none !important;
  font-size: 13px !important;
  font-weight: 500;
  letter-spacing: 0.05em;
  transition: background-color 0.2s ease;
}

:deep(.custom-inference-accordion .el-collapse-item__header:hover) {
  background-color: #161d2d !important;
}

:deep(.custom-inference-accordion .el-collapse-item__arrow) {
  color: #9ca3af !important;
  font-size: 13px;
}

:deep(.custom-inference-accordion .el-collapse-item__wrap) {
  background-color: #0a0e17 !important;
  border-bottom: none !important;
}

.collapse-header-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.collapse-body-content {
  padding: 12px 16px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.6;
  border-top: 1px solid #161f30;
}
</style>
