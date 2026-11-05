<template>
  <div class="wd">
    <div class="wd-header">
      <div class="wd-title">⚠️ 异常预警 · {{ article?.title || "异常开源情报" }}</div>
      <div class="wd-meta">
        <span v-if="metaPlace" class="wd-chip">{{ metaPlace }}</span>
        <span v-if="article?.agencyName" class="wd-chip">来源：{{ article.agencyName }}</span>
        <span v-if="article?.author" class="wd-chip">作者：{{ article.author }}</span>
        <span v-if="article?.publishedAt" class="wd-chip">{{ String(article.publishedAt).slice(0, 10) }}</span>
        <span v-if="sentimentLabel" class="wd-chip">{{ sentimentLabel }}</span>
        <span v-if="threatLevel" class="wd-chip" :class="'lvl-' + threatLevel">威胁等级：{{ threatLevel }}</span>
      </div>
    </div>

    <div class="wd-body">
      <div v-if="state === 'loading'" class="wd-status">🔎 正在查询历史分析…</div>
      <div v-else-if="state === 'error'" class="wd-error">
        <div>{{ error || "分析失败，请重试。" }}</div>
        <el-button type="primary" size="small" class="wd-retry" @click="$emit('retry')">重试</el-button>
      </div>
      <template v-else>
        <div v-if="state === 'streaming'" class="wd-streaming">⏳ 异常情报分析师正在分析…</div>
        <div class="markdown-body" v-html="renderMarkdown(content)"></div>
        <div v-if="state === 'ready' && analyzedAt" class="wd-analyzed">
          分析时间 {{ formatTime(analyzedAt) }} · 异常情报分析师
        </div>
      </template>
    </div>

    <div class="wd-source">
      <el-collapse v-model="sourceOpen">
        <el-collapse-item name="src">
          <template #title><span class="wd-source-title">原文参考</span></template>
          <div class="wd-source-text">{{ article?.content || article?.title || "暂无原文" }}</div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!--div class="wd-actions">
      <el-button type="primary" :loading="state === 'streaming'" @click="$emit('reanalyze')">重新分析</el-button>
      <el-button @click="onJoinAnalysis">加入征候研判</el-button>
      <el-button v-if="article?.url" @click="openSource">查看原文</el-button>
    </div-->
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import MarkdownIt from "markdown-it";
import { ElMessage } from "element-plus";

const props = defineProps<{
  article: {
    id: number | null;
    title: string;
    country?: string;
    region?: string;
    author?: string;
    agencyName?: string;
    publishedAt?: string;
    sentiment?: string;
    url?: string | null;
    content?: string;
    keywords?: (string | null)[];
    topics?: (string | null)[];
  } | null;
  state: "loading" | "streaming" | "ready" | "error";
  content: string;
  error?: string;
  analyzedAt?: string;
}>();
defineEmits<{ (e: "retry"): void; (e: "reanalyze"): void }>();

// Markdown 渲染器：禁用原始 HTML（防 XSS），与 RightPanel 一致
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
const renderMarkdown = (src: string) => md.render(src || "");

const sourceOpen = ref<string[]>([]);

// 从分析内容中提取「威胁等级：高/中/低」渲染顶部徽章；提取不到则不显示
const threatLevel = computed(() => {
  const m = (props.content || "").match(/威胁等级[：:]\s*(高|中|低)/);
  return m ? m[1] : "";
});

const SENTIMENT_LABELS: Record<string, string> = {
  negative: "消极",
  neutral: "中立",
  positive: "积极",
  mixed: "混合",
};
const sentimentLabel = computed(() => {
  const s = String(props.article?.sentiment || "");
  return SENTIMENT_LABELS[s] || (s ? s : "");
});

const metaPlace = computed(() => {
  const a = props.article;
  if (!a) return "";
  return [a.country || "", a.region || ""].filter(Boolean).join(" / ");
});

const formatTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const onJoinAnalysis = () => ElMessage.success("已加入征候研判");
const openSource = () => {
  if (props.article?.url) window.open(props.article.url, "_blank");
};
</script>

<style scoped lang="scss">
.wd {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wd-header {
  .wd-title {
    font-size: 15px;
    font-weight: 700;
    color: #e5e7eb;
    line-height: 1.4;
    margin-bottom: 8px;
    word-break: break-word;
  }

  .wd-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .wd-chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
    color: #cbd5e1;
    background: #111827;
    border: 1px solid #2d3a4d;

    &.lvl-高 { color: #fca5a5; background: rgba(239, 68, 68, 0.12); border-color: #ef4444; font-weight: 700; }
    &.lvl-中 { color: #fbbf24; background: rgba(245, 158, 11, 0.12); border-color: #f59e0b; font-weight: 700; }
    &.lvl-低 { color: #93c5fd; background: rgba(59, 130, 246, 0.12); border-color: #3b82f6; font-weight: 700; }
  }
}

.wd-body {
  min-height: 120px;
  max-height: 46vh;
  overflow-y: auto;
  padding: 10px 12px;
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
}

.wd-status {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  font-size: 12px;
  color: #9ca3af;
}

.wd-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: center;
  min-height: 100px;
  font-size: 12px;
  color: #fca5a5;
}

.wd-streaming {
  margin-bottom: 8px;
  font-size: 12px;
  color: #93c5fd;
}

.wd-analyzed {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #2d3a4d;
  font-size: 11px;
  color: #6b7280;
}

.wd-source {
  :deep(.el-collapse-item__header) { background: transparent; border-bottom-color: #2d3a4d; }
  :deep(.el-collapse-item__wrap) { background: transparent; border-bottom-color: #2d3a4d; }
  :deep(.el-collapse-item__content) { color: #9ca3af; }
}

.wd-source-title { color: #9ca3af; font-size: 12px; }
.wd-source-text {
  font-size: 12px;
  line-height: 1.7;
  color: #9ca3af;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 160px;
  overflow-y: auto;
}

.wd-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Markdown 暗色主题（与 RightPanel .markdown-body 规则一致） */
.markdown-body {
  font-size: 12px;
  line-height: 1.75;
  color: #cbd5e1;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  margin: 8px 0 4px;
  color: #93c5fd;
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
.markdown-body :deep(strong) { color: #bfdbfe; font-weight: 700; }
.markdown-body :deep(em) { color: #cbd5e1; }
.markdown-body :deep(a) { color: #93c5fd; text-decoration: underline; }
.markdown-body :deep(code) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fca5a5;
}
.markdown-body :deep(pre) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.markdown-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #cbd5e1;
  font-size: 11px;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
  color: #cbd5e1;
  margin: 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2d3a4d;
  margin: 8px 0;
}
</style>
