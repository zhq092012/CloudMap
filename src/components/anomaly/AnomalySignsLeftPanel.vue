<template>
  <div
    class="w-90 h-full absolute left-0 top-0 z-1000 bg-[#111827]/95 border border-[#2d3a4d] text-[#e5e7eb] flex flex-col p-2.5 font-sans select-none backdrop-blur-sm">
    <div class="anomaly-view">
      <div class="anomaly-filter">
        <button v-for="tab in anomalyTabs" :key="tab.key" type="button" class="anomaly-filter-btn"
          :class="{ active: activeAnomalyTab === tab.key }" @click="activeAnomalyTab = tab.key">
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
                <input v-model="selectedIds" type="checkbox" class="anomaly-checkbox" :value="item.id"
                  :disabled="analysisAction" @click.stop />
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
                <button type="button" class="anomaly-card-btn" :class="item.isAnalyzed ? 'is-analyzed' : 'is-analysis'"
                  :disabled="analyzeBusyIds.includes(item.id)" @click.stop="toggleAnalysisStatus(item)">
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
            <input v-if="analysisSelecting" v-model="analysisSelectedIds" type="checkbox" class="anomaly-checkbox"
              :value="item.id" @click.stop />
          </div>
        </div>
      </div>
      <!-- 「待研判」分组 -->
      <div v-else class="anomaly-list">
        <div v-if="filteredAnomalies.length === 0" class="anomaly-empty">暂无数据</div>
        <div
          v-for="item in filteredAnomalies"
          :key="item.id"
          class="anomaly-item"
          :class="{ 'anomaly-item--pending': activeAnomalyTab === 'pending' }"
        >
          <!-- 待研判：左勾选（纵向居中）| 标题行右侧为状态 tag +「确认」tag -->
          <template v-if="activeAnomalyTab === 'pending'">
            <input
              v-model="selectedIds"
              type="checkbox"
              class="anomaly-checkbox anomaly-item-select"
              :value="item.id"
              @click.stop
            />
            <div class="anomaly-item-main">
              <div class="anomaly-item-head">
                <span class="anomaly-item-name" :title="item.name">{{
                  (item.name || "").trim() || "未命名异常"
                }}</span>
                <div class="anomaly-item-tags">
                  <span class="anomaly-item-status" :class="statusClass(item.status)">{{
                    statusText(item.status)
                  }}</span>
                  <button
                    type="button"
                    class="anomaly-item-status is-confirm-tag"
                    :disabled="pendingAction"
                    @click.stop="confirmOne(item)"
                  >
                    确认
                  </button>
                </div>
              </div>
              <div class="anomaly-item-meta">
                <span>异常程度 {{ item.score || 0 }}%</span>
                <span>置信度 {{ item.confidence || 0 }}%</span>
                <span class="anomaly-item-date">{{ formatItemTime(item) }}</span>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="anomaly-item-main">
              <div class="anomaly-item-head">
                <span class="anomaly-item-name" :title="item.name">{{
                  (item.name || "").trim() || "未命名异常"
                }}</span>
                <span class="anomaly-item-status" :class="statusClass(item.status)">{{
                  statusText(item.status)
                }}</span>
              </div>
              <div class="anomaly-item-meta">
                <span>异常程度 {{ item.score || 0 }}%</span>
                <span>置信度 {{ item.confidence || 0 }}%</span>
                <span class="anomaly-item-date">{{ formatItemTime(item) }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 「异常」分组底部操作：勾选后批量确认（提交 /anomalies/analyze，把数据置为分析中）；
           未选中任何条目时两个按钮都不可点 -->
      <div v-if="activeAnomalyTab === 'confirmed'" class="anomaly-batch-bar">
        <span class="anomaly-batch-count">已选 {{ selectedIds.length }} 条</span>
        <button type="button" class="anomaly-batch-btn is-confirm"
          :disabled="analysisAction || selectedIds.length === 0" @click="batchAnalyze">
          批量确认
        </button>
        <button type="button" class="anomaly-batch-cancel" :disabled="analysisAction || selectedIds.length === 0"
          @click="clearSelection">
          取消
        </button>
      </div>

      <!-- [待研判]勾选后在列表底部出现：已选数目 + 批量确认 / 批量排除 / 取消选择 -->
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
          <button type="button" class="anomaly-analysis-btn" :class="{ 'is-danger': analysisSelecting }"
            :disabled="analysisAction" @click="toggleAnalysisRemove">
            {{ analysisSelecting ? `确认移除 (${analysisSelectedIds.length})` : "批量移除" }}
          </button>
          <button type="button" class="anomaly-analysis-btn" :disabled="analysisAction"
            @click="analysisSelecting ? cancelAnalysisSelection() : clearAnalysisList()">
            {{ analysisSelecting ? "取消" : "清空分析栏" }}
          </button>
        </div>
      </div>

    </div>
  </div>
  <!-- 「异常」分组条目的「查看详情」弹窗（结构同 WarningLeftPanel.vue 的事件详情） -->
  <el-dialog v-model="detailVisible" plain class="anomaly-dialog" width="520px" :close-on-click-modal="false"
    title="事件详情" @closed="detailEvent = null">
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
          <span v-if="detailSigint.alt != null" class="dialog-country">高度：{{ Math.round(Number(detailSigint.alt))
          }}</span>
          <span v-if="detailSigint.speed != null" class="dialog-country">速度：{{ Math.round(Number(detailSigint.speed))
          }}kt</span>
          <span v-if="detailSigint.heading != null" class="dialog-country">航向：{{
            Math.round(Number(detailSigint.heading))
          }}°</span>
        </div>
        <div v-else class="dialog-meta">
          <span class="dialog-date">无 sigint_latest 最新快照（目标可能已离开监测范围）</span>
        </div>
        <div v-if="detailTrajectoryPoints.length" class="dialog-meta">
          <span class="dialog-country">轨迹点数：{{ detailTrajectoryPoints.length }}</span>
          <span v-if="detailEvidence?.distanceKm != null" class="dialog-country">距警戒区：{{
            Number(detailEvidence.distanceKm).toFixed(0) }}km</span>
          <span v-if="detailEvidence?.deviationScore != null" class="dialog-country">偏离度：{{
            detailEvidence.deviationScore
          }}</span>
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

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";
import { ElMessage } from "element-plus";
import {
  confirmAnomaly,
  confirmAnomalies,
  rejectAnomaly,
  getAnomalyById,
  analyzeAnomalies,
} from "@/api/anomalies";
import type { AnomalyEvent } from "@/api/anomalies";
import type { WarningMarker, WarningItem } from "@/types/home";

const homeStore = useHomeStore();
const router = useRouter();

/** 顶部分组 Tab 键 */
type AnomalyTabKey = "pending" | "confirmed" | "analysis" | "history";

/** 异常详情里文章 asset_data 快照字段 */
interface ArticleAssetSnapshot {
  title?: string;
  content?: string;
  summary?: string;
  source?: string;
  author?: string;
  country?: string;
}

/** 轨迹类异常的 evidence_json 摘要字段 */
interface TrajectoryEvidenceFields {
  distanceKm?: number | string;
  deviationScore?: number | string;
}

// ==================== 异常征候左栏 ====================
// 数据源与右侧面板 data-mark="异常列表" 完全一致：homeStore.warningMarkers

// 历史判定：createdAt 距今超过 1 周（7 天）。基准时间每 60s 刷新一次，
// 保证页面长时间停留时条目能按时"过期"滑入历史。
const HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const nowTs = ref(Date.now());
let anomalyClock: ReturnType<typeof setInterval> | null = null;

const parseTs = (value: string | null | undefined) => {
  if (!value) return NaN;
  const text = String(value).trim();
  const ts = Date.parse(text.replace(" ", "T")); // 兼容 "2026-10-28 10:00:00"
  return Number.isNaN(ts) ? Date.parse(text) : ts;
};

const isHistoryItem = (marker: WarningMarker) => {
  const ts = parseTs(marker.createdAt);
  return !Number.isNaN(ts) && nowTs.value - ts > HISTORY_WINDOW_MS;
};

// 四个分组互斥：超过 1 周的先归入「历史」，其余按 status 归入 待研判 / 异常 / 分析栏
const anomalyBuckets = computed(() => {
  const buckets: Record<AnomalyTabKey, WarningMarker[]> = {
    pending: [],
    confirmed: [],
    analysis: [],
    history: [],
  };
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

const anomalyTabs = computed(
  (): Array<{ key: AnomalyTabKey; label: string; count: number }> => [
    { key: "pending", label: "待研判", count: anomalyBuckets.value.pending.length },
    { key: "confirmed", label: "异常", count: anomalyBuckets.value.confirmed.length },
    { key: "analysis", label: "分析栏", count: analysisItems.value.length },
    { key: "history", label: "历史", count: anomalyBuckets.value.history.length },
  ],
);

const activeAnomalyTab = ref<AnomalyTabKey>("pending");
const filteredAnomalies = computed(
  () => anomalyBuckets.value[activeAnomalyTab.value] ?? [],
);

const statusText = (status: string | null | undefined) => {
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

const statusClass = (status: string | null | undefined) =>
  `is-${String(status || "POTENTIAL").toLowerCase()}`;

// ==================== 待研判条目的确认 / 排除 ====================
// 勾选只在「待研判」分组内有效；切换分组时清空，避免其它分组里残留隐藏的选中项
const selectedIds = ref<string[]>([]);
const pendingAction = ref(false);

const clearSelection = () => {
  selectedIds.value = [];
};

const applyStatus = async (
  ids: string[],
  handler: (id: string) => Promise<unknown>,
  actionText: string,
) => {
  if (pendingAction.value || ids.length === 0) return;
  pendingAction.value = true;
  try {
    const results = await Promise.allSettled(ids.map((id) => handler(id)));
    const failed = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
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

const confirmOne = (item: { id: string }) =>
  applyStatus([item.id], (id) => confirmAnomaly(id), "确认");

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
// 三个按钮的逻辑照 AnomalySignsRightPanel 的深度分析栏：进入云脑深度分析（带 ids 跳转）、
// 批量移除（两段式：先进入选择态，再确认）、清空分析栏。
// 列表数据来自接口 status=ANALYSIS 的事件；移除/清空 = 调 /anomalies/confirm 把状态改回已确认，
// 接口成功后本地乐观置为 CONFIRMED（条目随即离开分析栏、回到「异常」分组）再拉一次接口对齐。
const analysisSelecting = ref(false);
const analysisSelectedIds = ref<string[]>([]);
// 分析栏/异常分组的请求互斥标记（避免连点重复提交）
const analysisAction = ref(false);

const cancelAnalysisSelection = () => {
  analysisSelecting.value = false;
  analysisSelectedIds.value = [];
};

// 移出分析栏：批量确认后状态变 CONFIRMED
const submitAnalysisRemoval = async (
  ids: string[],
  successText: string,
  failText: string,
) => {
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
const formatItemTime = (item: WarningMarker) => {
  const ts = parseTs(item.createdAt);
  if (!Number.isNaN(ts)) {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return item.date || "";
};

// ==================== 「异常」分组：与 WarningLeftPanel 的异常列表同口径 ====================
// 参考 WarningLeftPanel.vue 中 data-mark="异常列表" 的映射规则：
// 威胁度优先取 threatLevel（纯数字才认，否则退回 score），等级 > 85 记为高危（琥珀色条），
// 异常度取 deviationScore，区域取接口 location（Map.vue 映射到了 marker.description）。
const ASSET_TYPE_LABELS: Record<string, string> = {
  article: "开源情报",
  aircraft: "飞机轨迹",
  vessel: "舰船轨迹",
  satellite: "卫星轨迹",
};
const assetTypeLabel = (asset: string | null | undefined) =>
  (asset && ASSET_TYPE_LABELS[asset]) || "其他";

const formatScore = (value: number) =>
  (Number.isInteger(value) ? String(value) : value.toFixed(1));

const threatDisplay = (marker: WarningMarker) => {
  const raw = String(marker.threatLevel ?? "").trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return formatScore(Number(raw));
  return formatScore(Number(marker.score) || 0);
};

const durationSince = (value: string | null | undefined) => {
  const ts = parseTs(value);
  if (Number.isNaN(ts)) return "未知";
  const days = Math.floor((nowTs.value - ts) / 86400000);
  return days >= 1 ? `${days}天` : "不足1天";
};

const toWarningItem = (marker: WarningMarker): WarningItem => {
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
const analyzeBusyIds = ref<string[]>([]);

const markLocalAnalyzing = (ids: string[]) => {
  homeStore.warningMarkers.forEach((marker) => {
    if (ids.includes(marker.id)) {
      marker.status = "ANALYSIS";
      marker.isAnalyzed = true;
    }
  });
};

const submitAnalyze = async (
  ids: string[],
  items: WarningItem[] | null | undefined,
  successText: string,
  failText: string,
) => {
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

const toggleAnalysisStatus = async (item: WarningItem) => {
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
const detailEvent = ref<AnomalyEvent | null>(null);

const openAnomalyDetail = async (item: WarningItem) => {
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

const parseJsonField = (value: unknown) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as unknown;
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
  const snap = parseJsonField(ev.assetData) as ArticleAssetSnapshot | null;
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

const detailEvidence = computed((): TrajectoryEvidenceFields | null => {
  const d = parseJsonField(detailEvent.value?.evidenceJson);
  return d && typeof d === "object" && !Array.isArray(d)
    ? (d as TrajectoryEvidenceFields)
    : null;
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

const formatCoord = (lat: number | string | null | undefined, lng: number | string | null | undefined) =>
  lat != null && lng != null ? `(${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})` : "--";

const formatEventTime = (value: string | null | undefined) => {
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
</script>

<style lang="scss" scoped>
/* 配色与态势左栏一致 */
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

  &.anomaly-item--pending {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 6px 9px 8px;
  }
}

.anomaly-item-main {
  flex: 1;
  min-width: 0;
}

.anomaly-item-select {
  flex-shrink: 0;
  align-self: center;
}

.anomaly-item-tags {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
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

  /* 待研判列表：紧挨状态 tag 后的可点「确认」 */
  &.is-confirm-tag {
    margin: 0;
    padding: 1px 8px;
    font: inherit;
    font-size: 10.5px;
    font-weight: 600;
    line-height: 1.5;
    color: $accent-text;
    background: rgba($accent, 0.14);
    border: 1px solid rgba($accent, 0.45);
    border-radius: $radius-sm;
    cursor: pointer;
    transition: background $ease, border-color $ease, color $ease;

    &:hover:not(:disabled) {
      background: rgba($accent, 0.24);
      border-color: rgba($accent, 0.65);
    }

    &:disabled {
      opacity: 0.55;
      cursor: default;
    }
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

/* 分析栏条目：查看详情 + 批量移除勾选 */
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

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: $text;
}

.dialog-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 12px;
  color: $text-2;
}

.dialog-body {
  font-size: 13px;
  line-height: 1.55;
  color: #cbd5e1;
  white-space: pre-wrap;
}

.dialog-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialog-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: $accent-text;
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
