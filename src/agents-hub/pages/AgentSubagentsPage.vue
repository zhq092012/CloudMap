<template>
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else class="flex flex-col h-full min-h-0 bg-[#060c14]">
    <!-- help banner -->
    <div class="px-6 py-2 text-[13px] text-[#708aa6] bg-[#0b131f] border-b border-[#142338]">
      该智能体可委派的对象，存储于 <code class="text-[#a3b8cc]">workspace/subagents/</code>。
      可手动新增，或从已有智能体引入。
    </div>

    <!-- list -->
    <div class="flex-1 min-h-0 overflow-y-auto px-6 py-4">
      <!-- header -->
      <div class="flex items-center gap-3 mb-4 flex-shrink-0">
        <span class="flex-1 text-[#526e8c] text-xs font-semibold uppercase tracking-[0.1em]">子智能体</span>
        <button type="button" @click="openPicker"
          class="px-3.5 py-1.5 rounded-lg border border-[#2b5384] text-[#7fd4ff] hover:bg-[#10243a] text-sm font-semibold transition-colors">从智能体创建</button>
        <button type="button" @click="openNew"
          class="px-3.5 py-1.5 rounded-lg font-semibold text-white text-sm transition-all"
          style="background: linear-gradient(135deg,#00f3ff 0%,#3b82f6 100%); box-shadow: 0 2px 6px rgba(0,243,255,0.35);">新增子智能体</button>
      </div>

      <div v-if="err" class="px-3.5 py-3 text-[#ef4444] text-sm">{{ err }}</div>
      <div v-else-if="loading" class="p-10 text-center text-[#708aa6] text-sm">加载中…</div>
      <div v-else-if="items.length === 0"
        class="p-10 text-center text-[#708aa6] text-sm leading-relaxed">
        尚未配置子智能体。<br />手动创建一个，或从已有智能体引入。
      </div>

      <div
        v-for="item in items" :key="item.name"
        class="bg-[#0f1927] border border-[#1e324f] rounded-xl p-4 mb-2.5 cursor-pointer hover:border-[#2b5384] transition-colors"
        @click="openEdit(item)"
      >
        <div class="flex items-center gap-2">
          <span class="font-semibold text-[15px] text-white">{{ item.name }}</span>
          <span class="px-2 py-0.5 rounded-md text-xs font-semibold"
            :class="item.workspaceMode === 'shared'
              ? 'bg-[#0b1e2e] text-[#7fd4ff] border border-[#1d3a57]'
              : 'bg-[#0f1927] text-[#708aa6] border border-[#1e324f]'">
            {{ item.workspaceMode }}
          </span>
          <span v-if="item.model"
            class="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#2e2a0b] text-[#fbbf24] border border-[#4a3a1d]">{{ item.model }}</span>
          <span class="flex-1"></span>
          <button type="button" @click.stop="handleDelete(item)"
            class="px-2.5 py-1 rounded-lg border border-[#ef4444] text-[#ef4444] text-xs font-semibold hover:bg-[#ef4444]/10">删除</button>
        </div>
        <div class="text-[#708aa6] text-sm mt-1.5">{{ item.description }}</div>
        <div v-if="item.tools && item.tools.length > 0"
          class="text-[#526e8c] text-[13px] mt-1.5 font-mono">tools: {{ item.tools.join(', ') }}</div>
      </div>
    </div>

    <!-- edit / new dialog -->
    <SubagentPanel
      v-if="panelOpen && agentId"
      :agent-id="agentId"
      :subagent="editing"
      @saved="reload"
      @close="panelOpen = false"
    />

    <!-- from-agent picker -->
    <div v-if="pickerOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-[#060c14]/70"
      @click="pickerOpen = false">
      <div class="flex flex-col w-[min(480px,92vw)] max-h-[80vh] rounded-xl overflow-hidden border border-[#2b5384] bg-[#0b131f] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
        @click.stop>
        <div class="flex items-center gap-3 px-5 py-3.5 border-b border-[#142338]">
          <div class="text-base font-semibold text-white">从已有智能体创建子智能体</div>
          <span class="flex-1"></span>
          <button type="button" @click="pickerOpen = false"
            class="px-3 py-1.5 rounded-lg border border-[#1e324f] bg-[#0f1927] text-[#a3b8cc] text-sm font-semibold hover:bg-[#142338]">取消</button>
        </div>
        <div class="px-5 py-4">
          <input
            class="w-full box-border px-3.5 py-2.5 rounded-lg bg-[#0f1927] border border-[#1e324f] text-[#a3b8cc] text-sm focus:outline-none focus:border-[#2b5384] mb-3"
            placeholder="搜索智能体…"
            v-model="search" autofocus
          />
          <div class="overflow-y-auto max-h-[320px]">
            <div v-if="pickerLoading" class="p-10 text-center text-[#708aa6] text-sm">加载中…</div>
            <div v-else-if="filteredAgents.length === 0" class="p-10 text-center text-[#708aa6] text-sm">未找到智能体</div>
            <div
              v-for="a in filteredAgents" :key="a.id"
              class="px-3.5 py-3 rounded-lg cursor-pointer border border-transparent mb-1 hover:bg-[#0f1927] hover:border-[#1e324f]"
              @click="pickAgent(a)"
            >
              <div class="font-semibold text-sm text-white">{{ a.name }}</div>
              <div v-if="a.description" class="text-[#708aa6] text-[13px] mt-0.5">{{ a.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue';
import type { Ref } from 'vue';
import * as api from '../api';
import type { SubagentInfo, AgentDefinition } from '../types';
import { useAgentHubStore } from '../store';
import SubagentPanel from './SubagentPanel.vue';

const agentId = inject<Ref<string | undefined>>('agentHubId');

const store = useAgentHubStore();

const items = ref<SubagentInfo[]>([]);
const err = ref<string | null>(null);
const loading = ref(false);

const panelOpen = ref(false);
const editing = ref<SubagentInfo | null>(null);

const pickerOpen = ref(false);
const search = ref('');
const pickerLoading = ref(false);

const sourceAgents = computed(() =>
  store.agents.filter((a) => a.id !== agentId?.value),
);
const filteredAgents = computed(() => {
  const q = search.value.toLowerCase();
  return sourceAgents.value.filter(
    (a) =>
      !q ||
      a.name.toLowerCase().includes(q) ||
      (a.description ?? '').toLowerCase().includes(q),
  );
});

async function reload() {
  if (!agentId?.value) return;
  loading.value = true;
  err.value = null;
  try {
    items.value = await api.listSubagents(agentId.value);
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to load subagents';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!agentId?.value) return;
  try {
    await store.fetchAgents();
  } catch {
    // ignore — picker just stays empty
  }
  await reload();
});

function openNew() {
  editing.value = null;
  panelOpen.value = true;
}
function openEdit(item: SubagentInfo) {
  editing.value = item;
  panelOpen.value = true;
}

async function openPicker() {
  pickerOpen.value = true;
  search.value = '';
  pickerLoading.value = true;
  try {
    if (store.agents.length === 0) await store.fetchAgents();
  } catch {
    // ignore
  } finally {
    pickerLoading.value = false;
  }
}

async function pickAgent(a: AgentDefinition) {
  if (!agentId?.value) return;
  pickerOpen.value = false;
  try {
    await api.createFromAgent(agentId.value, a.id);
    await reload();
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to add subagent';
  }
}

async function handleDelete(item: SubagentInfo) {
  if (!agentId?.value) return;
  if (!window.confirm(`Delete subagent "${item.name}"?`)) return;
  try {
    await api.deleteSubagent(agentId.value, item.name);
    await reload();
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Delete failed';
  }
}
</script>
