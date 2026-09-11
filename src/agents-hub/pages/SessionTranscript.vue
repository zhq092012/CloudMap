<template>
  <div>
    <div v-if="entries.length === 0" class="text-[#526e8c] text-sm">暂无记录。</div>
    <template v-for="t in entries" :key="t.id">
      <!-- tool call -->
      <div
        v-if="roleOf(t) === 'TOOL'"
        class="mb-3 rounded-lg border border-[#1e324f] bg-[#0f1927] overflow-hidden"
      >
        <button
          type="button"
          @click="toggle(t.id)"
          class="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left bg-[#0b131f] border-b border-[#1e324f]"
        >
          <span class="text-[#00f3ff] font-bold text-xs">{{ openMap[t.id] ? '▼' : '▶' }}</span>
          <span class="text-[#7fd4ff] font-semibold text-sm">工具: {{ t.toolName ?? 'tool' }}</span>
          <span class="ml-auto text-[#526e8c] text-xs font-mono">{{ (t.id || '').slice(0, 10) }}</span>
        </button>
        <div
          v-if="openMap[t.id]"
          class="p-3.5 text-[#a3b8cc] whitespace-pre-wrap break-all max-h-80 overflow-auto font-mono text-xs leading-relaxed"
        >
          {{ toolBody(t) }}
        </div>
      </div>

      <!-- user / assistant / system -->
      <div
        v-else
        class="mb-3.5 p-3.5 rounded-xl text-[15px] leading-relaxed whitespace-pre-wrap break-words"
        :class="bubbleClass(t)"
      >
        <div class="text-[11px] uppercase tracking-wider font-semibold mb-1.5 text-[#526e8c]">
          {{ roleOf(t) }}
        </div>
        {{ t.content ?? '' }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { TurnEntry } from '../types';

defineProps<{
  entries: TurnEntry[];
}>();

const openMap = ref<Record<string, boolean>>({});

function toggle(id: string) {
  openMap.value[id] = !openMap.value[id];
}
function roleOf(t: TurnEntry): string {
  return String(t.role).toUpperCase();
}
function toolBody(t: TurnEntry): string {
  const body = t.toolResult ?? t.toolInput ?? '';
  return body ? body : '运行中…';
}
function bubbleClass(t: TurnEntry): string {
  const role = roleOf(t);
  if (role === 'USER') return 'bg-[#0b1e2e] text-[#7fd4ff] border-l-[3px] border-l-[#00f3ff]';
  if (role === 'ASSISTANT') return 'bg-[#0f1927] text-[#a3b8cc] border border-[#1e324f]';
  return 'bg-[#0b131f] text-[#708aa6] border border-dashed border-[#1e324f]';
}
</script>
