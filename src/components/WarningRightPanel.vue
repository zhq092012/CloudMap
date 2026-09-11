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
          <div class="flex justify-between items-center text-[12px] mb-1">
            <span class="text-amber-500 font-bold flex items-center gap-1"
              >✨ 云脑AI作战参谋</span
            >
            <span class="text-slate-500">24小时内</span>
          </div>
          <div class="text-[12px] text-slate-400 mb-1 font-mono">
            异常征候指控分析报告
          </div>
          <div
            class="text-[12px] text-blue-400 font-medium mb-1.5 flex items-center gap-0.5"
          >
            ⚡ 多Agent综合研判
          </div>
          <div
            v-if="hasBriefing"
            class="text-[11px] text-amber-400/80 mb-1"
          >
            简报日期：{{ overviewDate }}
          </div>
          <div v-if="hasBriefing" class="overview-body markdown-body" v-html="overviewHtml"></div>
          <div
            v-else
            class="text-[12px] text-slate-500 text-center leading-relaxed bg-[#111113]/60 p-1.5 rounded border border-slate-800/40"
          >
            没有全局异常态势分析信息，请点击"查看详细报告及分析研判过程"按钮进行分析
          </div>
          <button
            class="mt-2 text-[12px] text-blue-400 bg-blue-950/40 border border-blue-500/20 px-2 py-0.5 rounded hover:bg-blue-900/40"
            @click="showReportDetail"
          >
            查看详细报告及分析研判过程
          </button>
        </div>

        <div>
          <div class="text-[12px] text-slate-400 mb-1.5 font-bold">
            云脑异常态势总览
          </div>
          <div class="space-y-2">
            <div
              class="bg-[#161c2e] p-2 rounded border border-slate-800/60 flex items-center gap-2"
            >
              <div
                class="w-7 h-7 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs"
              >
                ⚠️
              </div>
              <div>
                <div class="text-[12px] text-slate-500 leading-none">
                  异常事件总数
                </div>
                <div class="text-base font-black text-slate-200 font-mono mt-0.5">
                  {{ overviewStats?.total ?? 0 }}
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                class="bg-[#161c2e] p-2 rounded border border-slate-800/60 flex items-center gap-2"
              >
                <div
                  class="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs"
                >
                  🔥
                </div>
                <div>
                  <div class="text-[12px] text-slate-500 leading-none">
                    已确认异常
                  </div>
                  <div class="text-base font-black text-slate-200 font-mono mt-0.5">
                    {{ overviewStats?.status?.CONFIRMED ?? 0 }}
                  </div>
                </div>
              </div>
              <div
                class="bg-[#161c2e] p-2 rounded border border-slate-800/60 flex items-center gap-2"
              >
                <div
                  class="w-7 h-7 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs"
                >
                  ⚡
                </div>
                <div>
                  <div class="text-[12px] text-slate-500 leading-none">
                    潜在异常
                  </div>
                  <div class="text-base font-black text-slate-200 font-mono mt-0.5">
                    {{ overviewStats?.status?.POTENTIAL ?? 0 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-[#141926] p-2.5 rounded border border-slate-800/60 text-[12px]"
        >
          <div class="text-slate-400 mb-2 font-bold">异常威胁等级分布</div>
          <div class="space-y-1.5">
            <div v-for="d in threatDist" :key="d.label">
              <div
                class="flex justify-between text-[12px] text-slate-400 mb-0.5"
              >
                <span>{{ d.label }}</span>
                <span class="font-mono">{{ d.value }}({{ d.pct }}%)</span>
              </div>
              <div class="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full" :class="d.bar" :style="{ width: d.pct + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-[#141926] p-2 rounded border border-slate-800/60">
          <div class="text-[12px] text-slate-400 mb-1 font-bold">
            异常类型分布
          </div>
          <div ref="barChartRef" class="w-full h-28"></div>
        </div>

      </div>

      <div v-show="currentTab === 'analysis'" class="space-y-3">
        <button
          class="w-full py-2 bg-[#1d3557] hover:bg-blue-600 text-blue-300 text-xs rounded border border-blue-500/30 font-medium shadow-md transition-colors shrink-0"
          @click="showDeepAnalysis"
        >
          进入云脑深度分析
        </button>

        <div class="grid grid-cols-2 gap-2 text-[12px] shrink-0">
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

        <div class="text-[12px] text-sky-400 font-medium px-0.5">
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

              <div class="flex items-center gap-4 text-[12px] text-slate-400">
                <div>
                  {{ item.isHexagon ? "综合威胁度" : "威胁度" }}
                  <span class="text-amber-500 font-mono font-bold ml-1">{{
                    item.threat
                  }}</span>
                </div>
                <div>
                  {{ item.isHexagon ? "综合异常度" : "异常度" }}
                  <span class="text-slate-200 font-mono font-bold ml-1">{{
                    item.anomaly
                  }}</span>
                  <span class="text-slate-400 font-mono">&nbsp;(置信度 {{ item.anomalyConf }})</span
                  >
                </div>
              </div>
            </div>

            <div
              class="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center text-emerald-400 text-[12px] font-bold shrink-0"
            >
              ✓
            </div>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      v-model="briefingDialogVisible"
      plain
      width="960px"
      :close-on-click-modal="false"
      title="简报详情"
    >
      <BriefingDialog
        :state="briefingState"
        :briefing="briefingData"
        :error="briefingError"
        @regenerate="doGenerateBriefing"
        @close="briefingDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from "vue";
import * as echarts from "echarts";
import { getAnomalyStats } from "@/api/anomalies";
import type { AnomalyStats } from "@/api/anomalies";
import BriefingDialog from "@/components/Dialogs/BriefingDialog.vue";
import { useBriefing } from "@/composables/useBriefing";
import { useRouter } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";
const homestore = useHomeStore();
const router = useRouter();
const barChartRef = ref<HTMLDivElement | null>(null);
let myBarChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// Tab 控制状态：'global' 代表全局异常态势，'analysis' 代表深度分析
const currentTab = ref<"global" | "analysis">("global");

const overviewStats = ref<AnomalyStats | null>(null);

const threatDist = computed(() => {
  const t = overviewStats.value?.threatLevel ?? {};
  const high = t.high ?? 0;
  const medium = t.medium ?? 0;
  const low = t.low ?? 0;
  const sum = high + medium + low;
  const pct = (v: number) => (sum > 0 ? Math.round((v / sum) * 100) : 0);
  return [
    { label: "高威胁", value: high, pct: pct(high), bar: "bg-red-500" },
    { label: "中威胁", value: medium, pct: pct(medium), bar: "bg-amber-500" },
    { label: "低威胁", value: low, pct: pct(low), bar: "bg-blue-500" },
  ];
});

const assetDistData = computed(() => {
  const a = overviewStats.value?.assetType ?? {};
  return ["article", "aircraft", "vessel", "satellite"].map((k) => a[k] ?? 0);
});

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
  const selectedIds = homestore.analysisList.map((item) => item.id).filter(Boolean);
  if (selectedIds.length > 0) {
    router.push({ path: "/deepanalysis", query: { from: "homepage", ids: selectedIds.join(",") } });
  } else {
    router.push("/deepanalysis");
  }
};
const {
  briefingDialogVisible,
  briefingState,
  briefingData,
  briefingError,
  overviewHtml,
  overviewDate,
  hasBriefing,
  showReportDetail,
  doGenerateBriefing,
} = useBriefing();

onMounted(async () => {
  try {
    overviewStats.value = await getAnomalyStats();
  } catch (error) {
    console.error("[WarningRightPanel] 获取异常统计失败:", error);
    overviewStats.value = null;
  }
  nextTick(() => {
    if (!barChartRef.value) return;
    myBarChart = echarts.init(barChartRef.value);
    const option: echarts.EChartsOption = {
      grid: { top: 10, bottom: 5, left: 5, right: 5, containLabel: true },
      xAxis: {
        type: "category",
        data: ["开源情报", "飞机轨迹", "舰船轨迹", "卫星轨迹"],
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
          data: assetDistData.value,
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

watch(assetDistData, (data) => {
  myBarChart?.setOption({ series: [{ data }] });
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
.overview-body {
  max-height: 120px;
  overflow-y: auto;
}

.markdown-body {
  font-size: 12px;
  line-height: 1.75;
  color: #e2e8f0;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  margin: 8px 0 4px;
  color: #fbbf24;
  line-height: 1.35;
}
.markdown-body :deep(h1) { font-size: 14px; }
.markdown-body :deep(h2) { font-size: 13px; }
.markdown-body :deep(h3) { font-size: 12px; }
.markdown-body :deep(h4) { font-size: 12px; }
.markdown-body :deep(p) { margin: 4px 0; }
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}
.markdown-body :deep(li) { margin: 2px 0; }
.markdown-body :deep(ul li) { list-style: disc; }
.markdown-body :deep(ol li) { list-style: decimal; }
.markdown-body :deep(strong) { color: #fcd34d; font-weight: 700; }
.markdown-body :deep(em) { color: #cbd5e1; }
.markdown-body :deep(a) { color: #38bdf8; text-decoration: underline; }
.markdown-body :deep(code) {
  background: #0c121f;
  border: 1px solid #2d3748;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fca5a5;
}
.markdown-body :deep(pre) {
  background: #0c121f;
  border: 1px solid #2d3748;
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.markdown-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #e2e8f0;
  font-size: 11px;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #f59e0b;
  padding-left: 8px;
  color: #cbd5e1;
  margin: 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2d3748;
  margin: 8px 0;
}
</style>
