<template>
  <div class="my-2 rounded-lg border border-[#1e324f] overflow-hidden bg-[#0f1927]">
    <div class="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer select-none bg-[#0b1e2e] border-b border-[#1e324f]"
      @click="open = !open">
      <span class="text-[#7fd4ff] font-bold text-xs">{{ open ? '▼' : '▶' }}</span>
      <span class="text-[#7fd4ff] font-semibold text-sm">工具: {{ toolName }}</span>
      <span class="ml-auto text-[#526e8c] text-xs font-mono">{{ toolCallId.slice(0, 10) }}</span>
    </div>
    <div v-if="open && result"
      class="p-3.5 text-[#a3b8cc] whitespace-pre-wrap break-all max-h-80 overflow-y-auto font-mono text-xs leading-relaxed">
      {{ result }}
    </div>
    <div v-if="open && !result" class="p-3.5 text-[#526e8c] text-sm">运行中…</div>
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
