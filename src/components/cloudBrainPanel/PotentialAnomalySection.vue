<template>
  <CloudBrainSectionShell
    title="潜在异常研判"
    icon="◎"
    :badge="`${data.pendingCount} 待研判`"
  >
    <div
      class="featured border border-amber-500/50 bg-[#111827]/80 rounded p-2 mt-2"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-1.5 min-w-0">
          <span class="text-amber-400 text-xs mt-0.5 shrink-0">▲</span>
          <span class="text-[12.5px] font-semibold text-[#f3f4f6] leading-snug">{{
            data.featured.title
          }}</span>
        </div>
        <button
          type="button"
          class="ghost-btn shrink-0"
          @click="emitAction('locate-featured')"
        >
          定位
        </button>
      </div>
      <div class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-[#9ca3af]">
        <span
          >偏离度 <em class="text-amber-400 not-italic font-mono">{{ data.featured.deviation }}</em></span
        >
        <span>持续 {{ data.featured.durationDays }}天</span>
        <span>命中 {{ data.featured.indicatorHits }} 指标</span>
        <span>置信度 {{ data.featured.confidencePct }}%</span>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-1.5 mt-2">
      <div
        v-for="m in metricCards"
        :key="m.label"
        class="stat-cell"
      >
        <div class="stat-cell__val">{{ m.value }}</div>
        <div class="stat-cell__label">{{ m.label }}</div>
      </div>
    </div>

    <div class="text-[11px] text-[#9ca3af] mt-2.5 mb-1">待研判 Top 3</div>
    <ul class="space-y-1">
      <li
        v-for="item in data.topItems"
        :key="item.id"
        class="top-row"
      >
        <span class="text-amber-400 text-[10px] shrink-0">▲</span>
        <div class="min-w-0 flex-1">
          <div class="text-[11.5px] text-[#e5e7eb] truncate">{{ item.title }}</div>
          <div class="text-[10px] text-[#6b7280]">
            {{ item.category }} · {{ item.durationDays }}天 · {{ item.location }}
          </div>
        </div>
        <span class="text-amber-400 font-mono text-[12px] shrink-0">{{ item.score }}</span>
      </li>
    </ul>
    <div v-if="data.morePendingCount > 0" class="text-[10.5px] text-[#6b7280] mt-1.5">
      另有 {{ data.morePendingCount }} 项待研判
    </div>

    <div class="flex flex-wrap gap-1.5 mt-2.5">
      <button type="button" class="action-btn" @click="emitAction('open-monitor')">
        打开监测模块
      </button>
      <button type="button" class="action-btn" @click="emitAction('view-all')">
        查看全部列表
      </button>
      <button type="button" class="action-btn" @click="emitAction('locate-max-deviation')">
        定位最高偏离
      </button>
    </div>
  </CloudBrainSectionShell>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CloudBrainSectionShell from "./CloudBrainSectionShell.vue";
import type { PotentialAnomalyPanelData } from "@/mock/cloudBrainPanel";

const props = defineProps<{
  /** 潜在异常研判 Mock / API 数据 */
  data: PotentialAnomalyPanelData;
}>();

const emit = defineEmits<{
  action: [key: string];
}>();

/** 顶部三列指标卡片展示结构 */
const metricCards = computed(() => [
  { value: props.data.metrics.newIn24h, label: "近 24h 新增" },
  { value: `${props.data.metrics.caseSimilarityPct}%`, label: "战例相似度" },
  { value: props.data.metrics.confirmedImpactCount, label: "全部确认影响" },
]);

/**
 * 向父组件上报底部操作（后续可接路由或地图定位）。
 * @param key - 操作标识
 */
const emitAction = (key: string) => {
  emit("action", key);
};
</script>

<style scoped>
.featured em {
  font-style: normal;
}

.stat-cell {
  background: #111827;
  border: 1px solid #2d3a4d60;
  border-radius: 4px;
  padding: 6px 4px;
  text-align: center;
}

.stat-cell__val {
  font-size: 15px;
  font-weight: 700;
  color: #f3f4f6;
  font-family: ui-monospace, monospace;
}

.stat-cell__label {
  font-size: 9.5px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.2;
}

.top-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid #2d3a4d40;
}

.top-row:last-child {
  border-bottom: none;
}

.ghost-btn {
  padding: 2px 6px;
  font-size: 10px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 4px;
  cursor: pointer;
}

.ghost-btn:hover {
  background: rgba(59, 130, 246, 0.2);
}

.action-btn {
  flex: 1 1 auto;
  min-width: 0;
  padding: 5px 6px;
  font-size: 10.5px;
  color: #cbd5e1;
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.action-btn:hover {
  background: #253141;
  border-color: #3d4d64;
}
</style>