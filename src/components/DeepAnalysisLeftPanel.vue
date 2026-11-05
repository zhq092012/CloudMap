<template>
  <div class="da-panel da-panel--left w-95 h-full shrink-0 select-none">
    <div class="flex items-center justify-between gap-2 mb-3 shrink-0">
      <h2 class="da-panel-title">深度分析栏</h2>
      <button type="button" class="da-btn da-btn--ghost da-btn--sm" :disabled="loading" @click="loadWorkflowList">
        {{ loading ? "刷新中" : "刷新" }}
      </button>
    </div>

    <div v-if="analysisStore.workflowTitle"
      class="shrink-0 mb-2.5 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-panel)]">
      <div class="text-[12px] text-[var(--text-muted)] truncate" :title="analysisStore.workflowTitle">
        当前流程：{{ analysisStore.workflowTitle }}
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar" data-mark="深度分析栏列表">
      <!-- 异常视图：从「异常证候」页面跳转进入（URL 携带 from=homepage&ids）：
           展示所选异常事件，「开始分析」新建工作流对所选异常开始深度分析 -->
      <template v-if="showAnomalyItems">
        <div v-for="(item, idx) in anomalyItems" :key="idx"
          class="da-card da-card--sunken hover:border-[var(--border-strong)] transition-colors">
          <div class="flex flex-col gap-2">
            <div class="text-[12.5px] font-semibold text-[var(--text)] flex items-start gap-1.5 leading-snug"
              :title="item.title">
              <span :class="item.isHexagon ? 'text-[var(--orange)] font-mono text-[13px]' : 'text-[var(--orange)] text-[12px]'">
                {{ item.isHexagon ? "⬢" : "◆" }}
              </span>
              <span class="flex-1">{{ item.title }}</span>
            </div>

            <div class="flex items-center gap-4 text-[12px] text-[var(--text-muted)]">
              <div>
                {{ item.isHexagon ? "综合威胁度" : "威胁度" }}
                <span class="text-[var(--orange)] font-mono font-bold ml-1">{{ item.threat }}</span>
              </div>

              <div>
                {{ item.isHexagon ? "综合异常度" : "异常度" }}
                <span class="text-[var(--text-2)] font-mono font-bold ml-1">{{ item.anomaly }}</span>
                <span class="text-[var(--text-faint)] font-mono ml-0.5">&nbsp;(置信度 {{ item.anomalyConf }})</span>
              </div>
            </div>

            <!-- Start Analysis Action footer：逻辑沿用深度分析栏此前的实现 -->
            <div class="flex justify-between items-center pt-2 border-t border-[var(--border)] shrink-0">
              <span class="text-[12px] text-[var(--text-faint)]">
                状态: {{ isAlreadyLoaded(item) ? "分析中" : "就绪" }}
              </span>
              <button v-if="!isAlreadyLoaded(item) && !isAnalyzingItem(item)" type="button"
                class="da-btn da-btn--primary da-btn--sm shrink-0" @click.stop="startAnalysis(item)">
                开始分析
              </button>
              <button v-else-if="isAnalyzingItem(item)" type="button" disabled
                class="da-btn da-btn--sm shrink-0">
                ⏳ 分析中
              </button>
              <span v-else-if="isAlreadyLoaded(item) && isInCurrentFlow(item)"
                class="text-[12px] text-[var(--green)] font-semibold flex items-center gap-1 shrink-0">
                ✓ 已载入图谱
              </span>
              <button v-else-if="analysisStore.workflowId" type="button" :disabled="isJoiningItem(item)"
                class="da-btn da-btn--warn da-btn--sm shrink-0" @click.stop="joinToCurrentFlow(item)">
                {{ isJoiningItem(item) ? "⏳ 载入中" : "加入当前分析" }}
              </button>
              <button v-else type="button" :disabled="isJoiningItem(item)"
                class="da-btn da-btn--sm shrink-0" @click.stop="loadHistoryAnomaly(item)">
                {{ isJoiningItem(item) ? "⏳ 载入中" : "载入历史分析" }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 工作流视图：直接点顶部「深度分析」tab 进入（或异常视图无所选异常时兜底）：
           展示未完成的工作流实例列表（最近更新的在前，即最新 workflow 实例） -->
      <template v-else>
        <!-- 数据源：GET /api/v1/agent-flows/workflows/incomplete（未完成工作流列表） -->
        <div v-if="loading && workflowItems.length === 0"
          class="da-card da-card--sunken text-[12px] text-[var(--text-muted)]">
          正在加载未完成的分析流程…
        </div>
        <div v-else-if="workflowItems.length === 0"
          class="da-card da-card--sunken text-[12px] text-[var(--text-muted)] leading-relaxed">
          暂无未完成的分析流程
        </div>

        <div v-for="item in workflowItems" :key="item.workflowId"
          class="da-card da-card--sunken hover:border-[var(--border-strong)] transition-colors"
          :class="{ 'da-card--accent': isCurrentWorkflow(item) }">
          <div class="flex flex-col gap-2">
            <div class="text-[12.5px] font-semibold text-[var(--text)] flex items-start gap-1.5 leading-snug"
              :title="`${item.title || '未命名流程'}（${item.workflowId}）`">
              <span class="text-[var(--orange)] text-[12px]">◆</span>
              <span class="flex-1">{{ item.title || "未命名分析流程" }}</span>
              <span v-if="isCurrentWorkflow(item)" class="da-chip shrink-0">画布中</span>
            </div>

            <div class="flex items-center gap-4 text-[12px] text-[var(--text-muted)]">
              <div>
                阶段
                <span class="text-[var(--orange)] font-mono font-bold ml-1">{{ phaseText(item) }}</span>
              </div>

              <div>
                关联异常
                <span class="text-[var(--text-2)] font-mono font-bold ml-1">{{ anomalyCount(item) }}</span>
                <span class="text-[var(--text-faint)] font-mono ml-0.5">项</span>
              </div>
            </div>

            <!-- 载入到画布：调 analysisStore.loadWorkflow（按该工作流自身的节点类型完整还原链路） -->
            <div class="flex justify-between items-center pt-2 border-t border-[var(--border)] shrink-0">
              <span class="text-[12px] text-[var(--text-faint)] truncate">
                状态: {{ statusText(item.status) }} · {{ formatTime(item.updatedAt) }}
              </span>
              <button v-if="!isCurrentWorkflow(item)" type="button" :disabled="!!loadingWorkflowId"
                class="da-btn da-btn--primary da-btn--sm shrink-0" @click.stop="loadWorkflowItem(item)">
                {{ loadingWorkflowId === item.workflowId ? "⏳ 载入中" : "载入分析" }}
              </button>
              <span v-else class="text-[12px] text-[var(--green)] font-semibold flex items-center gap-1 shrink-0">
                ✓ 已载入
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { useHomeStore } from "@/store/modules/homeStore";
import { useAgentStore } from "@/store/modules/agentStore";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { confirmAnomaly } from "@/api/anomalies";
import {
  listIncompleteWorkflows,
  listDeepAnalysisNodesByType,
  addAnomaliesToWorkflow,
} from "@/api/deep-analysis";
import type { AgentFlow } from "@/api/deep-analysis";
import { ElMessage } from "element-plus";

const analysisStore = useAnalysisStore();
const homeStore = useHomeStore();
const agentStore = useAgentStore();
const route = useRoute();

/* 面板展示模式（随路由响应式切换）：
   - 从「异常证候」页面跳转进入（URL 携带 from=homepage&ids 且存在所选异常）：
     展示所选异常事件，「开始分析」新建工作流对所选异常开始深度分析；
   - 直接点击「深度分析」tab 进入（无跳转参数）：展示未完成工作流实例列表
     （最近更新的在前，即最新 workflow 实例）。
   异常视图无所选异常时兜底展示工作流列表，避免空态死角。 */
const showAnomalyItems = computed(
  () =>
    route.query.from === "homepage" &&
    !!route.query.ids &&
    homeStore.analysisList.length > 0
);

/* ============ 异常列表（所选异常，数据源 homeStore.analysisList） ============ */
const analyzingAnomalyIds = ref<Set<string>>(new Set());
const joiningAnomalyIds = ref<Set<string>>(new Set());

const anomalyItems = computed(() =>
  homeStore.analysisList.map((item: any) => ({
    id: item.id,
    itemId: item.itemId,
    title: item.title,
    type: item.type,
    level: item.level,
    region: item.region,
    threat: item.threat,
    threatConf: item.threatConf,
    anomaly: item.anomaly,
    anomalyConf: item.anomalyConf,
    isHexagon: item.isAnalyzed,
    count: item.count,
    discoverTime: item.discoverTime,
    duration: item.duration,
    isAnalyzed: item.isAnalyzed,
  }))
);

const isAlreadyLoaded = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return analysisStore.coveredAnomalyIds.includes(itemId);
};
const isAnalyzingItem = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return analyzingAnomalyIds.value.has(itemId);
};
const isInCurrentFlow = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return !!itemId && analysisStore.anomalyIds.includes(itemId);
};
const isJoiningItem = (item: any) => {
  const itemId = item.anomalyId || item.id;
  return joiningAnomalyIds.value.has(itemId);
};

/* 「开始分析」：当前没有工作流 → analysisStore.startAnalysis 新建工作流并开始深度分析；
   已有工作流 → 把该异常增量并入当前工作流后继续意图分析 */
const startAnalysis = async (item: any) => {
  const anomalyId = item.anomalyId || item.id;
  if (!anomalyId) {
    ElMessage.warning("缺少异常事件ID，无法启动分析");
    return;
  }
  if (analysisStore.coveredAnomalyIds.includes(anomalyId)) {
    ElMessage.info("该异常已分析");
    return;
  }
  analyzingAnomalyIds.value.add(anomalyId);
  try {
    if (!analysisStore.workflowId) {
      agentStore.setCurrentTaskType("意图穷举");
      analysisStore.resetAnalysis();
      await analysisStore.startAnalysis(anomalyId);
    } else {
      const workflow = await addAnomaliesToWorkflow(
        analysisStore.workflowId as string,
        [anomalyId]
      );
      analysisStore.anomalyIds =
        workflow.anomalyIds || [...analysisStore.anomalyIds, anomalyId];
      analysisStore.anomalyId = anomalyId;
      if (workflow.title) analysisStore.workflowTitle = workflow.title;
      await confirmAnomaly(anomalyId);
      ElMessage.success("已添加异常到当前分析");

      analysisStore.currentPhase = 0;
      analysisStore.isAnalyzing = false;

      const originNodes = await listDeepAnalysisNodesByType(
        analysisStore.workflowId as string,
        "ORIGIN"
      );
      analysisStore.addNodeFromWorkflow(originNodes, "Origin");

      const originNodeIds = originNodes.map((n) => n.nodeId);
      await analysisStore.proceedToIntent(originNodeIds);
      await analysisStore.restoreChainFromDB();
    }

    if (!analysisStore.coveredAnomalyIds.includes(anomalyId)) {
      analysisStore.coveredAnomalyIds.push(anomalyId);
    }
  } finally {
    analyzingAnomalyIds.value.delete(anomalyId);
  }
};

/* 已覆盖异常「加入当前分析」——不调 LLM，仅并入工作流并追加展示已有链路 */
const joinToCurrentFlow = async (item: any) => {
  const anomalyId = item.anomalyId || item.id;
  if (!anomalyId || !analysisStore.workflowId || isJoiningItem(item)) return;
  joiningAnomalyIds.value.add(anomalyId);
  try {
    await analysisStore.joinAnomalyToCurrentFlow(anomalyId);
    ElMessage.success("已加入当前分析");
  } catch (e: any) {
    analysisStore.addLog(
      `加入当前分析失败 (${anomalyId}): ${e?.message || "未知错误"}`,
      "error"
    );
    ElMessage.error(`加入当前分析失败: ${e?.message}`);
  } finally {
    joiningAnomalyIds.value.delete(anomalyId);
  }
};

/* 已覆盖但无工作流的异常「载入历史分析」——仅画布展示，不创建/变更工作流 */
const loadHistoryAnomaly = async (item: any) => {
  const anomalyId = item.anomalyId || item.id;
  if (!anomalyId || isJoiningItem(item)) return;
  joiningAnomalyIds.value.add(anomalyId);
  try {
    await analysisStore.loadHistoryAnomaly(anomalyId);
  } catch (e: any) {
    analysisStore.addLog(
      `载入历史分析失败 (${anomalyId}): ${e?.message || "未知错误"}`,
      "error"
    );
    ElMessage.error(`载入历史分析失败: ${e?.message}`);
  } finally {
    joiningAnomalyIds.value.delete(anomalyId);
  }
};

/* ============ 工作流列表（数据源 GET /api/v1/agent-flows/workflows/incomplete） ============ */
const workflowItems = ref<AgentFlow[]>([]);
const loading = ref(false);
const loadingWorkflowId = ref("");

/* currentPhase 0~4 对应画布顶部的阶段名（与 DeepAnalysisMain 的展示口径一致） */
const PHASE_TEXT = ["ORIGIN", "INTENT", "BLUE_PLAN", "RED_PLAN", "EVALUATION"];

const STATUS_TEXT: Record<string, string> = {
  PENDING: "待开始",
  RUNNING: "分析中",
  WAITING_USER: "待确认",
  COMPLETED: "已完成",
  FAILED: "已失败",
};

const phaseText = (item: AgentFlow) => PHASE_TEXT[Number(item?.currentPhase) || 0] ?? "—";
const statusText = (status?: string) => {
  const key = String(status || "").toUpperCase();
  return STATUS_TEXT[key] ?? (key || "未知");
};
const anomalyCount = (item: AgentFlow) => (item?.anomalyIds || []).length;
const formatTime = (value?: string) => (value ? String(value).replace("T", " ").slice(0, 16) : "—");
const isCurrentWorkflow = (item: AgentFlow) =>
  !!item?.workflowId && item.workflowId === analysisStore.workflowId;

const timeOf = (value?: string) => {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(t) ? 0 : t;
};

const loadWorkflowList = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const list = await listIncompleteWorkflows();
    workflowItems.value = (list || [])
      .slice()
      .sort((a, b) => timeOf(b.updatedAt || b.createdAt) - timeOf(a.updatedAt || a.createdAt));
    // 同步到 store，其它位置复用同一份工作表
    analysisStore.workflowList = workflowItems.value;
  } catch (e: any) {
    ElMessage.error(`加载未完成分析流程失败：${e?.message || "未知错误"}`);
  } finally {
    loading.value = false;
  }
};

const loadWorkflowItem = async (item: AgentFlow) => {
  if (!item?.workflowId || loadingWorkflowId.value || isCurrentWorkflow(item)) return;
  loadingWorkflowId.value = item.workflowId;
  try {
    const ok = await analysisStore.loadWorkflow(item);
    if (ok) ElMessage.success(`已载入：${item.title || item.workflowId}`);
  } catch (e: any) {
    ElMessage.error(`载入分析流程失败：${e?.message || "未知错误"}`);
  } finally {
    loadingWorkflowId.value = "";
  }
};

/* 两种视图都预载工作流列表：异常视图兜底展示 / 工作流视图直接消费 */
onMounted(loadWorkflowList);
</script>

<style scoped>
/* 针对情报系统定制的窄轨道暗色暗色微型滚动条 */
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
  background: #475569;
}
</style>
