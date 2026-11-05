<template>
  <div
    class="w-90 h-full absolute left-0 top-0 z-1000 bg-[#111827]/95 border border-[#2d3a4d] text-[#e5e7eb] flex flex-col p-2.5 font-sans select-none backdrop-blur-sm">
    <!-- 「异常征候」视图（路由 /anomaly）：顶部 4 个筛选项 + 过滤后的异常列表 -->
    <div v-if="isAnomalyMode" class="anomaly-view">
      <div class="anomaly-filter">
        <button
          v-for="tab in anomalyTabs"
          :key="tab.key"
          type="button"
          class="anomaly-filter-btn"
          :class="{ active: activeAnomalyTab === tab.key }"
          @click="activeAnomalyTab = tab.key"
        >
          <span>{{ tab.label }}</span>
          <span class="anomaly-filter-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- 「异常」分组：条目逻辑与布局沿用 WarningLeftPanel.vue 的 data-mark="异常列表"
           （左侧等级色条 + 综合威胁度/异常度 + 展开详情 + 查看详情 / 加入深度分析）
           条目不收缩：详情始终展开 -->
      <div v-if="activeAnomalyTab === 'confirmed'" class="anomaly-list anomaly-card-list">
        <div v-if="confirmedList.length === 0" class="anomaly-empty">暂无数据</div>
        <div v-for="item in confirmedList" :key="item.id" class="anomaly-card">
          <span class="anomaly-card-ribbon" :class="item.level === 'high' ? 'is-high' : 'is-low'"></span>

          <div class="anomaly-card-body">
            <div class="anomaly-card-head">
              <span class="anomaly-card-title">
                <span class="anomaly-card-dot" :class="item.level === 'high' ? 'is-high' : 'is-low'">
                  {{ item.level === "high" ? "⚡" : "◆" }}
                </span>
                <span class="anomaly-card-name" :title="item.title">{{ item.title }}</span>
              </span>
              <span class="anomaly-card-head-right">
                <span v-if="item.count" class="anomaly-card-count">
                  {{ item.count }}
                </span>
                <!-- 「异常」分组支持勾选后批量确认（提交 /anomalies/analyze） -->
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  class="anomaly-checkbox"
                  :value="item.id"
                  :disabled="analysisAction"
                  @click.stop
                />
              </span>
            </div>

            <div class="anomaly-card-metrics is-open">
              <div>
                综合威胁度 <span class="metric-threat">{{ item.threat }}</span>
              </div>
              <div>
                综合异常度 <span class="metric-anomaly">{{ item.anomaly }}</span>
                <span class="metric-sub">&nbsp;(置信度 {{ item.anomalyConf }})</span>
              </div>
            </div>

            <div class="anomaly-card-detail">
              <div class="anomaly-card-field">
                <span class="field-label">异常类型</span>
                <span class="field-value">{{ assetTypeLabel(item.assetType) }}</span>
              </div>
              <div class="anomaly-card-field">
                <span class="field-label">区域</span>
                <span class="field-value">{{ item.region }}</span>
              </div>

              <div class="anomaly-card-time">{{ item.discoverTime }} 发现 | 已持续{{ item.duration }}</div>

              <div class="anomaly-card-btns">
                <button type="button" class="anomaly-card-btn is-detail" @click.stop="openAnomalyDetail(item)">
                  查看详情
                </button>
                <button
                  type="button"
                  class="anomaly-card-btn"
                  :class="item.isAnalyzed ? 'is-analyzed' : 'is-analysis'"
                  :disabled="analyzeBusyIds.includes(item.id)"
                  @click.stop="toggleAnalysisStatus(item)"
                >
                  {{ item.isAnalyzed ? "已加入深度分析" : "加入深度分析" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 「分析栏」分组：直接取接口中 status=ANALYSIS 的事件（与待研判/异常同一份 warningMarkers） -->
      <div v-else-if="activeAnomalyTab === 'analysis'" class="anomaly-list">
        <div v-if="analysisItems.length === 0" class="anomaly-empty">
          分析栏为空，可在「异常」条目里点「加入深度分析」
        </div>
        <div v-for="item in analysisItems" :key="item.id" class="anomaly-item">
          <div class="anomaly-item-head">
            <span class="anomaly-item-name" :title="item.title">{{ item.title }}</span>
            <span class="anomaly-item-status" :class="statusClass('ANALYSIS')">分析中</span>
          </div>
          <div class="anomaly-item-meta">
            <span>威胁度 {{ item.threat }}</span>
            <span>异常度 {{ item.anomaly }}</span>
            <span class="anomaly-item-date">置信度 {{ item.anomalyConf }}</span>
          </div>
          <!-- 最后一行：查看详情（逻辑同「异常」卡片），批量移除模式下右侧多一个勾选框 -->
          <div class="anomaly-item-actions">
            <button type="button" class="anomaly-detail-btn" @click.stop="openAnomalyDetail(item)">
              查看详情
            </button>
            <input
              v-if="analysisSelecting"
              v-model="analysisSelectedIds"
              type="checkbox"
              class="anomaly-checkbox"
              :value="item.id"
              @click.stop
            />
          </div>
        </div>
      </div>

      <div v-else class="anomaly-list">
        <div v-if="filteredAnomalies.length === 0" class="anomaly-empty">暂无数据</div>
        <div v-for="item in filteredAnomalies" :key="item.id" class="anomaly-item">
          <div class="anomaly-item-head">
            <span class="anomaly-item-name" :title="item.name">{{ (item.name || "").trim() || "未命名异常" }}</span>
            <span class="anomaly-item-status" :class="statusClass(item.status)">{{ statusText(item.status) }}</span>
          </div>
          <div class="anomaly-item-meta">
            <span>异常程度 {{ item.score || 0 }}%</span>
            <span>置信度 {{ item.confidence || 0 }}%</span>
            <span class="anomaly-item-date">{{ formatItemTime(item) }}</span>
          </div>
          <!-- 仅「待研判」分组可操作：右侧是单条确认按钮 + 勾选框 -->
          <div v-if="activeAnomalyTab === 'pending'" class="anomaly-item-actions">
            <button
              type="button"
              class="anomaly-confirm-btn"
              :disabled="pendingAction"
              @click="confirmOne(item)"
            >
              确认
            </button>
            <input
              v-model="selectedIds"
              type="checkbox"
              class="anomaly-checkbox"
              :value="item.id"
            />
          </div>
        </div>
      </div>

      <!-- 「异常」分组底部操作：勾选后批量确认（提交 /anomalies/analyze，把数据置为分析中）；
           未选中任何条目时两个按钮都不可点 -->
      <div v-if="activeAnomalyTab === 'confirmed'" class="anomaly-batch-bar">
        <span class="anomaly-batch-count">已选 {{ selectedIds.length }} 条</span>
        <button
          type="button"
          class="anomaly-batch-btn is-confirm"
          :disabled="analysisAction || selectedIds.length === 0"
          @click="batchAnalyze"
        >
          批量确认
        </button>
        <button
          type="button"
          class="anomaly-batch-cancel"
          :disabled="analysisAction || selectedIds.length === 0"
          @click="clearSelection"
        >
          取消
        </button>
      </div>

      <!-- 勾选后在列表底部出现：已选数目 + 批量确认 / 批量排除 / 取消选择 -->
      <div v-if="activeAnomalyTab === 'pending' && selectedIds.length > 0" class="anomaly-batch-bar">
        <span class="anomaly-batch-count">已选 {{ selectedIds.length }} 条</span>
        <button type="button" class="anomaly-batch-btn is-confirm" :disabled="pendingAction" @click="batchConfirm">
          批量确认
        </button>
        <button type="button" class="anomaly-batch-btn is-reject" :disabled="pendingAction" @click="batchReject">
          批量排除
        </button>
        <button type="button" class="anomaly-batch-cancel" :disabled="pendingAction" @click="clearSelection">
          取消选择
        </button>
      </div>

      <!-- 「分析栏」底部操作：逻辑与 WarningRightPanel 的深度分析栏按钮一致 -->
      <div v-if="activeAnomalyTab === 'analysis'" class="anomaly-analysis-bar">
        <button type="button" class="anomaly-deep-btn" @click="enterDeepAnalysis">进入云脑深度分析</button>
        <div class="anomaly-analysis-actions">
          <button
            type="button"
            class="anomaly-analysis-btn"
            :class="{ 'is-danger': analysisSelecting }"
            :disabled="analysisAction"
            @click="toggleAnalysisRemove"
          >
            {{ analysisSelecting ? `确认移除 (${analysisSelectedIds.length})` : "批量移除" }}
          </button>
          <button
            type="button"
            class="anomaly-analysis-btn"
            :disabled="analysisAction"
            @click="analysisSelecting ? cancelAnalysisSelection() : clearAnalysisList()"
          >
            {{ analysisSelecting ? "取消" : "清空分析栏" }}
          </button>
        </div>
      </div>
    </div>

    <el-tabs v-else v-model="activeName" class="tabs" stretch>
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

  <!-- 「异常」分组条目的「查看详情」弹窗（结构同 WarningLeftPanel.vue 的事件详情） -->
  <el-dialog v-model="detailVisible" plain class="anomaly-dialog" width="520px" :close-on-click-modal="false" title="事件详情"
    @closed="detailEvent = null">
    <div v-loading="detailLoading" class="dialog-content">
      <div class="dialog-title">
        <span class="dialog-title-mark">◆</span>
        <span>{{ detailEvent?.name || "暂无标题" }}</span>
      </div>
      <div class="dialog-meta">
        <span class="dialog-country">异常类型：{{ assetTypeLabel(detailEvent?.assetType) }}</span>
        <span class="dialog-country">区域：{{ detailEvent?.location || "未知区域" }}</span>
      </div>
      <div class="dialog-meta">
        <span class="dialog-country">时间：{{ formatEventTime(detailEvent?.eventTime) }}</span>
        <span class="dialog-country">综合威胁度：{{ detailEvent?.threatLevel ?? "--" }}</span>
        <span class="dialog-country">置信度：{{ Math.round(Number(detailEvent?.confidence) || 0) }}%</span>
        <span class="dialog-country">偏离度：{{ detailEvent?.deviationScore ?? "--" }}</span>
      </div>

      <div v-if="detailArticle" class="dialog-section">
        <div class="dialog-meta">
          <span class="dialog-country">国家：{{ detailArticle.country || "未知国家" }}</span>
          <span class="dialog-country">来源：{{ detailArticle.author || detailArticle.source || "未知来源" }}</span>
        </div>
        <p class="dialog-body">{{ detailArticle.content || detailArticle.summary || "暂无内容" }}</p>
      </div>

      <div v-else-if="detailIsTrajectory" class="dialog-section">
        <div class="dialog-subtitle">轨迹目标</div>
        <div class="dialog-meta">
          <span class="dialog-country">呼号：{{ detailEvent?.source || "--" }}</span>
          <span class="dialog-country">资产 ID：{{ detailSigint?.assetId || detailEvent?.assetId || "--" }}</span>
          <span v-if="detailSigint?.aircraftType" class="dialog-country">机型：{{ detailSigint.aircraftType }}</span>
        </div>
        <div v-if="detailSigint" class="dialog-meta">
          <span class="dialog-country">最新位置：{{ formatCoord(detailSigint.lat, detailSigint.lng) }}</span>
          <span v-if="detailSigint.alt != null" class="dialog-country">高度：{{ Math.round(Number(detailSigint.alt)) }}</span>
          <span v-if="detailSigint.speed != null" class="dialog-country">速度：{{ Math.round(Number(detailSigint.speed)) }}kt</span>
          <span v-if="detailSigint.heading != null" class="dialog-country">航向：{{ Math.round(Number(detailSigint.heading)) }}°</span>
        </div>
        <div v-else class="dialog-meta">
          <span class="dialog-date">无 sigint_latest 最新快照（目标可能已离开监测范围）</span>
        </div>
        <div v-if="detailTrajectoryPoints.length" class="dialog-meta">
          <span class="dialog-country">轨迹点数：{{ detailTrajectoryPoints.length }}</span>
          <span v-if="detailEvidence?.distanceKm != null"
            class="dialog-country">距警戒区：{{ Number(detailEvidence.distanceKm).toFixed(0) }}km</span>
          <span v-if="detailEvidence?.deviationScore != null"
            class="dialog-country">偏离度：{{ detailEvidence.deviationScore }}</span>
        </div>
        <p v-if="detailTrajectorySummary" class="dialog-body">{{ detailTrajectorySummary }}</p>
        <p v-else class="dialog-body">暂无轨迹快照数据</p>
      </div>

      <p v-else class="dialog-body">暂无详细信息</p>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" class="dialog-close-btn" @click="detailVisible = false">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";
import { Management, List, TrendCharts } from '@element-plus/icons-vue'

import { FACILITY_TYPES, FACILITY_TYPE_LABELS_ZH } from "@/assets/facilities.js";
import WarningDialog from "./Dialogs/WarningDialog.vue";
import { ElMessage } from "element-plus";
import { getArticleAnalysis, saveArticleAnalysis } from "@/api/article-analyses"
import { confirmAnomaly, confirmAnomalies, rejectAnomaly, getAnomalyById, analyzeAnomalies } from "@/api/anomalies"
import { listAgents, stream } from "@/agents-hub/api";

// 与 homeStore.mapLeftTab 双向绑定：点击地图聚合时 Map.vue 会把它切到 "second"（开源情报）
const activeName = computed({
  get: () => homeStore.mapLeftTab,
  set: (v) => {
    homeStore.mapLeftTab = v;
  },
});
const homeStore = useHomeStore();

// ==================== 「异常征候」视图（路由 /anomaly） ====================
// 数据源与右侧面板 data-mark="异常列表" 完全一致：homeStore.warningMarkers
const route = useRoute();
const router = useRouter();
const isAnomalyMode = computed(() => route.name === "Anomaly");

// 历史判定：createdAt 距今超过 1 周（7 天）。基准时间每 60s 刷新一次，
// 保证页面长时间停留时条目能按时"过期"滑入历史。
const HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const nowTs = ref(Date.now());
let anomalyClock = null;

const parseTs = (value) => {
  if (!value) return NaN;
  const text = String(value).trim();
  const ts = Date.parse(text.replace(" ", "T")); // 兼容 "2026-10-28 10:00:00"
  return Number.isNaN(ts) ? Date.parse(text) : ts;
};

const isHistoryItem = (marker) => {
  const ts = parseTs(marker.createdAt);
  return !Number.isNaN(ts) && nowTs.value - ts > HISTORY_WINDOW_MS;
};

// 四个分组互斥：超过 1 周的先归入「历史」，其余按 status 归入 待研判 / 异常 / 分析栏
const anomalyBuckets = computed(() => {
  const buckets = { pending: [], confirmed: [], analysis: [], history: [] };
  (homeStore.warningMarkers || []).forEach((marker) => {
    if (isHistoryItem(marker)) {
      buckets.history.push(marker);
      return;
    }
    const status = String(marker.status || "").toUpperCase();
    // 「分析栏」直接取接口里 status=ANALYSIS 的事件（与待研判/异常同一份 warningMarkers）
    if (status === "CONFIRMED") buckets.confirmed.push(marker);
    else if (status === "ANALYSIS") buckets.analysis.push(marker);
    else buckets.pending.push(marker); // POTENTIAL / 未标记 / REJECTED / 其它状态
  });

  // 组内按 createdAt 倒序，无时间的排最后
  Object.values(buckets).forEach((list) => {
    list.sort((a, b) => {
      const ta = parseTs(a.createdAt);
      const tb = parseTs(b.createdAt);
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return tb - ta;
    });
  });

  return buckets;
});

const anomalyTabs = computed(() => [
  { key: "pending", label: "待研判", count: anomalyBuckets.value.pending.length },
  { key: "confirmed", label: "异常", count: anomalyBuckets.value.confirmed.length },
  { key: "analysis", label: "分析栏", count: analysisItems.value.length },
  { key: "history", label: "历史", count: anomalyBuckets.value.history.length },
]);

const activeAnomalyTab = ref("pending");
const filteredAnomalies = computed(() => anomalyBuckets.value[activeAnomalyTab.value] || []);

const statusText = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "CONFIRMED":
      return "异常";
    case "ANALYSIS":
      return "分析中";
    case "REJECTED":
      return "已排除";
    default:
      return "待研判";
  }
};

const statusClass = (status) => `is-${String(status || "POTENTIAL").toLowerCase()}`;

// ==================== 待研判条目的确认 / 排除 ====================
// 勾选只在「待研判」分组内有效；切换分组时清空，避免其它分组里残留隐藏的选中项
const selectedIds = ref([]);
const pendingAction = ref(false);

const clearSelection = () => {
  selectedIds.value = [];
};

const applyStatus = async (ids, handler, actionText) => {
  if (pendingAction.value || ids.length === 0) return;
  pendingAction.value = true;
  try {
    const results = await Promise.allSettled(ids.map((id) => handler(id)));
    const failed = results.filter((r) => r.status === "rejected");
    const okCount = ids.length - failed.length;
    if (failed.length > 0) {
      const reason = failed[0].reason;
      ElMessage.error(
        `${actionText}：成功 ${okCount} 条，失败 ${failed.length} 条（${reason instanceof Error ? reason.message : String(reason)}）`,
      );
    } else {
      ElMessage.success(`已${actionText} ${okCount} 条异常事件`);
    }
    clearSelection();
    // fetchWarningData 只在 Map 挂载时跑一次，没有轮询，改完状态必须手动刷
    await homeStore.anomaliesRefetch?.();
  } finally {
    pendingAction.value = false;
  }
};

const confirmOne = (item) => applyStatus([item.id], (id) => confirmAnomaly(id), "确认");

// 批量确认：走批量接口 POST /api/v1/anomalies/confirm，body { anomalyIds: [...] }
// 选中项的 id 一次性提交，不再是逐条循环请求
const batchConfirm = async () => {
  const ids = [...selectedIds.value];
  if (pendingAction.value || ids.length === 0) return;
  pendingAction.value = true;
  try {
    await confirmAnomalies(ids);
    ElMessage.success(`已确认 ${ids.length} 条异常事件`);
    clearSelection();
    // fetchWarningData 只在 Map 挂载时跑一次，没有轮询，改完状态必须手动刷
    await homeStore.anomaliesRefetch?.();
  } catch (reason) {
    ElMessage.error(
      `批量确认失败：${reason instanceof Error ? reason.message : String(reason)}`,
    );
  } finally {
    pendingAction.value = false;
  }
};

const batchReject = () => applyStatus([...selectedIds.value], (id) => rejectAnomaly(id), "批量排除");

// ==================== 「分析栏」底部操作 ====================
// 三个按钮的逻辑照 WarningRightPanel 的深度分析栏：进入云脑深度分析（带 ids 跳转）、
// 批量移除（两段式：先进入选择态，再确认）、清空分析栏。
// 列表数据来自接口 status=ANALYSIS 的事件；移除/清空 = 调 /anomalies/confirm 把状态改回已确认，
// 接口成功后本地乐观置为 CONFIRMED（条目随即离开分析栏、回到「异常」分组）再拉一次接口对齐。
const analysisSelecting = ref(false);
const analysisSelectedIds = ref([]);
// 分析栏/异常分组的请求互斥标记（避免连点重复提交）
const analysisAction = ref(false);

const cancelAnalysisSelection = () => {
  analysisSelecting.value = false;
  analysisSelectedIds.value = [];
};

// 移出分析栏：批量确认后状态变 CONFIRMED
const submitAnalysisRemoval = async (ids, successText, failText) => {
  if (analysisAction.value || ids.length === 0) return;
  analysisAction.value = true;
  try {
    await confirmAnomalies(ids);
    homeStore.warningMarkers.forEach((marker) => {
      if (ids.includes(marker.id)) {
        marker.status = "CONFIRMED";
        marker.isAnalyzed = false;
      }
    });
    homeStore.removeFromAnalysisBatch(ids); // 同步全局分析篮（深度分析页左侧栏复用这份）
    ElMessage.success(`${successText}${ids.length} 条`);
    homeStore.anomaliesRefetch?.();
  } catch (reason) {
    ElMessage.error(
      `${failText}：${reason instanceof Error ? reason.message : String(reason)}`,
    );
  } finally {
    analysisAction.value = false;
  }
};

const toggleAnalysisRemove = async () => {
  if (!analysisSelecting.value) {
    analysisSelecting.value = true;
    analysisSelectedIds.value = [];
    return;
  }
  if (analysisSelectedIds.value.length > 0) {
    await submitAnalysisRemoval([...analysisSelectedIds.value], "已移出分析栏 ", "移出分析栏失败");
  }
  cancelAnalysisSelection();
};

const clearAnalysisList = async () => {
  const ids = analysisItems.value.map((item) => item.id).filter(Boolean);
  if (ids.length > 0) {
    await submitAnalysisRemoval(ids, "已清空分析栏 ", "清空分析栏失败");
  }
  cancelAnalysisSelection();
};

const enterDeepAnalysis = () => {
  const ids = analysisItems.value.map((item) => item.id).filter(Boolean);
  if (ids.length > 0) {
    router.push({ path: "/deepanalysis", query: { from: "homepage", ids: ids.join(",") } });
  } else {
    router.push("/deepanalysis");
  }
};

watch(activeAnomalyTab, () => {
  clearSelection();
  cancelAnalysisSelection();
});

// 列表时间显示：createdAt 按本地时间格式化到分钟，取不到时间时退回 YYYY-MM-DD
const formatItemTime = (item) => {
  const ts = parseTs(item.createdAt);
  if (!Number.isNaN(ts)) {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return item.date || "";
};

// ==================== 「异常」分组：与 WarningLeftPanel 的异常列表同口径 ====================
// 参考 WarningLeftPanel.vue 中 data-mark="异常列表" 的映射规则：
// 威胁度优先取 threatLevel（纯数字才认，否则退回 score），等级 > 85 记为高危（琥珀色条），
// 异常度取 deviationScore，区域取接口 location（Map.vue 映射到了 marker.description）。
const ASSET_TYPE_LABELS = {
  article: "开源情报",
  aircraft: "飞机轨迹",
  vessel: "舰船轨迹",
  satellite: "卫星轨迹",
};
const assetTypeLabel = (asset) => (asset && ASSET_TYPE_LABELS[asset]) || "其他";

const formatScore = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

const threatDisplay = (marker) => {
  const raw = String(marker.threatLevel ?? "").trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return formatScore(Number(raw));
  return formatScore(Number(marker.score) || 0);
};

const durationSince = (value) => {
  const ts = parseTs(value);
  if (Number.isNaN(ts)) return "未知";
  const days = Math.floor((nowTs.value - ts) / 86400000);
  return days >= 1 ? `${days}天` : "不足1天";
};

const toWarningItem = (marker) => {
  const threat = threatDisplay(marker);
  const confidence = String(Math.round(Number(marker.confidence) || 0));
  return {
    id: marker.id,
    itemId: marker.itemId,
    title: (marker.name || "").trim() || "未知警告",
    count: marker.count || 0,
    level: Number(threat) > 85 ? "high" : "low",
    threat,
    threatConf: confidence,
    anomaly: formatScore(Number(marker.score) || 0),
    anomalyConf: confidence,
    type: marker.type,
    assetType: marker.assetType || "",
    region: marker.description || "未知区域",
    discoverTime: formatItemTime(marker),
    duration: durationSince(marker.createdAt),
    isAnalyzed: marker.isAnalyzed === true,
  };
};

const confirmedList = computed(() => anomalyBuckets.value.confirmed.map(toWarningItem));

// 「分析栏」条目：直接取接口 status=ANALYSIS 的事件（与待研判/异常同一份 warningMarkers，
// 映射口径也一致）
const analysisItems = computed(() =>
  anomalyBuckets.value.analysis.map(toWarningItem),
);

// 加入深度分析：提交 POST /anomalies/analyze（{ anomalyIds }）把该条置为分析中，
// 成功后本地乐观改状态 + 入全局分析篮（深度分析页左侧栏、跳转 ids 都复用这份），再拉接口对齐
const analyzeBusyIds = ref([]);

const markLocalAnalyzing = (ids) => {
  homeStore.warningMarkers.forEach((marker) => {
    if (ids.includes(marker.id)) {
      marker.status = "ANALYSIS";
      marker.isAnalyzed = true;
    }
  });
};

const submitAnalyze = async (ids, items, successText, failText) => {
  if (analysisAction.value || ids.length === 0) return;
  analysisAction.value = true;
  try {
    await analyzeAnomalies(ids);
    markLocalAnalyzing(ids);
    (items || []).forEach((item) => homeStore.addToAnalysis(item));
    ElMessage.success(`${successText}${ids.length} 条`);
    homeStore.anomaliesRefetch?.();
  } catch (reason) {
    ElMessage.error(
      `${failText}：${reason instanceof Error ? reason.message : String(reason)}`,
    );
  } finally {
    analysisAction.value = false;
  }
};

const toggleAnalysisStatus = async (item) => {
  if (analyzeBusyIds.value.includes(item.id) || analysisAction.value) return;
  analyzeBusyIds.value = [...analyzeBusyIds.value, item.id];
  try {
    await submitAnalyze([item.id], [item], "已加入深度分析 ", "加入深度分析失败");
  } finally {
    analyzeBusyIds.value = analyzeBusyIds.value.filter((id) => id !== item.id);
  }
};

// 「异常」分组底部：批量确认 = 把勾选中的条目一起提交 analyze（置为分析中）
const batchAnalyze = async () => {
  const ids = [...selectedIds.value];
  if (ids.length === 0) return;
  const items = confirmedList.value.filter((item) => ids.includes(item.id));
  await submitAnalyze(ids, items, "已批量确认 ", "批量确认失败");
  clearSelection();
};

// ---- 「查看详情」弹窗：结构同 WarningLeftPanel 的事件详情 ----
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailEvent = ref(null);

const openAnomalyDetail = async (item) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detailEvent.value = null;
  try {
    detailEvent.value = await getAnomalyById(item.id);
  } catch (error) {
    console.error("[MapLeft] 获取异常详情失败:", error);
    detailVisible.value = false;
    ElMessage.error("获取异常详情失败");
  } finally {
    detailLoading.value = false;
  }
};

const parseJsonField = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const detailIsTrajectory = computed(() =>
  ["aircraft", "vessel", "satellite"].includes(detailEvent.value?.assetType || ""),
);

/** 开源情报类：优先取 articles 实时数据（按 assetId 匹配），回退 anomaly_event.asset_data 快照 */
const detailArticle = computed(() => {
  const ev = detailEvent.value;
  if (!ev || ev.assetType !== "article") return null;
  if (ev.assetId) {
    const live = homeStore.articles.find((a) => a != null && String(a.id) === String(ev.assetId));
    if (live) {
      return {
        title: live.title ?? "",
        content: live.content ?? "",
        summary: live.summary ?? "",
        source: live.source ?? "",
        author: live.author ?? "",
        country: live.country ?? "",
      };
    }
  }
  const snap = parseJsonField(ev.assetData);
  if (snap && (snap.title || snap.content)) {
    return {
      title: snap.title ?? "",
      content: snap.content ?? "",
      summary: snap.summary ?? "",
      source: snap.source ?? "",
      author: snap.author ?? "",
      country: snap.country ?? "",
    };
  }
  return null;
});

const detailSigint = computed(() => {
  const s = detailEvent.value?.sigintData;
  return s && typeof s === "object" && !Array.isArray(s) ? s : null;
});

const detailTrajectoryPoints = computed(() => {
  const d = parseJsonField(detailEvent.value?.assetData);
  return Array.isArray(d) ? d : [];
});

const detailEvidence = computed(() => {
  const d = parseJsonField(detailEvent.value?.evidenceJson);
  return d && typeof d === "object" && !Array.isArray(d) ? d : null;
});

const detailTrajectorySummary = computed(() => {
  const pts = detailTrajectoryPoints.value;
  if (!pts.length) return "";
  const first = pts[0] || {};
  if (pts.length === 1) return `轨迹点 ${formatCoord(first.lat, first.lon)}。`;
  const last = pts[pts.length - 1] || {};
  const times = pts.map((p) => (p ? p.timestamp : undefined)).filter((t) => Boolean(t));
  let text = `起点 ${formatCoord(first.lat, first.lon)} → 终点 ${formatCoord(last.lat, last.lon)}，共 ${pts.length} 个轨迹点`;
  if (times.length) text += `，时间范围 ${times[0]} ~ ${times[times.length - 1]}`;
  return text + "。";
});

const formatCoord = (lat, lng) =>
  lat != null && lng != null ? `(${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})` : "--";

const formatEventTime = (value) => {
  if (!value) return "未知";
  // 与列表同源：不做时区转换，避免两边相差 8 小时
  const m = String(value).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : String(value);
};

onMounted(() => {
  anomalyClock = window.setInterval(() => {
    nowTs.value = Date.now();
  }, 60 * 1000);
});

onUnmounted(() => {
  if (anomalyClock) clearInterval(anomalyClock);
  anomalyClock = null;
});

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

/* ==================== 异常征候视图（/anomaly） ==================== */
.anomaly-view {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 四个筛选项：pill 形状，与智能体中心的一级筛选一致 */
.anomaly-filter {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.anomaly-filter-btn {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 500;
  color: $text-2;
  white-space: nowrap;
  background: $panel;
  border: 1px solid $border;
  border-radius: 15px;
  cursor: pointer;
  user-select: none;
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

.anomaly-filter-count {
  padding: 0 5px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 16px;
  color: $text-2;
  background: $sunken;
  border-radius: 9px;
}

.anomaly-filter-btn.active .anomaly-filter-count {
  color: $accent-text;
  background: rgba($accent, 0.22);
}

.anomaly-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.anomaly-item {
  /* 右侧留 6px：滚动条紧贴列表右边缘，不留白会与内容/复选框挤在一起 */
  padding: 9px 6px 9px 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: $text;
  border-bottom: 1px solid rgba(45, 58, 77, 0.7);
  transition: background $ease;

  &:hover {
    background: rgba($accent, 0.05);
  }
}

.anomaly-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.anomaly-item-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.anomaly-item-status {
  flex-shrink: 0;
  padding: 1px 6px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1.5;
  border: 1px solid;
  border-radius: $radius-sm;

  &.is-confirmed {
    color: #fca5a5;
    background: rgba($red, 0.12);
    border-color: rgba($red, 0.45);
  }

  &.is-analysis {
    color: $accent-text;
    background: rgba($accent, 0.12);
    border-color: rgba($accent, 0.45);
  }

  &.is-potential {
    color: $orange-text;
    background: rgba($orange, 0.12);
    border-color: rgba($orange, 0.45);
  }

  &.is-rejected {
    color: $text-2;
    background: rgba(156, 163, 175, 0.1);
    border-color: rgba(156, 163, 175, 0.35);
  }
}

.anomaly-item-meta {
  display: flex;
  gap: 12px;
  margin-top: 5px;
  font-size: 11.5px;
  color: $text-2;
  font-variant-numeric: tabular-nums;
}

.anomaly-item-date {
  margin-left: auto;
  color: $text-3;
}

/* 待研判条目底部一行：单条确认按钮 + 勾选框（右对齐） */
.anomaly-item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 7px;
}

.anomaly-confirm-btn {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
  border: 1px solid transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(59, 130, 246, 0.3);
  transition: box-shadow $ease, filter $ease;

  &:hover {
    box-shadow: 0 3px 10px rgba(59, 130, 246, 0.42);
  }

  &:active {
    filter: brightness(0.94);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
    box-shadow: none;
  }
}

.anomaly-checkbox {
  appearance: none;
  width: 14px;
  height: 14px;
  margin: 0;
  display: grid;
  place-content: center;
  background: $sunken;
  border: 1px solid $border-strong;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background $ease, border-color $ease;

  // 勾选标记：用两条边框拼出对勾
  &::after {
    content: "";
    width: 7px;
    height: 4px;
    border-left: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
    transform: rotate(-45deg) scale(0);
    transition: transform $ease;
  }

  &:hover {
    border-color: rgba($accent, 0.7);
  }

  &:checked {
    background: $accent;
    border-color: $accent;

    &::after {
      transform: rotate(-45deg) scale(1);
    }
  }
}

/* 勾选后固定在列表底部 */
.anomaly-batch-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  font-size: 11px;
  border-top: 1px solid $border;
}

.anomaly-batch-count {
  margin-right: auto;
  font-weight: 600;
  color: $accent-text;
}

.anomaly-batch-btn {
  height: 24px;
  padding: 0 9px;
  font-size: 11px;
  font-weight: 600;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background $ease;

  &.is-confirm {
    color: #6ee7b7;
    background: rgba($green, 0.12);
    border: 1px solid rgba($green, 0.45);

    &:hover {
      background: rgba($green, 0.22);
    }
  }

  &.is-reject {
    color: #fca5a5;
    background: rgba($red, 0.12);
    border: 1px solid rgba($red, 0.45);

    &:hover {
      background: rgba($red, 0.22);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.anomaly-batch-cancel {
  padding: 0;
  font-size: 11px;
  color: $text-2;
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: $text;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
}

.anomaly-empty {
  padding: 20px 0;
  font-size: 12px;
  text-align: center;
  color: $text-3;
}

/* ==================== 「异常」分组卡片 ==================== */
.anomaly-card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 与右侧滚动条留出间距（对应 WarningLeftPanel 的 pr-1） */
  padding-right: 4px;
}

.anomaly-card {
  position: relative;
  padding: 9px 10px;
  background: $panel;
  border: 1px solid $border;
  border-radius: $radius-md;
  /* 条目常展开、不收缩，所以不设 pointer 光标、也没有展开态高亮 */
  transition: border-color $ease, background $ease;

  &:hover {
    border-color: $border-strong;
    background: #1b2637;
  }
}

/* 左侧等级色条：高危橙 / 普通蓝 */
.anomaly-card-ribbon {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: $radius-md 0 0 $radius-md;

  &.is-high {
    background: $orange;
  }

  &.is-low {
    background: $accent;
  }
}

.anomaly-card-body {
  padding-left: 6px;
}

.anomaly-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

/* 卡片头右侧：聚合数徽标 + 批量确认用的勾选框 */
.anomaly-card-head-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.anomaly-card-title {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: $text;
}

.anomaly-card-dot {
  flex-shrink: 0;

  &.is-high {
    color: $orange;
  }

  &.is-low {
    color: #60a5fa;
  }
}

.anomaly-card-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.anomaly-card-count {
  flex-shrink: 0;
  padding: 0 5px;
  font-size: 10.5px;
  font-weight: 600;
  line-height: 16px;
  color: $orange-text;
  background: rgba($orange, 0.14);
  border: 1px solid rgba($orange, 0.3);
  border-radius: $radius-sm;
}

.anomaly-card-metrics {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px;
  font-size: 11.5px;
  color: $text-2;
  border-radius: $radius-sm;

  /* 展开时整行加深成一块底（同 WarningLeftPanel 展开态） */
  &.is-open {
    margin: 8px 0;
    background: $sunken;
    border: 1px solid $border;
  }
}

.metric-threat {
  font-family: var(--mono);
  font-weight: 700;
  color: $orange-text;
}

.metric-anomaly {
  font-family: var(--mono);
  font-weight: 700;
  color: $accent-text;
}

.metric-sub {
  color: $text-3;
}

.anomaly-card-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding-top: 4px;
  font-size: 12px;
  border-top: 1px solid rgba(45, 58, 77, 0.7);
}

.anomaly-card-field {
  display: flex;
  align-items: center;
  color: $text-2;

  .field-label {
    flex-shrink: 0;
    width: 64px;
    color: $text-3;
  }

  .field-value {
    color: $text;
  }
}

.anomaly-card-time {
  padding-top: 2px;
  font-family: var(--mono);
  font-size: 11.5px;
  color: $text-2;
}

.anomaly-card-btns {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.anomaly-card-btn {
  flex: 1;
  padding: 5px 0;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background $ease, color $ease, border-color $ease;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  &.is-detail {
    color: #cbd5e1;
    background: $sunken;
    border-color: $border;

    &:hover {
      color: $text;
      border-color: $border-strong;
      background: #18202c;
    }
  }

  &.is-analysis {
    color: $accent-text;
    background: rgba($accent, 0.12);
    border-color: rgba($accent, 0.35);

    &:hover {
      background: rgba($accent, 0.22);
    }
  }

  &.is-analyzed {
    color: #6ee7b7;
    background: rgba($green, 0.1);
    border-color: rgba($green, 0.35);

    &:hover {
      background: rgba($green, 0.2);
    }
  }
}

/* 分析栏条目最后一行的小「查看详情」按钮（同卡片里的按钮配色） */
.anomaly-detail-btn {
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 500;
  color: #cbd5e1;
  background: $sunken;
  border: 1px solid $border;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background $ease, color $ease, border-color $ease;

  &:hover {
    color: $text;
    border-color: $border-strong;
    background: #18202c;
  }
}

/* ==================== 「分析栏」底部三个操作按钮 ==================== */
.anomaly-analysis-bar {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid $border;
}

/* 进入云脑深度分析：主按钮（同智能体中心的 primary） */
.anomaly-deep-btn {
  width: 100%;
  padding: 7px 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, $accent 0%, #2563eb 100%);
  border: 1px solid transparent;
  border-radius: $radius-md;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  transition: box-shadow $ease, filter $ease;

  &:hover {
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.42);
  }

  &:active {
    filter: brightness(0.94);
  }
}

.anomaly-analysis-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.anomaly-analysis-btn {
  padding: 5px 0;
  font-size: 12px;
  font-weight: 500;
  color: #cbd5e1;
  background: $panel;
  border: 1px solid $border;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background $ease, color $ease, border-color $ease;

  &:hover {
    background: rgba($accent, 0.12);
    border-color: rgba($accent, 0.4);
    color: $accent-text;
  }

  /* 已进入删除确认态 */
  &.is-danger {
    color: #fca5a5;
    background: rgba($red, 0.12);
    border-color: rgba($red, 0.45);

    &:hover {
      background: rgba($red, 0.22);
      border-color: rgba($red, 0.6);
      color: #fecaca;
    }
  }

  &:disabled {
    opacity: 0.55;
    cursor: default;

    &:hover {
      background: $panel;
      border-color: $border;
      color: #cbd5e1;
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
