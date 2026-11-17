<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import {
  listKnowledgeBases, createKnowledgeBase, getKnowledgeBase,
  deleteKnowledgeBase, listKbDocuments, uploadKbDocument,
  deleteKbDocument, searchKnowledgeBase, pollKbDocumentUntilDone,
} from "@/agents-hub/api";
import type { KbSummary, KbDocument, KbSearchHit, KbParentView } from "@/agents-hub/types";

const kbs = ref<KbSummary[]>([]);
const loading = ref(false);
const err = ref("");

// create dialog
const showCreate = ref(false);
const newKb = reactive({ name: "", description: "" });
const creating = ref(false);

// selected KB
const selectedKb = ref<KbSummary | null>(null);
const docs = ref<KbDocument[]>([]);
const docsLoading = ref(false);
const uploading = ref(false);

// search
const searchQuery = ref("");
const searchHits = ref<KbSearchHit[]>([]);
const searchParent = ref<KbParentView | null>(null);
const searching = ref(false);

// 异步上传：每个在中的 indexing 文档持一个 cancel 句柄（切页/卸载时停止轮询）
const polling = new Map<string, () => void>();
function onBeforeUnmountCleanup() {
  for (const cancel of polling.values()) cancel();
  polling.clear();
}
onBeforeUnmount(onBeforeUnmountCleanup);

function loadKbs() {
  loading.value = true;
  err.value = "";
  listKnowledgeBases()
    .then((ls) => { kbs.value = ls; })
    .catch((e) => { err.value = (e as Error).message; })
    .finally(() => { loading.value = false; });
}

function selectKb(kb: KbSummary) {
  selectedKb.value = kb;
  loadDocs();
  searchHits.value = [];
  searchQuery.value = "";
}

function loadDocs() {
  if (!selectedKb.value) return;
  docsLoading.value = true;
  listKbDocuments(selectedKb.value.id)
    .then((ds) => { docs.value = ds; })
    .catch((e) => { err.value = (e as Error).message; })
    .finally(() => { docsLoading.value = false; });
}

function onUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !selectedKb.value) return;
  // 多个文件不要并发入队 —— 后端单线程 worker，逐个跑，让用户等待不可见。
  // 用 polling map 长度判断当前 KB 是否已有 doc 在 indexing。
  const kbId = selectedKb.value.id;
  const hasIndexing = docs.value.some((d) => d.kbRowId === Number(kbId) && d.status === 'indexing');
  if (hasIndexing) {
    err.value = '已有文档正在 indexing，请等其完成后再上传。';
    input.value = "";
    return;
  }
  uploading.value = true;
  input.value = "";
  uploadKbDocument(kbId, file)
    .then((doc) => { loadDocs(); if (doc.status !== 'failed') startPolling(kbId, doc, input); })
    .catch((e) => { err.value = (e as Error).message; uploading.value = false; })
    .finally(() => { /* keep uploading true until poll settles */ });
}

function startPolling(kbId: string, doc: KbDocument, input: HTMLInputElement) {
  const { promise, cancel } = pollKbDocumentUntilDone(kbId, doc.docId, (d) => {
    // 每次 tick 都刷新文档列表（用户在 UI 里看到 "正在 indexing" 状态翻转）
    loadDocs();
  });
  polling.set(doc.docId, cancel);
  void input?.value; // 无加强
  promise
    .then((done) => {
      if (done.status === 'failed') {
        err.value = done.errorMsg || 'Indexing failed';
      } else {
        err.value = "";
      }
      loadDocs();
      // 刷新 KB 列表的 docCount（左上数字）
      loadKbs();
    })
    .catch((e) => {
      err.value = (e as Error).message;
      loadDocs();
    })
    .finally(() => {
      polling.delete(doc.docId);
      uploading.value = false;
    });
}

async function doDeleteDoc(docId: string) {
  if (!selectedKb.value) return;
  try {
    await deleteKbDocument(selectedKb.value.id, docId);
    // 同时刷右侧文档表 + 左侧卡片 docCount（派生值，见后端 toSummary）
    loadDocs();
    loadKbs();
  } catch (e) {
    err.value = (e as Error).message;
  }
}

async function doDeleteKb() {
  if (!selectedKb.value) return;
  try {
    await deleteKnowledgeBase(selectedKb.value.id);
    selectedKb.value = null;
    loadKbs();
  } catch (e) {
    err.value = (e as Error).message;
  }
}

async function doCreate() {
  if (!newKb.name.trim()) return;
  creating.value = true;
  try {
    const kb = await createKnowledgeBase(newKb.name.trim(), newKb.description.trim() || undefined);
    showCreate.value = false;
    newKb.name = "";
    newKb.description = "";
    await loadKbs();
    selectKb(kb);
  } catch (e) {
    err.value = (e as Error).message;
  } finally {
    creating.value = false;
  }
}

async function doSearch() {
  if (!selectedKb.value || !searchQuery.value.trim()) return;
  searching.value = true;
  try {
    const res = await searchKnowledgeBase(selectedKb.value.id, searchQuery.value.trim(), 10);
    searchHits.value = res.hits;
    searchParent.value = res.parent;
  } catch (e) {
    err.value = (e as Error).message;
  } finally {
    searching.value = false;
  }
}

onMounted(loadKbs);
</script>

<template>
  <div class="kb-page">
    <div class="kb-header">
      <h1>知识库</h1>
      <el-button type="primary" @click="showCreate = true">新建知识库</el-button>
    </div>

    <el-alert v-if="err" :title="err" type="error" :closable="true" @close="err = ''" class="kb-err" />

    <div class="kb-layout">
      <div class="kb-list">
        <el-skeleton :loading="loading" :rows="3" />
        <template v-if="!loading && kbs.length > 0">
          <div
            v-for="kb in kbs"
            :key="kb.id"
            class="kb-card"
            :class="{ active: selectedKb?.id === kb.id }"
            @click="selectKb(kb)"
          >
            <div class="kb-card-name">{{ kb.name }}</div>
            <div class="kb-card-meta">
              {{ kb.docCount }} 个文档 · {{ kb.dimensions }} 维
            </div>
          </div>
        </template>
        <template v-if="!loading && kbs.length === 0">
          <p class="kb-empty">暂无知识库，点「新建知识库」开始。</p>
        </template>
      </div>

      <div class="kb-detail" v-if="selectedKb">
        <div class="kb-detail-head">
          <h2>{{ selectedKb.name }}</h2>
          <el-button size="small" type="danger" @click="doDeleteKb">删除</el-button>
        </div>
        <p v-if="selectedKb.description" class="kb-desc">{{ selectedKb.description }}</p>

        <h3>文档列表</h3>
        <el-table :data="docs" v-loading="docsLoading" size="small" stripe>
          <el-table-column prop="fileName" label="文件名" min-width="180" />
          <el-table-column prop="chunkCount" label="分块数" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button size="small" type="danger" link @click="doDeleteDoc(row.docId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="kb-upload">
          <label class="kb-upload-btn">
            <span v-if="!uploading">上传文档 (txt / pdf / docx / md ...)</span>
            <span v-else>索引中…</span>
            <input type="file" class="hidden" :disabled="uploading" @change="onUpload" />
          </label>
        </div>

        <h3>检索测试</h3>
        <div class="kb-search">
          <el-input v-model="searchQuery" placeholder="输入检索关键词…" @keyup.enter="doSearch" style="flex:1" />
          <el-button type="primary" @click="doSearch" :loading="searching">检索</el-button>
        </div>
        <div v-if="searchParent" class="kb-search-parent">
          <h4>段落上下文</h4>
          <pre class="kb-parent-text">{{ searchParent.text }}</pre>
        </div>
        <div v-if="searchHits.length > 0" class="kb-search-results">
          <div v-for="(h, i) in searchHits" :key="i" class="kb-hit">
            <div class="kb-hit-head">
              <span class="kb-hit-idx">{{ i + 1 }}</span>
              <span class="kb-hit-file">{{ h.kbName }} / {{ h.fileName }}</span>
              <span class="kb-hit-score">score {{ h.score.toFixed(2) }}</span>
            </div>
            <div class="kb-hit-content">{{ h.content }}</div>
          </div>
        </div>
      </div>

      <div class="kb-detail" v-else>
        <p class="kb-empty">← 选择左侧的知识库查看详情</p>
      </div>
    </div>

    <!-- Create dialog -->
    <el-dialog v-model="showCreate" title="新建知识库" width="480px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="名称" required>
          <el-input v-model="newKb.name" placeholder="例如: 装备情报库" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newKb.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="doCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.kb-page { padding: 24px; max-width: 1100px; margin: 0 auto; }
.kb-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.kb-header h1 { font-size: 1.4rem; color: #f3f4f6; }
.kb-err { margin-bottom: 12px; }
.kb-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
.kb-list { display: flex; flex-direction: column; gap: 8px; }
.kb-card { padding: 12px 14px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; cursor: pointer; transition: border-color 0.15s; }
.kb-card:hover { border-color: #60a5fa; }
.kb-card.active { border-color: #3b82f6; background: #1e3a5f22; }
.kb-card-name { font-size: 0.95rem; font-weight: 600; color: #f3f4f6; }
.kb-card-meta { font-size: 0.78rem; color: #9ca3af; margin-top: 4px; }
.kb-empty { color: #6b7280; font-size: 0.9rem; padding: 24px 0; text-align: center; }
.kb-detail h2 { font-size: 1.2rem; color: #f3f4f6; margin-bottom: 4px; }
.kb-detail h3 { font-size: 1rem; color: #d1d5db; margin: 16px 0 8px; }
.kb-desc { color: #9ca3af; font-size: 0.88rem; margin-bottom: 8px; }
.kb-detail-head { display: flex; align-items: center; justify-content: space-between; }
.kb-upload { margin-top: 12px; }
.kb-upload-btn { display: inline-block; padding: 8px 16px; background: #1f2937; border: 1px dashed #374151; border-radius: 8px; color: #9ca3af; font-size: 0.88rem; cursor: pointer; }
.kb-upload-btn:hover { border-color: #60a5fa; color: #d1d5db; }
.kb-upload-btn input.hidden { display: none; }
.kb-search { display: flex; gap: 8px; margin-bottom: 12px; }
.kb-search-parent { margin-bottom: 12px; }
.kb-search-parent h4 { color: #9ca3af; font-size: 0.9rem; margin-bottom: 6px; }
.kb-parent-text { background: #1a1a2e; border-left: 3px solid #60a5fa; padding: 10px 12px; border-radius: 4px; color: #d1d5db; font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; word-break: break-word; max-height: 300px; overflow-y: auto; margin: 0; }
.kb-search-results { display: flex; flex-direction: column; gap: 10px; }
.kb-hit { padding: 10px 12px; background: #1f2937; border-radius: 8px; border: 1px solid #374151; }
.kb-hit-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.kb-hit-idx { color: #60a5fa; font-weight: 600; }
.kb-hit-file { color: #9ca3af; font-size: 0.82rem; }
.kb-hit-score { color: #6b7280; font-size: 0.78rem; margin-left: auto; }
.kb-hit-content { color: #d1d5db; font-size: 0.88rem; line-height: 1.5; white-space: pre-wrap; }
</style>
