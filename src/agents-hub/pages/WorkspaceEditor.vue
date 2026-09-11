<template>
  <div class="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0f1927]">
    <div v-if="path"
      class="h-12 px-4 flex items-center gap-3 border-b border-[#142338] bg-[#0b131f] flex-shrink-0">
      <span class="font-mono text-sm text-[#7fd4ff] flex-1 truncate" :title="path">{{ path }}</span>
      <span v-if="!viewable"
        class="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#142338] text-[#708aa6] border border-[#1e324f]">read-only</span>
      <span v-if="error" class="text-sm text-[#ef4444] truncate">{{ error }}</span>
      <button v-if="viewable" type="button" @click="emit('save')" :disabled="saving"
        class="px-3 py-1.5 rounded-lg border border-[#2b5384] text-[#7fd4ff] hover:bg-[#10243a] text-sm font-semibold disabled:opacity-50">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>

    <div v-if="!path"
      class="flex-1 flex items-center justify-center text-[#708aa6] text-sm">Select a file from the tree to view.</div>
    <div v-else-if="loading"
      class="flex-1 flex items-center justify-center text-[#708aa6] text-sm">Loading…</div>
    <div v-else-if="!viewable"
      class="flex-1 flex items-center justify-center text-[#708aa6] text-sm text-center px-8">
      {{ error || 'Cannot view this file in the browser.' }}
    </div>
    <textarea v-else :value="content" @input="onInput" spellcheck="false"
      class="flex-1 w-full p-5 bg-[#060c14] border-none outline-none text-[#a3b8cc] font-mono text-sm leading-relaxed resize-none"></textarea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  path: string | null;
  content: string;
  loading?: boolean;
  error?: string | null;
  saving?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update', v: string): void;
  (e: 'save'): void;
}>();

const TEXT_EXT =
  /\.(md|txt|json|jsonl|ndjson|log|yaml|yml|toml|properties|conf|ini|csv|tsv|xml|html?|css|sql|sh|bash|zsh|java|py|ts|tsx|js|jsx|kt|go|rs|c|cpp|h|hpp)$/i;
const viewable = computed(
  () => !!props.path && (TEXT_EXT.test(props.path) || props.path.endsWith('AGENTS.md')),
);

function onInput(e: Event) {
  emit('update', (e.target as HTMLTextAreaElement).value);
}
</script>
