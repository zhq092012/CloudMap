<template>
  <CloudBrainSectionShell title="态势报告" icon="📄">
    <div class="report-card mt-2">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-1.5 min-w-0">
          <span class="text-[#5eead4] text-sm shrink-0">📄</span>
          <span class="text-[12px] font-semibold text-[#e5e7eb] leading-snug">{{
            data.title
          }}</span>
        </div>
        <span class="report-id">{{ data.reportId }}</span>
      </div>

      <dl class="meta-grid">
        <div class="meta-row">
          <dt>生成时间</dt>
          <dd>{{ data.generatedAt }}</dd>
          <dt class="meta-split">作者</dt>
          <dd>{{ data.author }}</dd>
        </div>
        <div class="meta-row meta-row--full">
          <dt>覆盖范围</dt>
          <dd>{{ data.coverage }}</dd>
        </div>
        <div class="meta-row">
          <dt>统计周期</dt>
          <dd>{{ data.period }}</dd>
          <dt class="meta-split">置信度</dt>
          <dd class="text-[#5eead4]">{{ data.confidencePct }}%</dd>
          <dt class="meta-split">建议</dt>
          <dd>
            {{ data.recommendationTotal }} 项（待执行 {{ data.recommendationPending }}）
          </dd>
        </div>
      </dl>

      <p class="summary">{{ data.summary }}</p>

      <div
        v-if="hasBriefing"
        class="briefing-extra mt-2 p-2 rounded border border-[#2d3a4d]/50 bg-[#111827]/60"
      >
        <div class="text-[10.5px] text-[#9ca3af] mb-1">简报日期：{{ overviewDate }}</div>
        <div class="overview-body markdown-body text-[11px]" v-html="overviewHtml" />
      </div>
      <div
        v-else
        class="text-[11px] text-[#9ca3af] text-center py-2 px-2 rounded border border-[#2d3a4d]/40 bg-[#111827]/40"
      >
        暂无实时简报正文，可点击「重新生成」或「查看详情」发起分析
      </div>

      <div class="btn-row">
        <button type="button" class="btn-primary" @click="emit('view-detail')">查看详情</button>
        <button type="button" class="btn-ghost" @click="emit('map-locate')">地图定位</button>
        <button type="button" class="btn-ghost" @click="emit('export')">导出</button>
        <button type="button" class="btn-ghost" @click="emit('regenerate')">重新生成</button>
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      plain
      class="article-read-dialog"
      width="1160px"
      append-to-body
      align-center
      :close-on-click-modal="false"
      destroy-on-close
      :title="detailDialogTitle"
    >
      <SituationReportDialog
        variant="briefing"
        :heading="briefingHeading"
        :load-state="loadState"
        :briefing="briefing"
        :error="briefingError"
        @regenerate="emit('regenerate')"
        @close="detailVisible = false"
      />
    </el-dialog>
  </CloudBrainSectionShell>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CloudBrainSectionShell from "./CloudBrainSectionShell.vue";
import SituationReportDialog from "@/components/Dialogs/SituationReportDialog.vue";
import type { AnomalyBriefing } from "@/api/briefings";
import type { BriefingDialogState } from "@/components/Dialogs/SituationReportDialog.vue";
import type { SituationReportPanelData } from "@/mock/cloudBrainPanel";

const props = defineProps<{
  /** 态势报告卡片 Mock / API 数据 */
  data: SituationReportPanelData;
  /** 是否已有后端简报 */
  hasBriefing?: boolean;
  /** 简报概览 HTML */
  overviewHtml?: string;
  /** 简报日期展示 */
  overviewDate?: string | null;
  /** 与 CloudBrainPanel 同步的简报详情弹窗显隐 */
  detailVisible?: boolean;
  /** 简报详情弹窗内标题 */
  briefingHeading?: string;
  loadState?: BriefingDialogState;
  briefing?: AnomalyBriefing | null;
  briefingError?: string;
}>();

const emit = defineEmits<{
  "view-detail": [];
  "map-locate": [];
  export: [];
  regenerate: [];
  "update:detailVisible": [visible: boolean];
}>();

/**
 * 计算详情弹窗显隐，与父组件 briefingDialogVisible 双向同步。
 * 返回 boolean。组件内 el-dialog v-model 绑定此值。
 * 作用：点击「查看详情」后父级打开弹窗并拉取简报，本节展示 SituationReportDialog 简报形态。
 */
const detailVisible = computed({
  get: () => props.detailVisible ?? false,
  set: (visible: boolean) => emit("update:detailVisible", visible),
});

/**
 * 计算 el-dialog 顶栏标题。
 * 返回 string。默认「态势报告详情」。
 */
const detailDialogTitle = computed(() => `${props.briefingHeading ?? "态势报告"}详情`);
</script>

<style scoped>
.report-card {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  padding: 10px;
}

.report-id {
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 9px;
  font-family: ui-monospace, monospace;
  color: #9ca3af;
  border: 1px solid #2d3a4d;
  border-radius: 999px;
}

.meta-grid {
  margin: 8px 0;
  font-size: 10px;
  color: #9ca3af;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 6px;
  margin-bottom: 4px;
}

.meta-row dt {
  color: #6b7280;
}

.meta-row dd {
  margin: 0;
  color: #cbd5e1;
}

.meta-split {
  margin-left: 8px;
}

.meta-row--full dd {
  flex: 1;
  min-width: 0;
}

.summary {
  margin: 0;
  font-size: 11px;
  line-height: 1.65;
  color: #cbd5e1;
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.btn-primary {
  padding: 5px 10px;
  font-size: 10.5px;
  font-weight: 500;
  color: #fff;
  background: #2563eb;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-ghost {
  padding: 5px 8px;
  font-size: 10.5px;
  color: #cbd5e1;
  background: transparent;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  cursor: pointer;
}

.btn-ghost:hover {
  background: #253141;
}

.overview-body :deep(p) {
  margin: 4px 0;
  color: #cbd5e1;
  line-height: 1.6;
}

.overview-body :deep(strong) {
  color: #93c5fd;
}
</style>