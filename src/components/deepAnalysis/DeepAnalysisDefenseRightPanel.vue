<template>
  <div
    class="da-panel w-[400px] shrink-0 h-full font-sans">
    <div class="da-panel-title mb-4">
      红方防御方案详情
    </div>

    <div class="flex flex-col gap-2 mb-4">
      <button
        class="da-btn da-btn--danger da-btn--block"
        @click="comparisionPlan">
        进入方案对比核验
      </button>
      

    </div>
    <!-- 选中节点信息卡片 -->
    <div v-if="
      store.selectedNode &&
      (store.selectedNode.type === 'Defense' ||
        store.selectedNode._type === 'Defense')
    " class="border border-[#ef4444]/50 bg-[#1f0c0c]/80 rounded p-3 mb-4 shadow-lg animate-fade-in">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-2 h-2 rounded-full bg-[#ef4444] shrink-0"></span>
        <span class="text-[12px] text-[#ef4444] font-semibold tracking-wider">当前选中 · 防御方案节点</span>
      </div>
      <div class="text-[var(--text)] font-medium text-[13px] leading-relaxed tracking-wide cursor-pointer hover:text-red-300"
        title="点击查看完整方案" @click="openDetailDialog(store.selectedNode)">
        {{
          store.selectedNode.text || store.selectedNode.title || "未命名节点"
        }}
      </div>
      <div class="flex items-center gap-4 mt-2 text-[11.5px] text-gray-400">
        <span>ID:
          <span class="text-gray-300 font-mono">{{
            store.selectedNode.id
          }}</span></span>
        <span v-if="store.selectedNode.reportId">关联方案:
          <span class="text-gray-300 font-mono">{{
            store.selectedNode.reportId
          }}</span></span>
      </div>
    </div>
    <div v-if="store.selectedNode.summary" class="mb-4 p-3 bg-[#0f1622]/80 border border-[#ef4444]/60 rounded-lg">
      <div class="flex items-center gap-1.5 text-gray-400 font-semibold mb-1.5 text-xs">
        <el-icon class="text-xs">
          <Document />
        </el-icon>
        <span>分析摘要</span>
      </div>
      <div class="text-gray-200 text-xs leading-relaxed font-sans tracking-wide pl-6">
        {{ resultDataText?.summary || "" }}
      </div>
    </div>

    <div class="border border-[#ef4444]/60 bg-[#1a2332]/90 rounded p-3 mb-4 shadow-lg">
      <div class="flex items-center gap-1.5 mb-2.5">
        <span class="text-xs text-[#10b981]/90 font-medium">方案置信度</span>
        <span class="text-[#10b981] font-bold font-mono text-sm glow-green">{{ nodeConfidenceText }}</span>
      </div>
      <div class="w-full h-2.5 bg-slate-800 rounded-sm mb-5 overflow-hidden">
          <div class="h-full bg-[#10b981] rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.45)]" :style="{ width: (store.selectedNode?.confidence || 0) + '%' }"></div>
        </div>
      

    </div>

    


    

    <DetailSectionAccordion :detail="resultDataText?.details" append-suffix="（推断）" />

    <AnalysisNodeDetailDialog v-model:visible="detailDialogVisible" :node="detailDialogNode" />
  </div>
</template>

<script setup lang="ts">
import { Document } from "@element-plus/icons-vue";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { useAgentStore } from "@/store/modules/agentStore";
import { ElMessage } from "element-plus";
import DetailSectionAccordion from "@/components/DetailSectionAccordion.vue";
import AnalysisNodeDetailDialog from "@/components/analysisNodeDetailDialog.vue";
import { useDeepAnalysisNodeData } from "@/composables/deepAnalysis/useDeepAnalysisNodeData";
import { useDeepAnalysisNodeDetailDialog } from "@/composables/deepAnalysis/useDeepAnalysisNodeDetailDialog";

const store = useAnalysisStore();
const agentStore = useAgentStore();
const { resultDataText, nodeConfidenceText } = useDeepAnalysisNodeData({
  deepNormalize: false,
});
const { detailDialogVisible, detailDialogNode, openDetailDialog } =
  useDeepAnalysisNodeDetailDialog();

const comparisionPlan = async () => {
  const selectedDefenses = store.rawNodes.filter(
    (n: any) => n.type === "Defense" && n._selected
  ).map((n: any) => n.id)

  const defenseIds = selectedDefenses.length > 0 ? selectedDefenses : [store.selectedNode?.id]

  if (!defenseIds[0]) {
    ElMessage.warning("请先选择一个红方方案节点")
    return
  }

  store.analysisType = "evaluation"
  agentStore.setCurrentTaskType("方案核验")

  await store.proceedToEvaluation(defenseIds)
};
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

/* 荧光绿文字微发光 */
.glow-green {
  text-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

/* 穿透定制 Element Plus 折叠面板样式以融合军工UI */
:deep(.custom-tactical-collapse) {
  border: none !important;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.custom-tactical-collapse .el-collapse-item) {
  border: 1px solid #2d3a4d !important;
  background-color: #1a2332 !important;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.custom-tactical-collapse .el-collapse-item__header) {
  background-color: #1a2332 !important;
  color: #e5e7eb !important;
  border-bottom: none !important;
  height: 38px !important;
  padding: 0 12px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

:deep(.custom-tactical-collapse .el-collapse-item__wrap) {
  background-color: transparent !important;
  border-bottom: none !important;
}

:deep(.custom-tactical-collapse .el-collapse-item__content) {
  padding: 0 !important;
}

/* 隐藏或微调原生滚动条 */
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

/* ==========================================================================
   深度穿透复刻：暗黑军事风独立竖向折叠面板
   ========================================================================== */

/* 移除全局折叠面板的自带边框与背景 */
:deep(.custom-inference-accordion) {
  border: none !important;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 强制每一个 item 之间产生竖向间隔 */
}

/* 每一个独立的竖向框体 */
:deep(.custom-inference-accordion .el-collapse-item) {
  background-color: #1a2332 !important;
  /* 灰黑蓝色头部背景 */
  border: 1px solid #2d3a4d !important;
  /* 低调内敛的科技线框 */
  border-radius: 4px;
  overflow: hidden;
}

/* 折叠面板头部样式 */
:deep(.custom-inference-accordion .el-collapse-item__header) {
  background-color: #1a2332 !important;
  color: #ffffff !important;
  height: 42px !important;
  /* 适中的竖向高度槽 */
  line-height: 42px !important;
  padding: 0 16px !important;
  border-bottom: none !important;
  /* 收起时移除下边框 */
  font-size: 13px !important;
  font-weight: 500;
  letter-spacing: 0.05em;
  transition: background-color 0.2s ease;
}

:deep(.custom-inference-accordion .el-collapse-item__header:hover) {
  background-color: #161d2d !important;
  /* 鼠标悬停微亮反馈 */
}

/* 右侧原生箭头样式微调 */
:deep(.custom-inference-accordion .el-collapse-item__arrow) {
  color: #9ca3af !important;
  /* 浅灰蓝色箭头 */
  font-size: 13px;
}

/* 展开后的内容包裹层 */
:deep(.custom-inference-accordion .el-collapse-item__wrap) {
  background-color: #0a0e17 !important;
  /* 展开后的内容区背景比头部更深 */
  border-bottom: none !important;
}

/* 核心内容样式类 */
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
  /* 展开后，内容与头部的虚隔线 */
}

/* 完美适配内嵌表格的精致窄边滚动条 */
.custom-table-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-table-scrollbar::-webkit-scrollbar-track {
  background: #1a2332;
  border-radius: 2px;
}

.custom-table-scrollbar::-webkit-scrollbar-thumb {
  background: #2e394e;
  border-radius: 2px;
}

.custom-table-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4b66;
}
</style>
