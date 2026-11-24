<template>
  <div
    class="w-90 h-full absolute left-0 top-0 z-1000 bg-[#111827]/95 border border-[#2d3a4d] text-[#e5e7eb] flex flex-col p-2.5 font-sans select-none backdrop-blur-sm">
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
              <span class="text-[13px]">{{ FACILITY_TYPE_LABELS_ZH[type.id] || type.label }}</span>
            </div>
            <div class="layer-label">
              <span class="layer-count">{{ facilityCountByType[type.id] || 0 }}</span>
              <el-switch v-model="facilityVisibility[type.id]" active-color="#3b82f6" inactive-color="#9e9e9e" />
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
            <el-icon>
              <TrendCharts />
            </el-icon>
            <span>态势图谱</span>
          </span>
        </template>
        <div class="graph-tip">
          <div class="graph-filter">
            <div class="graph-search-row">
              <input v-model="searchDraft" class="graph-search" type="text" placeholder="搜索标题 / 国家 / 主题…"
                @keyup.enter="applyGraphSearch" />
              <button class="graph-search-btn" type="button" @click="applyGraphSearch">搜索</button>
            </div>

            <div class="graph-sentiment">
              <span v-for="opt in sentimentOptions" :key="opt.value" class="sentiment-chip"
                :class="{ active: homeStore.graphFilter.sentiment === opt.value }"
                @click="homeStore.graphFilter.sentiment = opt.value">{{ opt.label }}</span>
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

  <!-- 异常文章「查看警告信息」按钮触发的实时分析警告弹窗 -->
  <el-dialog v-model="warningDialogVisible" plain class="anomaly-dialog" width="880px" :close-on-click-modal="false"
    title="⚠️ 警告信息">
    <WarningDialog :article="warningArticle" :state="warningState" :content="warningContent" :error="warningError"
      :analyzed-at="warningAnalyzedAt" @retry="reanalyzeWarning" @reanalyze="reanalyzeWarning" />
  </el-dialog>

</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";
import { Management, List, TrendCharts } from '@element-plus/icons-vue'

import { FACILITY_TYPES, FACILITY_TYPE_LABELS_ZH } from "@/assets/facilities.js";
import WarningDialog from "./Dialogs/WarningDialog.vue";
import { ElMessage } from "element-plus";
import { getArticleAnalysis, saveArticleAnalysis } from "@/api/article-analyses"
import type { ArticleListItem } from "@/api/data-api";
import { listAgents, stream } from "@/agents-hub/api";

const homeStore = useHomeStore();

/** 左栏文章列表展示行（mapArticle 输出） */
interface MapLeftArticleRow {
  id: number | null;
  title: string;
  sentiment: string;
  publishedAt: string;
  country: string;
  region: string;
  author: string;
  agencyName: string;
  url: string;
  keywords: string[];
  topics: string[];
  importance: number | null;
  content: string;
  isBreaking: boolean;
}

type WarningStreamState = "loading" | "streaming" | "ready" | "error";

// 与 homeStore.mapLeftTab 双向绑定：点击地图聚合时 Map.vue 会把它切到 "second"（开源情报）
const activeName = computed({
  get: () => homeStore.mapLeftTab,
  set: (v: typeof homeStore.mapLeftTab) => {
    homeStore.mapLeftTab = v;
  },
});

// 战场图谱（文章关系网）的情感筛选选项
type GraphSentiment = "all" | "positive" | "negative" | "neutral";
const sentimentOptions: Array<{ label: string; value: GraphSentiment }> = [
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
  const normalizeType = (type: string | null | undefined) => type || "other";
  return facilities.value.reduce<Record<string, number>>((acc, facility) => {
    const t = normalizeType(facility.type);
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
});

const categoryCount = computed(() => {
  return facilityTypeCategories.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = category.typeIds.reduce<number>(
      (sum, typeId) => sum + (facilityCountByType.value[typeId] || 0),
      0,
    );
    return acc;
  }, {});
});

const selectedSentiment = ref("all");
const articleDialogVisible = ref(false);
const selectedArticle = ref<MapLeftArticleRow | null>(null);

// 将单篇文章映射为列表展示项
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

const filteredArticleTitles = computed((): MapLeftArticleRow[] =>
  currentArticles.value.map((item) => ({
    ...item,
    publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : "",
  })),
);

// 清除地图聚合筛选，恢复展示全部文章
// 此处必须同时清除 store.selectedClusterIds（选中态），否则 30s 轮询刷新后
// Map.vue 的 renderArticleMarkers 会用旧的选中 id 把筛选重新塞回来。
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

// ---- 异常文章「查看警告信息」实时分析（状态机：loading/streaming/ready/error） ----
const ANALYST_AGENT_NAME = "异常情报分析师";
const ANALYST_AGENT_ID = "f4058fd6";

const warningDialogVisible = ref(false);
const warningState = ref<WarningStreamState>("loading");
const warningArticle = ref<MapLeftArticleRow | null>(null);
const warningContent = ref("");
const warningError = ref("");
const warningAnalyzedAt = ref("");
// 会话内内存缓存：articleId -> { content, updatedAt }（PUT 失败兜底 + 免重复分析）
const warningMemoryCache = new Map<
  string,
  { content: string; updatedAt: string }
>();
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
            if (article.id == null) break;
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

// 关闭弹窗时取消进行中的分析流（半成品不落库）
watch(warningDialogVisible, (v) => {
  if (!v) stopWarningStream();
});
</script>

<style lang="scss" scoped>
/* ============================================================================
   配色 token 与「智能体中心」一致：石墨底 #0a0e17 / 卡片 #1a2332 / 下沉 #111827
   边框 #2d3a4d / 主色 #3b82f6 / 中性文本 #e5e7eb · #9ca3af · #6b7280
   ========================================================================== */
$panel: #1a2332;
$sunken: #111827;
$border: #2d3a4d;
$border-strong: #3d4d64;
$text: #e5e7eb;
$text-2: #9ca3af;
$text-3: #6b7280;
$accent: #3b82f6;
$accent-text: #93c5fd;
$green: #10b981;
$orange: #f59e0b;
$orange-text: #fbbf24;
$red: #ef4444;
$radius-sm: 4px;
$radius-md: 6px;
$ease: 0.15s ease;

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: $border;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: $border-strong;
}

::v-deep(.tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .el-tabs__header {
    flex: 0 0 auto;
    margin: 0 0 10px;
  }

  /* 内容区必须自己撑满剩余高度并允许收缩，否则 el-tab-pane 里的
     height:100% 会退化成内容高度，列表再长也不会滚动（只会顶出面板被裁掉） */
  .el-tabs__content {
    flex: 1;
    min-height: 0;
  }

  .el-tab-pane {
    height: 100%;
  }

  .el-tabs__nav-wrap::after {
    height: 1px;
    background: $border;
  }

  .el-tabs__item {
    color: $text-2;
    font-size: 12.5px;
    font-weight: 500;
    transition: color $ease;

    .tabs-label {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    &:hover {
      color: $text;
    }
  }

  .el-tabs__item.is-active {
    color: $accent-text;
    font-weight: 600;
  }

  .el-tabs__active-bar {
    height: 2px;
    border-radius: 2px;
    background: $accent;
  }
}

/* ---------------- 作战要素 ---------------- */
.layers {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  /* 设施类型多时列表可滚动（滚动条样式见组件顶部的 ::-webkit-scrollbar） */
  overflow-y: auto;
  padding-right: 4px;
}

.category-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid $border;
}

.category-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px 0;
  min-height: 40px;
  font-size: 12px;
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
}

.category-label.active {
  color: $accent-text;
  background: rgba($accent, 0.16);
  border-color: rgba($accent, 0.45);
}

.category-label.active .category-count {
  color: $accent-text;
}

.category-count {
  color: $text;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.layer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  border: 1px solid $border;
  border-radius: $radius-md;
  background: $panel;
  font-size: 12.5px;
  color: $text;
  transition: border-color $ease;

  &:hover {
    border-color: $border-strong;
  }
}

.layer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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
  color: $text-2;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

/* ---------------- 开源情报 ---------------- */
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
}

.sentiment-item.active {
  color: $accent-text;
  background: rgba($accent, 0.16);
  border-color: rgba($accent, 0.45);
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

/* ==================== 弹窗内容 ====================
   配色对齐左栏卡片：底 #1a2332 / 下沉块 #111827 / 边框 #2d3a4d / 强调 #93c5fd
   ==================================================== */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
}

.dialog-title {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
  color: $text;
}

.dialog-title-mark {
  flex-shrink: 0;
  font-size: 12px;
  color: $accent;
}

.dialog-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: $text-2;
}

/* 字段做成小 chip，尺寸与配色同列表里的次数徽标 */
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

/* 正文块：同卡片展开时那块加深的底色 */
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

.dialog-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid $border;
}

.dialog-subtitle {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  color: $accent-text;
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

/* ---------------- 态势图谱 ---------------- */
.graph-tip {
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.7;
  color: #cbd5e1;
  background: rgba($panel, 0.72);
  border: 1px solid $border;
  border-radius: $radius-md;
  max-height: 100%;
  overflow-y: auto;

  b {
    color: $accent-text;
    font-weight: 600;
  }

  &__hint {
    margin-top: 8px;
    color: $text-2;
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
    font-size: 12.5px;
    color: $text;
    background: $sunken;
    border: 1px solid $border;
    border-radius: $radius-md;
    outline: none;
    transition: border-color $ease, box-shadow $ease;

    &::placeholder {
      color: $text-3;
    }

    &:focus {
      border-color: rgba($accent, 0.6);
      box-shadow: 0 0 0 2px rgba($accent, 0.14);
    }
  }

  .graph-search-btn {
    flex-shrink: 0;
    height: 28px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
    border: 1px solid transparent;
    border-radius: $radius-md;
    cursor: pointer;
    user-select: none;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.28);
    transition: box-shadow $ease, filter $ease;

    &:hover {
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
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
    font-weight: 500;
    color: $text-2;
    background: $panel;
    border: 1px solid $border;
    border-radius: $radius-md;
    cursor: pointer;
    user-select: none;
    transition: background $ease, border-color $ease, color $ease;

    &:hover {
      border-color: $border-strong;
      color: $text;
    }

    &.active {
      background: rgba($accent, 0.16);
      border-color: rgba($accent, 0.45);
      color: $accent-text;
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
      accent-color: $red;
      cursor: pointer;
    }
  }

  .graph-legend {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid $border;
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
      color: $text-3;
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

      /* 图谱里「国家」节点本身就是金色，图例随之保留 */
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
        border-color: rgba(59, 130, 246, 0.6);
      }
    }
  }
}

</style>

<style lang="scss">
/* 弹窗外壳（el-dialog 全局皮肤已改深灰蓝，这里按类名覆盖成左栏卡片的配色）
   弹窗 teleport 到 body，用非 scoped 的类名选择器，避免 :deep 失效。 */
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
