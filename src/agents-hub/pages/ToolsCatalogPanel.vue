<template>
  <div class="flex flex-col h-full min-h-0 bg-[#0a0e17]">
    <!-- tabs -->
    <div class="flex gap-1 px-5 pt-3 border-b border-[#2d3a4d] bg-[#111827]">
      <button type="button" @click="tab = 'builtin'"
        class="px-4 py-2.5 border-b-2 transition-colors text-[12.5px] font-medium"
        :class="tab === 'builtin' ? 'text-white border-[#3b82f6]' : 'text-[#9ca3af] border-transparent hover:text-[#cbd5e1]'">
        Built-in tools
      </button>
      <button type="button" @click="tab = 'mcp'"
        class="px-4 py-2.5 border-b-2 transition-colors text-[12.5px] font-medium"
        :class="tab === 'mcp' ? 'text-white border-[#3b82f6]' : 'text-[#9ca3af] border-transparent hover:text-[#cbd5e1]'">
        MCP servers
      </button>
    </div>

    <!-- built-in -->
    <div v-if="tab === 'builtin'" class="flex-1 overflow-auto p-5 bg-[#0a0e17]">
      <div v-if="builtinLoading" class="text-[#9ca3af]">Loading…</div>
      <div v-if="builtinErr" class="text-[#ef4444] text-[12.5px]">{{ builtinErr }}</div>
      <template v-if="!builtinLoading">
        <template v-for="[group, items] in builtinGroups" :key="group">
          <div class="text-[10.5px] font-bold uppercase tracking-wider text-[#6b7280] mt-2 mb-1">{{ group }}</div>
          <label v-for="b in items" :key="b.id"
            class="flex items-start gap-3 bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-3.5 mb-2 cursor-pointer">
            <input type="checkbox" :checked="enabled.has(b.id)" @change="toggle(b.id)" class="mt-1 accent-[#3b82f6]" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-white text-[13px]">{{ b.id }}</div>
              <div v-if="b.description" class="text-[#9ca3af] text-[12.5px] mt-0.5 leading-relaxed">{{ b.description }}</div>
            </div>
          </label>
        </template>
      </template>
      <div class="flex items-center gap-3 px-0 py-3 border-t border-[#2d3a4d]">
        <span class="flex-1 text-[12.5px] text-[#9ca3af]">
          {{ dirty ? `${enabled.size} of ${builtinCatalog.length} enabled — unsaved` : `${enabled.size} of ${builtinCatalog.length} enabled` }}
        </span>
        <button type="button" :disabled="!dirty || builtinSaving" @click="saveBuiltin"
          class="px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          :class="!dirty || builtinSaving ? 'bg-[#253141] text-[#9ca3af]' : 'bg-gradient-to-r from-[#3b82f6] to-[#3b82f6]'">
          {{ builtinSaving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>

    <!-- mcp -->
    <div v-else class="flex-1 overflow-auto p-5 bg-[#0a0e17] relative">
      <div v-if="mcpLoading" class="text-[#9ca3af]">Loading…</div>
      <div v-if="mcpErr" class="text-[#ef4444] text-[12.5px]">{{ mcpErr }}</div>
      <div v-if="!mcpLoading && mcpCatalog.length === 0"
        class="text-[#9ca3af] p-6 text-center">
        No MCP servers in the catalog. You can still add servers by editing
        <code class="text-[#cbd5e1]">workspace/tools.json</code> directly.
      </div>
      <div v-for="entry in mcpCatalog" :key="entry.id"
        class="flex items-start gap-3 bg-[#1a2332] border border-[#2d3a4d] rounded-lg p-3.5 mb-2">
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-white text-[13px]">{{ entry.name }}</div>
          <div v-if="entry.description" class="text-[#9ca3af] text-[12.5px] mt-0.5 leading-relaxed">{{ entry.description }}</div>
          <a v-if="entry.docsUrl" :href="entry.docsUrl" target="_blank" rel="noreferrer"
            class="text-[11.5px] text-[#93c5fd] mt-1 inline-block">docs ↗</a>
        </div>
        <span v-if="mcpInstalled.has(entry.id)"
          class="px-2.5 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-wider flex-shrink-0 border bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[rgba(16,185,129,0.35)]">installed</span>
        <button v-else type="button" @click="openAdd(entry)"
          class="px-3.5 py-1.5 rounded-md border border-[rgba(59,130,246,0.45)] bg-[rgba(59,130,246,0.12)] text-[#93c5fd] text-[11.5px] font-semibold hover:bg-[#253141] flex-shrink-0">+ Add</button>
      </div>

      <!-- add form -->
      <div v-if="adding"
        class="absolute inset-0 z-[90] flex items-center justify-center bg-[#0a0e17]/70"
        @click="adding = null">
        <div class="w-[min(520px,92vw)] max-h-[85vh] overflow-auto rounded-lg border border-[#3d4d64] bg-[#111827] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          @click.stop>
          <div class="text-[13.5px] font-semibold text-white">Add MCP server: {{ adding.name }}</div>
          <div class="text-[12.5px] text-[#9ca3af] mt-1">
            Transport: <b class="text-[#cbd5e1]">{{ adding.transport }}</b>
            <template v-if="adding.url"> &middot; URL: <code class="text-[#cbd5e1]">{{ adding.url }}</code></template>
          </div>

          <label class="block text-[11.5px] font-semibold text-[#cbd5e1] mt-3 mb-1">Server name (key in tools.json)</label>
          <input v-model="addName" :disabled="addBusy" placeholder="e.g. amap"
            class="w-full box-border px-3 py-2 rounded-md border border-[#2d3a4d] bg-[#1a2332] text-[#cbd5e1] text-[12.5px] outline-none font-mono" />

          <template v-if="(adding.requiredEnv ?? []).length > 0">
            <div class="text-[11.5px] font-semibold text-[#cbd5e1] mt-4 mb-1">Environment variables</div>
            <div class="text-[11.5px] text-[#9ca3af] mb-1.5">
              Leave blank to use the process environment (recommended for secrets). Values here are persisted into <code class="text-[#cbd5e1]">tools.json</code>.
            </div>
            <div v-for="envKey in adding.requiredEnv ?? []" :key="envKey" class="mb-2">
              <label class="text-[11.5px] text-[#9ca3af] font-mono">{{ envKey }}</label>
              <input v-model="envValues[envKey]" :disabled="addBusy" :placeholder="`$${envKey}`" type="text"
                class="w-full box-border px-3 py-2 rounded-md border border-[#2d3a4d] bg-[#1a2332] text-[#cbd5e1] text-[12.5px] outline-none font-mono" />
            </div>
          </template>

          <div v-if="addErr" class="mt-3 text-[#ef4444] text-[12.5px]">{{ addErr }}</div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" :disabled="addBusy" @click="adding = null"
              class="px-3.5 py-1.5 rounded-md border border-[#2d3a4d] bg-[#1a2332] text-[#cbd5e1] text-[12.5px] disabled:opacity-50">Cancel</button>
            <button type="button" :disabled="addBusy || !addName.trim()" @click="submitAdd"
              class="px-4 py-1.5 rounded-md text-white text-[12.5px] font-semibold disabled:opacity-60"
              style="background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);">
              {{ addBusy ? 'Adding…' : 'Add server' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as api from '../api';
import type { BuiltinToolInfo, McpCatalogEntry, McpServerConfig, ToolsConfig } from '../types';

const props = defineProps<{ agentId: string }>();
const emit = defineEmits<{ saved: [] }>();

const tab = ref<'builtin' | 'mcp'>('builtin');

// ---------------- built-in ----------------
const builtinCatalog = ref<BuiltinToolInfo[]>([]);
const builtinCfg = ref<ToolsConfig | null>(null);
const builtinLoading = ref(true);
const builtinSaving = ref(false);
const builtinErr = ref<string | null>(null);
const enabled = ref<Set<string>>(new Set());
const dirty = ref(false);

const builtinGroups = computed(() => {
  const out = new Map<string, BuiltinToolInfo[]>();
  for (const b of builtinCatalog.value) {
    const g = b.group ?? 'other';
    if (!out.has(g)) out.set(g, []);
    out.get(g)!.push(b);
  }
  return Array.from(out.entries());
});

function computeEnabled(catalog: BuiltinToolInfo[], cfg: ToolsConfig): Set<string> {
  const allow = cfg.allow ?? [];
  const deny = new Set(cfg.deny ?? []);
  if (allow.length > 0) return new Set(allow);
  return new Set(catalog.map((b) => b.id).filter((id) => !deny.has(id)));
}

function toggle(id: string) {
  const next = new Set(enabled.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  enabled.value = next;
  dirty.value = true;
}

async function saveBuiltin() {
  if (!builtinCfg.value) return;
  builtinSaving.value = true;
  builtinErr.value = null;
  try {
    const next: ToolsConfig = { ...builtinCfg.value };
    const all = builtinCatalog.value.map((b) => b.id);
    const disabled = all.filter((id) => !enabled.value.has(id));
    if (next.allow && next.allow.length > 0) {
      next.allow = all.filter((id) => enabled.value.has(id));
      next.deny = [];
    } else {
      next.allow = [];
      next.deny = disabled;
    }
    await api.saveConfig(props.agentId, next);
    builtinCfg.value = next;
    dirty.value = false;
    emit('saved');
  } catch (e) {
    builtinErr.value = e instanceof Error ? e.message : 'Save failed';
  } finally {
    builtinSaving.value = false;
  }
}

// ---------------- mcp ----------------
const mcpCatalog = ref<McpCatalogEntry[]>([]);
const mcpCfg = ref<ToolsConfig | null>(null);
const mcpLoading = ref(true);
const mcpErr = ref<string | null>(null);
const adding = ref<McpCatalogEntry | null>(null);
const addName = ref('');
const envValues = ref<Record<string, string>>({});
const addBusy = ref(false);
const addErr = ref<string | null>(null);

const mcpInstalled = computed(() => new Set(Object.keys(mcpCfg.value?.mcpServers ?? {})));

async function install(name: string, server: McpServerConfig) {
  if (!mcpCfg.value) return;
  const next: ToolsConfig = { ...mcpCfg.value };
  next.mcpServers = { ...(next.mcpServers ?? {}), [name]: server };
  await api.saveConfig(props.agentId, next);
  mcpCfg.value = next;
  adding.value = null;
  emit('saved');
}

async function submitAdd() {
  if (!adding.value) return;
  if (!addName.value.trim()) {
    addErr.value = 'Name is required';
    return;
  }
  if (mcpInstalled.value.has(addName.value.trim())) {
    addErr.value = 'That name is already in use';
    return;
  }
  addBusy.value = true;
  addErr.value = null;
  try {
    const entry = adding.value;
    const server: McpServerConfig = { transport: entry.transport };
    if (entry.url) server.url = entry.url;
    if (entry.command) server.command = entry.command;
    if (entry.args && entry.args.length > 0) server.args = entry.args;
    if (entry.headers) server.headers = { ...entry.headers };
    if (entry.queryParams) server.queryParams = { ...entry.queryParams };
    if (entry.env) server.env = { ...entry.env };
    if (Object.keys(envValues.value).length > 0) {
      server.env = { ...(server.env ?? {}), ...envValues.value };
    }
    await install(addName.value.trim(), server);
  } catch (e) {
    addErr.value = e instanceof Error ? e.message : 'Add failed';
  } finally {
    addBusy.value = false;
  }
}

async function loadBuiltin() {
  builtinLoading.value = true;
  builtinErr.value = null;
  try {
    const [cat, c] = await Promise.all([api.fetchBuiltinCatalog(props.agentId), api.fetchConfig(props.agentId)]);
    builtinCatalog.value = cat;
    builtinCfg.value = c;
    enabled.value = computeEnabled(cat, c);
    dirty.value = false;
  } catch (e) {
    builtinErr.value = e instanceof Error ? e.message : 'Failed';
  } finally {
    builtinLoading.value = false;
  }
}

async function loadMcp() {
  mcpLoading.value = true;
  mcpErr.value = null;
  try {
    const [cat, c] = await Promise.all([api.fetchMcpCatalog(props.agentId), api.fetchConfig(props.agentId)]);
    mcpCatalog.value = cat;
    mcpCfg.value = c;
  } catch (e) {
    mcpErr.value = e instanceof Error ? e.message : 'Failed';
  } finally {
    mcpLoading.value = false;
  }
}

// watch the adding modal so env inputs reset per server
function openAdd(entry: McpCatalogEntry) {
  addName.value = entry.id;
  const out: Record<string, string> = {};
  for (const k of entry.requiredEnv ?? []) out[k] = '';
  envValues.value = out;
  addErr.value = null;
  adding.value = entry;
}

onMounted(() => {
  loadBuiltin();
  loadMcp();
});
</script>
