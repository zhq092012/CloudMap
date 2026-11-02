<template>
  <div
    class="w-[400px] h-full bg-[#080d16] text-gray-200 p-4 border-l border-[#16253b] flex flex-col overflow-y-auto custom-scrollbar font-sans text-sm selection:bg-purple-500 selection:text-white">
    <div class="text-base font-semibold text-white mb-4 tracking-wide">
      方案对比核验结果
    </div>

    <!-- <div class="flex flex-col gap-2 mb-4">
      <button
        class="w-full py-2 px-3 bg-[#112035] border border-[#a855f7]/60 text-[#c084fc] hover:bg-[#162e4e] hover:border-[#c084fc] transition-all rounded text-xs font-medium tracking-wider shadow-inner text-center"
        @click="goToComparison">
        查看完整对比报告
      </button>
    </div> -->

    <!-- 选中节点信息卡片 -->
    <div v-if="
      analysisStore.selectedNode &&
      (analysisStore.selectedNode.type === 'Evaluation' ||
        analysisStore.selectedNode._type === 'Evaluation')
    " class="border border-[#a855f7]/50 bg-[#1a1028]/80 rounded p-3 mb-4 shadow-lg animate-fade-in">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-2 h-2 rounded-full bg-[#a855f7] shrink-0"></span>
        <span class="text-[11px] text-[#a855f7] font-semibold tracking-wider">当前选中 · 核验评估节点</span>
      </div>
      <div class="text-white font-medium text-sm leading-relaxed tracking-wide cursor-pointer hover:text-purple-300"
        title="点击查看完整报告" @click="openDetailDialog(analysisStore.selectedNode)">
        {{
          analysisStore.selectedNode.text || analysisStore.selectedNode.title || "未命名节点"
        }}
      </div>
      <div class="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
        <span>ID:
          <span class="text-gray-300 font-mono">{{
            analysisStore.selectedNode.id
          }}</span></span>
      </div>
    </div>

    <div v-if="analysisStore.selectedNode.summary" class="mb-4 p-3 bg-[#0a0e15]/80 border border-[#a855f7]/50 rounded-lg">
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
    <div class="mb-4 p-4 border rounded shadow-lg" :class="[
      analysisStore.selectedNode?.isRecommended
        ? 'border-[#22c55e]/60 bg-[#0a1a14]/90'
        : 'border-[#a855f7]/40 bg-[#14101e]/90'
    ]">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-gray-400 font-medium">综合评分</span>
          <span class="text-[#22c55e] font-bold font-mono text-lg glow-green">
            {{ analysisStore.selectedNode.confidence ? Math.round(analysisStore.selectedNode.confidence) : 'N/A' }}%
          </span>
        </div>
        <div v-if="analysisStore.selectedNode?.isRecommended"
          class="px-2 py-1 bg-[#22c55e]/20 border border-[#22c55e]/40 rounded text-[#22c55e] text-xs font-bold">
          ★ 推荐候选方案
        </div>
      </div>
      <div class="w-full h-2 bg-slate-800 rounded-sm overflow-hidden">
        <div class="h-full bg-[#22c55e] rounded-sm shadow-[0_0_8px_rgba(34,197,94,0.5)]"
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

    <!--
    <div class="mb-4 p-4 border rounded shadow-lg  text-xs" :class="[
      analysisStore.selectedNode?.isRecommended
        ? 'border-[#22c55e]/60 bg-[#0a1a14]/90'
        : 'border-[#a855f7]/40 bg-[#14101e]/90'
    ]">
      <div class="text-gray-500 mb-2.5">方案详情</div>
      <div>{{ resultDataText?.details }}</div>
    </div>
    -->

    <!-- 评估矩阵 -->
    <!--div class="border border-[#16253b] bg-[#111622]/60 rounded p-4 mb-4">
      <div class="text-xs font-semibold text-gray-300 mb-4 flex items-center justify-between">
        <span>多维评估矩阵</span>
        <span class="text-[11px] font-medium">
          综合得分
          <span class="text-[#22c55e] font-mono font-bold ml-1">
            {{ analysisStore.selectedNode.confidence ? Math.round(analysisStore.selectedNode.confidence) : 0 }}%
          </span>
        </span>
      </div>

      <div class="space-y-3">
        <div v-for="item in evalMatrix" :key="item.label" class="flex items-center text-xs">
          <span class="w-20 text-gray-400 shrink-0 font-medium">{{ item.label }}</span>
          <div class="flex-1 h-2 bg-slate-800/80 rounded-sm mx-3 overflow-hidden">
            <div class="h-full rounded-sm" :class="item.value > 70 ? 'bg-[#22c55e]/80' : item.value > 50 ? 'bg-[#f59e0b]/80' : 'bg-[#ef4444]/80'"
              :style="{ width: item.value + '%' }"></div>
          </div>
          <span class="w-8 text-right font-mono font-bold" :class="item.value > 70 ? 'text-[#22c55e]/90' : item.value > 50 ? 'text-[#f59e0b]/90' : 'text-[#ef4444]/90'">
            {{ item.value }}%
          </span>
        </div>
      </div>
    </div-->

    <!-- 评估详情折叠 -->
    <!--
    <el-collapse v-model="activeNames" class="custom-inference-accordion">
      <el-collapse-item name="conflicts">
        <template #title>
          <div class="collapse-header-content">
            <span>时空冲突检测结果</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="text-gray-400 text-[11px] leading-relaxed mb-2">
            F10时空冲突检测Agent对方案进行了以下冲突分析：
          </div>
          <div v-if="analysisStore.selectedNode" class="space-y-2">
            <div class="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
              {{ getEvalField(analysisStore.selectedNode, '时空冲突检测结果') }}
            </div>
          </div>
          <div v-else class="text-xs text-gray-500">
            请先选择一个核验节点查看详情
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="criteria">
        <template #title>
          <div class="collapse-header-content">
            <span>判据逻辑校验报告</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="text-gray-400 text-[11px] leading-relaxed mb-2">
            F11判据逻辑校验Agent对方案进行了判据一致性分析：
          </div>
          <div v-if="analysisStore.selectedNode" class="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
            {{ getEvalField(analysisStore.selectedNode, '判据逻辑校验报告') }}
          </div>
          <div v-else class="text-xs text-gray-500">
            请先选择一个核验节点查看详情
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="risks">
        <template #title>
          <div class="collapse-header-content">
            <span>风险评估报告</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="text-gray-400 text-[11px] leading-relaxed mb-2">
            F12风险评估Agent识别了以下风险：
          </div>
          <div v-if="analysisStore.selectedNode" class="space-y-2">
            <div class="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
              {{ getEvalField(analysisStore.selectedNode, '风险评估报告') }}
            </div>
            <div v-if="analysisStore.selectedNode.riskLevel" class="mt-2 flex items-center gap-2">
              <span class="text-gray-500 text-xs">综合风险等级:</span>
              <span class="font-mono font-bold text-xs" :class="[
                analysisStore.selectedNode.riskLevel === 'CRITICAL' ? 'text-red-400' :
                analysisStore.selectedNode.riskLevel === 'HIGH' ? 'text-orange-400' :
                analysisStore.selectedNode.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                'text-emerald-400'
              ]">
                {{ analysisStore.selectedNode.riskLevel }}
              </span>
            </div>
          </div>
          <div v-else class="text-xs text-gray-500">
            请先选择一个核验节点查看详情
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="evidence">
        <template #title>
          <div class="collapse-header-content">
            <span>情报核验结果</span>
          </div>
        </template>
        <div class="collapse-body-content">
          <div class="text-gray-400 text-[11px] leading-relaxed mb-2">
            F16情报核验Agent对核验中的关键不确定性进行了回溯验证：
          </div>
          <div v-if="analysisStore.selectedNode" class="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
            {{ getEvalField(analysisStore.selectedNode, '情报核验') || getEvalField(analysisStore.selectedNode, '证据链') || '情报核验已触发，确保证据链完整。' }}
          </div>
          <div v-else class="text-xs text-gray-500">
            请先选择一个核验节点查看详情
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
    -->
    <DetailSectionAccordion :detail="resultDataText?.details" />

    <!-- 方案排序 -->
    <div v-if="analysisStore.rawNodes.filter((n: any) => n.type === 'Evaluation').length > 1"
      class="border border-[#16253b] bg-[#111622]/60 rounded p-3 mb-4 mt-4">
      <div class="text-xs font-semibold text-gray-300 mb-3">红方方案排序</div>
      <div v-for="(n, i) in sortedEvalNodes" :key="n.id"
        class="flex items-center justify-between py-1.5 px-2 rounded mb-1 cursor-pointer"
        title="点击查看完整报告" @click="openDetailDialog(n)"
        :class="[
          n.isRecommended ? 'bg-[#22c55e]/10 border border-[#22c55e]/30' :
          n._selected ? 'bg-[#a855f7]/10 border border-[#a855f7]/30' :
          'bg-transparent hover:bg-[#0d1117]'
        ]">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            :class="[
              i === 0 ? 'bg-[#22c55e]/30 text-[#22c55e]' :
              i === 1 ? 'bg-[#94a3b8]/30 text-[#94a3b8]' :
              i === 2 ? 'bg-[#f59e0b]/30 text-[#f59e0b]' :
              'bg-[#1e293b] text-gray-400'
            ]">
            {{ i + 1 }}
          </span>
          <span class="text-xs text-gray-200 truncate max-w-48">{{ n.text }}</span>
          <span v-if="n.isRecommended" class="text-[#22c55e] text-[10px]">★推荐</span>
        </div>
        <span class="text-xs font-mono font-bold"
          :class="Number(n.confidence) > 70 ? 'text-[#22c55e]' : Number(n.confidence) > 50 ? 'text-[#f59e0b]' : 'text-[#ef4444]'">
          {{ Math.round(Number(n.confidence)) }}%
        </span>
      </div>
    </div>

    <AnalysisNodeDetailDialog v-model:visible="detailDialogVisible" :node="detailDialogNode" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Document } from "@element-plus/icons-vue";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { useComparisonStore } from "@/store/modules/comparisionStore";
import DetailSectionAccordion from "@/components/DetailSectionAccordion.vue";
import AnalysisNodeDetailDialog from "@/components/analysisNodeDetailDialog.vue";

/* 点击方案名/排序行 → 完整方案弹窗（与画布节点名点击同一组件） */
const detailDialogVisible = ref(false);
const detailDialogNode = ref<any>(null);

function openDetailDialog(node: any) {
  const t = node?.type;
  if (t !== "Attack" && t !== "Defense" && t !== "Evaluation") return;
  detailDialogNode.value = node;
  detailDialogVisible.value = true;
}

const analysisStore = useAnalysisStore();
const comparisonStore = useComparisonStore();

const store = useAnalysisStore();
// 选中节点的 nodeData / confidence 展示用计算属性
const resultDataText = computed<Record<string, any>>(() => {
  const nd = store.selectedNode?.nodeData;
  if (nd == null) return {};

  try {
    const obj = typeof nd === "string" ? JSON.parse(nd) : nd;
    if (obj && typeof obj === "object") {
      return obj as Record<string, any>;
    }
    return { value: obj };
  } catch {
    return { value: typeof nd === "string" ? nd : String(nd) };
  }
});

// const activeNames = ref<string[]>([]);

const evalMatrix = computed(() => {
  const conf = analysisStore.selectedNode?.confidence || 0;
  return [
    { label: "时空冲突", value: Math.min(100, Math.max(0, 100 - Math.round(conf * 0.3))) },
    { label: "判据可行性", value: Math.min(100, Math.max(0, conf - 5)) },
    { label: "风险等级", value: Math.min(100, Math.max(0, 100 - getRiskScore(analysisStore.selectedNode?.riskLevel))) },
    { label: "资源利用率", value: Math.min(100, Math.max(0, conf - 10)) },
  ];
});

const getRiskScore = (level: string) => {
  switch (level) {
    case "CRITICAL": return 40;
    case "HIGH": return 25;
    case "MEDIUM": return 15;
    case "LOW": return 5;
    default: return 15;
  }
};

const sortedEvalNodes = computed(() => {
  return analysisStore.rawNodes
    .filter((n: any) => n.type === "Evaluation")
    .sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0));
});

// const getEvalField = (node: any, keyword: string): string => {
//   try {
//     const details = node.raw?.nodeData;
//     const parsed = typeof details === "string" ? JSON.parse(details) : details;
//     const fullText = parsed?.details || parsed?.summary || "";
//     const idx = fullText.indexOf(keyword);
//     if (idx === -1) return "";
//     const rest = fullText.substring(idx + keyword.length).split("\n").find((line: string) => line.trim());
//     return rest || fullText.substring(idx, Math.min(idx + 500, fullText.length));
//   } catch {
//     return "";
//   }
// };

void comparisonStore;
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
  background: #080d16;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

:deep(.custom-inference-accordion) {
  border: none !important;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.custom-inference-accordion .el-collapse-item) {
  background-color: #111622 !important;
  border: 1px solid #1c2435 !important;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.custom-inference-accordion .el-collapse-item__header) {
  background-color: #111622 !important;
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
  color: #94a3b8 !important;
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
  color: #94a3b8;
  line-height: 1.6;
  border-top: 1px solid #161f30;
}
</style>
