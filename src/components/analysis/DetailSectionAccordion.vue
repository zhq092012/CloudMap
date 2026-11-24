<template>
  <el-collapse v-if="items.length > 0" v-model="activeNames" class="detail-accordion">
    <el-collapse-item
      v-for="(sec, idx) in items"
      :key="`${sec.title}-${idx}`"
      :name="`section-${idx}`">
      <template #title>
        <div class="detail-collapse-header">{{ sec.title }}{{ appendSuffix }}</div>
      </template>
      <div class="detail-collapse-body">{{ sec.content || "（暂无内容）" }}</div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { parseDetailSections } from "@/utils/detailSections";

const props = withDefaults(
  defineProps<{
    detail?: string | null;
    appendSuffix?: string;
  }>(),
  {
    detail: "",
    appendSuffix: "",
  }
);

const activeNames = ref<string[]>([]);

const text = computed(() => (typeof props.detail === "string" ? props.detail : ""));

const sections = computed(() => parseDetailSections(text.value));

const items = computed(() =>
  sections.value.length > 0
    ? sections.value
    : text.value.trim()
      ? [{ title: "详情", content: text.value }]
      : []
);
</script>

<style scoped>
.detail-accordion {
  border: none !important;
  background-color: transparent !important;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:deep(.el-collapse-item) {
  background-color: var(--bg-panel) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

:deep(.el-collapse-item__header) {
  background-color: var(--bg-panel) !important;
  color: var(--text) !important;
  height: 36px !important;
  line-height: 36px !important;
  padding: 0 12px !important;
  border-bottom: none !important;
  font-size: 12.5px !important;
  font-weight: 500;
  letter-spacing: 0.05em;
  transition: background-color 0.2s ease;
}

:deep(.el-collapse-item__header:hover) {
  background-color: var(--bg-raised) !important;
}

:deep(.el-collapse-item__arrow) {
  color: var(--text-muted) !important;
  font-size: 12px;
}

:deep(.el-collapse-item__wrap) {
  background-color: #0f1622 !important;
  border-bottom: none !important;
}

.detail-collapse-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.detail-collapse-body {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.7;
  border-top: 1px solid var(--border);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
