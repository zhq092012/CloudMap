<template>
  <div
    class="w-90 bg-[#111827]/95 border border-[#2d3a4d] rounded p-2.5 flex flex-col h-[calc(100%-24px)] min-h-0 shadow-xl select-none">
    <div class="text-base font-bold text-[#e5e7eb] mb-2.5 shrink-0 flex items-center gap-2">
      <span class="w-1 h-3.5 rounded-sm bg-[#3b82f6]"></span>异常列表
    </div>

    <div class="bg-[#1a2332] p-2 rounded border border-[#2d3a4d] text-[12px] space-y-2 mb-3 shrink-0">
      <div class="flex items-start gap-2">
        <span class="text-[#9ca3af] w-14 shrink-0 h-5 flex items-center">区域</span>
        <div class="flex gap-1 flex-wrap flex-1">
          <span v-for="opt in regionOptions" :key="opt" @click="activeRegion = opt" :class="[
            'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
            activeRegion === opt
              ? 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border-[rgba(59,130,246,0.45)]'
              : 'bg-[#111827] text-[#9ca3af] border-transparent hover:bg-[#1b2637]',
          ]">
            {{ opt }}
          </span>
          <!-- <span class="text-[#6b7280] cursor-pointer scale-90">···</span> -->
        </div>
      </div>

      <div class="flex items-start gap-2">
        <span class="text-[#9ca3af] w-14 shrink-0 h-5 flex items-center">时间</span>
        <div class="flex gap-1 flex-wrap flex-1">
          <span v-for="opt in timeOptions" :key="opt" @click="activeTime = opt" :class="[
            'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
            activeTime === opt
              ? 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border-[rgba(59,130,246,0.45)]'
              : 'bg-[#111827] text-[#9ca3af] border-transparent hover:bg-[#1b2637]',
          ]">
            {{ opt }}
          </span>
        </div>
      </div>

      <div class="flex items-start gap-2">
        <span class="text-[#9ca3af] w-14 shrink-0 h-5 flex items-center">异常类型</span>
        <div class="flex gap-1 flex-wrap flex-1">
          <span v-for="opt in typeOptions" :key="opt" @click="activeType = opt" :class="[
            'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
            activeType === opt
              ? 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border-[rgba(59,130,246,0.45)]'
              : 'bg-[#111827] text-[#9ca3af] border-transparent hover:bg-[#1b2637]',
          ]">
            {{ opt }}
          </span>
        </div>
      </div>

      <div class="space-y-1 pt-1 border-t border-[#2d3a4d]">
        <div class="flex items-center gap-2">
          <span class="text-[#9ca3af] w-14 shrink-0">威胁度</span>
          <div class="flex-1 flex items-center gap-2">
            <el-slider v-model="sliderThreat" :min="0" :max="100" size="small" class="custom-slider-amber flex-1" />
            <span
              class="text-[#f59e0b] font-mono w-8 text-right bg-[#111827] px-1 rounded border border-[#2d3a4d]">{{
                sliderThreat }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-1">
          <span class="text-[#9ca3af] w-14 shrink-0">威胁置信</span>
          <div class="flex-1 flex items-center gap-2">
            <el-slider v-model="sliderConfidence" :min="0" :max="100" size="small"
              class="custom-slider-emerald flex-1" />
            <span
              class="text-[#10b981] font-mono w-8 text-right bg-[#111827] px-1 rounded border border-[#2d3a4d]">{{
                sliderConfidence }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1.5">
          <span class="text-[#9ca3af] w-14 shrink-0">深度分析</span>
          <div class="flex gap-1 flex-1">
            <span v-for="opt in analysisOptions" :key="opt" @click="activeAnalysis = opt" :class="[
              'px-1.5 py-0.5 rounded-sm cursor-pointer scale-90 origin-left transition-colors border',
              activeAnalysis === opt
                ? 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border-[rgba(59,130,246,0.45)]'
                : 'bg-[#111827] text-[#9ca3af] border-transparent hover:bg-[#1b2637]',
            ]">
              {{ opt }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <span class="text-[#9ca3af] w-14 shrink-0">排序方式</span>
          <div class="flex-1 custom-select-container">
            <el-select v-model="sortBy" placeholder="请选择" size="small" effect="dark" class="w-full">
              <el-option label="威胁度降序" value="threat-desc" />
              <el-option label="威胁度升序" value="threat-asc" />
              <el-option label="时间降序" value="time-desc" />
            </el-select>
          </div>
        </div>
      </div>
    </div>

    <button
      class="w-full py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs rounded border border-transparent font-medium mb-3 shrink-0"
      @click="doSearch">
      异常搜索
    </button>

    <div class="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar" data-mark="异常列表">
      <div v-for="(item, idx) in leftListData" :key="idx" @click="toggleExpand(idx)" :class="[
        'p-2 bg-[#1a2332] border rounded transition-all cursor-pointer relative',
        expandedIndex === idx
          ? 'border-[rgba(59,130,246,0.45)] shadow-lg bg-[#253141]'
          : 'border-[#2d3a4d] hover:border-[#3d4d64]',
      ]">
        <div :class="[
          'absolute left-0 top-0 bottom-0 w-1 rounded-l',
          item.level === 'high' ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]',
        ]"></div>

        <div class="pl-1.5">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-[#e5e7eb] flex items-center gap-1">
              <span :class="item.level === 'high' ? 'text-[#f59e0b]' : 'text-[#93c5fd]'
                ">
                {{
                  expandedIndex === idx && item.level === "high" ? "⚡" : "◆"
                }}
              </span>
              {{ item.title }}
            </span>
            <span v-if="item.count && expandedIndex !== idx"
              class="text-[12px] bg-[rgba(245,158,11,0.14)] text-[#fbbf24] border border-[rgba(245,158,11,0.3)] px-1 rounded-sm">
              {{ item.count }}
            </span>
          </div>

          <div :class="[
            'flex items-center gap-4 gap-y-0.5 text-[12px] text-[#9ca3af] p-1 rounded',
            expandedIndex === idx
              ? 'bg-[#111827] my-2 border border-[#2d3a4d]'
              : '',
          ]">
            <div>
              综合威胁度
              <span class="text-[#f59e0b] font-mono font-bold">{{
                item.threat
              }}</span>
            </div>
            <div>
              综合异常度
              <span class="text-[#93c5fd] font-mono font-bold">{{
                item.anomaly
              }}</span>
              <span class="text-[#9ca3af]">&nbsp;(置信度 {{ item.anomalyConf }})</span>
            </div>
          </div>

          <div v-if="expandedIndex === idx" class="space-y-2 mt-2 pt-1 border-t border-[#2d3a4d] text-[12px]">
            <div class="space-y-1 text-[#9ca3af]">
              <div class="flex items-center">
                <span class="w-16 shrink-0 text-[#6b7280]">异常类型</span>
                <span class="text-[#e5e7eb]">{{ assetTypeLabel(item.assetType) }}</span>
              </div>
              <div class="flex items-center">
                <span class="w-16 shrink-0 text-[#6b7280]">区域</span>
                <span class="text-[#e5e7eb]">{{ item.region }}</span>
              </div>
            </div>

            <div class="text-[12px] text-[#9ca3af] font-mono pt-0.5">
              {{ item.discoverTime }} 发现 | 已持续{{ item.duration }}
            </div>

            <div class="flex gap-2 pt-1">
              <button @click.stop="handleViewDetails(item)"
                class="flex-1 py-1 bg-[#111827] hover:bg-[#1b2637] text-[#cbd5e1] text-[12px] rounded border border-[#2d3a4d] transition-colors">
                查看详情
              </button>
              <button @click.stop="toggleAnalysisStatus(item)" :class="[
                'flex-1 py-1 text-[12px] rounded border transition-colors',
                item.isAnalyzed
                  ? 'border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.12)] text-[#10b981] hover:bg-[rgba(16,185,129,0.2)]'
                  : 'border-[rgba(59,130,246,0.45)] bg-[rgba(59,130,246,0.12)] text-[#93c5fd] hover:bg-[rgba(59,130,246,0.2)]',
              ]">
                {{ item.isAnalyzed ? "已加入深度分析" : "加入深度分析" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="detailVisible" plain width="520px" :close-on-click-modal="false" title="事件详情"
    @closed="detailEvent = null">
    <div v-loading="detailLoading" class="dialog-content">
      <div class="dialog-title">{{ detailEvent?.name || "暂无标题" }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { useHomeStore } from "@/store/modules/homeStore";
import type { WarningItem } from "@/types/home";
import { ref, computed, onMounted } from "vue";
import { searchAnomalies, getAnomalyById } from "@/api/anomalies";
import type { AnomalyEvent } from "@/api/anomalies";
const homeStore = useHomeStore();

const regionOptions = ["全部", "霍尔木兹", "阿曼湾", "红海", "伊朗"];
const timeOptions = ["全部", "6小时内", "12小时内", "24小时内"];
const typeOptions = ["全部", "开源情报", "飞机轨迹", "舰船轨迹", "卫星轨迹"];
const analysisOptions = ["全部", "已加入", "未加入"];

/** 异常类型选项 → anomaly_event.asset_type */
const typeToAssetType: Record<string, string> = {
  开源情报: "article",
  飞机轨迹: "aircraft",
  舰船轨迹: "vessel",
  卫星轨迹: "satellite",
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  article: "开源情报",
  aircraft: "飞机轨迹",
  vessel: "舰船轨迹",
  satellite: "卫星轨迹",
};
const assetTypeLabel = (asset?: string): string =>
  (asset && ASSET_TYPE_LABELS[asset]) || "其他";

const activeRegion = ref("全部");
const activeTime = ref("全部");
const activeType = ref("全部");
const activeAnalysis = ref("全部");

const sliderThreat = ref(50);
const sliderConfidence = ref(50);
const sortBy = ref("threat-desc");

const expandedIndex = ref<number | null>(null);
const searchResults = ref<AnomalyEvent[]>([]);

const toggleExpand = (idx: number) => {
  expandedIndex.value = expandedIndex.value === idx ? null : idx;
};

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailEvent = ref<AnomalyEvent | null>(null);

const parseJsonField = <T>(v?: string | Record<string, any> | null): T | null => {
  if (!v) return null;
  if (typeof v === "object") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
};

const detailIsTrajectory = computed(() =>
  ["aircraft", "vessel", "satellite"].includes(detailEvent.value?.assetType || ""),
);

/** 开源情报类：优先取 articles 表实时数据（缓存文章列表按 assetId 中的文章 ID 匹配），回退 anomaly_event.asset_data 快照 */
const detailArticle = computed(() => {
  const ev = detailEvent.value as any;
  if (!ev || ev.assetType !== "article") return null;
  if (ev.assetId) {
    const live = homeStore.articles.find(
      (a: any) => a != null && String(a.id) === String(ev.assetId),
    ) as any;
    if (live) return { title: live.title ?? "", content: live.content ?? "", summary: live.summary ?? "", source: live.source ?? "", author: live.author ?? "", country: live.country ?? "", url: live.url ?? "", publishedAt: live.publishedAt ?? "" };
  }
  const snap = parseJsonField<Record<string, any>>(ev.assetData);
  if (snap && (snap.title || snap.content)) {
    return { title: snap.title ?? "", content: snap.content ?? "", summary: snap.summary ?? "", source: snap.source ?? "", author: snap.author ?? "", country: snap.country ?? "", url: snap.url ?? "", publishedAt: snap.publishedAt ?? "" };
  }
  return null;
});

const detailSigint = computed(() => {
  const s = detailEvent.value?.sigintData;
  return s && typeof s === "object" && !Array.isArray(s) ? s : null;
});

const detailTrajectoryPoints = computed(() => {
  const d = parseJsonField<Record<string, any>[]>(detailEvent.value?.assetData);
  return Array.isArray(d) ? d : [];
});

const detailEvidence = computed(() => {
  const d = parseJsonField<Record<string, any>>(detailEvent.value?.evidenceJson);
  return d && typeof d === "object" && !Array.isArray(d) ? d : null;
});

const detailTrajectorySummary = computed(() => {
  const pts = detailTrajectoryPoints.value;
  if (!pts.length) return "";
  const first = pts[0] || {};
  if (pts.length === 1) return `轨迹点 ${formatCoord(first.lat, first.lon)}。`;
  const last = pts[pts.length - 1] || {};
  const times = pts
    .map((p) => (p ? p.timestamp : undefined))
    .filter((t): t is string => Boolean(t));
  let text = `起点 ${formatCoord(first.lat, first.lon)} → 终点 ${formatCoord(last.lat, last.lon)}，共 ${pts.length} 个轨迹点`;
  if (times.length) text += `，时间范围 ${times[0]} ~ ${times[times.length - 1]}`;
  return text + "。";
});

const formatCoord = (lat?: number | null, lng?: number | null): string =>
  lat != null && lng != null ? `(${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})` : "--";

const formatEventTime = (v?: string): string => {
  if (!v) return "未知";
  // 与列表 discoverTime 同源：直接解析接口原始字符串，不做本地时区转换，避免两端相差 8 小时
  const norm = formatMarkerDate(v);
  const m = norm.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : norm;
};

const handleViewDetails = async (item: WarningItem) => {
  detailVisible.value = true;
  detailLoading.value = true;
  detailEvent.value =
    searchResults.value.find((e) => (e.anomalyId || `ANM_${e.rowId}`) === item.id) ?? null;
  try {
    detailEvent.value = await getAnomalyById(item.id);
  } catch (error) {
    console.error("[WarningLeftPanel] 获取异常详情失败:", error);
    if (!detailEvent.value) detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
};

const toggleAnalysisStatus = (item: WarningItem) => {
  homeStore.addToAnalysis(item);
};

const regionOf = (label: string): string | undefined =>
  label === "全部" ? undefined : label;

const hoursOf = (label: string): number | undefined => {
  if (label === "全部") return undefined;
  return Number(label.replace("小时内", ""));
};

const doSearch = async () => {
  const params = {
    region: regionOf(activeRegion.value),
    hours: hoursOf(activeTime.value),
    assetType: activeType.value === "全部" ? undefined : typeToAssetType[activeType.value],
    minThreat: sliderThreat.value,
    minConfidence: sliderConfidence.value,
    sort: sortBy.value,
    limit: 100,
  };
  console.log("[WarningLeftPanel] 异常搜索点击, 参数:", params);
  try {
    const results = await searchAnomalies(params);
    console.log("[WarningLeftPanel] 异常搜索成功, 返回", results?.length ?? 0, "条");
    searchResults.value = results;
  } catch (error) {
    console.error("[WarningLeftPanel] 异常搜索失败:", error);
    searchResults.value = [];
  }
};

onMounted(doSearch);

const formatScore = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const threatDisplay = (marker: { threatLevel?: string | number; score?: number }): string => {
  const raw = String(marker.threatLevel ?? "").trim();
  if (/^\d+(\.\d+)?$/.test(raw)) return formatScore(Number(raw));
  return formatScore(Number(marker.score) || 0);
};

const formatMarkerDate = (d?: string): string => {
  if (!d) return "";
  const norm = /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
  return Number.isNaN(new Date(norm).getTime()) ? "" : norm;
};

const durationSince = (d?: string): string => {
  const norm = formatMarkerDate(d);
  const t = new Date(norm).getTime();
  if (!norm || Number.isNaN(t)) return "未知";
  const days = Math.floor((Date.now() - t) / 86400000);
  return days >= 1 ? `${days}天` : "不足1天";
};

const isAnalyzed = (id: string): boolean =>
  homeStore.warningMarkers.some((m) => m.id === id && m.isAnalyzed);

const toWarningItem = (item: AnomalyEvent): WarningItem => {
  const id = item.anomalyId || `ANM_${item.rowId}`;
  const anomalyScore = Number(item.deviationScore) || 0;
  const confidence = Math.round(Number(item.confidence) || 0);
  const eventTime = item.eventTime || item.createdAt || "";
  const threatStr = threatDisplay({ threatLevel: item.threatLevel, score: item.deviationScore });
  return {
    id,
    itemId: item.rowId,
    title: item.name || item.source || "未知警告",
    count: item.count || 0,
    level: Number(threatStr) > 85 ? "high" : "low",
    threat: threatStr,
    threatConf: String(confidence),
    anomaly: formatScore(anomalyScore),
    anomalyConf: String(confidence),
    type: item.type,
    assetType: item.assetType,
    region: item.location || item.source || "未知区域",
    discoverTime: formatMarkerDate(eventTime),
    duration: durationSince(eventTime),
    isAnalyzed: isAnalyzed(id),
  };
};

const leftListData = computed(() => {
  return searchResults.value
    .filter((item) => {
      const analyzed = isAnalyzed(item.anomalyId || `ANM_${item.rowId}`);
      if (activeAnalysis.value === "已加入") return analyzed;
      if (activeAnalysis.value === "未加入") return !analyzed;
      return true;
    })
    .map(toWarningItem);
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #3d4d64;
}

/* 橙色滑块自定义 */
:deep(.custom-slider-amber .el-slider__bar) {
  background-color: #f59e0b;
}

:deep(.custom-slider-amber .el-slider__button) {
  border-color: #111827;
  background-color: #f59e0b;
  width: 12px;
  height: 12px;
}

/* 绿色滑块自定义 */
:deep(.custom-slider-emerald .el-slider__bar) {
  background-color: #10b981;
}

:deep(.custom-slider-emerald .el-slider__button) {
  border-color: #111827;
  background-color: #10b981;
  width: 12px;
  height: 12px;
}

/* 公共滑块轨道样式修改 */
:deep(.el-slider__runway) {
  background-color: #253141;
  height: 6px !important;
  border-radius: 3px;
}

:deep(.el-slider__bar) {
  height: 6px !important;
  border-radius: 3px;
}

:deep(.el-slider__button-wrapper) {
  top: -13px;
}

/* 暗色系下拉框样式定制（兼容 Element Plus） */
.custom-select-container :deep(.el-select__wrapper) {
  background-color: #111827 !important;
  box-shadow: 0 0 0 1px #2d3a4d inset !important;
}

.custom-select-container :deep(.el-select__placeholder) {
  color: #9ca3af !important;
}

.custom-select-container :deep(.el-select__selected-item) {
  color: #e5e7eb !important;
  font-size: 12px;
}

/* 事件详情弹窗 */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.dialog-title {
  color: #e5e7eb;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.dialog-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 12px;
  color: #9ca3af;
  font-size: 12px;
}

.dialog-country {
  color: #cbd5e1;
}

.dialog-date {
  color: #9ca3af;
}

.dialog-body {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #e5e7eb;
  font-size: 13px;
  line-height: 1.65;
}

.dialog-section {
  padding-top: 10px;
  border-top: 1px solid #253141;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialog-subtitle {
  color: #e5e7eb;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 14px;
}

.dialog-close-btn {
  min-width: 120px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}

.dialog-close-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}
</style>
