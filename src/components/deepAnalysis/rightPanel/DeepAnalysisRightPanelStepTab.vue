<template>
  <div class="da-rp-step">
    <header class="da-rp-step__meta">
      <span class="da-rp-step__meta-index">{{ content.displayIndex }}</span>
      <span class="da-rp-step__meta-title">{{ content.stepTitle }}</span>
      <span class="da-rp-step__meta-dot">·</span>
      <span class="da-rp-step__meta-status">{{ content.phaseStatus }}</span>
    </header>

    <h3 class="da-rp-step__headline">{{ content.headline }}</h3>
    <p class="da-rp-step__subtitle">{{ content.subtitle }}</p>

    <div class="da-rp-step__sections custom-scrollbar">
      <section
        v-for="(section, sIdx) in content.sections"
        :key="sIdx"
        class="da-rp-step__section"
      >
        <h4 class="da-rp-step__section-title">{{ section.title }}</h4>

        <template v-if="section.kind === 'keyValue'">
          <dl class="da-rp-step__kv">
            <div
              v-for="(row, rIdx) in section.rows"
              :key="rIdx"
              class="da-rp-step__kv-row"
            >
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </template>

        <template v-else-if="section.kind === 'bullets'">
          <ul class="da-rp-step__bullets">
            <li v-for="(item, iIdx) in section.items" :key="iIdx">
              <strong v-if="item.emphasis" class="da-rp-step__emphasis">{{ item.emphasis }}</strong>
              <span>{{ item.text }}</span>
            </li>
          </ul>
        </template>

        <template v-else-if="section.kind === 'pipeline'">
          <p class="da-rp-step__pipeline">
            <template v-for="(agent, aIdx) in section.agents" :key="aIdx">
              <span>{{ agent }}</span>
              <span v-if="aIdx < section.agents.length - 1" class="da-rp-step__pipeline-arrow">→</span>
            </template>
            <template v-if="section.pendingSuffix">
              <span class="da-rp-step__pipeline-arrow">→</span>
              <span class="da-rp-step__pipeline-pending">{{ section.pendingSuffix }}</span>
            </template>
          </p>
        </template>

        <template v-else-if="section.kind === 'tables'">
          <p class="da-rp-step__tables-hint">{{ section.hint }}</p>
          <button
            v-for="(entry, eIdx) in section.entries"
            :key="eIdx"
            type="button"
            class="da-rp-step__table-row"
            @click="onTableEntry(entry.title)"
          >
            <span class="da-rp-step__table-chevron">▸</span>
            <span class="da-rp-step__table-name">{{ entry.title }}</span>
            <span class="da-rp-step__table-meta">
              {{ entry.rowCount }} 行 · {{ entry.colCount }} 列
            </span>
          </button>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeepAnalysisStepPanelContent } from "@/types/deepAnalysisRightPanel";

defineProps<{
  /** 「步骤」Tab 视图模型 */
  content: DeepAnalysisStepPanelContent;
}>();

/**
 * 短表摘要行点击：后续打开栏内展开或主区弹窗。
 * @param tableTitle - 表名
 */
function onTableEntry(tableTitle: string): void {
  void tableTitle;
}
</script>

<style scoped>
.da-rp-step {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 12px 14px 14px;
}

.da-rp-step__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 11px;
  color: #6b7280;
}

.da-rp-step__meta-index,
.da-rp-step__meta-title {
  color: #9ca3af;
}

.da-rp-step__meta-status {
  color: #6b7280;
  font-family: ui-monospace, monospace;
}

.da-rp-step__headline {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #f3f4f6;
  line-height: 1.3;
}

.da-rp-step__subtitle {
  margin: 0 0 14px;
  font-size: 11.5px;
  line-height: 1.5;
  color: #6b7280;
}

.da-rp-step__sections {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.da-rp-step__section + .da-rp-step__section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #2d3a4d;
}

.da-rp-step__section-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.02em;
}

.da-rp-step__kv {
  margin: 0;
}

.da-rp-step__kv-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.da-rp-step__kv-row + .da-rp-step__kv-row {
  margin-top: 6px;
}

.da-rp-step__kv-row dt {
  margin: 0;
  color: #9ca3af;
}

.da-rp-step__kv-row dd {
  margin: 0;
  color: #e5e7eb;
}

.da-rp-step__bullets {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  line-height: 1.55;
  color: #cbd5e1;
}

.da-rp-step__bullets li + li {
  margin-top: 4px;
}

.da-rp-step__emphasis {
  font-weight: 700;
  color: #f3f4f6;
  margin-right: 4px;
}

.da-rp-step__pipeline {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #cbd5e1;
}

.da-rp-step__pipeline-arrow {
  margin: 0 4px;
  color: #4b5563;
}

.da-rp-step__pipeline-pending {
  color: #9ca3af;
}

.da-rp-step__tables-hint {
  margin: 0 0 8px;
  font-size: 11.5px;
  line-height: 1.5;
  color: #6b7280;
}

.da-rp-step__table-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 6px;
  padding: 8px 10px;
  text-align: left;
  font-size: 12px;
  color: #e5e7eb;
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.da-rp-step__table-row:hover {
  background: #253141;
}

.da-rp-step__table-chevron {
  color: #6b7280;
  flex-shrink: 0;
}

.da-rp-step__table-name {
  flex: 1;
  min-width: 0;
}

.da-rp-step__table-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: #6b7280;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}
</style>