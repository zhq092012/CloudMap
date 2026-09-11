<template>
  <div class="right-graph-list-root">
    <div
      class="w-95 h-full absolute right-0 top-0 z-1000 bg-[#111625]/90 border-l border-[#1e293b] text-slate-200 flex flex-col font-sans select-none backdrop-blur-sm overflow-hidden">
      <div class="flex-1 overflow-y-auto p-2.5 space-y-3">
        <div class="border-b border-[#2d3748] pb-2">
          <h2 class="text-sm font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
            📄 聚合文章列表
          </h2>
          <p v-if="aggInfo" class="mt-1 text-[12px] text-slate-400">
            <span v-if="aggInfo.kind === 'country'" class="text-amber-400">▲ 国家</span>
            <span v-else class="text-purple-300">◆ 作者</span>
            ：<b class="text-slate-200">{{ aggInfo.label }}</b>
            <span class="text-slate-500"> · 共 {{ list.length }} 篇</span>
          </p>
          <p v-else class="mt-1 text-[12px] text-slate-500">
            点击图谱中的聚合点（▲ 国家 / ◆ 作者）查看对应文章
          </p>
        </div>

        <!-- 已选中聚合点：列出对应文章 -->
        <div v-if="aggInfo" class="space-y-2">
          <div v-for="(article, index) in list" :key="`${article.id ?? index}-${index}`"
            class="bg-[#161e2e] border border-[#2d3748] rounded p-2.5 cursor-pointer hover:bg-[#1c2738] transition-colors"
            @click="openArticle(article)">
            <div class="flex items-start justify-between gap-2">
              <div class="text-[13px] font-semibold text-slate-100 leading-snug">
                {{ article.title || "无标题" }}
              </div>
              <span v-if="article.isBreaking"
                class="shrink-0 text-[11px] font-bold text-rose-400 border border-rose-400 rounded px-1 py-0.5">异常</span>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
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
          <div v-if="list.length === 0" class="text-[12px] text-slate-500 text-center py-6">
            该聚合点下暂无匹配文章
          </div>
        </div>

        <!-- 未选中：提示 -->
        <div v-else class="text-[12px] text-slate-500 text-center py-10 leading-relaxed">
          尚未选择聚合点<br />在左侧图谱中点击 ▲ 国家 或 ◆ 作者 节点
        </div>
      </div>
    </div>

    <el-dialog v-model="articleDialogVisible" append-to-body plain width="520px" :close-on-click-modal="false"
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

// 当前选中的聚合节点解析（country:X / author:Y）
const aggInfo = computed(() => {
  const id = homeStore.selectedGraphAggId;
  if (!id) return null;
  if (id.startsWith("country:")) {
    const key = id.slice("country:".length);
    return { kind: "country", key, label: key };
  }
  if (id.startsWith("author:")) {
    const key = id.slice("author:".length);
    return { kind: "author", key, label: key };
  }
  return null;
});

// 该聚合点对应的文章列表（取当前作用域内的全部文章，与 GraphMain 的数据源一致）
const list = computed(() => {
  const info = aggInfo.value;
  if (!info) return [];
  const base: any[] = homeStore.clusterArticles ?? homeStore.articles;
  return base.filter((a: any) =>
    info.kind === "country" ? countryKeyOf(a) === info.key : authorKeyOf(a) === info.key,
  );
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
</style>
