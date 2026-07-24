<template>
  <div
    class="w-95 bg-[#111625]/90 border border-slate-800/80 rounded p-3 flex flex-col h-full min-h-0 shadow-xl select-none"
  >
    <h2 class="text-sm font-bold text-slate-200 mb-2">🧠 云脑智能面板</h2>

    <div
      class="grid grid-cols-2 gap-1 bg-[#161c2e] p-0.5 rounded border border-slate-800 mb-3 text-xs shrink-0"
    >
      <button
        @click="currentTab = 'global'"
        :class="[
          'py-1 text-center font-medium rounded-sm transition-all',
          currentTab === 'global'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200',
        ]"
      >
        全局异常态势分析
      </button>
      <button
        @click="currentTab = 'analysis'"
        :class="[
          'py-1 text-center font-medium rounded-sm transition-all',
          currentTab === 'analysis'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200',
        ]"
      >
        深度分析栏
      </button>
    </div>

    <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
      <div v-show="currentTab === 'global'" class="space-y-4">
        <div class="bg-[#1c1815] border border-amber-600/20 rounded p-2.5">
          <div class="flex justify-between items-center text-[11px] mb-1">
            <span class="text-amber-500 font-bold flex items-center gap-1"
              >✨ 云脑AI作战参谋</span
            >
            <span class="text-slate-500">7-12小时前</span>
          </div>
          <div class="text-[10px] text-slate-400 mb-1 font-mono">
            异常征候指控分析报告 #2026-0421-001
          </div>
          <div
            class="text-[10px] text-blue-400 font-medium mb-1.5 flex items-center gap-0.5"
          >
            ⚡ 多Agent综合研判
          </div>
          <p
            class="text-[11px] text-slate-300 leading-relaxed bg-[#111113]/60 p-1.5 rounded border border-slate-800/40"
          >
            全局异常态势呈现进攻端口前移的趋势。态势特征参训与模式识别参数均达到网格一结论：当前全局异常态势整体确认武装准备特训及境外外交施压。双谱验证一致，置信度较高。
          </p>
          <button
            class="mt-2 text-[10px] text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2 py-0.5 rounded hover:bg-blue-900/40"
            @click="showReportDetail"
          >
            查看详细报告及分析研判过程
          </button>
        </div>

        <div>
          <div class="text-[11px] text-slate-400 mb-1.5 font-bold">
            云脑异常态势总览
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              class="bg-[#161c2e] p-2 rounded border border-slate-800/60 flex items-center gap-2"
            >
              <div
                class="w-7 h-7 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs"
              >
                ⚠️
              </div>
              <div>
                <div class="text-[9px] text-slate-500 leading-none">
                  异常事件
                </div>
                <div class="text-base font-black text-slate-200 font-mono">
                  {{ homestore.warningMarkers.length }}
                </div>
              </div>
            </div>
            <div
              class="bg-[#161c2e] p-2 rounded border border-slate-800/60 flex items-center gap-2"
            >
              <div
                class="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs"
              >
                🔥
              </div>
              <div>
                <div class="text-[9px] text-slate-500 leading-none">
                  异常事件簇
                </div>
                <div class="text-base font-black text-slate-200 font-mono">
                  {{ homestore.warningMarkers.length }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-[#141926] p-2.5 rounded border border-slate-800/60 text-[11px]"
        >
          <div class="text-slate-400 mb-2 font-bold">异常威胁等级分布</div>
          <div class="space-y-1.5">
            <div>
              <div
                class="flex justify-between text-[10px] text-slate-400 mb-0.5"
              >
                <span>高威胁</span><span class="font-mono">35%</span>
              </div>
              <div class="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-red-500" style="width: 35%"></div>
              </div>
            </div>
            <div>
              <div
                class="flex justify-between text-[10px] text-slate-400 mb-0.5"
              >
                <span>中威胁</span><span class="font-mono">42%</span>
              </div>
              <div class="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-amber-500" style="width: 42%"></div>
              </div>
            </div>
            <div>
              <div
                class="flex justify-between text-[10px] text-slate-400 mb-0.5"
              >
                <span>低威胁</span><span class="font-mono">23%</span>
              </div>
              <div class="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500" style="width: 23%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-[#141926] p-2 rounded border border-slate-800/60">
          <div class="text-[11px] text-slate-400 mb-1 font-bold">
            异常类型分布
          </div>
          <div ref="barChartRef" class="w-full h-28"></div>
        </div>

        <div
          class="bg-[#141926] p-2 rounded border border-slate-800/60 text-[11px]"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-slate-400 font-bold">云脑波次节奏分析概览</span>
            <span class="text-[10px] text-blue-400">全局共12个波次 ⚙️</span>
          </div>
          <div
            class="border border-slate-800 bg-[#0f1320] p-1.5 rounded space-y-1 font-mono text-[9px]"
          >
            <div
              class="flex items-center gap-1 border-b border-slate-800/50 pb-1"
            >
              <span class="w-14 text-slate-500 shrink-0">火箭/网电/侦察</span>
              <span
                class="bg-blue-950 text-blue-400 px-1 border border-blue-500/20 rounded-sm"
                >W-R1 侦察部署</span
              >
              <span
                class="bg-purple-950 text-purple-400 px-1 border border-purple-500/20 rounded-sm"
                >W-R3 电子战</span
              >
            </div>
            <div
              class="flex items-center gap-1 border-b border-slate-800/50 py-1"
            >
              <span class="w-14 text-slate-500 shrink-0">空军/海军</span>
              <span
                class="bg-amber-950 text-amber-400 px-1 border border-amber-500/20 rounded-sm"
                >W-R2 兵力集结</span
              >
              <span
                class="bg-blue-950 text-blue-400 px-1 border border-blue-500/20 rounded-sm"
                >W-R5 沿岸侦察</span
              >
            </div>
            <div
              class="flex items-center justify-between pt-1 text-[8px] text-slate-600"
            >
              <span>02.01</span>
              <span>02.15</span>
              <span>03.01</span>
            </div>
          </div>
        </div>
      </div>

      <div v-show="currentTab === 'analysis'" class="space-y-3">
        <button
          class="w-full py-2 bg-[#1d3557] hover:bg-blue-600 text-blue-300 text-xs rounded border border-blue-500/30 font-medium shadow-md transition-colors shrink-0"
          @click="showDeepAnalysis"
        >
          进入云脑深度分析
        </button>

        <div class="grid grid-cols-2 gap-2 text-[11px] shrink-0">
          <button
            class="py-1.5 rounded border transition-colors"
            :class="
              isSelecting
                ? 'bg-red-900/40 hover:bg-red-800/50 text-red-300 border-red-800'
                : 'bg-[#141926] hover:bg-slate-800 text-slate-300 border-slate-800'
            "
            @click="batchDelete"
          >
            {{ isSelecting ? `确认删除 (${selectedIds.length})` : "批量移除" }}
          </button>
          <button
            class="py-1.5 bg-[#141926] hover:bg-slate-800 text-slate-300 rounded border border-slate-800 transition-colors"
            @click="isSelecting ? cancelSelection() : clearAnalysisList()"
          >
            {{ isSelecting ? "取消" : "清空分析栏" }}
          </button>
        </div>

        <div class="text-[11px] text-sky-400 font-medium px-0.5">
          当前分析篮共 {{ analysisListData.length }} 个对象
        </div>

        <div class="space-y-2">
          <div
            v-for="(item, idx) in analysisListData"
            :key="idx"
            @click="isSelecting ? toggleSelectItem(item.id) : null"
            class="p-2 bg-[#161c2e]/70 border border-slate-800/80 rounded flex items-center justify-between hover:border-slate-700 transition-colors"
            :class="isSelecting ? 'cursor-pointer select-none' : ''"
          >
            <!-- Checkbox for selection when isSelecting is true -->
            <div
              v-if="isSelecting"
              class="mr-2 shrink-0 flex items-center"
              @click.stop
            >
              <input
                type="checkbox"
                v-model="selectedIds"
                :value="item.id"
                class="accent-amber-500 cursor-pointer w-3.5 h-3.5"
              />
            </div>

            <div class="space-y-1.5 flex-1 pr-2">
              <div
                class="text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <span
                  :class="
                    item.isHexagon
                      ? 'text-amber-500 font-mono text-sm'
                      : 'text-amber-500 text-xs'
                  "
                >
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
                  <span class="text-amber-600/90 font-mono"
                    >(置信度{{ item.threatConf }})</span
                  >
                </div>
                <div>
                  {{ item.isHexagon ? "综合异常度" : "异常度" }}
                  <span class="text-slate-200 font-mono font-bold ml-1">{{
                    item.anomaly
                  }}</span>
                  <span class="text-slate-400 font-mono"
                    >(置信度{{ item.anomalyConf }})</span
                  >
                </div>
              </div>
            </div>

            <div
              class="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 text-[9px] font-bold shrink-0"
            >
              ✓
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import * as echarts from "echarts";
import { useWarningStore } from "@/store/modules/warnStore";
import { useRouter } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";
const homestore = useHomeStore();
const router = useRouter();
const warningStore = useWarningStore();
const barChartRef = ref<HTMLDivElement | null>(null);
let myBarChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// Tab 控制状态：'global' 代表全局异常态势，'analysis' 代表深度分析
const currentTab = ref<"global" | "analysis">("global");

// 模拟深度分析的列表数据源
// const analysisListData = ref([
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
const isSelecting = ref(false);
const selectedIds = ref<string[]>([]);

const analysisListData = computed(() => {
  return homestore.analysisList.map((item) => ({
    id: item.id,
    itemId: item.itemId,
    title: item.title,
    threat: item.threat,
    threatConf: item.threatConf,
    anomaly: item.anomaly,
    anomalyConf: item.anomalyConf,
    isHexagon: item.isAnalyzed,
  }));
});

const toggleSelectItem = (id: string) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx > -1) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const cancelSelection = () => {
  isSelecting.value = false;
  selectedIds.value = [];
};

const batchDelete = () => {
  if (!isSelecting.value) {
    isSelecting.value = true;
    selectedIds.value = [];
    return;
  }
  if (selectedIds.value.length > 0) {
    homestore.removeFromAnalysisBatch(selectedIds.value);
    selectedIds.value = [];
  }
  isSelecting.value = false;
};

const clearAnalysisList = () => {
  homestore.clearAnalysis();
  cancelSelection();
};
const showDeepAnalysis = () => {
  router.push("/deepanalysis");
};
const showReportDetail = () => {
  warningStore.toggleWarningDialog(true);
};

onMounted(() => {
  nextTick(() => {
    if (!barChartRef.value) return;
    myBarChart = echarts.init(barChartRef.value);
    const option: echarts.EChartsOption = {
      grid: { top: 10, bottom: 5, left: 5, right: 5, containLabel: true },
      xAxis: {
        type: "category",
        data: ["侦察", "部署", "电子战", "通信", "调动", "舆论"],
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#94a3b8", fontSize: 9 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#1e293b" } },
        axisLabel: { color: "#64748b", fontSize: 9 },
      },
      series: [
        {
          type: "bar",
          data: [144, 108, 72, 36, 52, 41],
          barWidth: "40%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#f59e0b" },
              { offset: 1, color: "#b45309" },
            ]),
            borderRadius: [2, 2, 0, 0],
          },
        },
      ],
    };
    myBarChart.setOption(option);

    resizeObserver = new ResizeObserver(() => {
      myBarChart?.resize();
    });
    resizeObserver.observe(barChartRef.value);
  });
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
  myBarChart?.dispose();
});
</script>

<style scoped>
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
