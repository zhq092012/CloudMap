<template>
  <div class="tc-block">
    <button type="button" class="tc-head" @click="open = !open">
      <span class="tc-caret">{{ open ? '▼' : '▶' }}</span>
      <span class="tc-name">工具 · {{ toolName }}</span>
      <span class="tc-id">{{ toolCallId.slice(0, 10) }}</span>
    </button>
    <pre v-if="open && result" class="tc-body">{{ result }}</pre>
    <div v-if="open && !result" class="tc-pending">运行中…</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  toolName: string;
  toolCallId: string;
  result?: string;
}>();

const open = ref(false);
</script>

<style scoped lang="scss">
@use "./styles/tokens" as *;

.tc-block {
  margin: 8px 0;
  overflow: hidden;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
}

.tc-head {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid $border;
  background: $bg-sunken;
  text-align: left;
  cursor: pointer;
  user-select: none;
}

.tc-caret {
  font-size: 10px;
  color: $accent-text;
}

.tc-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: $accent-text;
}

.tc-id {
  font-family: var(--mono);
  font-size: 10.5px;
  color: $text-4;
}

.tc-body {
  max-height: 320px;
  margin: 0;
  padding: 11px 12px;
  overflow: auto;
  font-family: var(--mono);
  font-size: 11.5px;
  line-height: 1.7;
  color: $text-2;
  white-space: pre-wrap;
  word-break: break-all;
  @include thin-scroll(6px);
}

.tc-pending {
  padding: 11px 12px;
  font-size: 12px;
  color: $text-3;
}
</style>
