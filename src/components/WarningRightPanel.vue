<template>
  <div
    class="w-95 bg-[#111827]/95 border border-[#2d3a4d] rounded-l-lg p-3 flex flex-col h-full min-h-0 shadow-xl select-none backdrop-blur-sm"
  >
    <h2 class="text-[13.5px] font-bold tracking-wider text-[#e5e7eb] pb-2 mb-2.5 border-b border-[#2d3a4d]">🧠 云脑智能面板</h2>

    <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar">
      <div class="space-y-4">
        <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-md p-2.5">
          <div class="flex justify-between items-center text-[12.5px] mb-1">
            <span class="text-[#93c5fd] font-bold flex items-center gap-1"
              >✨ 云脑AI作战参谋</span
            >
            <span class="text-[11px] text-[#6b7280]">24小时内</span>
          </div>
          <div class="text-[11.5px] text-[#6b7280] font-mono">
            异常征候指控分析报告
          </div>
          <div
            class="text-[12.5px] text-[#93c5fd] font-medium mb-1.5 flex items-center gap-0.5"
          >
            ⚡ 多Agent综合研判
          </div>
          <div
            v-if="hasBriefing"
            class="text-[11.5px] text-[#9ca3af] mb-1"
          >
            简报日期：{{ overviewDate }}
          </div>
          <div v-if="hasBriefing" class="overview-body markdown-body" v-html="overviewHtml"></div>
          <div
            v-else
            class="text-[12.5px] text-[#6b7280] text-center leading-relaxed bg-[#111827]/60 p-2 rounded border border-[#2d3a4d]/60"
          >
            没有全局异常态势分析信息，请点击"查看详细报告及分析研判过程"按钮进行分析
          </div>
          <button
            class="mt-2 text-[12.5px] font-medium text-[#93c5fd] bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.4)] px-2.5 py-1 rounded-md hover:bg-[rgba(59,130,246,0.22)] transition-colors"
            @click="showReportDetail"
          >
            查看详细报告及分析研判过程
          </button>
        </div>

        <div>
          <div class="text-[12px] font-semibold text-[#cbd5e1] mb-2">
            云脑异常态势总览
          </div>
          <div class="space-y-2">
            <div
              class="bg-[#1a2332] p-2 rounded-md border border-[#2d3a4d] flex items-center gap-2"
            >
              <div
                class="w-7 h-7 rounded bg-[rgba(59,130,246,0.12)] flex items-center justify-center text-[#93c5fd] font-bold text-xs"
              >
                ⚠️
              </div>
              <div>
                <div class="text-[11.5px] text-[#9ca3af] leading-none">
                  异常事件总数
                </div>
                <div class="text-[17px] font-bold text-[#e5e7eb] font-mono mt-0.5">
                  {{ overviewStats?.total ?? 0 }}
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                class="bg-[#1a2332] p-2 rounded-md border border-[#2d3a4d] flex items-center gap-2"
              >
                <div
                  class="w-7 h-7 rounded bg-[rgba(239,68,68,0.12)] flex items-center justify-center text-[#fca5a5] font-bold text-xs"
                >
                  🔥
                </div>
                <div>
                  <div class="text-[11.5px] text-[#9ca3af] leading-none">
                    已确认异常
                  </div>
                  <div class="text-[17px] font-bold text-[#e5e7eb] font-mono mt-0.5">
                    {{ overviewStats?.status?.CONFIRMED ?? 0 }}
                  </div>
                </div>
              </div>
              <div
                class="bg-[#1a2332] p-2 rounded-md border border-[#2d3a4d] flex items-center gap-2"
              >
                <div
                  class="w-7 h-7 rounded bg-[rgba(59,130,246,0.12)] flex items-center justify-center text-[#93c5fd] font-bold text-xs"
                >
                  ⚡
                </div>
                <div>
                  <div class="text-[11.5px] text-[#9ca3af] leading-none">
                    潜在异常
                  </div>
                  <div class="text-[17px] font-bold text-[#e5e7eb] font-mono mt-0.5">
                    {{ overviewStats?.status?.POTENTIAL ?? 0 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-[#1a2332] p-2.5 rounded-md border border-[#2d3a4d] text-[12.5px]"
        >
          <div class="text-[12px] font-semibold text-[#cbd5e1] mb-2">异常威胁等级分布</div>
          <div class="space-y-1.5">
            <div v-for="d in threatDist" :key="d.label">
              <div
                class="flex justify-between text-[12.5px] text-[#9ca3af] mb-0.5"
              >
                <span>{{ d.label }}</span>
                <span class="font-mono">{{ d.value }}({{ d.pct }}%)</span>
              </div>
              <div class="w-full h-1 bg-[#111827] rounded-full overflow-hidden">
                <div class="h-full" :class="d.bar" :style="{ width: d.pct + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-[#1a2332] p-2 rounded-md border border-[#2d3a4d]">
          <div class="text-[12px] font-semibold text-[#cbd5e1] mb-2">
            异常类型分布
          </div>
          <div ref="barChartRef" class="w-full h-28"></div>
        </div>

      </div>
    </div>
    <el-dialog
      v-model="briefingDialogVisible"
      plain
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      title="异常征候简报详情"
    >
      <BriefingDialog
        heading="异常征候简报"
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
const barChartRef = ref<HTMLDivElement | null>(null);
let myBarChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

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
        axisLine: { lineStyle: { color: "#3d4d64" } },
        axisLabel: { color: "#9ca3af", fontSize: 9 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#2d3a4d" } },
        axisLabel: { color: "#6b7280", fontSize: 9 },
      },
      series: [
        {
          type: "bar",
          data: assetDistData.value,
          barWidth: "40%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#93c5fd" },
              { offset: 1, color: "#2563eb" },
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
  background: #2d3a4d;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4d64;
}
.overview-body {
  max-height: 120px;
  overflow-y: auto;
}

.markdown-body {
  font-size: 12px;
  line-height: 1.75;
  color: #e5e7eb;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  margin: 8px 0 4px;
  color: #93c5fd;
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
.markdown-body :deep(strong) { color: #bfdbfe; font-weight: 700; }
.markdown-body :deep(em) { color: #cbd5e1; }
.markdown-body :deep(a) { color: #93c5fd; text-decoration: underline; }
.markdown-body :deep(code) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fca5a5;
}
.markdown-body :deep(pre) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.markdown-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #e5e7eb;
  font-size: 11px;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
  color: #cbd5e1;
  margin: 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2d3a4d;
  margin: 8px 0;
}
</style>
