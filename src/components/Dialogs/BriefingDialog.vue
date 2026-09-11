<template>
  <div class="bd">
    <div class="bd-header">
      <div class="bd-title">📄 全局异常态势简报</div>
      <div class="bd-meta">
        <span v-if="briefing" class="bd-chip">简报日期：{{ briefing.briefingDate }}</span>
        <span v-if="briefing" class="bd-chip">纳入异常：{{ briefing.anomalyCount }} 条（过去24小时）</span>
        <span v-if="briefing?.updatedAt" class="bd-chip">生成于 {{ formatTime(briefing.updatedAt) }}</span>
      </div>
    </div>

    <div class="bd-body">
      <div v-if="state === 'loading'" class="bd-status">🔎 正在查询今日简报…</div>
      <div v-else-if="state === 'generating'" class="bd-status">
        ⏳ 正在调用「态势简报生成Agent」生成过去24小时全局异常态势简报，约需 1 分钟，请勿关闭…
      </div>
      <div v-else-if="state === 'error'" class="bd-error">
        <div>{{ error || "简报生成失败，请重试。" }}</div>
        <el-button type="primary" size="small" @click="$emit('regenerate')">重新生成</el-button>
      </div>
      <div v-else class="markdown-body" v-html="renderMarkdown(briefing?.content || '')"></div>
    </div>

    <div class="bd-actions">
      <el-button
        type="primary"
        :loading="state === 'loading' || state === 'generating'"
        @click="$emit('regenerate')"
      >
        立即重新生成
      </el-button>
      <el-button @click="$emit('close')">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from "markdown-it";
import type { AnomalyBriefing } from "@/api/briefings";

defineProps<{
  state: "loading" | "generating" | "ready" | "error";
  briefing: AnomalyBriefing | null;
  error?: string;
}>();
defineEmits<{ (e: "regenerate"): void; (e: "close"): void }>();

// Markdown 渲染器：禁用原始 HTML（防 XSS），与 WarningDialog 一致
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
const renderMarkdown = (src: string) => md.render(src);

const formatTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
</script>

<style scoped lang="scss">
.bd {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bd-header {
  .bd-title {
    font-size: 15px;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.4;
    margin-bottom: 8px;
    word-break: break-word;
  }

  .bd-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .bd-chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
    color: #cbd5e1;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid #334155;
  }
}

.bd-body {
  min-height: 120px;
  max-height: 56vh;
  overflow-y: auto;
  padding: 10px 12px;
  background: rgba(11, 15, 26, 0.5);
  border: 1px solid #1e293b;
  border-radius: 6px;
}

.bd-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  font-size: 12px;
  color: #94a3b8;
}

.bd-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: center;
  min-height: 100px;
  font-size: 12px;
  color: #fca5a5;
}

.bd-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Markdown 暗色主题（与 WarningDialog .markdown-body 规则一致） */
.markdown-body {
  font-size: 12px;
  line-height: 1.75;
  color: #e2e8f0;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  margin: 8px 0 4px;
  color: #fbbf24;
  line-height: 1.35;
}
.markdown-body :deep(h1) { font-size: 14px; }
.markdown-body :deep(h2) { font-size: 13px; }
.markdown-body :deep(h3) { font-size: 12px; }
.markdown-body :deep(h4) { font-size: 12px; }
.markdown-body :deep(p) { margin: 4px 0; }
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}
.markdown-body :deep(li) { margin: 2px 0; }
.markdown-body :deep(ul li) { list-style: disc; }
.markdown-body :deep(ol li) { list-style: decimal; }
.markdown-body :deep(strong) { color: #fcd34d; font-weight: 700; }
.markdown-body :deep(em) { color: #cbd5e1; }
.markdown-body :deep(a) { color: #38bdf8; text-decoration: underline; }
.markdown-body :deep(code) {
  background: #0c121f;
  border: 1px solid #2d3748;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fca5a5;
}
.markdown-body :deep(pre) {
  background: #0c121f;
  border: 1px solid #2d3748;
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.markdown-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #e2e8f0;
  font-size: 11px;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #f59e0b;
  padding-left: 8px;
  color: #cbd5e1;
  margin: 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2d3748;
  margin: 8px 0;
}
</style>
