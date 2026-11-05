<template>
  <div>
    <div v-if="entries.length === 0" class="ib-empty">暂无会话 —— 先在对话中试试。</div>
    <button
      v-for="e in entries"
      :key="e.sessionKey"
      type="button"
      class="ib-card"
      :class="{ 'is-unread': e.unread }"
      :title="e.sessionId"
      @click="$emit('select', e.sessionKey)"
    >
      <div class="ib-head">
        <span class="ib-label">{{ e.label ?? e.sessionId }}</span>
        <span v-if="e.unread" class="ib-unread">未读</span>
        <span class="ib-time">{{ relTime(e.lastActivityMs) }}</span>
      </div>
      <div v-if="e.lastMessage" class="ib-preview">{{ e.lastMessage }}</div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { InboxEntry } from '../types';

defineProps<{
  entries: InboxEntry[];
  unreadOnly?: boolean;
}>();
const emit = defineEmits<{ (e: 'select', sessionKey: string): void }>();

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时`;
  return `${Math.floor(diff / 86_400_000)} 天`;
}
</script>

<style scoped lang="scss">
@use "../styles/tokens" as *;

.ib-empty {
  padding: 46px 0;
  text-align: center;
  font-size: 12.5px;
  color: $text-3;
}

.ib-card {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 1px solid $border;
  border-left: 3px solid transparent;
  border-radius: $radius-lg;
  background: $bg-panel;
  text-align: left;
  cursor: pointer;
  transition: border-color $ease, background $ease;

  &:hover {
    border-color: $border-strong;
    background: $bg-elevated;
  }

  &.is-unread {
    border-left-color: $accent;
  }
}

.ib-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ib-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: $text;
}

.ib-unread {
  flex: none;
  padding: 1px 8px;
  border-radius: 9px;
  border: 1px solid $green-line;
  background: $green-soft;
  color: $green;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.7;
}

.ib-time {
  flex: none;
  font-size: 10.5px;
  color: $text-4;
}

.ib-preview {
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11.5px;
  line-height: 1.6;
  color: $text-3;
}
</style>
