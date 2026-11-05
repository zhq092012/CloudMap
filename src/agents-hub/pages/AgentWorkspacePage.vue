<template>
  <div v-if="!agentId" class="ws-missing">缺少智能体 id。</div>
  <div v-else class="ws-page">
    <!-- workspace path bar -->
    <div v-if="summary?.workspacePath" class="ws-path-bar">
      <span class="ws-path-label">Path</span>
      <span class="ws-path-value" :title="summary.workspacePath">{{ summary.workspacePath }}</span>
      <button type="button" class="ws-btn is-ghost" @click="copyPath">复制</button>
    </div>

    <!-- toolbar -->
    <div class="ws-toolbar">
      <button type="button" class="ws-btn" @click="newFile">＋ 新建文件</button>
      <button type="button" class="ws-btn is-danger" :disabled="!selected" @click="deleteSelected">
        🗑 删除
      </button>
      <label class="ws-btn">
        ↑ 上传
        <input type="file" class="hidden" @change="onUpload" />
      </label>
      <span v-if="treeErr" class="ws-err">{{ treeErr }}</span>
    </div>

    <!-- tree + editor -->
    <div class="ws-main">
      <WorkspaceFileTree :nodes="nodes" :selected-path="selected" @file-selected="onSelect"
        @refresh="loadTree" />
      <WorkspaceEditor :path="selected" :content="content" :loading="readLoading" :error="readErr"
        :saving="saving" @update="onUpdate" @save="onSave" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue';
import type { Ref } from 'vue';
import * as api from '../api';
import type { FileNode, WorkspaceSummary } from '../types';
import WorkspaceFileTree from './WorkspaceFileTree.vue';
import WorkspaceEditor from './WorkspaceEditor.vue';

const agentId = inject<Ref<string | undefined>>('agentHubId');

const summary = ref<WorkspaceSummary | null>(null);
const nodes = ref<FileNode[]>([]);
const selected = ref<string | null>(null);
const content = ref('');
const readLoading = ref(false);
const readErr = ref<string | null>(null);
const treeErr = ref<string | null>(null);
const saving = ref(false);

async function loadSummary() {
  if (!agentId?.value) return;
  try {
    summary.value = await api.summary(agentId.value);
  } catch {
    summary.value = null;
  }
}
async function loadTree() {
  if (!agentId?.value) return;
  treeErr.value = null;
  try {
    nodes.value = await api.tree(agentId.value, true);
  } catch (e) {
    treeErr.value = (e as Error).message;
  }
}
async function loadFile(path: string) {
  if (!agentId?.value) return;
  readLoading.value = true;
  readErr.value = null;
  try {
    content.value = await api.readFile(agentId.value, path);
  } catch (e) {
    readErr.value = (e as Error).message;
    content.value = '';
  } finally {
    readLoading.value = false;
  }
}

function onSelect(path: string) {
  selected.value = path;
  content.value = '';
  loadFile(path);
}
function onUpdate(v: string) {
  content.value = v;
}
async function onSave() {
  if (!agentId?.value || !selected.value) return;
  saving.value = true;
  readErr.value = null;
  try {
    await api.writeFile(agentId.value, selected.value, content.value);
  } catch (e) {
    readErr.value = (e as Error).message;
  } finally {
    saving.value = false;
  }
}
async function newFile() {
  if (!agentId?.value) return;
  const name = window.prompt('New file path (relative to workspace):');
  if (!name) return;
  try {
    await api.createNode(agentId.value, name);
    await loadTree();
  } catch (e) {
    treeErr.value = (e as Error).message;
  }
}
async function deleteSelected() {
  if (!agentId?.value || !selected.value) return;
  if (!window.confirm(`Delete ${selected.value}?`)) return;
  try {
    await api.deleteNode(agentId.value, selected.value);
    selected.value = null;
    content.value = '';
    await loadTree();
  } catch (e) {
    treeErr.value = (e as Error).message;
  }
}
function onUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && agentId?.value) {
    api.uploadFile(agentId.value, file.name, file)
      .then(loadTree)
      .catch((err) => (treeErr.value = (err as Error).message));
  }
  input.value = '';
}
function copyPath() {
  if (!summary.value?.workspacePath) return;
  navigator.clipboard?.writeText(summary.value.workspacePath).catch(() => {});
}

onMounted(() => {
  loadSummary();
  loadTree();
});
watch(() => agentId?.value, () => {
  loadSummary();
  loadTree();
});
</script>

<style scoped lang="scss">
@use "../styles/tokens" as *;

.ws-missing {
  padding: 32px;
  font-size: 13px;
  color: $text-3;
}

.ws-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: $bg-root;
}

/* 工作区绝对路径条 */
.ws-path-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  border-bottom: 1px solid $border;
  background: $bg-sunken;
}

.ws-path-label {
  flex: none;
  padding: 1px 7px;
  border-radius: $radius-sm;
  border: 1px solid $border;
  background: $bg-panel;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $text-4;
}

.ws-path-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 11.5px;
  color: $text-2;
}

/* 工具栏 */
.ws-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid $border;
  background: $bg-sunken;
}

.ws-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 11px;
  border-radius: $radius-md;
  border: 1px solid $border;
  background: $bg-panel;
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

  &.is-danger:hover:not(:disabled) {
    color: #fca5a5;
    border-color: $red-line;
    background: $red-soft;
  }

  &.is-ghost {
    height: 24px;
    padding: 0 9px;
    font-size: 11.5px;
    background: transparent;
  }
}

.ws-err {
  margin-left: 6px;
  font-size: 12px;
  color: $red;
}

.ws-main {
  flex: 1;
  min-height: 0;
  display: flex;
}
</style>
