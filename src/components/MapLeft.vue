<template>
  <div
    class="w-90 h-[calc(100%-24px)] absolute left-3 top-3 z-1000 bg-[#111625]/90 border border-[#1e293b] rounded-sm text-slate-200 flex flex-col p-2.5 font-sans select-none">
    <el-tabs v-model="activeName" class="tabs" stretch>
      <el-tab-pane name="first">
        <template #label>
          <span class="tabs-label">
            <el-icon>
              <List />
            </el-icon>
            <span>作战要素</span>
          </span>
        </template>
        <div class="layers">
          <div class="category-row">
            <div class="category-label" v-for="category in facilityTypeCategories" :key="category.id"
              :class="{ active: selectedCategory === category.id }" @click="selectedCategory = category.id">
              <span class="category-count">{{ categoryCount[category.id] || 0 }}</span>
              <span>{{ category.label }}</span>
            </div>
          </div>

          <div class="layer-item" v-for="type in facilityTypes" :key="type.id">
            <div class="layer-info">
              <span class="layer-icon" v-html="type.svgIcon"></span>
              <span class="text-[14px]">{{ FACILITY_TYPE_LABELS_ZH[type.id] || type.label }}</span>
            </div>
            <div class="layer-label">
              <span class="layer-count">{{ facilityCountByType[type.id] || 0 }}</span>
              <el-switch v-model="facilityVisibility[type.id]" active-color="#c1a465" inactive-color="#9e9e9e" />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="second">
        <template #label>
          <span class="tabs-label">
            <el-icon>
              <Management />
            </el-icon>
            <span>开源情报</span>
          </span>
        </template>
        <div class="articles">
          <div v-if="homeStore.clusterArticles" class="filter-chip" @click="clearClusterFilter">
            <span class="filter-chip__text">已按地图聚合筛选 · {{ homeStore.clusterArticles.length }} 篇</span>
            <span class="filter-chip__close">✕</span>
          </div>
          <div v-else class="filter-chip">
            <span class="filter-chip__text">{{ classifyValue }}文章共 {{ currentArticles.length }} 篇</span>
          </div>
          <div class="classify">
            <div class="sentiment-item" :class="{ active: selectedSentiment === 'all' }"
              @click="selectedSentiment = 'all'">全部
            </div>
            <div class="sentiment-item" :class="{ active: selectedSentiment === 'negative' }"
              @click="selectedSentiment = 'negative'">消极</div>
            <div class="sentiment-item" :class="{ active: selectedSentiment === 'neutral' }"
              @click="selectedSentiment = 'neutral'">中立</div>
            <div class="sentiment-item" :class="{ active: selectedSentiment === 'positive' }"
              @click="selectedSentiment = 'positive'">积极</div>
          </div>
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
                  <button class="warning-btn" @click.stop="openWarningDialog(article)">查看警告信息</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="third">
        <template #label>
          <span class="tabs-label">
            <el-icon><TrendCharts /></el-icon>
            <span>态势图谱</span>
          </span>
        </template>
        <div class="graph-tip">
        <div class="graph-filter">
          <div class="graph-search-row">
            <input
              v-model="searchDraft"
              class="graph-search"
              type="text"
              placeholder="搜索标题 / 国家 / 主题…"
              @keyup.enter="applyGraphSearch"
            />
            <button class="graph-search-btn" type="button" @click="applyGraphSearch">搜索</button>
          </div>

            <div class="graph-sentiment">
              <span
                v-for="opt in sentimentOptions"
                :key="opt.value"
                class="sentiment-chip"
                :class="{ active: homeStore.graphFilter.sentiment === opt.value }"
                @click="homeStore.graphFilter.sentiment = opt.value"
              >{{ opt.label }}</span>
            </div>

            <label class="graph-breaking">
              <input type="checkbox" v-model="homeStore.graphFilter.onlyBreaking" />
              <span>仅显示异常文章</span>
            </label>
          </div>

          <div class="graph-legend">
            <div class="legend-group">
              <div class="legend-title">节点形状</div>
              <div class="legend-item"><span class="shape shape-triangle"></span>国家聚合 / 同国家文章</div>
              <div class="legend-item"><span class="shape shape-diamond"></span>作者聚合 / 同作者文章</div>
              <div class="legend-item"><span class="shape shape-square"></span>独立文章</div>
            </div>
            <div class="legend-group">
              <div class="legend-title">节点颜色</div>
              <div class="legend-item"><span class="dot" style="background:#ef4444"></span>异常 / 消极</div>
              <div class="legend-item"><span class="dot" style="background:#94a3b8"></span>中立</div>
              <div class="legend-item"><span class="dot" style="background:#22c55e"></span>积极</div>
              <div class="legend-item"><span class="dot" style="background:#c1a465"></span>国家（金）</div>
              <div class="legend-item"><span class="dot" style="background:#a78bfa"></span>作者（紫）</div>
            </div>
            <div class="legend-group">
              <div class="legend-title">连线</div>
              <div class="legend-item"><span class="line line-country"></span>国家关联</div>
              <div class="legend-item"><span class="line line-author"></span>作者关联</div>
              <div class="legend-item"><span class="line line-topic"></span>主题关联</div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>

  <el-dialog v-model="articleDialogVisible" plain width="520px" :close-on-click-modal="false" title="文章简介"
    @close="closeDialog">
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

  <!-- 异常文章「查看警告信息」按钮触发的实时分析警告弹窗 -->
  <el-dialog v-model="warningDialogVisible" plain width="880px" :close-on-click-modal="false" title="⚠️ 警告信息">
    <WarningDialog
      :article="warningArticle"
      :state="warningState"
      :content="warningContent"
      :error="warningError"
      :analyzed-at="warningAnalyzedAt"
      @retry="reanalyzeWarning"
      @reanalyze="reanalyzeWarning"
    />
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";
import { Management, List, TrendCharts } from '@element-plus/icons-vue'

import { FACILITY_TYPES, FACILITY_TYPE_LABELS_ZH } from "@/assets/facilities.js";
import WarningDialog from "./Dialogs/WarningDialog.vue";
import { ElMessage } from "element-plus";
import { getArticleAnalysis, saveArticleAnalysis } from "@/api/article-analyses";
import { listAgents, stream } from "@/agents-hub/api";

// 与 homeStore.mapLeftTab 双向绑定：点击地图聚合时 Map.vue 会把它切到 "second"（开源情报）
const activeName = computed({
  get: () => homeStore.mapLeftTab,
  set: (v) => {
    homeStore.mapLeftTab = v;
  },
});
const homeStore = useHomeStore();

// 战场图谱（文章关系网）的情感筛选选项
const sentimentOptions = [
  { label: "全部", value: "all" },
  { label: "消极", value: "negative" },
  { label: "中立", value: "neutral" },
  { label: "积极", value: "positive" },
];

// homeStore.graphFilter.search，由 GraphMain 的深度 watch（防抖 300ms）触发图谱重渲染
const searchDraft = ref(homeStore.graphFilter.search);
const applyGraphSearch = () => {
  homeStore.graphFilter.search = searchDraft.value.trim();
};
const facilityVisibility = homeStore.facilityTypeVisibility;
const facilities = computed(() => homeStore.getFacilities);

const facilityTypeCategories = [
  {
    id: "all",
    label: "全部",
    typeIds: FACILITY_TYPES.map((type) => type.id),
  },
  {
    id: "military",
    label: "军事设施",
    typeIds: ["military", "military_airport"],
  },
  {
    id: "civil",
    label: "民用设施",
    typeIds: ["satellite", "embassy", "data_center", "airport", "company", "port", "other"],
  },
  {
    id: "energy",
    label: "能源设施",
    typeIds: ["oil_gas", "nuclear", "pipeline", "dam"],
  },
];

const selectedCategory = ref("all");

const facilityTypes = computed(() => {
  const category = facilityTypeCategories.find((item) => item.id === selectedCategory.value);
  const validTypeIds = category ? category.typeIds : FACILITY_TYPES.map((type) => type.id);

  return FACILITY_TYPES.filter((type) => {
    if (!validTypeIds.includes(type.id)) return false;
    if (type.id === "other") {
      return facilities.value.some((facility) => !facility.type);
    }
    return facilities.value.some((facility) => facility.type === type.id);
  });
});

watch(selectedCategory, (categoryId) => {
  const category = facilityTypeCategories.find((item) => item.id === categoryId);
  const visibleTypeIds = category ? category.typeIds : FACILITY_TYPES.map((type) => type.id);

  Object.keys(facilityVisibility).forEach((typeId) => {
    facilityVisibility[typeId] = visibleTypeIds.includes(typeId);
  });
}, { immediate: true });

const facilityCountByType = computed(() => {
  const normalizeType = (type) => type || "other";
  return facilities.value.reduce((acc, facility) => {
    const t = normalizeType(facility.type);
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
});

const categoryCount = computed(() => {
  return facilityTypeCategories.reduce((acc, category) => {
    acc[category.id] = category.typeIds.reduce(
      (sum, typeId) => sum + (facilityCountByType.value[typeId] || 0),
      0,
    );
    return acc;
  }, {});
});

const selectedSentiment = ref("all");
const articleDialogVisible = ref(false);
const selectedArticle = ref(null);

// 将单篇文章映射为列表展示项
const mapArticle = (article) => ({
  id: article.id ?? null,
  title: article.title || article.name || "",
  sentiment: article.sentiment || "neutral",
  publishedAt: article.publishedAt || "",
  country: article.country || "",
  region: article.region || "",
  author: article.author || "",
  agencyName: article.agencyName || article.source || "",
  url: article.url || "",
  keywords: article.keywords || [],
  topics: article.topics || [],
  importance: article.importance ?? null,
  content: article.content || article.summary || "",
  isBreaking: article.isBreaking === true,
});

// 基础文章集：地图点击聚合筛选后只取其子集，否则取全部
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

const filteredArticleTitles = computed(() => {
  return currentArticles.value.map((item) => ({
    id: item.id,
    title: item.title,
    country: item.country,
    region: item.region,
    author: item.author,
    agencyName: item.agencyName,
    url: item.url,
    keywords: item.keywords,
    topics: item.topics,
    importance: item.importance,
    publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
    content: item.content,
    isBreaking: item.isBreaking,
  }));
});

// 清除地图聚合筛选，恢复展示全部文章
// 此处必须同时清除 store.selectedClusterIds（选中态），否则 30s 轮询刷新后
// Map.vue 的 renderArticleMarkers 会用旧的选中 id 把筛选重新塞回来。
const clearClusterFilter = () => {
  homeStore.clearClusterFilter();
};

const openArticle = (article) => {
  selectedArticle.value = article;
  articleDialogVisible.value = true;
};

const closeDialog = () => {
  articleDialogVisible.value = false;
};

// ---- 异常文章「查看警告信息」实时分析（状态机：loading/streaming/ready/error） ----
const ANALYST_AGENT_NAME = "异常情报分析师";
const ANALYST_AGENT_ID = "f4058fd6";

const warningDialogVisible = ref(false);
const warningState = ref("loading"); // 'loading' | 'streaming' | 'ready' | 'error'
const warningArticle = ref(null);
const warningContent = ref("");
const warningError = ref("");
const warningAnalyzedAt = ref("");
// 会话内内存缓存：articleId -> { content, updatedAt }（PUT 失败兜底 + 免重复分析）
const warningMemoryCache = new Map();
let warningAborter = null;

const stopWarningStream = () => {
  if (warningAborter) {
    warningAborter.abort();
    warningAborter = null;
  }
};

const buildAnalysisPrompt = (a) => {
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

const runWarningAnalysis = async (article) => {
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
        // 思考中，保持 streaming 提示
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
            await saveArticleAnalysis(article.id, {
              content: text,
              analyzedBy: ANALYST_AGENT_NAME,
              sessionKey: evt.sessionKey || undefined,
            });
          } catch (e) {
            ElMessage.warning("分析结果保存失败，本次会话内可重复查看");
          }
        } else {
          warningState.value = "error";
          warningError.value = "分析未返回任何内容，请重试。";
        }
      }
    }
    // 流自然结束但没有 done 事件
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

const openWarningDialog = (article) => {
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

// 关闭弹窗时取消进行中的分析流（半成品不落库）
watch(warningDialogVisible, (v) => {
  if (!v) stopWarningStream();
});
</script>

<style lang="scss" scoped>
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-thumb {
  background: #2d3748;
  border-radius: 2px;
}

::v-deep(.tabs) {
  height: 100%;

  .el-tabs__header {
    margin: 0 0 10px;
  }

  .el-tab-pane {
    height: 100%;
  }

  .el-tabs__item {
    color: #9e9e9e;

    .tabs-label {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .el-tabs__item.is-active {
    color: #c1a465;
  }
}

.layers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.category-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
  min-height: 40px;
  font-size: 12px;
  background: rgba(16, 27, 39, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.category-label.active {
  background: rgba(42, 42, 42, 0.6);
  border-color: #c1a465;
}

.category-label.active .category-count {
  color: #ffffff;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.85), 0 0 14px rgba(255, 255, 255, 0.55);
}

.category-label:hover {
  background: rgba(255, 255, 255, 0.06);
}

.category-count {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: #2a2a2a;
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layer-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.layer-icon svg {
  width: 100%;
  height: 100%;
}

.layer-label {
  display: flex;
  align-items: center;
  gap: 20px;
}

.layer-count {
  color: #ffffff;
  font-size: 12px;
}

.articles {
  height: 100%;
}

.classify {
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
  font-size: 12px;
  background: rgba(16, 27, 39, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.sentiment-item.active {
  background: rgba(193, 164, 101, 0.18);
  border-color: #c1a465;
}

.article-list {
  height: calc(100% - 30px);
  overflow-y: auto;
}

.article {
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.4;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 0;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
}

.article:hover {
  background: rgba(255, 255, 255, 0.1);
}

.article-title-text {
  font-weight: 600;
}

.article-meta {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 4px;
}

.article-country {
  color: #cbd5e1;
  font-size: 11px;
}

.article-date {
  color: #94a3b8;
  font-size: 11px;
}

.article-breaking {
  margin-right: auto;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid #ef4444;
  border-radius: 3px;
  white-space: nowrap;
}

.article-warning-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.warning-btn {
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #ef4444;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.warning-btn:hover {
  background: #dc2626;
}

.article-empty {
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
  padding: 20px 0;
}

.filter-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding: 5px 10px;
  font-size: 12px;
  color: #f0d9a8;
  background: rgba(193, 164, 101, 0.16);
  border: 1px solid #c1a465;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.filter-chip:hover {
  background: rgba(193, 164, 101, 0.28);
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
}

.dialog-title {
  color: #f8fafc;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.dialog-meta {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  color: #94a3b8;
  font-size: 12px;
}

.dialog-country {
  color: #cbd5e1;
}

.dialog-date {
  color: #94a3b8;
}

.dialog-body {
  white-space: pre-wrap;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 14px;
}

.dialog-close-btn {
  min-width: 120px;
  border-radius: 10px;
  background: #2a2a2a;
  border-color: transparent;
  color: #e2e8f0;
}

.dialog-close-btn:hover {
  background: #1f1f1f;
}

.graph-tip {
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.6;
  color: #cbd5e1;
  background: rgba(16, 27, 39, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  max-height: 100%;
  overflow-y: auto;

  b {
    color: #f0d9a8;
  }

  &__hint {
    margin-top: 8px;
    color: #94a3b8;
  }

  .graph-filter {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .graph-search-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .graph-search {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    padding: 6px 10px;
    font-size: 12px;
    color: #e2e8f0;
    background: rgba(11, 15, 26, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    outline: none;
    transition: border-color 0.2s ease;

    &::placeholder {
      color: #64748b;
    }

    &:focus {
      border-color: #c1a465;
    }
  }

  .graph-search-btn {
    flex-shrink: 0;
    height: 28px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 600;
    color: #1a1206;
    background: linear-gradient(180deg, #d9bc7f, #c1a465);
    border: 1px solid #a98a4e;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: filter 0.2s ease;

    &:hover {
      filter: brightness(1.1);
    }

    &:active {
      filter: brightness(0.94);
    }
  }

  .graph-sentiment {
    display: flex;
    gap: 6px;
  }

  .sentiment-chip {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 0 6px;
    font-size: 12px;
    color: #cbd5e1;
    background: rgba(16, 27, 39, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    &.active {
      background: rgba(193, 164, 101, 0.18);
      border-color: #c1a465;
      color: #f0d9a8;
    }
  }

  .graph-breaking {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #cbd5e1;
    cursor: pointer;
    user-select: none;

    input {
      accent-color: #ef4444;
      cursor: pointer;
    }
  }

  .graph-legend {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 10px;

    .legend-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .legend-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #94a3b8;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #cbd5e1;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      flex: none;
    }

    .shape {
      width: 12px;
      height: 12px;
      display: inline-block;
      flex: none;

      &.shape-triangle {
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-bottom: 11px solid #c1a465;
      }

      &.shape-diamond {
        width: 11px;
        height: 11px;
        background: #a78bfa;
        transform: rotate(45deg);
      }

      &.shape-square {
        width: 11px;
        height: 11px;
        background: #94a3b8;
      }
    }

    .line {
      width: 18px;
      height: 0;
      border-top: 2px solid;
      display: inline-block;
      flex: none;

      &.line-country {
        border-color: rgba(193, 164, 101, 0.6);
      }

      &.line-author {
        border-color: rgba(167, 139, 250, 0.6);
      }

      &.line-topic {
        border-top-style: dashed;
        border-color: rgba(56, 189, 248, 0.6);
      }
    }
  }
}
</style>
