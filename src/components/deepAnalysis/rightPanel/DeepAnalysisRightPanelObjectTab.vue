<template>
  <div class="da-rp-object">
    <div v-if="content.empty" class="da-rp-object__empty">
      <p>{{ content.emptyHint }}</p>
    </div>

    <template v-else>
      <p v-if="content.breadcrumb" class="da-rp-object__crumb">{{ content.breadcrumb }}</p>
      <h3 v-if="content.title" class="da-rp-object__title">{{ content.title }}</h3>
      <p v-if="content.statsLine" class="da-rp-object__stats">{{ content.statsLine }}</p>

      <div v-if="content.metrics?.length" class="da-rp-object__metrics">
        <div
          v-for="(card, idx) in content.metrics"
          :key="idx"
          class="da-rp-object__metric-card"
        >
          <span class="da-rp-object__metric-value">{{ card.value }}</span>
          <span class="da-rp-object__metric-label">{{ card.label }}</span>
        </div>
      </div>

      <section v-if="content.basicInfo?.length" class="da-rp-object__block">
        <h4 class="da-rp-object__block-title">{{ content.basicInfoTitle ?? "基本信息" }}</h4>
        <dl class="da-rp-object__kv">
          <div
            v-for="(row, idx) in content.basicInfo"
            :key="idx"
            class="da-rp-object__kv-row"
          >
            <dt>{{ row.label }}</dt>
            <dd :class="{ 'is-active': row.valueTone === 'active' }">{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="content.overview" class="da-rp-object__block">
        <h4 class="da-rp-object__block-title">{{ content.overviewTitle ?? "概述" }}</h4>
        <p class="da-rp-object__overview">{{ content.overview }}</p>
      </section>

      <section v-if="content.relatedRoots?.length" class="da-rp-object__block">
        <h4 class="da-rp-object__block-title">{{ content.relatedRootsTitle ?? "关联节点" }}</h4>
        <ul class="da-rp-object__roots">
          <li v-for="(rootId, idx) in content.relatedRoots" :key="idx">
            <span class="da-rp-object__root-id">{{ rootId }}</span>
            <span class="da-rp-object__root-id da-rp-object__root-id--right">{{ rootId }}</span>
          </li>
        </ul>
      </section>

      <footer v-if="content.actions?.length" class="da-rp-object__footer">
        <button
          v-for="action in content.actions"
          :key="action.id"
          type="button"
          :class="
            action.variant === 'link'
              ? 'da-rp-object__action-link'
              : 'da-rp-object__action-primary'
          "
          @click="onAction(action.id)"
        >
          {{ action.label }}
        </button>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DeepAnalysisObjectPanelContent } from "@/types/deepAnalysisRightPanel";

defineProps<{
  /** 「对象」Tab 视图模型 */
  content: DeepAnalysisObjectPanelContent;
}>();

/**
 * 对象 Tab 底部操作占位。
 * @param actionId - 操作 id
 */
function onAction(actionId: string): void {
  void actionId;
}
</script>

<style scoped>
.da-rp-object {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 12px 14px 14px;
  overflow-y: auto;
}

.da-rp-object__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 24px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #6b7280;
  text-align: center;
}

.da-rp-object__crumb {
  margin: 0 0 8px;
  font-size: 11px;
  color: #6b7280;
}

.da-rp-object__title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  color: #f3f4f6;
}

.da-rp-object__stats {
  margin: 0 0 14px;
  font-size: 11.5px;
  color: #9ca3af;
}

.da-rp-object__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.da-rp-object__metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 6px;
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 8px;
}

.da-rp-object__metric-value {
  font-size: 22px;
  font-weight: 700;
  color: #f3f4f6;
  font-family: ui-monospace, monospace;
  line-height: 1;
}

.da-rp-object__metric-label {
  font-size: 10.5px;
  color: #6b7280;
}

.da-rp-object__block {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #2d3a4d;
}

.da-rp-object__block-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}

.da-rp-object__kv {
  margin: 0;
}

.da-rp-object__kv-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.da-rp-object__kv-row + .da-rp-object__kv-row {
  margin-top: 6px;
}

.da-rp-object__kv-row dt {
  margin: 0;
  color: #9ca3af;
}

.da-rp-object__kv-row dd {
  margin: 0;
  color: #e5e7eb;
}

.da-rp-object__kv-row dd.is-active {
  color: #22d3ee;
  font-weight: 600;
}

.da-rp-object__overview {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.55;
  color: #f3f4f6;
}

.da-rp-object__roots {
  margin: 0;
  padding: 0;
  list-style: none;
}

.da-rp-object__roots li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 1px solid #2d3a4d40;
}

.da-rp-object__root-id {
  color: #9ca3af;
  font-family: ui-monospace, monospace;
}

.da-rp-object__root-id--right {
  color: #e5e7eb;
}

.da-rp-object__footer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
}

.da-rp-object__action-primary {
  width: 100%;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
  background: transparent;
  border: 1px solid #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.da-rp-object__action-primary:hover {
  background: #253141;
  border-color: #64748b;
}

.da-rp-object__action-link {
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: #93c5fd;
  background: none;
  border: none;
  cursor: pointer;
}

.da-rp-object__action-link:hover {
  text-decoration: underline;
}
</style>