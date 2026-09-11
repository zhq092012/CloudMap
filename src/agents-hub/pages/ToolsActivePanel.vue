<template>
  <div class="flex flex-col gap-4 h-full min-h-0 p-5 bg-[#060c14]">
    <!-- header -->
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <div class="text-[1.05rem] font-semibold text-white">Active tools</div>
        <div class="text-[13px] text-[#708aa6]">Live view, resolved by introspecting a transient agent against this workspace.</div>
      </div>
      <button type="button" :disabled="loading" @click="$emit('change')"
        class="px-3 py-1.5 rounded-md border border-[#1e324f] bg-[#0b131f] text-[#a3b8cc] text-[13px] font-medium hover:bg-[#142338] disabled:opacity-50">
        {{ loading ? '…' : '↻ refresh' }}
      </button>
      <button type="button" @click="$emit('requestBrowse')"
        class="px-4 py-2 rounded-lg text-white text-sm font-semibold border border-[#2b5384]"
        style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%);">+ Add / configure</button>
    </div>

    <!-- warnings -->
    <div v-if="data?.warnings && data.warnings.length > 0"
      class="rounded-lg border border-[#4a3a1d] bg-[#2e240b] px-3.5 py-2.5 text-[13px] text-[#fbbf24] leading-relaxed">
      <div v-for="(w, i) in data.warnings" :key="i">⚠ {{ w }}</div>
    </div>
    <div v-if="actionErr" class="text-[#ef4444] text-sm">{{ actionErr }}</div>
    <div v-if="err" class="text-[#ef4444] text-sm">{{ err }}</div>

    <!-- list -->
    <div class="flex flex-col gap-2 overflow-auto flex-1 min-h-0">
      <div v-if="!err && !loading && (data?.tools ?? []).length === 0"
        class="p-8 text-center text-[#708aa6] text-[14px]">
        No tools available. Click <b class="text-[#7fd4ff]">Add / configure</b> to enable some.
      </div>
      <template v-for="[source, tools] in groupedEntries" :key="source">
        <div class="text-[0.7rem] font-bold uppercase tracking-wider text-[#526e8c] mt-2 mb-1">
          {{ source === 'built-in' ? 'Built-in' : `MCP — ${source}` }}
        </div>
        <div v-for="t in tools" :key="`${source}:${t.name}`"
          class="flex items-start gap-3 rounded-xl border border-[#1e324f] bg-[#0f1927] p-3.5">
          <span class="px-2 py-0.5 rounded-full text-[0.7rem] font-semibold uppercase tracking-wider flex-shrink-0 border"
            :class="t.source === 'built-in'
              ? 'bg-[#0b2e3a] text-[#00f3ff] border-[#1d4a57]'
              : 'bg-[#0b2e1f] text-[#00ffc4] border-[#1d4a38]'">{{ t.source }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-white text-[0.92rem]">{{ t.name }}</div>
            <div v-if="t.description" class="text-[#708aa6] text-[13px] mt-1 leading-relaxed">{{ t.description }}</div>
          </div>
          <button type="button" @click="disableTool(t)"
            :title="t.source === 'built-in' ? 'Add to deny list' : 'Remove this MCP server'"
            class="px-2.5 py-1 rounded-md border border-[#4a2020] bg-[#2e1414] text-[#ef4444] text-[0.74rem] font-medium hover:bg-[#3a1818] flex-shrink-0 ml-auto">
            Disable
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import * as api from '../api';
import type { ActiveTool, ActiveToolsResponse, ToolsConfig } from '../types';

const props = defineProps<{ agentId: string; refreshKey: number }>();
const emit = defineEmits<{ (e: 'change'): void; (e: 'requestBrowse'): void }>();

const data = ref<ActiveToolsResponse | null>(null);
const loading = ref(false);
const err = ref<string | null>(null);
const actionErr = ref<string | null>(null);

const grouped = computed<Map<string, ActiveTool[]>>(() => {
  const out = new Map<string, ActiveTool[]>();
  for (const t of data.value?.tools ?? []) {
    const key = t.source || 'unknown';
    if (!out.has(key)) out.set(key, []);
    out.get(key)!.push(t);
  }
  return out;
});
const groupedEntries = computed(() => Array.from(grouped.value.entries()));

async function load() {
  loading.value = true;
  err.value = null;
  try {
    data.value = await api.fetchActive(props.agentId);
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed';
  } finally {
    loading.value = false;
  }
}

async function disableTool(t: ActiveTool) {
  actionErr.value = null;
  try {
    const cfg: ToolsConfig = await api.fetchConfig(props.agentId);
    if (t.source === 'built-in') {
      const deny = new Set(cfg.deny ?? []);
      deny.add(t.name);
      cfg.deny = Array.from(deny);
    } else {
      const map = { ...(cfg.mcpServers ?? {}) };
      delete map[t.name];
      cfg.mcpServers = map;
    }
    await api.saveConfig(props.agentId, cfg);
    emit('change');
  } catch (e) {
    actionErr.value = e instanceof Error ? e.message : 'Failed to update config';
  }
}

onMounted(load);
watch(
  () => [props.agentId, props.refreshKey],
  load,
);
</script>
