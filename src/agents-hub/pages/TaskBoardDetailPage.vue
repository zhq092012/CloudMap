<script setup lang="ts">
// ============================================================
// 智能任务看板 — 执行详情（执行信息 + 关联异常 + 步骤时间线）
// 步骤输入/输出 JSON 展开时懒加载（既有 /api/v1/steps/{stepId}）
// ============================================================
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import HubAuthGate from '../HubAuthGate.vue';
import {
  getFlowStep,
  getTaskBoardExecution,
  type TaskBoardExecutionDetail,
  type TaskBoardStepItem,
} from '@/api/task-board';
import {
  fmtDuration,
  fmtTime,
  phaseLabel,
  prettyJson,
  resultTypeLabel,
  statusBadge,
  stepTypeLabel,
} from './task-board-format';

const route = useRoute();
const router = useRouter();
const executionId = computed(() => String(route.params.executionId ?? ''));

const detail = ref<TaskBoardExecutionDetail | null>(null);
const notFound = ref(false);
const loading = ref(true);
const error = ref('');
const copied = ref(false);

let isUnmounted = false;
let loadSeq = 0;
async function load() {
  const seq = ++loadSeq;
  try {
    const data = await getTaskBoardExecution(executionId.value);
    if (isUnmounted || seq !== loadSeq) return;
    detail.value = data;
    notFound.value = false;
    error.value = '';
  } catch (e: unknown) {
    if (isUnmounted || seq !== loadSeq) return;
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      notFound.value = true;
    } else {
      error.value = e instanceof Error ? e.message : '加载失败';
    }
  } finally {
    if (!isUnmounted && seq === loadSeq) {
      loading.value = false;
    }
  }
}

onBeforeUnmount(() => {
  isUnmounted = true;
});

function goBack() {
  const state = window.history.state as { back?: string | null } | null;
  if (state && state.back) router.back();
  else router.push({ name: 'AgentHubTaskBoard' });
}

async function copyExecutionId() {
  try {
    await navigator.clipboard.writeText(executionId.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    /* 剪贴板不可用时忽略 */
  }
}

// ---------- 执行信息「针对实体」 ----------
interface TargetNode {
  nodeId: string;
  stepId: string;
  type: string;
  summary: string | null;
  sourceAnomalyName: string | null;
}
function targetEntityName(t: TargetNode): string {
  return t.type === 'ORIGIN' ? (t.sourceAnomalyName ?? t.nodeId) : (t.summary ?? t.nodeId);
}
function targetNodeTitle(t: TargetNode): string {
  return `${resultTypeLabel(t.type)}：${targetEntityName(t)}`;
}

// ---------- 步骤按源节点分组 ----------
interface StepGroup {
  key: string;
  label: string;
  anomaly: string | null;
  anomalyName: string | null;
  steps: TaskBoardStepItem[];
}
const groups = computed<StepGroup[]>(() => {
  const steps = detail.value?.steps ?? [];
  const map = new Map<string, TaskBoardStepItem[]>();
  for (const s of steps) {
    const key = s.parentStepId && s.parentStepId !== s.stepId ? s.parentStepId : '__root__';
    const arr = map.get(key);
    if (arr) arr.push(s);
    else map.set(key, [s]);
  }
  return [...map.entries()].map(([key, gs]) => ({
    key,
    label: key === '__root__' ? '直接步骤' : (gs[0]?.nodeId ?? key),
    anomaly: gs[0]?.sourceAnomalyId ?? null,
    anomalyName: gs.find((s) => s.sourceAnomalyName)?.sourceAnomalyName ?? null,
    steps: gs,
  }));
});

// ---------- 步骤展开（懒加载输入/输出） ----------
interface StepLookup {
  loading: boolean;
  error: string | null;
  input: string | null;
  output: string | null;
}
const expanded = ref<Record<string, StepLookup>>({});

async function toggle(s: TaskBoardStepItem) {
  const cur = expanded.value[s.stepId];
  if (cur) {
    // 已展开（或加载失败）→ 收起
    const next = { ...expanded.value };
    delete next[s.stepId];
    expanded.value = next;
    return;
  }
  expanded.value = {
    ...expanded.value,
    [s.stepId]: { loading: true, error: null, input: null, output: null },
  };
  try {
    const step = await getFlowStep(s.stepId);
    if (isUnmounted) return;
    const cur = expanded.value[s.stepId];
    if (!cur || !cur.loading) return;
    expanded.value = {
      ...expanded.value,
      [s.stepId]: { loading: false, error: null, input: step.inputJson, output: step.outputJson },
    };
  } catch (e) {
    if (isUnmounted) return;
    const cur = expanded.value[s.stepId];
    if (!cur || !cur.loading) return;
    expanded.value = {
      ...expanded.value,
      [s.stepId]: {
        loading: false,
        error: e instanceof Error ? e.message : '加载失败',
        input: null,
        output: null,
      },
    };
  }
}

onMounted(load);
</script>

<template>
  <HubAuthGate>
    <div class="h-full overflow-y-auto custom-scrollbar bg-[#0a0e17] text-[#cbd5e1] p-8">
      <div v-if="loading" class="text-[#9ca3af] text-[12.5px]">加载中…</div>

      <div v-else-if="notFound" class="py-16 text-center">
        <p class="text-[#9ca3af] m-0 mb-4">执行不存在或已被清理。</p>
        <button
          @click="goBack"
          class="px-4 py-1.5 rounded-lg border border-[#2d3a4d] text-[#cbd5e1] hover:text-white hover:border-[#3d4d64] text-[12.5px]"
        >
          ← 返回看板
        </button>
      </div>

      <template v-else-if="detail">
        <!-- header -->
        <div class="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div class="flex items-center gap-3 flex-wrap">
            <button
              @click="goBack"
              class="px-2.5 py-1.5 rounded-lg border border-[#2d3a4d] text-[#cbd5e1] hover:text-white hover:border-[#3d4d64] text-[12.5px]"
            >
              ← 返回
            </button>
            <h1 class="text-[19px] font-bold text-white tracking-tight m-0">执行详情</h1>
            <button
              @click="copyExecutionId"
              class="font-mono text-[11.5px] bg-[#1a2332] border border-[#2d3a4d] rounded px-2 py-1"
              :class="copied ? 'text-[#10b981]' : 'text-[#6b7280] hover:text-[#93c5fd]'"
            >
              {{ copied ? '已复制' : executionId }}
            </button>
            <span
              class="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider"
              :class="statusBadge(detail.execution.status).cls"
            >
              {{ statusBadge(detail.execution.status).label }}
            </span>
          </div>
          <button
            @click="load"
            class="px-3 py-1.5 rounded-lg border border-[#2d3a4d] text-[#cbd5e1] hover:text-white hover:border-[#3d4d64] text-[12.5px]"
          >
            ⟳ 刷新
          </button>
        </div>

        <div v-if="error" class="text-[#ef4444] text-[12.5px] mb-4">{{ error }}</div>

        <!-- 执行信息 -->
        <div class="bg-[#111827]/40 border border-[#2d3a4d] rounded-lg p-5 mb-4">
          <div class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-3">执行信息</div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-[12.5px]">
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">工作流</div>
              <div class="text-white">{{ detail.workflow?.title ?? '（未命名工作流）' }}</div>
            </div>
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">工作流类型</div>
              <div class="text-white">{{ detail.workflow?.workflowType ?? '—' }}</div>
            </div>
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">工作流状态</div>
              <div class="text-white">{{ detail.workflow?.status ?? '—' }}</div>
            </div>
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">执行阶段</div>
              <div class="text-white">{{ phaseLabel(detail.execution.phase) }} 结果数：{{ detail.execution.resultCount ?? 0 }}</div>
            </div>
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">发起人</div>
              <div class="text-white font-mono text-[11.5px]">{{ detail.execution.callerUserId ?? '—' }}</div>
            </div>
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">开始时间</div>
              <div class="text-white font-mono text-[11.5px]">{{ fmtTime(detail.execution.startedAt) }}</div>
            </div>
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">结束时间</div>
              <div class="text-white font-mono text-[11.5px]">{{ fmtTime(detail.execution.completedAt) }}</div>
            </div>
            <div>
              <div class="text-[#6b7280] text-[11.5px] mb-0.5">耗时</div>
              <div class="text-white font-mono text-[11.5px]">
                {{ detail.execution.status === 'RUNNING' ? '运行中' : fmtDuration(detail.execution.durationMs) }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-[#111827]/40 border border-[#2d3a4d] rounded-lg p-5 mb-4">
          <div class="grid grid-cols-2 gap-x-6">
            <div>
              <div class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">
                关联异常（{{ detail.anomalies.length }}）
              </div>
              <div v-if="detail.anomalies.length === 0" class="text-[#6b7280] text-[12.5px]">无</div>
              <div v-else class="flex flex-wrap gap-2">
                <span
                  v-for="a in detail.anomalies"
                  :key="a.anomalyId"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                  :class="a.isOrigin ? 'bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.45)]' : 'bg-[#1a2332] border-[#2d3a4d]'"
                >
                  <span class="text-[11.5px] text-white max-w-[160px] truncate" :title="a.name">{{
                    a.name
                  }}</span>
                  <span class="font-mono text-[11px] text-[#6b7280]">{{ a.anomalyId }}</span>
                  <span
                    class="px-1.5 py-0.5 rounded text-[10.5px] font-bold"
                    :class="a.isOrigin ? 'bg-[rgba(59,130,246,0.12)] text-[#93c5fd]' : 'bg-[#2d3a4d]/40 text-[#9ca3af]'"
                  >
                    {{ a.isOrigin ? '本源' : '衍生' }}
                  </span>
                </span>
              </div>
            </div>
            <div>
              <div class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af] mb-2">上一步节点</div>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.45)]">
              <span v-if="detail.execution.targetNodes.length === 0" class="text-[#6b7280]">—</span>
              <template v-else>
                <span
                  v-for="t in detail.execution.targetNodes"
                  :key="t.stepId"
                  class="text-[11.5px] text-white max-w-[320px] truncate"
                  :title="targetNodeTitle(t)"
                >
                  {{ resultTypeLabel(t.type) }} · {{ targetEntityName(t) }}
                </span>
              </template>
              </div>
            </div>
          </div>
          <div
            v-if="detail.execution.errorMessage"
            class="mt-4 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.4)] rounded-lg px-4 py-3 text-[12.5px] text-[#ef4444] whitespace-pre-wrap break-words"
          >
            {{ detail.execution.errorMessage }}
          </div>
        </div>

        <!-- 步骤时间线 -->
        <div class="bg-[#111827]/40 border border-[#2d3a4d] rounded-lg">
          <div class="flex items-center justify-between px-5 pt-5 pb-3 flex-wrap gap-2">
            <div class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">步骤时间线</div>
            <div class="flex gap-2 text-[11px] font-mono">
              <span class="px-2 py-0.5 rounded bg-[#1a2332] text-[#9ca3af] border border-[#2d3a4d]">
                共 {{ detail.stats.total }}
              </span>
              <span class="px-2 py-0.5 rounded bg-[rgba(59,130,246,0.12)] text-[#93c5fd] border border-[rgba(59,130,246,0.45)]">
                运行 {{ detail.stats.running }}
              </span>
              <span class="px-2 py-0.5 rounded bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.35)]">
                完成 {{ detail.stats.completed }}
              </span>
              <span class="px-2 py-0.5 rounded bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.4)]">
                失败 {{ detail.stats.failed }}
              </span>
            </div>
          </div>
          <table class="w-full border-collapse text-[12.5px]">
            <thead>
              <tr class="text-left text-[10.5px] font-semibold uppercase tracking-wide text-[#6b7280]">
                <th class="px-3 py-2 border-b border-[#2d3a4d] w-10">#</th>
                <th class="px-3 py-2 border-b border-[#2d3a4d]">类型</th>
                <th class="px-3 py-2 border-b border-[#2d3a4d]">Agent</th>
                <th class="px-3 py-2 border-b border-[#2d3a4d]">状态</th>
                <th class="px-3 py-2 border-b border-[#2d3a4d]">开始时间</th>
                <th class="px-3 py-2 border-b border-[#2d3a4d]">耗时</th>
                <th class="px-3 py-2 border-b border-[#2d3a4d]">结果</th>
                <th class="px-3 py-2 border-b border-[#2d3a4d] text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in groups" :key="g.key">
                <tr class="bg-[#111827]/70">
                  <td colspan="8" class="px-3 py-1.5 text-[11px] font-mono text-[#9ca3af] border-b border-[#2d3a4d]">
                    源节点 · {{ g.label }}
                    <template v-if="g.anomaly">
                      · 异常 <span :title="g.anomaly">{{ g.anomalyName ?? g.anomaly }}</span>
                    </template>
                  </td>
                </tr>
                <template v-for="(s, idx) in g.steps" :key="s.stepId">
                  <tr class="hover:bg-[#253141]/60 transition-colors">
                    <td class="px-3 py-2.5 font-mono text-[11.5px] text-[#6b7280] border-b border-[#2d3a4d]">{{
                      idx + 1
                    }}</td>
                    <td class="px-3 py-2.5 border-b border-[#2d3a4d] whitespace-nowrap">{{
                      stepTypeLabel(s.stepType)
                    }}</td>
                    <td class="px-3 py-2.5 border-b border-[#2d3a4d]">
                      <span class="text-white text-[12.5px]">{{ s.agentName ?? s.agentId }}</span>
                      <span v-if="s.agentName" class="block font-mono text-[10.5px] text-[#6b7280]">{{
                        s.agentId
                      }}</span>
                    </td>
                    <td class="px-3 py-2.5 border-b border-[#2d3a4d]">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap"
                        :class="statusBadge(s.status).cls"
                      >
                        {{ statusBadge(s.status).label }}
                      </span>
                    </td>
                    <td class="px-3 py-2.5 font-mono text-[12.5px] text-[#9ca3af] border-b border-[#2d3a4d] whitespace-nowrap">
                      {{ fmtTime(s.startedAt) }}
                    </td>
                    <td class="px-3 py-2.5 font-mono text-[12.5px] text-[#9ca3af] border-b border-[#2d3a4d] whitespace-nowrap">
                      {{ fmtDuration(s.durationMs) }}
                    </td>
                    <td class="px-3 py-2.5 font-mono text-[11.5px] border-b border-[#2d3a4d]">
                      <span v-if="s.agentResultType" class="text-[#93c5fd]">
                        {{ resultTypeLabel(s.agentResultType) }}
                        <template v-if="s.resultConfidence != null">
                          · {{ Math.round(s.resultConfidence) }}%
                        </template>
                      </span>
                      <span v-else-if="s.resultPruned" class="text-[#f59e0b]">已剪枝</span>
                      <span v-else class="text-[#6b7280]">—</span>
                    </td>
                    <td class="px-3 py-2.5 text-right border-b border-[#2d3a4d] whitespace-nowrap">
                      <button
                        v-if="s.errorMessage"
                        class="text-[10.5px] text-[#ef4444] font-mono mr-2"
                        :title="s.errorMessage"
                      >
                        有错误
                      </button>
                      <button
                        @click="toggle(s)"
                        class="text-[11.5px] px-2.5 py-1 rounded border transition-colors"
                        :class="
                          expanded[s.stepId]
                            ? 'text-[#93c5fd] border-[#3d4d64]'
                            : 'text-[#9ca3af] border-[#2d3a4d] hover:text-[#93c5fd] hover:border-[#3d4d64]'
                        "
                      >
                        {{ expanded[s.stepId] ? '收起 ↑' : '展开 ↓' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="expanded[s.stepId]" class="bg-[#0a0e17]/60">
                    <td colspan="8" class="px-4 py-3 border-b border-[#2d3a4d]">
                      <div v-if="expanded[s.stepId].loading" class="text-[#9ca3af] text-[11.5px]">
                        加载输入/输出…
                      </div>
                      <div v-else-if="expanded[s.stepId].error" class="text-[#ef4444] text-[11.5px] mb-2">
                        {{ expanded[s.stepId].error }}
                      </div>
                      <template v-else>
                        <div class="text-[11px] font-bold uppercase tracking-wide text-[#6b7280] mb-1">
                          输入
                        </div>
                        <pre
                          class="whitespace-pre-wrap break-words bg-[#0a0e17] border border-[#2d3a4d] rounded p-3 text-[11.5px] font-mono text-[#cbd5e1] max-h-80 overflow-auto m-0"
                        >{{ prettyJson(expanded[s.stepId].input) }}</pre>
                        <div class="text-[11px] font-bold uppercase tracking-wide text-[#6b7280] mt-3 mb-1">
                          输出
                        </div>
                        <pre
                          class="whitespace-pre-wrap break-words bg-[#0a0e17] border border-[#2d3a4d] rounded p-3 text-[11.5px] font-mono text-[#cbd5e1] max-h-80 overflow-auto m-0"
                        >{{ prettyJson(expanded[s.stepId].output) }}</pre>
                      </template>
                    </td>
                  </tr>
                </template>
              </template>
              <tr v-if="(detail.steps ?? []).length === 0">
                <td colspan="8" class="px-3 py-8 text-center text-[#6b7280] text-[12.5px] italic">
                  该执行尚无步骤记录。
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div v-else class="py-16 text-center">
        <p class="text-[#ef4444] text-[12.5px] m-0 mb-4">{{ error || '加载失败' }}</p>
        <div class="flex justify-center gap-3">
          <button
            @click="goBack"
            class="px-4 py-1.5 rounded-lg border border-[#2d3a4d] text-[#cbd5e1] hover:text-white hover:border-[#3d4d64] text-[12.5px]"
          >
            ← 返回看板
          </button>
          <button
            @click="load"
            class="px-4 py-1.5 rounded-lg border border-[#2d3a4d] text-[#cbd5e1] hover:text-white hover:border-[#3d4d64] text-[12.5px]"
          >
            ⟳ 重试
          </button>
        </div>
      </div>
    </div>
  </HubAuthGate>
</template>
