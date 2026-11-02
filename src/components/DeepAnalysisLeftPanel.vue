<template>
  <div
    class="w-95 bg-[#111625]/90 border border-slate-800/80 rounded p-3 flex flex-col h-full min-h-0 shadow-xl select-none">
    <h2 class="text-base font-bold text-slate-100 mb-3 shrink-0 flex items-center gap-2">
      🧠 深度分析栏
    </h2>

    <div v-if="analysisStore.workflowTitle"
      class="shrink-0 mb-2 px-2 py-1 rounded border border-slate-700/50 bg-slate-800/40">
      <div class="text-[10px] text-slate-400 truncate" :title="analysisStore.workflowTitle">
        当前流程：{{ analysisStore.workflowTitle }}
      </div>
    </div>

    <div class="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
      <div v-for="(item, idx) in listData" :key="idx"
        class="p-2.5 bg-[#161c2e]/50 border border-slate-800/80 rounded hover:border-slate-700/80 transition-colors">
        <div class="space-y-1.5 flex flex-col">
          <div class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span :class="item.isHexagon
              ? 'text-amber-500 font-mono text-sm'
              : 'text-amber-500 text-xs'
              ">
              {{ item.isHexagon ? "⬢" : "◆" }}
            </span>
            <span>{{ item.title }}</span>
          </div>

          <div class="flex items-center gap-4 text-[10px] text-slate-400">
            <div>
              {{ item.isHexagon ? "综合威胁度" : "威胁度" }}
              <span class="text-amber-500 font-mono font-bold ml-1">{{
                item.threat
              }}</span>
            </div>

            <div>
              {{ item.isHexagon ? "综合异常度" : "异常度" }}
              <span class="text-slate-400 font-mono font-bold ml-1">{{
                item.anomaly
              }}</span>
              <span class="text-slate-400 font-mono ml-0.5">&nbsp;(置信度 {{ item.anomalyConf }})</span>
            </div>
          </div>

          <!-- Start Analysis Action footer -->
          <div class="flex justify-between items-center pt-2 border-t border-slate-800/30 mt-1 shrink-0">
            <span class="text-[9px] text-slate-500">
              状态: {{ isAlreadyLoaded(item) ? "分析中" : "就绪" }}
            </span>
            <button v-if="!isAlreadyLoaded(item) && !isAnalyzingItem(item)" @click.stop="startAnalysis(item)"
              class="px-2.5 py-0.5 bg-blue-950/60 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white rounded text-[10px] transition-all cursor-pointer shadow-sm font-medium">
              开始分析
            </button>
            <button v-else-if="isAnalyzingItem(item)" disabled
              class="px-2.5 py-0.5 bg-blue-950/60 border border-blue-500/30 text-blue-300 rounded text-[10px] transition-all cursor-not-allowed shadow-sm font-medium opacity-60">
              ⏳ 分析中
            </button>
            <span v-else-if="isAlreadyLoaded(item) && isInCurrentFlow(item)" class="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
              ✓ 已载入图谱
            </span>
            <button v-else-if="analysisStore.workflowId" :disabled="isJoiningItem(item)" @click.stop="joinToCurrentFlow(item)"
              class="px-2.5 py-0.5 bg-amber-950/60 hover:bg-amber-600/60 border border-amber-500/30 text-amber-400 hover:text-white rounded text-[10px] transition-all cursor-pointer shadow-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
              {{ isJoiningItem(item) ? "⏳ 载入中" : "加入当前分析" }}
            </button>
            <button v-else :disabled="isJoiningItem(item)" @click.stop="loadHistoryAnomaly(item)"
              class="px-2.5 py-0.5 bg-slate-800/80 hover:bg-slate-600/60 border border-slate-500/30 text-slate-300 hover:text-white rounded text-[10px] transition-all cursor-pointer shadow-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
              {{ isJoiningItem(item) ? "⏳ 载入中" : "载入历史分析" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHomeStore } from "@/store/modules/homeStore";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { computed, ref } from "vue";
import { useAgentStore } from "@/store/modules/agentStore";
import { confirmAnomaly } from "@/api/anomalies";
import {
  listDeepAnalysisNodesByType,
  addAnomaliesToWorkflow,
} from "@/api/deep-analysis";
import { ElMessage } from "element-plus";
const homestore = useHomeStore();
const analysisStore = useAnalysisStore();
const agentStore = useAgentStore();
const analyzingAnomalyIds = ref<Set<string>>(new Set());
const joiningAnomalyIds = ref<Set<string>>(new Set());
const isAlreadyLoaded = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return analysisStore.coveredAnomalyIds.includes(itemId);
};
const isAnalyzingItem = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return analyzingAnomalyIds.value.has(itemId);
};
const isInCurrentFlow = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return !!itemId && analysisStore.anomalyIds.includes(itemId);
};
const isJoiningItem = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return joiningAnomalyIds.value.has(itemId);
};

const startAnalysis = async (item: any) => {
  const anomalyId = item.anomalyId || item.id
  if (!anomalyId) {
    ElMessage.warning("缺少异常事件ID，无法启动分析")
    return
  }

  if (analysisStore.coveredAnomalyIds.includes(anomalyId)) {
    ElMessage.info("该异常已分析")
    return
  }

  analyzingAnomalyIds.value.add(anomalyId);

  try {
    if (!analysisStore.workflowId) {
      agentStore.setCurrentTaskType("意图穷举")
      analysisStore.resetAnalysis()
      await analysisStore.startAnalysis(anomalyId)
    } else {
      const workflow = await addAnomaliesToWorkflow(analysisStore.workflowId as string, [anomalyId])
      analysisStore.anomalyIds = workflow.anomalyIds || [...analysisStore.anomalyIds, anomalyId]
      analysisStore.anomalyId = anomalyId
      if (workflow.title) analysisStore.workflowTitle = workflow.title
      await confirmAnomaly(anomalyId)
      ElMessage.success("已添加异常到当前分析")

      analysisStore.currentPhase = 0
      analysisStore.isAnalyzing = false

      const originNodes = await listDeepAnalysisNodesByType(
        analysisStore.workflowId as string,
        "ORIGIN"
      )
      analysisStore.addNodeFromWorkflow(originNodes, "Origin")

      const originNodeIds = originNodes.map((n) => n.nodeId)
      await analysisStore.proceedToIntent(originNodeIds)
      await analysisStore.restoreChainFromDB()
    }

    if (!analysisStore.coveredAnomalyIds.includes(anomalyId)) {
      analysisStore.coveredAnomalyIds.push(anomalyId)
    }
  } finally {
    analyzingAnomalyIds.value.delete(anomalyId);
  }
}

// 1a-UX：已覆盖异常「加入当前分析」——不调 LLM，仅并入工作流并追加展示已有链路
const joinToCurrentFlow = async (item: any) => {
  const anomalyId = item.anomalyId || item.id;
  if (!anomalyId || !analysisStore.workflowId || isJoiningItem(item)) return;
  joiningAnomalyIds.value.add(anomalyId);
  try {
    await analysisStore.joinAnomalyToCurrentFlow(anomalyId);
    ElMessage.success("已加入当前分析");
  } catch (e: any) {
    analysisStore.addLog(
      `加入当前分析失败 (${anomalyId}): ${e?.message || "未知错误"}`,
      "error"
    );
    ElMessage.error(`加入当前分析失败: ${e?.message}`);
  } finally {
    joiningAnomalyIds.value.delete(anomalyId);
  }
};

// 1a-UX：已覆盖但无工作流的异常「载入历史分析」——仅画布展示，不建工作流
const loadHistoryAnomaly = async (item: any) => {
  const anomalyId = item.anomalyId || item.id;
  if (!anomalyId || isJoiningItem(item)) return;
  joiningAnomalyIds.value.add(anomalyId);
  try {
    await analysisStore.loadHistoryAnomaly(anomalyId);
  } catch (e: any) {
    analysisStore.addLog(
      `载入历史分析失败 (${anomalyId}): ${e?.message || "未知错误"}`,
      "error"
    );
    ElMessage.error(`载入历史分析失败: ${e?.message}`);
  } finally {
    joiningAnomalyIds.value.delete(anomalyId);
  }
};

// 完美匹配图片中的 8 条核心看板模拟数据
// const listData = ref([
//   {
//     title: "霍尔木兹侦察压制集群 [3事件]",
//     threat: "94",
//     threatConf: "91",
//     anomaly: "87",
//     anomalyConf: "91",
//     isHexagon: true,
//   },
//   {
//     title: "阿拉伯海打击集群 [2事件]",
//     threat: "91",
//     threatConf: "83",
//     anomaly: "87",
//     anomalyConf: "91",
//     isHexagon: true,
//   },
//   {
//     title: "阿曼湾水下声呐阵列异常活跃",
//     threat: "89",
//     threatConf: "82",
//     anomaly: "94",
//     anomalyConf: "91",
//     isHexagon: false,
//   },
//   {
//     title: "巴林乌代德基地F-15E转场异常",
//     threat: "87",
//     threatConf: "82",
//     anomaly: "94",
//     anomalyConf: "91",
//     isHexagon: false,
//   },
//   {
//     title: "以色列北部通信静默",
//     threat: "87",
//     threatConf: "82",
//     anomaly: "94",
//     anomalyConf: "91",
//     isHexagon: false,
//   },
//   {
//     title: "P-18A轨迹异常",
//     threat: "87",
//     threatConf: "82",
//     anomaly: "94",
//     anomalyConf: "91",
//     isHexagon: false,
//   },
//   {
//     title: "雷达火控增加",
//     threat: "87",
//     threatConf: "82",
//     anomaly: "94",
//     anomalyConf: "91",
//     isHexagon: false,
//   },
//   {
//     title: "巴林后勤异常",
//     threat: "87",
//     threatConf: "82",
//     anomaly: "94",
//     anomalyConf: "91",
//     isHexagon: false,
//   },
// ]);

const listData = computed(() => {
  return homestore.analysisList.map((item) => ({
    id: item.id,
    itemId: item.itemId,
    title: item.title,
    type: item.type,
    level: item.level,
    region: item.region,
    threat: item.threat,
    threatConf: item.threatConf,
    anomaly: item.anomaly,
    anomalyConf: item.anomalyConf,
    isHexagon: item.isAnalyzed,
    count: item.count,
    discoverTime: item.discoverTime,
    duration: item.duration,
    isAnalyzed: item.isAnalyzed,
  }));
});
</script>

<style scoped>
/* 针对情报系统定制的窄轨道暗色暗色微型滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>
