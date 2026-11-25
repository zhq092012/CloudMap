<!-- 态势监控-云脑智能面板-潜在异常研判区块 -->
<template>
  <CloudBrainSectionShell title="潜在异常研判" icon="◎" :badge="`${data.pendingCount} 待研判`">
    <div class="featured">
      <div class="featured__top">
        <button type="button" class="featured__title-btn" @click="openFeaturedDetail">
          <span class="featured__mark" aria-hidden="true">▲</span>
          <span class="featured__title">{{ data.featured.title }}</span>
        </button>
        <button type="button" class="ghost-btn" @click="emitAction('locate-featured')">定位</button>
      </div>
      <div class="featured__meta">
        <span
          >偏离度 <em class="featured__em">{{ data.featured.deviation }}</em></span
        >
        <span>持续 {{ data.featured.durationDays }}天</span>
        <span>命中 {{ data.featured.indicatorHits }} 指标</span>
        <span>置信度 {{ data.featured.confidencePct }}%</span>
      </div>
    </div>

    <div class="metrics-grid">
      <div v-for="m in metricCards" :key="m.label" class="stat-cell">
        <div class="stat-cell__val">{{ m.value }}</div>
        <div class="stat-cell__label">{{ m.label }}</div>
      </div>
    </div>

    <div class="top-heading">待研判 Top 3</div>
    <ul class="top-list">
      <li v-for="item in data.topItems" :key="item.id" class="top-row">
        <span class="top-row__mark" aria-hidden="true">▲</span>
        <div class="top-row__main">
          <div class="top-row__title">{{ item.title }}</div>
          <div class="top-row__sub">{{ item.category }} · {{ item.durationDays }}天 · {{ item.location }}</div>
        </div>
        <span class="top-row__score">{{ item.score }}</span>
      </li>
    </ul>
    <div v-if="data.morePendingCount > 0" class="more-hint">另有 {{ data.morePendingCount }} 项待研判</div>

    <div class="actions">
      <button type="button" class="action-btn" @click="emitAction('open-monitor')">打开监测模块</button>
      <button type="button" class="action-btn" @click="openListDialog">查看全部列表</button>
      <button type="button" class="action-btn" @click="emitAction('locate-max-deviation')">定位最高偏离</button>
    </div>

    <PotentialAnomalyDetailDialog
      v-model="detailVisible"
      :anomaly-id="activeDetailId"
      @locate="onDetailLocate"
      @reject="onDetailReject"
      @confirm="onDetailConfirm"
      @brain-read="onBrainRead"
    />

    <PotentialAnomalyListDialog
      v-model="listVisible"
      :rows="listRows"
      @open-detail="openDetailById"
      @batch-confirm="onBatchConfirm"
    />
  </CloudBrainSectionShell>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import CloudBrainSectionShell from "./CloudBrainSectionShell.vue";
import PotentialAnomalyDetailDialog from "./PotentialAnomalyDetailDialog.vue";
import PotentialAnomalyListDialog from "./PotentialAnomalyListDialog.vue";
import type { PotentialAnomalyPanelData } from "@/mock/cloudBrainPanel";
import { potentialAnomalyListMock } from "@/mock/potentialAnomalyDialogs";

const props = defineProps<{
  /** 潜在异常研判 Mock / API 数据 */
  data: PotentialAnomalyPanelData;
}>();

const emit = defineEmits<{
  action: [key: string];
}>();

const detailVisible = ref(false);
const listVisible = ref(false);
const activeDetailId = ref<string | undefined>();

/** 完整列表 Mock */
const listRows = potentialAnomalyListMock;

/** 顶部三列指标卡片展示结构 */
const metricCards = computed(() => [
  { value: props.data.metrics.newIn24h, label: "近 24h 新增" },
  { value: `${props.data.metrics.caseSimilarityPct}%`, label: "战例相似度" },
  { value: props.data.metrics.confirmedImpactCount, label: "全部确认影响" },
]);

const emitAction = (key: string) => {
  emit("action", key);
};

/** 点击置顶标题打开详情 */
const openFeaturedDetail = () => {
  activeDetailId.value = props.data.featured.id;
  detailVisible.value = true;
};

const openListDialog = () => {
  listVisible.value = true;
  emit("action", "view-all");
};

const openDetailById = (id: string) => {
  activeDetailId.value = id;
  detailVisible.value = true;
};

const onDetailLocate = () => {
  emitAction("locate-featured");
  ElMessage.info("定位（Mock）");
};

const onDetailReject = () => {
  ElMessage.warning(`已标记排除：${activeDetailId.value ?? ""}（Mock）`);
};

const onDetailConfirm = () => {
  ElMessage.success(`已确认异常：${activeDetailId.value ?? ""}（Mock）`);
  detailVisible.value = false;
};

const onBrainRead = () => {
  ElMessage.info("云脑解读（Mock，待接业务）");
};

const onBatchConfirm = (ids: string[]) => {
  ElMessage.success(`已提交逐条确认 ${ids.length} 条（Mock）`);
  listVisible.value = false;
};
</script>

<style scoped lang="scss">
.featured {
  margin-top: 8px;
  padding: 8px;
  background: rgba(17, 24, 39, 0.8);
  border: 1px solid rgba(245, 158, 11, 0.5);
  border-radius: 4px;
}

.featured__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.featured__title-btn {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
  padding: 0;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.featured__title-btn:hover .featured__title {
  color: #fde68a;
}

.featured__mark {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 12px;
  color: #fbbf24;
}

.featured__title {
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.35;
  color: #f3f4f6;
}

.featured__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0 12px;
  margin-top: 6px;
  font-size: 10.5px;
  color: #9ca3af;
}

.featured__em {
  font-style: normal;
  font-weight: 600;
  font-family: ui-monospace, monospace;
  color: #fbbf24;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.stat-cell {
  padding: 6px 4px;
  text-align: center;
  background: #111827;
  border: 1px solid rgba(45, 58, 77, 0.38);
  border-radius: 4px;
}

.stat-cell__val {
  font-size: 15px;
  font-weight: 700;
  color: #f3f4f6;
  font-family: ui-monospace, monospace;
}

.stat-cell__label {
  margin-top: 2px;
  font-size: 9.5px;
  line-height: 1.2;
  color: #6b7280;
}

.top-heading {
  margin: 10px 0 4px;
  font-size: 11px;
  color: #9ca3af;
}

.top-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.top-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(45, 58, 77, 0.25);
}

.top-row:last-child {
  border-bottom: none;
}

.top-row__mark {
  flex-shrink: 0;
  font-size: 10px;
  color: #fbbf24;
}

.top-row__main {
  flex: 1;
  min-width: 0;
}

.top-row__title {
  font-size: 11.5px;
  color: #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-row__sub {
  font-size: 10px;
  color: #6b7280;
}

.top-row__score {
  flex-shrink: 0;
  font-size: 12px;
  font-family: ui-monospace, monospace;
  color: #fbbf24;
}

.more-hint {
  margin-top: 6px;
  font-size: 10.5px;
  color: #6b7280;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.ghost-btn {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 10px;
  color: #93c5fd;
  cursor: pointer;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 4px;
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
  cursor: pointer;
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.action-btn:hover {
  background: #253141;
  border-color: #3d4d64;
}
</style>