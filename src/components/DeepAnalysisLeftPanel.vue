<template>
  <div
    class="w-95 bg-[#111625]/90 border border-slate-800/80 rounded p-3 flex flex-col h-full min-h-0 shadow-xl select-none">
    <h2 class="text-base font-bold text-slate-100 mb-3 shrink-0 flex items-center gap-2">
      🧠 深度分析栏
    </h2>

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
              <span class="text-amber-600/90 font-mono ml-0.5">(置信度{{ item.threatConf }})</span>
            </div>

            <div>
              {{ item.isHexagon ? "综合异常度" : "异常度" }}
              <span class="text-slate-200 font-mono font-bold ml-1">{{
                item.anomaly
              }}</span>
              <span class="text-slate-400 font-mono ml-0.5">(置信度{{ item.anomalyConf }})</span>
            </div>
          </div>

          <!-- Start Analysis Action footer -->
          <div class="flex justify-between items-center pt-2 border-t border-slate-800/30 mt-1 shrink-0">
            <span class="text-[9px] text-slate-500">
              状态: {{ isAlreadyLoaded(item.title) ? "分析中" : "就绪" }}
            </span>
            <button v-if="!isAlreadyLoaded(item.title)" @click.stop="startAnalysis(item)"
              class="px-2.5 py-0.5 bg-blue-950/60 hover:bg-blue-600 border border-blue-500/30 text-blue-400 hover:text-white rounded text-[10px] transition-all cursor-pointer shadow-sm font-medium">
              开始分析
            </button>
            <span v-else class="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
              ✓ 已载入图谱
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHomeStore } from "@/store/modules/homeStore";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { computed } from "vue";
import { useAgentStore } from "@/store/modules/agentStore";
const homestore = useHomeStore();
const analysisStore = useAnalysisStore();
const agentStore = useAgentStore()
const isAlreadyLoaded = (title: string) => {
  return analysisStore.rawNodes.some(
    (node) => node.text && String(node.text).includes(title),
  );
};

const startAnalysis = (item: any) => {
  // 设置agent编排任务类型
  agentStore.setCurrentTaskType('意图穷举')
  agentStore.setEventId(item.itemId)
  analysisStore.addNodeToGraphByTitle(item);
  // 设置意图节点数据
  analysisStore.IntentAnalysis();
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
