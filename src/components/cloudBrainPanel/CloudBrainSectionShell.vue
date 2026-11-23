<template>
  <section class="cb-section">
  <button
    type="button"
    class="cb-section__head"
    :aria-expanded="expanded"
    @click="expanded = !expanded"
  >
    <span class="cb-section__head-left">
      <span v-if="icon" class="cb-section__icon" aria-hidden="true">{{ icon }}</span>
      <span class="cb-section__title">{{ title }}</span>
      <span v-if="badge" class="cb-section__badge">{{ badge }}</span>
    </span>
    <span class="cb-section__chevron" aria-hidden="true">{{ expanded ? "⌃" : "⌄" }}</span>
  </button>
  <div v-show="expanded" class="cb-section__body">
    <slot />
  </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    /** 区块标题，如「潜在异常研判」 */
    title: string;
    /** 标题左侧符号/emoji */
    icon?: string;
    /** 标题旁徽章文案，如「4 待研判」 */
    badge?: string;
    /** 初始是否展开 */
    defaultExpanded?: boolean;
  }>(),
  {
    icon: "",
    badge: "",
    defaultExpanded: true,
  },
);

/** 当前折叠状态 */
const expanded = ref(props.defaultExpanded);
</script>

<style scoped>
.cb-section {
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  background: #1a2332;
  overflow: hidden;
}

.cb-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: #e5e7eb;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.cb-section__head:hover {
  background: #253141;
}

.cb-section__head-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cb-section__icon {
  font-size: 13px;
  line-height: 1;
}

.cb-section__title {
  white-space: nowrap;
}

.cb-section__badge {
  margin-left: 4px;
  padding: 1px 6px;
  font-size: 10.5px;
  font-weight: 500;
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.45);
  border-radius: 999px;
  white-space: nowrap;
}

.cb-section__chevron {
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
}

.cb-section__body {
  padding: 0 10px 10px;
  border-top: 1px solid #2d3a4d40;
}
</style>