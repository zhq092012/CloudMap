<!-- 潜在异常详情弹窗（Mock） -->
<template>
  <el-dialog
    v-model="visible"
    append-to-body
    class="pa-detail-dialog"
    width="920px"
    :close-on-click-modal="false"
    :show-close="true"
    @closed="emit('closed')"
  >
    <template #header>
      <div class="pa-detail-dialog__head">
        <h2 class="pa-detail-dialog__title">{{ detail?.title }}</h2>
        <div class="pa-detail-dialog__id">{{ detail?.id }}</div>
      </div>
    </template>

    <div v-if="detail" class="pa-detail-dialog__body custom-scrollbar">
      <div class="pa-detail-dialog__metrics">
        <div class="metric-chip">
          <span class="metric-chip__label">偏离度</span>
          <span class="metric-chip__val metric-chip__val--warn">{{ detail.deviation }}</span>
        </div>
        <div class="metric-chip">
          <span class="metric-chip__label">置信度</span>
          <span class="metric-chip__val">{{ detail.confidencePct }}%</span>
        </div>
        <div class="metric-chip">
          <span class="metric-chip__label">持续</span>
          <span class="metric-chip__val">{{ detail.durationDays }}天</span>
        </div>
        <div class="metric-chip">
          <span class="metric-chip__label">区域</span>
          <span class="metric-chip__val metric-chip__val--sm">{{ detail.region }}</span>
        </div>
        <div class="metric-chip">
          <span class="metric-chip__label">命中指标数</span>
          <span class="metric-chip__val">{{ detail.indicatorHits }}</span>
        </div>
      </div>

      <section class="pa-block">
        <h3 class="pa-block__title">基础信息</h3>
        <dl class="pa-kv">
          <div class="pa-kv__row">
            <dt>类型/子类</dt>
            <dd>{{ detail.typeLabel }}</dd>
          </div>
          <div class="pa-kv__row">
            <dt>区域</dt>
            <dd>{{ detail.regionDetail }}</dd>
          </div>
          <div class="pa-kv__row">
            <dt>首次发现</dt>
            <dd>{{ detail.firstSeen }}</dd>
          </div>
          <div class="pa-kv__row">
            <dt>最近活动</dt>
            <dd>{{ detail.lastActive }}</dd>
          </div>
          <div class="pa-kv__row">
            <dt>状态</dt>
            <dd>
              <span class="status-tag">{{ detail.statusLabel }}</span>
            </dd>
          </div>
          <div class="pa-kv__row">
            <dt>关联实体</dt>
            <dd>{{ detail.relatedEntities }}</dd>
          </div>
          <div class="pa-kv__row">
            <dt>源情报</dt>
            <dd>{{ detail.sourceIntel }}</dd>
          </div>
        </dl>
      </section>

      <section class="pa-block">
        <h3 class="pa-block__title">研判摘要</h3>
        <p class="pa-block__text">{{ detail.summary }}</p>
      </section>

      <section class="pa-block">
        <h3 class="pa-block__title">行为基线对比表</h3>
        <div class="pa-table-wrap">
          <table class="pa-table">
            <thead>
              <tr>
                <th>指标</th>
                <th>当前值</th>
                <th>基线值</th>
                <th>偏离%</th>
                <th>Z值</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in detail.baselineRows" :key="row.indicator">
                <td>{{ row.indicator }}</td>
                <td>{{ row.current }}</td>
                <td>{{ row.baseline }}</td>
                <td class="num-warn">{{ row.deviationPct }}</td>
                <td>{{ row.zScore }}</td>
                <td><span class="status-tag status-tag--danger">{{ row.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="pa-block">
        <h3 class="pa-block__title">历史匹配表</h3>
        <div class="pa-table-wrap">
          <table class="pa-table">
            <thead>
              <tr>
                <th>战例 ID</th>
                <th>战例名称</th>
                <th>时间</th>
                <th>相似度</th>
                <th>共性特征</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in detail.historyRows" :key="row.caseId">
                <td>{{ row.caseId }}</td>
                <td>{{ row.caseName }}</td>
                <td>{{ row.time }}</td>
                <td>{{ row.similarity }}</td>
                <td>{{ row.commonFeatures }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="pa-block">
        <h3 class="pa-block__title">事件时间线</h3>
        <div class="pa-table-wrap">
          <table class="pa-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>事件描述</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in detail.timelineRows" :key="idx">
                <td>{{ row.time }}</td>
                <td>{{ row.event }}</td>
                <td>{{ row.source }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="pa-block">
        <h3 class="pa-block__title">关联与影响</h3>
        <dl class="pa-kv">
          <div class="pa-kv__row">
            <dt>关联异常</dt>
            <dd>{{ detail.relatedAnomalies }}</dd>
          </div>
          <div class="pa-kv__row">
            <dt>关联报告</dt>
            <dd>{{ detail.relatedReports }}</dd>
          </div>
          <div class="pa-kv__row">
            <dt>影响范围</dt>
            <dd>{{ detail.impactNote }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <template #footer>
      <div class="pa-detail-dialog__footer">
        <button type="button" class="link-btn" @click="emit('brain-read')">查看云脑解读 →</button>
        <div class="pa-detail-dialog__footer-actions">
          <button type="button" class="foot-btn" @click="emit('locate')">定位</button>
          <button type="button" class="foot-btn foot-btn--danger" @click="emit('reject')">排除</button>
          <button type="button" class="foot-btn foot-btn--primary" @click="emit('confirm')">确认</button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getPotentialAnomalyDetail } from "@/mock/potentialAnomalyDialogs";

const visible = defineModel<boolean>({ required: true });

const props = defineProps<{
  /** 打开详情的异常编号 */
  anomalyId?: string;
}>();

const emit = defineEmits<{
  closed: [];
  locate: [];
  reject: [];
  confirm: [];
  "brain-read": [];
}>();

/**
 * 根据编号解析详情 Mock；编号缺失或未知时不展示正文。
 */
const detail = computed(() => {
  if (!props.anomalyId) return undefined;
  return getPotentialAnomalyDetail(props.anomalyId);
});
</script>

<style scoped lang="scss">
.pa-detail-dialog__head {
  padding-right: 28px;
}

.pa-detail-dialog__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #f3f4f6;
}

.pa-detail-dialog__id {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  font-family: ui-monospace, monospace;
}

.pa-detail-dialog__body {
  max-height: min(62vh, 640px);
  overflow-y: auto;
  padding-right: 4px;
}

.pa-detail-dialog__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.metric-chip {
  flex: 1 1 100px;
  min-width: 88px;
  padding: 8px 10px;
  background: #0f172a;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  text-align: center;
}

.metric-chip__label {
  display: block;
  font-size: 10px;
  color: #6b7280;
}

.metric-chip__val {
  display: block;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #e5e7eb;
  font-family: ui-monospace, monospace;
}

.metric-chip__val--warn {
  color: #fbbf24;
}

.metric-chip__val--sm {
  font-size: 12px;
  font-weight: 600;
}

.pa-block {
  margin-bottom: 18px;
}

.pa-block__title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: #93c5fd;
}

.pa-block__text {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #cbd5e1;
}

.pa-kv__row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.pa-kv__row dt {
  color: #6b7280;
}

.pa-kv__row dd {
  margin: 0;
  color: #e5e7eb;
}

.status-tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.status-tag--danger {
  color: #f87171;
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.35);
}

.pa-table-wrap {
  overflow-x: auto;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
}

.pa-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.pa-table th,
.pa-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #2d3a4d40;
  color: #cbd5e1;
}

.pa-table th {
  background: #111827;
  color: #93c5fd;
  font-weight: 600;
}

.pa-table tbody tr:last-child td {
  border-bottom: none;
}

.num-warn {
  color: #fbbf24;
  font-family: ui-monospace, monospace;
}

.pa-detail-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pa-detail-dialog__footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.link-btn {
  padding: 0;
  font-size: 12px;
  color: #60a5fa;
  background: none;
  border: none;
  cursor: pointer;
}

.foot-btn {
  min-width: 72px;
  padding: 6px 14px;
  font-size: 12px;
  color: #cbd5e1;
  background: #111827;
  border: 1px solid #3d4d64;
  border-radius: 6px;
  cursor: pointer;
}

.foot-btn:hover {
  background: #253141;
}

.foot-btn--primary {
  color: #fff;
  background: #2563eb;
  border-color: #2563eb;
}

.foot-btn--primary:hover {
  background: #1d4ed8;
}

.foot-btn--danger {
  color: #fca5a5;
  border-color: rgba(248, 113, 113, 0.45);
}

.foot-btn--danger:hover {
  background: rgba(127, 29, 29, 0.25);
}
</style>

<style lang="scss">
.pa-detail-dialog.el-dialog {
  background: #111827;
  border: 1px solid #2d3a4d;
}

.pa-detail-dialog .el-dialog__header {
  margin-right: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #2d3a4d;
}

.pa-detail-dialog .el-dialog__body {
  padding-top: 12px;
  color: #e5e7eb;
}

.pa-detail-dialog .el-dialog__footer {
  border-top: 1px solid #2d3a4d;
}
</style>