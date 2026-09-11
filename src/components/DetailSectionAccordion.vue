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
  background-color: #111622 !important;
  border: 1px solid #1c2435 !important;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.el-collapse-item__header) {
  background-color: #111622 !important;
  color: #ffffff !important;
  height: 42px !important;
  line-height: 42px !important;
  padding: 0 16px !important;
  border-bottom: none !important;
  font-size: 13px !important;
  font-weight: 500;
  letter-spacing: 0.05em;
  transition: background-color 0.2s ease;
}

:deep(.el-collapse-item__header:hover) {
  background-color: #161d2d !important;
}

:deep(.el-collapse-item__arrow) {
  color: #94a3b8 !important;
  font-size: 13px;
}

:deep(.el-collapse-item__wrap) {
  background-color: #0a0e17 !important;
  border-bottom: none !important;
}

.detail-collapse-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.detail-collapse-body {
  padding: 12px 16px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
  border-top: 1px solid #161f30;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
