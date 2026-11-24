<template>
  <CloudBrainSectionShell title="重点关注" icon="◎">
    <ul class="focus-list mt-2">
      <li v-for="item in data.items" :key="item.id" class="focus-item">
        <div class="focus-item__head">
          <span class="focus-item__icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="focus-item__title">{{ item.title }}</span>
          <span class="focus-item__time">{{ item.time }}</span>
          <button
            type="button"
            class="focus-item__close"
            aria-label="忽略"
            @click="emit('dismiss', item.id)"
          >
            ×
          </button>
        </div>
        <p class="focus-item__source">{{ item.sourceLine }}</p>
        <div class="focus-item__foot">
          <span class="severity" :class="`severity--${item.severity}`">{{
            severityLabel(item.severity)
          }}</span>
          <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
          <button
            v-if="item.inBasket"
            type="button"
            class="in-basket"
            disabled
          >
            ✓ 已入篮
          </button>
        </div>
      </li>
    </ul>
  </CloudBrainSectionShell>
</template>

<script setup lang="ts">
import CloudBrainSectionShell from "./CloudBrainSectionShell.vue";
import type { KeyFocusPanelData, KeyFocusSeverity } from "@/mock/cloudBrainPanel";

defineProps<{
  /** 重点关注 Mock / API 数据 */
  data: KeyFocusPanelData;
}>();

const emit = defineEmits<{
  dismiss: [id: string];
}>();

/**
 * 严重等级中文文案。
 * @param severity - 等级枚举
 */
const severityLabel = (severity: KeyFocusSeverity) => {
  const map: Record<KeyFocusSeverity, string> = {
    urgent: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };
  return map[severity];
};
</script>

<style scoped>
.focus-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
}

.focus-item {
  padding: 8px 0;
  border-bottom: 1px solid #2d3a4d50;
}

.focus-item:last-child {
  border-bottom: none;
}

.focus-item__head {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 6px;
}

.focus-item__icon {
  font-size: 12px;
  color: #9ca3af;
}

.focus-item__title {
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-item__time {
  font-size: 10px;
  color: #6b7280;
  font-family: ui-monospace, monospace;
}

.focus-item__close {
  width: 18px;
  height: 18px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
}

.focus-item__close:hover {
  color: #cbd5e1;
}

.focus-item__source {
  margin: 4px 0 6px;
  font-size: 10.5px;
  color: #9ca3af;
  line-height: 1.45;
}

.focus-item__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.severity {
  display: inline-block;
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 2px;
}

.severity--urgent {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.severity--high {
  color: #fde68a;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.45);
}

.severity--medium {
  color: #e5e7eb;
  background: #374151;
  border: 1px solid #4b5563;
}

.severity--low {
  color: #9ca3af;
  background: #1f2937;
  border: 1px solid #374151;
}

.tag {
  font-size: 9.5px;
  color: #9ca3af;
  padding: 1px 5px;
  border: 1px solid #2d3a4d;
  border-radius: 3px;
}

.in-basket {
  margin-left: auto;
  padding: 2px 6px;
  font-size: 9.5px;
  color: #5eead4;
  background: rgba(13, 148, 136, 0.15);
  border: 1px solid rgba(45, 212, 191, 0.35);
  border-radius: 4px;
  cursor: default;
}
</style>