<template>
  <div class="right-graph-list-root">
    <div
      class="w-95 h-full absolute right-0 top-0 z-1000 bg-[#111827]/95 border-l border-[#2d3a4d] text-[#e5e7eb] flex flex-col font-sans select-none backdrop-blur-sm overflow-hidden">
      <div class="flex-1 overflow-y-auto p-2.5 space-y-3">
        <div class="border-b border-[#2d3a4d] pb-2">
          <h2 class="text-[13.5px] font-bold tracking-wider text-[#e5e7eb] flex items-center gap-1.5">
            📄 聚合文章列表
          </h2>
          <p v-if="aggInfo" class="mt-1 text-[12px] text-[#9ca3af]">
            <span v-if="aggInfo.kind === 'country'" class="text-[#93c5fd]">▲ 国家</span>
            <span v-else-if="aggInfo.kind === 'author'" class="text-[#a78bfa]">◆ 作者</span>
            <span v-else :style="{ color: sentimentColor(aggInfo.key) }">● 情感</span>
            ：<b class="text-[#e5e7eb]">{{ aggInfo.label }}</b>
            <span class="text-[#6b7280]"> · 共 {{ list.length }} 篇</span>
          </p>
          <p v-else class="mt-1 text-[12px] text-[#6b7280]">
            {{ aggHint }}
          </p>
        </div>

        <!-- 已选中聚合点：列出对应文章 -->
        <div v-if="aggInfo" class="space-y-2">
          <div v-for="(article, index) in list" :key="`${article.id ?? index}-${index}`"
            class="bg-[#1a2332] border border-[#2d3a4d] rounded-md p-2.5 cursor-pointer hover:bg-[#1b2637] hover:border-[#3d4d64] transition-colors"
            @click="openArticle(article)">
            <div class="flex items-start justify-between gap-2">
              <div class="text-[12.5px] font-semibold text-[#e5e7eb] leading-snug">
                {{ article.title || "无标题" }}
              </div>
              <span v-if="article.isBreaking"
                class="shrink-0 text-[10.5px] font-semibold text-[#fca5a5] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.45)] rounded px-1.5 py-0.5">异常</span>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#9ca3af]">
              <span>{{ article.country || "未知国家" }}</span>
              <span v-if="article.author || article.agencyName || article.source">
                · {{ article.author || article.agencyName || article.source }}
              </span>
              <span v-if="article.publishedAt">{{ String(article.publishedAt).slice(0, 10) }}</span>
              <span :style="{ color: sentimentColor(article.sentiment) }">
                {{ sentimentLabel(article.sentiment) }}
              </span>
            </div>
          </div>
          <div v-if="list.length === 0" class="text-[12px] text-[#6b7280] text-center py-6">
            该聚合点下暂无匹配文章
          </div>
        </div>

        <!-- 未选中：提示 -->
        <div v-else class="text-[12px] text-[#6b7280] text-center py-10 leading-relaxed">
          尚未选择聚合点<br />{{ aggHint }}
        </div>
      </div>
    </div>

    <el-dialog
      v-model="articleDialogVisible"
      append-to-body
      plain
      class="article-read-dialog"
      width="520px"
      :close-on-click-modal="false"
      title="文章详情" @close="closeDialog">
      <div class="dialog-content">
        <div class="dialog-title">{{ selectedArticle?.title || "暂无标题" }}</div>
        <div class="dialog-meta">
          <span class="dialog-country">国家：{{ selectedArticle?.country || "未知国家" }}</span>
          <span class="dialog-country">作者：{{ selectedArticle?.author || "未知作者" }}</span>
          <span class="dialog-date">时间：{{ selectedArticle?.publishedAt || "" }}</span>
        </div>
        <p class="dialog-body">{{ selectedArticle?.content || selectedArticle?.summary || "暂无内容" }}</p>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" class="dialog-close-btn" @click="closeDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";

const homeStore = useHomeStore();

// 与 GraphMain.vue 中聚合 key 规则保持一致（否则点击节点后匹配不到文章）
const countryKeyOf = (a: any): string => a.country || "未知国家";
const authorKeyOf = (a: any): string => a.author || a.agencyName || a.source || "未知来源";

const sentimentColor = (s?: string): string => {
  switch (s) {
    case "negative":
      return "#ef4444";
    case "positive":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
};
const sentimentLabel = (s?: string): string => {
  switch (s) {
    case "negative":
      return "消极";
    case "positive":
      return "积极";
    default:
      return "中立";
  }
};

/** 与 GraphMain 相同的搜索 / 情感 / 异常筛选，避免右侧列表与画布不一致 */
const filterArticlesLikeGraph = (base: any[]): any[] => {
  const f = homeStore.graphFilter;
  const kw = (f.search || "").trim().toLowerCase();
  return base.filter((a: any) => {
    if (f.onlyBreaking && a.isBreaking !== true) return false;
    if (f.sentiment !== "all" && (a.sentiment || "neutral") !== f.sentiment) return false;
    if (kw) {
      const hay = `${a.title || ""} ${a.country || ""} ${a.author || ""} ${a.agencyName || ""} ${(a.topics || []).join(" ")}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
};

// 当前选中的聚合节点解析（country:X / author:Y / sentiment:Z）
const aggInfo = computed(() => {
  const id = homeStore.selectedGraphAggId;
  if (!id) return null;
  if (id.startsWith("country:")) {
    const key = id.slice("country:".length);
    return { kind: "country" as const, key, label: key };
  }
  if (id.startsWith("author:")) {
    const key = id.slice("author:".length);
    return { kind: "author" as const, key, label: key };
  }
  if (id.startsWith("sentiment:")) {
    const key = id.slice("sentiment:".length);
    return { kind: "sentiment" as const, key, label: sentimentLabel(key) };
  }
  return null;
});

/** 未选中聚合点时的引导文案（随聚合维度切换） */
const aggHint = computed(() =>
  homeStore.graphFilter.groupBy === "sentiment"
    ? "点击情感大圆（积极 / 消极 / 中立）或圆内文章查看列表"
    : "点击图谱中的聚合点（▲ 国家 / ◆ 作者）查看对应文章",
);

// 该聚合点对应的文章列表（数据源与筛选项与 GraphMain 一致）
const list = computed(() => {
  const info = aggInfo.value;
  if (!info) return [];
  const base: any[] = homeStore.clusterArticles ?? homeStore.articles;
  const scoped = filterArticlesLikeGraph(base);
  if (info.kind === "country") {
    return scoped.filter((a: any) => countryKeyOf(a) === info.key);
  }
  if (info.kind === "author") {
    return scoped.filter((a: any) => authorKeyOf(a) === info.key);
  }
  return scoped.filter((a: any) => (a.sentiment || "neutral") === info.key);
});

const articleDialogVisible = ref(false);
const selectedArticle = ref<any>(null);
const openArticle = (article: any) => {
  selectedArticle.value = article;
  articleDialogVisible.value = true;
};
const closeDialog = () => {
  articleDialogVisible.value = false;
};
</script>

<style scoped>
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-title {
  color: #e5e7eb;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.dialog-meta {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  color: #9ca3af;
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
  color: #cbd5e1;
  font-size: 12.5px;
  line-height: 1.75;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 14px;
}

.dialog-close-btn {
  min-width: 120px;
  border-radius: 6px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: transparent;
  color: #ffffff;
  font-weight: 600;
}

.dialog-close-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}
</style>
