<template>
  <div class="flex flex-col gap-4 h-full min-h-0 p-5 bg-[#0a0e17]">
    <!-- header -->
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <div class="text-[14px] font-semibold text-white">Active tools</div>
        <div class="text-[12.5px] text-[#9ca3af]">Live view, resolved by introspecting a transient agent against this workspace.</div>
      </div>
      <button type="button" :disabled="loading" @click="$emit('change')"
        class="tl-tool-ghost">
        {{ loading ? '…' : '↻ refresh' }}
      </button>
      <button type="button" @click="$emit('requestBrowse')"
        class="tl-tool-primary">+ 添加 / 配置工具</button>
    </div>

    <!-- warnings -->
    <div v-if="data?.warnings && data.warnings.length > 0"
      class="rounded-lg border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.12)] px-3.5 py-2.5 text-[12.5px] text-[#f59e0b] leading-relaxed">
      <div v-for="(w, i) in data.warnings" :key="i">⚠ {{ w }}</div>
    </div>
    <div v-if="actionErr" class="text-[#ef4444] text-[12.5px]">{{ actionErr }}</div>
    <div v-if="err" class="text-[#ef4444] text-[12.5px]">{{ err }}</div>

    <!-- list -->
    <div class="flex flex-col gap-2 overflow-auto flex-1 min-h-0">
      <div v-if="!err && !loading && (data?.tools ?? []).length === 0"
        class="p-8 text-center text-[#9ca3af] text-[13px]">
        No tools available. Click <b class="text-[#93c5fd]">Add / configure</b> to enable some.
      </div>
      <template v-for="[source, tools] in groupedEntries" :key="source">
        <div class="mt-2 mb-1 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
          <span>{{ sourceLabel(source) }}</span>
          <span class="h-px flex-1 bg-[#2d3a4d]"></span>
          <span class="text-[10.5px] font-medium tracking-normal text-[#6b7280]">{{ tools.length }}</span>
        </div>
        <div v-for="t in tools" :key="`${source}:${t.name}`"
          class="flex items-start gap-3 rounded-lg border border-[#2d3a4d] bg-[#1a2332] p-3.5">
          <span class="px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider flex-shrink-0 border"
            :class="t.source === 'built-in'
              ? 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border-[rgba(59,130,246,0.45)]'
              : 'bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[rgba(16,185,129,0.35)]'">{{ t.source }}</span>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-white text-[13px]">{{ t.name }}</div>
            <div v-if="t.description" class="text-[#9ca3af] text-[12.5px] mt-1 leading-relaxed">{{ t.description }}</div>
          </div>
          <button type="button" @click="disableTool(t)"
            :title="t.source === 'built-in' ? 'Add to deny list' : 'Remove this MCP server'"
            class="tl-tool-disable">
            停用
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

// 分组标题：内置工具与 MCP 服务器分开展示，避免出现「MCP — mcp」这类重复。
function sourceLabel(source: string): string {
  const key = (source || '').toLowerCase();
  if (key === 'built-in' || key === 'builtin') return '内置工具';
  if (key === 'mcp') return 'MCP 服务器';
  return `MCP · ${source}`;
}

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


<style scoped lang="scss">
@use "../styles/tokens" as *;

.tl-tool-ghost {
  flex: none;
  height: 28px;
  padding: 0 12px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: $bg-sunken;
  color: $text-2;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover:not(:disabled) {
    color: $accent-text;
    border-color: $accent-line;
    background: $accent-soft;
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
}

.tl-tool-primary {
  flex: none;
  height: 30px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: $radius-md;
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  @include accent-gradient;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: box-shadow $ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.42);
  }
}

.tl-tool-disable {
  flex: none;
  margin-left: auto;
  height: 26px;
  padding: 0 11px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: transparent;
  color: $text-3;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease;

  &:hover {
    color: #fca5a5;
    border-color: $red-line;
    background: $red-soft;
  }
}
</style>
