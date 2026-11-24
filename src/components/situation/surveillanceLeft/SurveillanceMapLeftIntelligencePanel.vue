<!-- 开源情报 -->
<template>
  <div class="intel-panel">
    <div class="articles">
      <!-- 开源情报筛选 -->
      <div v-if="homeStore.clusterArticles" class="filter-chip" @click="clearClusterFilter">
        <span class="filter-chip__text">已按地图聚合筛选 · {{ homeStore.clusterArticles.length }} 篇</span>
        <span class="filter-chip__close">✕</span>
      </div>
      <div v-else class="filter-chip">
        <span class="filter-chip__text">{{ classifyValue }}文章共 {{ currentArticles.length }} 篇</span>
        <!-- 开源情报情感 -->
      </div>
      <div class="classify">

        <div class="sentiment-item" :class="{ active: selectedSentiment === 'all' }" @click="selectedSentiment = 'all'">
          全部
        </div>
        <div class="sentiment-item" :class="{ active: selectedSentiment === 'negative' }"
          @click="selectedSentiment = 'negative'">
          消极
        </div>
        <div class="sentiment-item" :class="{ active: selectedSentiment === 'neutral' }"
          @click="selectedSentiment = 'neutral'">
          中立
        </div>
        <div class="sentiment-item" :class="{ active: selectedSentiment === 'positive' }"
          @click="selectedSentiment = 'positive'">
          积极
        </div>
      </div>
      <!-- 开源情报文章列表 -->
      <div class="article-list">
        <div v-if="filteredArticleTitles.length === 0" class="article-empty">暂无文章</div>
        <div v-else>
          <div v-for="(article, index) in filteredArticleTitles"
            :key="`${article.title}-${article.publishedAt}-${index}`" class="article" @click="openArticle(article)">
            <div class="article-title-text">{{ article.title }}</div>
            <div class="article-meta">
              <span v-if="article.isBreaking" class="article-breaking">状态：异常</span>
              <span class="article-country">{{ article.country }}</span>
              <span class="article-date">{{ article.publishedAt }}</span>
            </div>
            <div v-if="article.isBreaking" class="article-warning-row">
              <button type="button" class="warning-btn" @click.stop="openWarningDialog(article)">
                查看警告信息
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章简介弹窗 -->
    <el-dialog v-model="articleDialogVisible" plain class="anomaly-dialog" width="520px" :close-on-click-modal="false"
      title="文章简介" @close="closeDialog">
      <div class="dialog-content">
        <div class="dialog-title">{{ selectedArticle?.title || "暂无标题" }}</div>
        <div class="dialog-meta">
          <span class="dialog-country">国家：{{ selectedArticle?.country || "未知国家" }}</span>
          <span class="dialog-country">作者：{{ selectedArticle?.author || "未知作者" }}</span>
          <span class="dialog-date">时间：{{ selectedArticle?.publishedAt || "" }}</span>
        </div>
        <p class="dialog-body">{{ selectedArticle?.content || "暂无内容" }}</p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" class="dialog-close-btn" @click="closeDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 警告信息弹窗 -->
    <el-dialog v-model="warningDialogVisible" plain class="anomaly-dialog" width="880px" :close-on-click-modal="false"
      title="⚠️ 警告信息">
      <WarningDialog :article="warningArticle" :state="warningState" :content="warningContent" :error="warningError"
        :analyzed-at="warningAnalyzedAt" @retry="reanalyzeWarning" @reanalyze="reanalyzeWarning" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useHomeStore } from "@/store/modules/homeStore";
import WarningDialog from "@/components/Dialogs/WarningDialog.vue";
import { getArticleAnalysis, saveArticleAnalysis } from "@/api/article-analyses";
import type { ArticleListItem } from "@/api/data-api";
import { listAgents, stream } from "@/agents-hub/api";
import type { MapLeftArticleRow, WarningStreamState } from "@/types/surveillanceMapLeft";

const homeStore = useHomeStore();

const selectedSentiment = ref("all");
const articleDialogVisible = ref(false);
const selectedArticle = ref<MapLeftArticleRow | null>(null);

const mapArticle = (article: ArticleListItem): MapLeftArticleRow => ({
  id: article.id ?? null,
  title: article.title || "",
  sentiment: article.sentiment || "neutral",
  publishedAt: article.publishedAt || "",
  country: article.country || "",
  region: article.region || "",
  author: article.author || "",
  agencyName: article.agencyName || article.source || "",
  url: article.url || "",
  keywords: article.keywords ?? [],
  topics: article.topics ?? [],
  importance: article.importance ?? null,
  content: article.content || article.summary || "",
  isBreaking: article.isBreaking === true,
});

const baseArticles = computed(() => homeStore.clusterArticles ?? homeStore.articles);

const articleItems = computed(() =>
  baseArticles.value.map(mapArticle).filter((item) => item.title),
);

const currentArticles = computed(() =>
  selectedSentiment.value === "all"
    ? articleItems.value
    : articleItems.value.filter((item) => item.sentiment === selectedSentiment.value),
);

const classifyValue = computed(() => {
  switch (selectedSentiment.value) {
    case "negative":
      return "消极";
    case "neutral":
      return "中立";
    case "positive":
      return "积极";
    default:
      return "全部";
  }
});

const filteredArticleTitles = computed((): MapLeftArticleRow[] =>
  currentArticles.value.map((item) => ({
    ...item,
    publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
  })),
);

const clearClusterFilter = () => {
  homeStore.clearClusterFilter();
};

const openArticle = (article: MapLeftArticleRow) => {
  selectedArticle.value = article;
  articleDialogVisible.value = true;
};

const closeDialog = () => {
  articleDialogVisible.value = false;
};

const ANALYST_AGENT_NAME = "异常情报分析师";
const ANALYST_AGENT_ID = "f4058fd6";

const warningDialogVisible = ref(false);
const warningState = ref<WarningStreamState>("loading");
const warningArticle = ref<MapLeftArticleRow | null>(null);
const warningContent = ref("");
const warningError = ref("");
const warningAnalyzedAt = ref("");
const warningMemoryCache = new Map<string, { content: string; updatedAt: string }>();
let warningAborter: AbortController | null = null;

const stopWarningStream = () => {
  if (warningAborter) {
    warningAborter.abort();
    warningAborter = null;
  }
};

const buildAnalysisPrompt = (a: MapLeftArticleRow) => {
  const body = a.content || "";
  return [
    "【文章研判任务】",
    `- 标题：${a.title || ""}`,
    `- 来源：${a.agencyName || ""}  作者：${a.author || ""}`,
    `- 国家/地区：${a.country || ""} / ${a.region || ""}`,
    `- 发布时间：${a.publishedAt}  情感：${a.sentiment}  重要性：${a.importance ?? "未知"}`,
    `- 关键词：${(a.keywords || []).join("、") || "无"}  主题：${(a.topics || []).join("、") || "无"}`,
    "文章原文：",
    body.slice(0, 4000),
  ].join("\n");
};

const runWarningAnalysis = async (article: MapLeftArticleRow) => {
  stopWarningStream();
  warningState.value = "streaming";
  warningContent.value = "";
  warningError.value = "";
  const controller = new AbortController();
  warningAborter = controller;
  try {
    const agents = await listAgents();
    const agent =
      agents.find((a) => a.name === ANALYST_AGENT_NAME) ||
      agents.find((a) => a.id === ANALYST_AGENT_ID);
    if (!agent?.id) {
      throw new Error(`未找到“${ANALYST_AGENT_NAME}”Agent，请先在智能体中心创建。`);
    }
    let text = "";
    for await (const evt of stream(agent.id, { message: buildAnalysisPrompt(article) }, { signal: controller.signal })) {
      if (controller.signal.aborted) break;
      if (warningArticle.value?.id !== article.id) break;
      if (evt.type === "token") {
        text += evt.data || "";
        warningContent.value = text;
      } else if (evt.type === "processing") {
        /* 思考中 */
      } else if (evt.type === "tool_call") {
        warningContent.value = text + `\n[调用工具] ${evt.toolName || ""}\n`;
      } else if (evt.type === "tool_result") {
        warningContent.value = text + `\n[工具结果] ${evt.toolResult || ""}\n`;
      } else if (evt.type === "error") {
        throw new Error(evt.error || "分析流错误");
      } else if (evt.type === "done") {
        if (text.trim()) {
          warningContent.value = text;
          warningState.value = "ready";
          warningAnalyzedAt.value = new Date().toISOString();
          const cacheItem = { content: text, updatedAt: warningAnalyzedAt.value };
          warningMemoryCache.set(String(article.id), cacheItem);
          try {
            if (article.id == null) break;
            await saveArticleAnalysis(article.id, {
              content: text,
              analyzedBy: ANALYST_AGENT_NAME,
              sessionKey: evt.sessionKey || undefined,
            });
          } catch {
            ElMessage.warning("分析结果保存失败，本次会话内可重复查看");
          }
        } else {
          warningState.value = "error";
          warningError.value = "分析未返回任何内容，请重试。";
        }
      }
    }
    if (!controller.signal.aborted && warningState.value === "streaming") {
      warningState.value = text.trim() ? "ready" : "error";
      if (!text.trim()) warningError.value = "分析流意外结束，请重试。";
    }
  } catch (e) {
    if (!controller.signal.aborted) {
      warningState.value = "error";
      warningError.value = e instanceof Error ? e.message : String(e);
    }
  } finally {
    if (warningAborter === controller) warningAborter = null;
  }
};

const openWarningDialog = (article: MapLeftArticleRow) => {
  stopWarningStream();
  warningArticle.value = article;
  warningDialogVisible.value = true;
  warningError.value = "";
  const cached = warningMemoryCache.get(String(article.id));
  if (cached) {
    warningState.value = "ready";
    warningContent.value = cached.content;
    warningAnalyzedAt.value = cached.updatedAt;
    return;
  }
  warningState.value = "loading";
  warningContent.value = "";
  if (article.id == null) return;
  getArticleAnalysis(article.id)
    .then((res) => {
      if (warningArticle.value?.id !== article.id || !warningDialogVisible.value) return;
      warningState.value = "ready";
      warningContent.value = res.content;
      warningAnalyzedAt.value = res.updatedAt || "";
    })
    .catch(() => {
      if (warningArticle.value?.id === article.id && warningDialogVisible.value) {
        void runWarningAnalysis(article);
      }
    });
};

const reanalyzeWarning = () => {
  if (!warningArticle.value) return;
  stopWarningStream();
  warningMemoryCache.delete(String(warningArticle.value.id));
  void runWarningAnalysis(warningArticle.value);
};

watch(warningDialogVisible, (v) => {
  if (!v) stopWarningStream();
});
</script>

<style scoped lang="scss">
@use "./surveillanceLeftTokens.scss" as *;

.intel-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.articles {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.classify {
  flex: 0 0 auto;
  height: 30px;
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.sentiment-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 10px;
  font-size: 12.5px;
  font-weight: 500;
  color: $text-2;
  background: $panel;
  border: 1px solid $border;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background $ease, border-color $ease, color $ease;

  &:hover {
    border-color: $border-strong;
    color: $text;
  }

  &.active {
    color: $accent-text;
    background: rgba($accent, 0.16);
    border-color: rgba($accent, 0.45);
  }
}

.article-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.article {
  color: $text;
  font-size: 12.5px;
  line-height: 1.5;
  border-bottom: 1px solid rgba(45, 58, 77, 0.7);
  padding: 8px 4px 8px 0;
  cursor: pointer;
  transition: background $ease;

  &:hover {
    background: rgba($accent, 0.06);
  }
}

.article-title-text {
  font-weight: 600;
  line-height: 1.5;
}

.article-meta {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.article-country {
  color: $text-2;
  font-size: 11px;
}

.article-date {
  color: $text-3;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.article-breaking {
  margin-right: auto;
  padding: 1px 6px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.5;
  color: #fca5a5;
  background: rgba($red, 0.12);
  border: 1px solid rgba($red, 0.45);
  border-radius: $radius-sm;
  white-space: nowrap;
}

.article-warning-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.warning-btn {
  padding: 4px 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: #fff;
  background: $red;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background $ease;

  &:hover {
    background: #dc2626;
  }
}

.article-empty {
  color: $text-3;
  font-size: 12px;
  text-align: center;
  padding: 20px 0;
}

.filter-chip {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding: 5px 10px;
  font-size: 12px;
  color: $accent-text;
  background: rgba($accent, 0.12);
  border: 1px solid rgba($accent, 0.4);
  border-radius: $radius-md;
  cursor: pointer;
  user-select: none;
  transition: background $ease;

  &:hover {
    background: rgba($accent, 0.2);
  }
}

.filter-chip__close {
  font-size: 11px;
  line-height: 1;
  opacity: 0.8;
}

.filter-chip:hover .filter-chip__close {
  opacity: 1;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
}

.dialog-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
  color: $text;
}

.dialog-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: $text-2;
}

.dialog-country,
.dialog-date {
  padding: 1px 6px;
  border: 1px solid $border;
  border-radius: $radius-sm;
  background: rgba($sunken, 0.7);
}

.dialog-country {
  color: #cbd5e1;
}

.dialog-date {
  color: $text-2;
  font-variant-numeric: tabular-nums;
}

.dialog-body {
  margin: 0;
  padding: 9px 11px;
  font-size: 12.5px;
  line-height: 1.75;
  color: #cbd5e1;
  white-space: pre-wrap;
  word-break: break-word;
  background: $sunken;
  border: 1px solid $border;
  border-radius: $radius-md;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.dialog-close-btn {
  min-width: 120px;
  border-radius: $radius-md !important;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%) !important;
  border: 1px solid transparent !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.32);

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.42);
  }
}
</style>

<style lang="scss">
.anomaly-dialog {
  background-color: #1a2332 !important;
  border: 1px solid #2d3a4d !important;
  border-radius: 8px !important;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55) !important;

  .el-dialog__header {
    margin-right: 0;
    padding: 14px 18px;
    border-bottom: 1px solid #2d3a4d;
  }

  .el-dialog__title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2px;
    color: #e5e7eb !important;
  }

  .el-dialog__headerbtn {
    top: 12px;
    right: 10px;

    .el-dialog__close {
      color: #9ca3af !important;
    }

    &:hover .el-dialog__close,
    &:focus .el-dialog__close {
      color: #93c5fd !important;
    }
  }

  .el-dialog__body {
    padding: 16px 18px;
    color: #cbd5e1 !important;
  }

  .el-dialog__footer {
    padding: 0 18px 16px;
  }
}
</style>