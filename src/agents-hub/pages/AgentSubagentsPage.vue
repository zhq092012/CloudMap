<template>
  <div v-if="!agentId" class="sa-missing">缺少智能体 id。</div>
  <div v-else class="sa-page">
    <!-- help banner -->
    <div class="sa-banner">
      该智能体可委派的对象，存储于 <code>workspace/subagents/</code>。可手动新增，或从已有智能体引入。
    </div>

    <!-- list -->
    <div class="sa-scroll">
      <!-- header -->
      <div class="sa-head">
        <span class="sa-head-title">子智能体</span>
        <button type="button" class="sa-ghost" @click="openPicker">从智能体创建</button>
        <button type="button" class="sa-primary" @click="openNew">＋ 新增子智能体</button>
      </div>

      <div v-if="err" class="sa-err">{{ err }}</div>
      <div v-else-if="loading" class="sa-empty">加载中…</div>
      <div v-else-if="items.length === 0" class="sa-empty">
        尚未配置子智能体。手动创建一个，或从已有智能体引入。
      </div>

      <div v-for="item in items" :key="item.name" class="sa-card" @click="openEdit(item)">
        <div class="sa-card-head">
          <span class="sa-card-name">{{ item.name }}</span>
          <span class="sa-tag" :class="item.workspaceMode === 'shared' ? 'is-accent' : 'is-muted'">
            {{ item.workspaceMode }}
          </span>
          <span v-if="item.model" class="sa-tag is-warn">{{ item.model }}</span>
          <span class="sa-grow"></span>
          <button type="button" class="sa-del" @click.stop="handleDelete(item)">删除</button>
        </div>
        <div class="sa-card-desc">{{ item.description }}</div>
        <div v-if="item.tools && item.tools.length > 0" class="sa-card-tools">
          tools: {{ item.tools.join(', ') }}
        </div>
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
    <div v-if="pickerOpen" class="sa-overlay" @click="pickerOpen = false">
      <div class="sa-modal" @click.stop>
        <div class="sa-modal-head">
          <div class="sa-modal-title">从已有智能体创建子智能体</div>
          <button type="button" class="sa-ghost is-sm" @click="pickerOpen = false">取消</button>
        </div>
        <div class="sa-modal-body">
          <input class="sa-search" placeholder="搜索智能体…" v-model="search" autofocus />
          <div class="sa-picker-list">
            <div v-if="pickerLoading" class="sa-empty">加载中…</div>
            <div v-else-if="filteredAgents.length === 0" class="sa-empty">未找到智能体</div>
            <button v-for="a in filteredAgents" :key="a.id" type="button" class="sa-pick-row"
              @click="pickAgent(a)">
              <span class="sa-pick-name">{{ a.name }}</span>
              <span v-if="a.description" class="sa-pick-desc">{{ a.description }}</span>
            </button>
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

<style scoped lang="scss">
@use "../styles/tokens" as *;

.sa-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

.sa-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: $bg-root;
}

.sa-banner {
  flex: none;
  padding: 9px 22px;
  border-bottom: 1px solid $border;
  background: rgba(17, 24, 39, 0.7);
  font-size: 12px;
  line-height: 1.7;
  color: $text-3;

  code {
    padding: 1px 6px;
    border-radius: $radius-sm;
    border: 1px solid rgba(59, 130, 246, 0.18);
    background: $bg-sunken;
    color: $accent-text;
    font-size: 11.5px;
  }
}

.sa-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 22px 26px;
  @include thin-scroll;
}

.sa-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.sa-head-title {
  flex: 1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $text-4;
}

.sa-ghost,
.sa-primary {
  height: 30px;
  padding: 0 13px;
  border-radius: $radius-md;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: color $ease, border-color $ease, background $ease, box-shadow $ease;
}

.sa-ghost {
  border: 1px solid $border;
  background: transparent;
  color: $text-2;

  &:hover {
    color: $accent-text;
    border-color: $accent-line;
    background: $accent-soft;
  }

  &.is-sm {
    height: 26px;
    padding: 0 10px;
    font-size: 11.5px;
  }
}

.sa-primary {
  border: 1px solid transparent;
  color: #fff;
  font-weight: 600;
  @include accent-gradient;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

  &:hover {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.42);
  }
}

.sa-err {
  padding: 10px 12px;
  font-size: 12.5px;
  color: $red;
}

.sa-empty {
  padding: 40px 0;
  text-align: center;
  font-size: 12.5px;
  line-height: 1.9;
  color: $text-3;
}

.sa-card {
  @include card;
  margin-bottom: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color $ease, background $ease, box-shadow $ease;

  &:hover {
    border-color: $border-strong;
    background: $bg-elevated;
    box-shadow: 0 0 18px rgba(59, 130, 246, 0.12);
  }
}

.sa-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sa-grow {
  flex: 1;
}

.sa-card-name {
  font-size: 13.5px;
  font-weight: 600;
  color: $text;
}

.sa-tag {
  padding: 1px 8px;
  border-radius: $radius-sm;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.7;
  border: 1px solid $border;

  &.is-accent {
    background: $accent-soft;
    border-color: $accent-line;
    color: $accent-text;
  }

  &.is-muted {
    background: $bg-sunken;
    color: $text-3;
  }

  &.is-warn {
    background: $orange-soft;
    border-color: $orange-line;
    color: $orange;
  }
}

.sa-del {
  flex: none;
  height: 24px;
  padding: 0 10px;
  border-radius: $radius-sm;
  border: 1px solid $border;
  background: transparent;
  color: $text-3;
  font-size: 11.5px;
  cursor: pointer;
  transition: all $ease;

  &:hover {
    color: #fca5a5;
    border-color: $red-line;
    background: $red-soft;
  }
}

.sa-card-desc {
  margin-top: 7px;
  font-size: 12.5px;
  line-height: 1.7;
  color: $text-3;
}

.sa-card-tools {
  margin-top: 6px;
  font-family: var(--mono);
  font-size: 11.5px;
  color: $text-4;
}

/* ---- 选择器弹窗 ---- */
.sa-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 7, 13, 0.72);
  backdrop-filter: blur(2px);
}

.sa-modal {
  display: flex;
  flex-direction: column;
  width: min(480px, 92vw);
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid $border;
  border-radius: $radius-lg;
  background: $bg-panel;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
}

.sa-modal-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid $border;
}

.sa-modal-title {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: $text;
}

.sa-modal-body {
  padding: 16px 18px 18px;
}

.sa-search {
  width: 100%;
  box-sizing: border-box;
  height: 34px;
  margin-bottom: 10px;
  padding: 0 12px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: $bg-sunken;
  color: $text-2;
  font-size: 12.5px;
  outline: none;
  transition: border-color $ease, box-shadow $ease;

  &::placeholder {
    color: $text-4;
  }

  &:focus {
    border-color: $accent-line;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.12);
  }
}

.sa-picker-list {
  max-height: 320px;
  overflow-y: auto;
  @include thin-scroll(6px);
}

.sa-pick-row {
  display: block;
  width: 100%;
  margin-bottom: 2px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: $radius-md;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background $ease, border-color $ease;

  &:hover {
    background: $bg-sunken;
    border-color: $border;
  }
}

.sa-pick-name {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: $text;
}

.sa-pick-desc {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  line-height: 1.6;
  color: $text-3;
}
</style>
