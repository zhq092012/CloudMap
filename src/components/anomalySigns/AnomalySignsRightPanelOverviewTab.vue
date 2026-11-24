<template>
  <div class="asrp-overview">
    <section class="asrp-card asrp-card--brief">
      <div class="asrp-card__head">
        <span class="asrp-card__head-title">✨ 云脑 AI 作战参谋</span>
        <span class="asrp-card__head-meta">24 小时内</span>
      </div>
      <p class="asrp-card__sub">异常征候指控分析报告</p>
      <p class="asrp-card__tag">⚡ 多 Agent 综合研判</p>
      <p v-if="hasBriefing" class="asrp-card__date">简报日期：{{ overviewDate }}</p>
      <div v-if="hasBriefing" class="asrp-md asrp-card__md" v-html="overviewHtml"></div>
      <p v-else class="asrp-card__empty">
        没有全局异常态势分析信息，请点击「查看详细报告及分析研判过程」进行分析
      </p>
      <button type="button" class="asrp-btn asrp-btn--ghost" @click="showReportDetail">
        查看详细报告及分析研判过程
      </button>
    </section>

    <section class="asrp-card">
      <h3 class="asrp-section-title">云脑异常态势总览</h3>
      <div class="asrp-stat-grid">
        <div
          v-for="card in statCards"
          :key="card.key"
          class="asrp-stat"
          :class="`asrp-stat--${card.tone}`"
        >
          <span class="asrp-stat__icon" aria-hidden="true">{{ card.icon }}</span>
          <div class="asrp-stat__body">
            <span class="asrp-stat__label">{{ card.label }}</span>
            <span class="asrp-stat__value">{{ card.value }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="asrp-card">
      <h3 class="asrp-section-title">异常威胁等级分布</h3>
      <div class="asrp-bars">
        <div v-for="d in threatDist" :key="d.label" class="asrp-bar-row">
          <div class="asrp-bar-row__meta">
            <span>{{ d.label }}</span>
            <span class="asrp-mono">{{ d.value }} ({{ d.pct }}%)</span>
          </div>
          <div class="asrp-bar-track">
            <div class="asrp-bar-fill" :class="`asrp-bar-fill--${d.tone}`" :style="{ width: `${d.pct}%` }" />
          </div>
        </div>
      </div>
    </section>

    <section class="asrp-card">
      <h3 class="asrp-section-title">近 24 小时时段分布</h3>
      <div ref="timeChartRef" class="asrp-chart asrp-chart--time"></div>
    </section>

    <section class="asrp-card">
      <h3 class="asrp-section-title">异常类型分布</h3>
      <div ref="barChartRef" class="asrp-chart"></div>
    </section>

    <div class="asrp-overview__actions">
      <button type="button" class="asrp-btn asrp-btn--primary" @click="onConfirmContinue">
        确认并继续
      </button>
      <button type="button" class="asrp-btn asrp-btn--muted" @click="onDismiss">暂不处理</button>
    </div>

    <section
      v-for="(sec, idx) in foldSections"
      :key="sec.title"
      class="asrp-fold"
      :class="{ 'is-open': sectionOpen[idx] }"
    >
      <button type="button" class="asrp-fold__head" @click="sectionOpen[idx] = !sectionOpen[idx]">
        <span>{{ sec.title }}</span>
        <span class="asrp-fold__chev" aria-hidden="true">{{ sectionOpen[idx] ? "▾" : "▸" }}</span>
      </button>
      <div v-show="sectionOpen[idx]" class="asrp-fold__body">
        <p v-for="(p, pIdx) in sec.paragraphs" :key="pIdx">{{ p }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import * as echarts from "echarts";
import type { AnomalyStats } from "@/api/anomalies";
import {
  mockAnomalyOverviewSections,
  mockAnomalyOverviewTimeBuckets,
} from "@/mock/anomalySignsRightPanel";

const props = defineProps<{
  /** 异常统计接口数据 */
  overviewStats: AnomalyStats | null;
  /** 简报 HTML */
  overviewHtml: string;
  overviewDate: string | null;
  hasBriefing: boolean;
  showReportDetail: () => void;
}>();

const barChartRef = ref<HTMLDivElement | null>(null);
const timeChartRef = ref<HTMLDivElement | null>(null);
let barChart: echarts.ECharts | null = null;
let timeChart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const foldSections = mockAnomalyOverviewSections;
const sectionOpen = ref(foldSections.map((s) => s.defaultOpen));

const statCards = computed(() => {
  const s = props.overviewStats;
  return [
    {
      key: "confirmed",
      label: "已确认",
      value: s?.status?.CONFIRMED ?? 0,
      icon: "🔥",
      tone: "danger",
    },
    {
      key: "potential",
      label: "潜在异常",
      value: s?.status?.POTENTIAL ?? 0,
      icon: "⚡",
      tone: "info",
    },
    {
      key: "high",
      label: "高威胁",
      value: s?.threatLevel?.high ?? 0,
      icon: "⚠️",
      tone: "warn",
    },
    {
      key: "total",
      label: "事件总数",
      value: s?.total ?? 0,
      icon: "∑",
      tone: "muted",
    },
  ];
});

const threatDist = computed(() => {
  const t = props.overviewStats?.threatLevel ?? {};
  const high = t.high ?? 0;
  const medium = t.medium ?? 0;
  const low = t.low ?? 0;
  const sum = high + medium + low;
  const pct = (v: number) => (sum > 0 ? Math.round((v / sum) * 100) : 0);
  return [
    { label: "高威胁", value: high, pct: pct(high), tone: "danger" },
    { label: "中威胁", value: medium, pct: pct(medium), tone: "warn" },
    { label: "低威胁", value: low, pct: pct(low), tone: "info" },
  ];
});

const assetDistData = computed(() => {
  const a = props.overviewStats?.assetType ?? {};
  return ["article", "aircraft", "vessel", "satellite"].map((k) => a[k] ?? 0);
});

const timeBucketData = computed(() => mockAnomalyOverviewTimeBuckets);

function chartBaseGrid(): echarts.GridComponentOption {
  return { top: 8, bottom: 4, left: 4, right: 4, containLabel: true };
}

function initCharts() {
  if (barChartRef.value) {
    barChart = echarts.init(barChartRef.value);
    barChart.setOption({
      grid: chartBaseGrid(),
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
          barWidth: "42%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#93c5fd" },
              { offset: 1, color: "#2563eb" },
            ]),
            borderRadius: [2, 2, 0, 0],
          },
        },
      ],
    });
  }
  if (timeChartRef.value) {
    timeChart = echarts.init(timeChartRef.value);
    timeChart.setOption({
      grid: chartBaseGrid(),
      xAxis: {
        type: "category",
        data: timeBucketData.value.map((b) => b.label),
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
          data: timeBucketData.value.map((b) => b.value),
          barWidth: "50%",
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#fcd34d" },
              { offset: 1, color: "#d97706" },
            ]),
            borderRadius: [2, 2, 0, 0],
          },
        },
      ],
    });
  }

  const observeTarget = barChartRef.value ?? timeChartRef.value;
  if (observeTarget) {
    resizeObserver = new ResizeObserver(() => {
      barChart?.resize();
      timeChart?.resize();
    });
    if (barChartRef.value) resizeObserver.observe(barChartRef.value);
    if (timeChartRef.value) resizeObserver.observe(timeChartRef.value);
  }
}

watch(assetDistData, (data) => {
  barChart?.setOption({ series: [{ data }] });
});

onMounted(() => {
  nextTick(initCharts);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  barChart?.dispose();
  timeChart?.dispose();
});

function onConfirmContinue() {
  // 后续对接：批量确认或跳转深度分析
}

function onDismiss() {
  // 后续对接：关闭提示态
}
</script>

<script lang="ts">
export default { name: "AnomalySignsRightPanelOverviewTab" };
</script>

<style scoped lang="scss">
.asrp-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asrp-card {
  padding: 10px;
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 6px;

  &--brief {
    background: #1a2332;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  &__head-title {
    font-size: 12.5px;
    font-weight: 700;
    color: #93c5fd;
  }

  &__head-meta {
    font-size: 11px;
    color: #6b7280;
  }

  &__sub {
    margin: 0 0 4px;
    font-size: 11.5px;
    font-family: ui-monospace, monospace;
    color: #6b7280;
  }

  &__tag {
    margin: 0 0 6px;
    font-size: 12.5px;
    font-weight: 500;
    color: #93c5fd;
  }

  &__date {
    margin: 0 0 6px;
    font-size: 11.5px;
    color: #9ca3af;
  }

  &__md {
    max-height: 120px;
    margin-bottom: 8px;
    overflow-y: auto;
  }

  &__empty {
    margin: 0 0 8px;
    padding: 8px;
    font-size: 12.5px;
    line-height: 1.5;
    text-align: center;
    color: #6b7280;
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid rgba(45, 58, 77, 0.6);
    border-radius: 4px;
  }
}

.asrp-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
}

.asrp-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.asrp-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(17, 24, 39, 0.45);
  border: 1px solid #2d3a4d;
  border-radius: 6px;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 12px;
    border-radius: 4px;
  }

  &--danger .asrp-stat__icon {
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.12);
  }

  &--warn .asrp-stat__icon {
    color: #fcd34d;
    background: rgba(245, 158, 11, 0.12);
  }

  &--info .asrp-stat__icon {
    color: #93c5fd;
    background: rgba(59, 130, 246, 0.12);
  }

  &--muted .asrp-stat__icon {
    color: #9ca3af;
    background: rgba(107, 114, 128, 0.15);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: 11.5px;
    line-height: 1;
    color: #9ca3af;
  }

  &__value {
    font-size: 17px;
    font-weight: 700;
    font-family: ui-monospace, monospace;
    color: #e5e7eb;
  }
}

.asrp-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.asrp-bar-row {
  &__meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
    font-size: 12px;
    color: #9ca3af;
  }
}

.asrp-bar-track {
  width: 100%;
  height: 4px;
  overflow: hidden;
  background: #111827;
  border-radius: 999px;
}

.asrp-bar-fill {
  height: 100%;
  border-radius: 999px;

  &--danger {
    background: #ef4444;
  }

  &--warn {
    background: #f59e0b;
  }

  &--info {
    background: #3b82f6;
  }
}

.asrp-mono {
  font-family: ui-monospace, monospace;
}

.asrp-chart {
  width: 100%;
  height: 112px;

  &--time {
    height: 96px;
  }
}

.asrp-overview__actions {
  display: flex;
  gap: 8px;
}

.asrp-btn {
  flex: 1;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &--primary {
    color: #e5e7eb;
    background: rgba(59, 130, 246, 0.35);
    border: 1px solid rgba(59, 130, 246, 0.65);

    &:hover {
      background: rgba(59, 130, 246, 0.5);
    }
  }

  &--muted {
    color: #9ca3af;
    background: rgba(17, 24, 39, 0.6);
    border: 1px solid #2d3a4d;

    &:hover {
      color: #e5e7eb;
      background: rgba(31, 41, 55, 0.9);
    }
  }

  &--ghost {
    width: 100%;
    margin-top: 4px;
    color: #93c5fd;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.4);

    &:hover {
      background: rgba(59, 130, 246, 0.22);
    }
  }
}

.asrp-fold {
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  background: rgba(26, 35, 50, 0.65);
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
    background: transparent;
    border: none;
    cursor: pointer;

    &:hover {
      color: #93c5fd;
    }
  }

  &__chev {
    font-size: 11px;
    color: #6b7280;
  }

  &__body {
    padding: 0 10px 10px;
    font-size: 11.5px;
    line-height: 1.6;
    color: #9ca3af;

    p {
      margin: 0 0 6px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.asrp-md {
  font-size: 12px;
  line-height: 1.75;
  color: #e5e7eb;
  word-break: break-word;
}

.asrp-md :deep(h1),
.asrp-md :deep(h2),
.asrp-md :deep(h3) {
  margin: 6px 0 4px;
  font-weight: 700;
  color: #93c5fd;
}

.asrp-md :deep(p) {
  margin: 4px 0;
}

.asrp-md :deep(ul),
.asrp-md :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}
</style>