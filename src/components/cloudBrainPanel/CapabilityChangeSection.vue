<template>
  <CloudBrainSectionShell title="能力变化" icon="★">
    <div class="flex items-center justify-between mt-2 mb-1 text-[10px] text-[#6b7280]">
      <span>能力变化</span>
      <span class="flex items-center gap-2">
        <span>滚轮缩放 · 拖动旋转</span>
        <button type="button" class="link-btn" @click="emit('export')">导出</button>
      </span>
    </div>
    <div ref="radarRef" class="radar-chart" />
    <table class="cap-table">
      <thead>
        <tr>
          <th class="text-left">维度</th>
          <th class="text-center col-blue">蓝方</th>
          <th class="text-center col-red">红方</th>
          <th class="text-right">变化</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data.dimensions" :key="row.name">
          <td>{{ row.name }}</td>
          <td class="text-center col-blue font-mono">{{ row.blue }}</td>
          <td class="text-center col-red font-mono">{{ row.red }}</td>
          <td class="text-right trend-cell" :class="trendClass(row.trend)">
            {{ trendSymbol(row.trend) }} {{ Math.abs(row.delta) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div class="text-[10px] text-[#6b7280] mt-2 mb-1">近 7 次快照</div>
    <div class="snap-row">
      <button
        v-for="snap in data.snapshots"
        :key="snap.id"
        type="button"
        class="snap-block"
        :class="{ 'snap-block--current': snap.isCurrent }"
        :title="snap.label"
        @click="selectedSnap = snap.id"
      />
    </div>
    <div class="snap-labels">
      <span
        v-for="snap in data.snapshots"
        :key="`lbl-${snap.id}`"
        class="snap-label"
        :class="{ 'snap-label--current': snap.id === selectedSnap || snap.isCurrent }"
      >
        {{ snap.isCurrent ? "当前" : snap.label }}
      </span>
    </div>
  </CloudBrainSectionShell>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as echarts from "echarts";
import CloudBrainSectionShell from "./CloudBrainSectionShell.vue";
import type { CapabilityChangePanelData, CapabilityDimensionScore } from "@/mock/cloudBrainPanel";

const props = defineProps<{
  /** 能力变化 Mock / API 数据 */
  data: CapabilityChangePanelData;
}>();

const emit = defineEmits<{
  export: [];
}>();

const radarRef = ref<HTMLDivElement | null>(null);
/** 当前选中的快照 id（交互占位） */
const selectedSnap = ref(
  props.data.snapshots.find((s) => s.isCurrent)?.id ?? props.data.snapshots.at(-1)?.id ?? "",
);

let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

/**
 * 根据趋势类型返回展示符号。
 * @param trend - 趋势枚举
 */
const trendSymbol = (trend: CapabilityDimensionScore["trend"]) => {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
};

/**
 * 趋势单元格颜色 class。
 * @param trend - 趋势枚举
 */
const trendClass = (trend: CapabilityDimensionScore["trend"]) => {
  if (trend === "up") return "trend-up";
  if (trend === "down") return "trend-down";
  return "trend-flat";
};

/**
 * 构建雷达图 option。
 */
function buildOption(): echarts.EChartsOption {
  const indicators = props.data.dimensions.map((d) => ({
    name: d.name,
    max: 100,
  }));
  const blueSeries = props.data.dimensions.map((d) => d.blue);
  const redSeries = props.data.dimensions.map((d) => d.red);

  return {
    backgroundColor: "transparent",
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: "#9ca3af", fontSize: 10 },
      data: ["蓝方", "红方"],
    },
    radar: {
      center: ["50%", "46%"],
      radius: "58%",
      splitNumber: 4,
      axisName: { color: "#9ca3af", fontSize: 9 },
      splitLine: { lineStyle: { color: "#2d3a4d" } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: "#2d3a4d" } },
      indicator: indicators,
    },
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 4,
        data: [
          {
            name: "蓝方",
            value: blueSeries,
            lineStyle: { color: "#3b82f6", width: 1.5 },
            areaStyle: { color: "rgba(59, 130, 246, 0.2)" },
            itemStyle: { color: "#3b82f6" },
          },
          {
            name: "红方",
            value: redSeries,
            lineStyle: { color: "#ef4444", width: 1.5 },
            areaStyle: { color: "rgba(239, 68, 68, 0.15)" },
            itemStyle: { color: "#ef4444" },
          },
        ],
      },
    ],
  };
}

function initChart() {
  if (!radarRef.value) return;
  chart?.dispose();
  chart = echarts.init(radarRef.value);
  chart.setOption(buildOption());
}

onMounted(() => {
  initChart();
  if (radarRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(radarRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = null;
});

watch(
  () => props.data.dimensions,
  () => {
    chart?.setOption(buildOption(), true);
  },
  { deep: true },
);
</script>

<style scoped>
.radar-chart {
  width: 100%;
  height: 180px;
}

.link-btn {
  padding: 0;
  font-size: 10px;
  color: #93c5fd;
  background: none;
  border: none;
  cursor: pointer;
}

.link-btn:hover {
  color: #bfdbfe;
  text-decoration: underline;
}

.cap-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5px;
  color: #cbd5e1;
  margin-top: 4px;
}

.cap-table th,
.cap-table td {
  padding: 3px 2px;
  border-bottom: 1px solid #2d3a4d40;
}

.cap-table th {
  color: #6b7280;
  font-weight: 500;
}

.col-blue {
  color: #93c5fd;
}

.col-red {
  color: #fca5a5;
}

.trend-up {
  color: #fbbf24;
}

.trend-down {
  color: #f97316;
}

.trend-flat {
  color: #9ca3af;
}

.snap-row {
  display: flex;
  gap: 4px;
}

.snap-block {
  flex: 1;
  height: 14px;
  padding: 0;
  background: #0d9488;
  border: 1px solid #14b8a6;
  border-radius: 2px;
  opacity: 0.55;
  cursor: pointer;
}

.snap-block--current,
.snap-block:hover {
  opacity: 1;
}

.snap-labels {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.snap-label {
  flex: 1;
  text-align: center;
  font-size: 9px;
  color: #6b7280;
}

.snap-label--current {
  color: #5eead4;
}
</style>