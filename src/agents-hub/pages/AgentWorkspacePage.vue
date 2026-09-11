<template>
  <div v-if="!agentId" class="p-8 text-[#708aa6]">缺少智能体 id。</div>
  <div v-else class="flex flex-col h-full min-h-0 bg-[#060c14]">
    <!-- workspace path bar -->
    <div v-if="summary?.workspacePath"
      class="flex items-center gap-2 px-4 py-1.5 border-b border-[#142338] bg-[#0b131f] flex-shrink-0 text-xs text-[#708aa6]">
      <span class="font-semibold uppercase tracking-wider text-[#526e8c]">Path</span>
      <span class="font-mono text-[#a3b8cc] flex-1 truncate" :title="summary.workspacePath">{{
        summary.workspacePath
      }}</span>
      <button type="button" @click="copyPath"
        class="bg-[#0f1927] border border-[#1e324f] text-[#a3b8cc] rounded-md px-2.5 py-0.5 hover:bg-[#142338]">Copy</button>
    </div>

    <!-- toolbar -->
    <div class="flex items-center gap-2 px-4 py-2 border-b border-[#142338] bg-[#0b131f] flex-shrink-0">
      <button type="button" @click="newFile"
        class="px-2.5 py-1 rounded-md border border-[#2b5384] text-[#7fd4ff] hover:bg-[#10243a] text-sm">+ New</button>
      <button type="button" @click="deleteSelected" :disabled="!selected"
        class="px-2.5 py-1 rounded-md border border-[#2b5384] text-[#ef4444] hover:bg-[#10243a] text-sm disabled:opacity-40">🗑 Delete</button>
      <label
        class="px-2.5 py-1 rounded-md border border-[#2b5384] text-[#7fd4ff] hover:bg-[#10243a] text-sm cursor-pointer">
        ↑ Upload
        <input type="file" class="hidden" @change="onUpload" />
      </label>
      <span v-if="treeErr" class="text-[#ef4444] text-sm ml-2">{{ treeErr }}</span>
    </div>

    <!-- tree + editor -->
    <div class="flex flex-1 min-h-0">
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
