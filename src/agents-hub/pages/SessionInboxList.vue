<template>
  <div>
    <div v-if="entries.length === 0" class="py-12 text-center text-[#526e8c] text-sm">
      暂无会话 — 先在对话中试试。
    </div>
    <button
      v-for="e in entries"
      :key="e.sessionKey"
      type="button"
      @click="$emit('select', e.sessionKey)"
      class="w-full text-left mb-3 rounded-xl p-4 transition-colors bg-[#0f1927] border border-[#1e324f] hover:bg-[#142338]"
      :class="e.unread ? 'border-l-[3px] border-l-[#00f3ff]' : ''"
      :title="e.sessionId"
    >
      <div class="flex items-center gap-2.5 mb-1.5">
        <span class="flex-1 truncate text-[#a3b8cc] font-semibold text-[15px]">{{ e.label ?? e.sessionId }}</span>
        <span
          v-if="e.unread"
          class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0b2e1f] text-[#00ffc4] border border-[#1d4a38]"
          >未读</span
        >
        <span class="text-[#526e8c] text-xs flex-shrink-0">{{ relTime(e.lastActivityMs) }}</span>
      </div>
      <div v-if="e.lastMessage" class="text-[#708aa6] text-sm truncate">{{ e.lastMessage }}</div>
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
