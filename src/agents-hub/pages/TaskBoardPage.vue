<script setup lang="ts">
// ============================================================
// 智能任务看板 — 深度分析执行历史列表（服务端分页 + 筛选）
// 风格对齐 AgentsHub.vue / AgentsManage.vue 既有暗色主题
// ============================================================
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import HubAuthGate from '../HubAuthGate.vue';
import {
  listTaskBoardExecutions,
  type ExecutionStatus,
  type TaskBoardExecutionItem,
} from '@/api/task-board';
import { fmtDuration, fmtTime, phaseLabel, statusBadge } from './task-board-format';

const router = useRouter();

const PAGE_SIZE = 20;

const items = ref<TaskBoardExecutionItem[]>([]);
const total = ref(0);
const runningTotal = ref(0);
const page = ref(0);
const loading = ref(false);
const error = ref('');

const statusFilter = ref<ExecutionStatus | ''>('');
const phaseFilter = ref<number>(0); // 0 = 全部
const keyword = ref('');

const STATUS_FILTERS: { key: ExecutionStatus | ''; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'RUNNING', label: '运行中' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'FAILED', label: '失败' },
  { key: 'CANCELLED', label: '已取消' },
];
const PHASE_FILTERS: { key: number; label: string }[] = [
  { key: 0, label: '全部' },
  { key: 1, label: '意图研判' },
  { key: 2, label: '蓝方方案生成' },
  { key: 3, label: '红方方案生成' },
  { key: 4, label: '方案评估' },
];

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

let isUnmounted = false;
let loadSeq = 0;
async function load() {
  const seq = ++loadSeq;
  loading.value = true;
  try {
    const [data, running] = await Promise.all([
      listTaskBoardExecutions({
        page: page.value,
        size: PAGE_SIZE,
        status: statusFilter.value || undefined,
        phase: phaseFilter.value || undefined,
        keyword: keyword.value.trim() || undefined,
      }),
      // 统计条：全量运行中数量（轻量单页请求）
      listTaskBoardExecutions({ page: 0, size: 1, status: 'RUNNING' }),
    ]);
    if (isUnmounted || seq !== loadSeq) return;
    items.value = data.items;
    total.value = data.total;
    runningTotal.value = running.total;
    error.value = '';
  } catch (e) {
    if (isUnmounted || seq !== loadSeq) return;
    error.value = e instanceof Error ? e.message : '加载失败';
  } finally {
    if (!isUnmounted && seq === loadSeq) {
      loading.value = false;
    }
  }
}

onBeforeUnmount(() => {
  isUnmounted = true;
  if (keywordTimer != null) window.clearTimeout(keywordTimer);
});

watch([statusFilter, phaseFilter], () => {
  page.value = 0;
  load();
});
let keywordTimer: number | null = null;
watch(keyword, () => {
  if (keywordTimer != null) window.clearTimeout(keywordTimer);
  keywordTimer = window.setTimeout(() => {
    page.value = 0;
    load();
  }, 300);
});

function pageChanged(p: number) {
  page.value = p;
  load();
}

function openDetail(row: TaskBoardExecutionItem) {
  router.push(`/agents-hub/task-board/${encodeURIComponent(row.executionId)}`);
}

onMounted(load);
</script>

<template>
  <HubAuthGate>
    <div class="h-full overflow-y-auto custom-scrollbar bg-[#0a0e17] text-[#cbd5e1] p-8">
      <!-- header -->
      <div class="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <span
            class="w-9 h-9 rounded-lg flex items-center justify-center text-[15px] text-white"
            style="background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);"
            >📋</span
          >
          <h1 class="text-[19px] font-bold text-white tracking-tight m-0">智能任务看板</h1>
        </div>
        <button
          @click="load"
          class="px-3 py-1.5 rounded-lg border border-[#2d3a4d] text-[#cbd5e1] hover:text-white hover:border-[#3d4d64] transition-colors text-[12.5px]"
        >
          ⟳ 刷新
        </button>
      </div>

      <p class="text-[#9ca3af] text-[12.5px] leading-relaxed max-w-3xl mb-6">
        深度分析工作流的执行历史 —— 每次阶段执行一条记录，可下钻查看各 Agent 步骤的输入与输出。
      </p>

      <!-- stats -->
      <div
        class="bg-[#111827]/60 border border-[#2d3a4d] rounded px-6 py-4 flex items-center gap-12 text-[12.5px] mb-6"
      >
        <div>
          执行总数
          <span class="text-white text-[15px] font-mono ml-2 font-bold">{{ total }}</span>
        </div>
        <div class="border-l border-[#2d3a4d] h-4"></div>
        <div>
          运行中
          <span class="text-[#93c5fd] text-[15px] font-mono ml-2 font-bold">{{ runningTotal }}</span>
        </div>
      </div>

      <!-- filters -->
      <div class="bg-[#111827]/40 border border-[#2d3a4d] rounded-lg p-4 mb-6 space-y-3">
        <div class="flex items-start gap-4">
          <span class="text-[#9ca3af] w-20 py-1 flex-shrink-0 text-right text-[12.5px]">状态</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="f in STATUS_FILTERS"
              :key="f.label"
              @click="statusFilter = f.key"
              class="px-2.5 py-1 rounded-full text-[12.5px] font-semibold border transition-colors"
              :class="
                statusFilter === f.key
                  ? 'bg-[rgba(59,130,246,0.16)] text-[#93c5fd] border-[rgba(59,130,246,0.45)]'
                  : 'bg-[#111827] text-[#9ca3af] border-[#2d3a4d] hover:border-[#3d4d64] hover:text-[#cbd5e1]'
              "
            >
              {{ f.label }}
            </button>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <span class="text-[#9ca3af] w-20 py-1 flex-shrink-0 text-right text-[12.5px]">阶段</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="f in PHASE_FILTERS"
              :key="f.key"
              @click="phaseFilter = f.key"
              class="px-2.5 py-1 rounded-full text-[12.5px] font-semibold border whitespace-nowrap transition-colors"
              :class="
                phaseFilter === f.key
                  ? 'bg-[rgba(59,130,246,0.16)] text-[#93c5fd] border-[rgba(59,130,246,0.45)]'
                  : 'bg-[#111827] text-[#9ca3af] border-[#2d3a4d] hover:border-[#3d4d64] hover:text-[#cbd5e1]'
              "
            >
              {{ f.label }}
            </button>
          </div>
        </div>
        <div class="flex items-start gap-4">
          <span class="text-[#9ca3af] w-20 py-1 flex-shrink-0 text-right text-[12.5px]">关键词</span>
          <input
            v-model="keyword"
            type="text"
            placeholder="搜索工作流标题 / 发起人"
            class="flex-1 max-w-sm bg-[#111827] border border-[#3d4d64] rounded px-3 py-1.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-[#3b82f6]/60 text-[11.5px]"
          />
        </div>
      </div>

      <div v-if="error" class="text-[#ef4444] text-[12.5px] mb-4">{{ error }}</div>
      <div v-if="loading && items.length === 0" class="text-[#9ca3af] text-[12.5px]">加载中…</div>

      <!-- table -->
      <div class="bg-[#1a2332] border border-[#2d3a4d] rounded-lg overflow-hidden">
        <table class="w-full border-collapse text-[12.5px]">
          <thead>
            <tr class="text-left text-[10.5px] font-semibold uppercase tracking-wide text-[#6b7280]">
              <th class="px-3 py-2 border-b border-[#2d3a4d]">工作流</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">异常事件</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">处理异常</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">阶段</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">状态</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">发起人</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">开始时间</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">耗时</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d]">结果</th>
              <th class="px-3 py-2 border-b border-[#2d3a4d] text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in items"
              :key="r.executionId"
              class="cursor-pointer hover:bg-[#253141] transition-colors"
              :class="{ 'opacity-60': loading }"
              @click="openDetail(r)"
            >
              <td class="px-3 py-2.5 border-b border-[#2d3a4d]">
                <span class="block max-w-[280px] truncate text-[12.5px] font-medium text-white" :title="r.workflowTitle ?? ''">
                  {{ r.workflowTitle ?? '（未命名工作流）' }}
                </span>
                <span class="block text-[11px] text-[#6b7280] font-mono truncate max-w-[280px]">{{
                  r.workflowId
                }}</span>
              </td>
              <td class="px-3 py-2.5 border-b border-[#2d3a4d]">
                <span v-if="r.anomalies.length === 0" class="text-[#6b7280]">—</span>
                <div v-else class="flex flex-wrap gap-1">
                  <span
                    v-for="a in r.anomalies.slice(0, 3)"
                    :key="a.anomalyId"
                    class="px-2 py-0.5 rounded text-[10.5px] font-bold border max-w-[140px] truncate whitespace-nowrap"
                    :class="
                      a.isOrigin
                        ? 'bg-[rgba(59,130,246,0.12)] border-[rgba(59,130,246,0.45)] text-[#93c5fd]'
                        : 'bg-[#1a2332] border-[#2d3a4d] text-[#9ca3af]'
                    "
                  >
                    {{ a.name }}
                  </span>
                  <span
                    v-if="r.anomalies.length > 3"
                    :title="r.anomalies.slice(3).map((a) => a.name).join('、')"
                    class="px-2 py-0.5 rounded text-[10.5px] font-bold border bg-[#1a2332] border-[#2d3a4d] text-[#9ca3af]"
                  >
                    +{{ r.anomalies.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-2.5 border-b border-[#2d3a4d]">
                <span v-if="r.processingAnomalies.length === 0" class="text-[#6b7280]">—</span>
                <div v-else class="flex flex-wrap gap-1">
                  <span
                    v-for="a in r.processingAnomalies.slice(0, 3)"
                    :key="a.anomalyId"
                    class="px-2 py-0.5 rounded text-[10.5px] font-bold border max-w-[140px] truncate whitespace-nowrap bg-[#1a2332] border-[#2d3a4d] text-[#9ca3af]"
                  >
                    {{ a.name }}
                  </span>
                  <span
                    v-if="r.processingAnomalies.length > 3"
                    :title="r.processingAnomalies.slice(3).map((a) => a.name).join('、')"
                    class="px-2 py-0.5 rounded text-[10.5px] font-bold border bg-[#1a2332] border-[#2d3a4d] text-[#9ca3af]"
                  >
                    +{{ r.processingAnomalies.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-2.5 border-b border-[#2d3a4d] whitespace-nowrap">{{
                phaseLabel(r.phase)
              }}</td>
              <td class="px-3 py-2.5 border-b border-[#2d3a4d]">
                <span
                  class="px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider whitespace-nowrap"
                  :class="statusBadge(r.status).cls"
                >
                  {{ statusBadge(r.status).label }}
                </span>
              </td>
              <td class="px-3 py-2.5 font-mono text-[12.5px] text-[#9ca3af] border-b border-[#2d3a4d]">
                {{ r.callerUserId ?? '—' }}
              </td>
              <td class="px-3 py-2.5 font-mono text-[12.5px] text-[#9ca3af] border-b border-[#2d3a4d] whitespace-nowrap">
                {{ fmtTime(r.startedAt) }}
              </td>
              <td class="px-3 py-2.5 font-mono text-[12.5px] border-b border-[#2d3a4d] whitespace-nowrap">
                <span v-if="r.status === 'RUNNING'" class="text-[#93c5fd]">运行中</span>
                <span v-else>{{ fmtDuration(r.durationMs) }}</span>
              </td>
              <td class="px-3 py-2.5 font-mono text-[12.5px] text-[#9ca3af] border-b border-[#2d3a4d]">
                {{ r.resultCount }}
              </td>
              <td class="px-3 py-2.5 text-right border-b border-[#2d3a4d] whitespace-nowrap">
                <button
                  type="button"
                  class="bg-transparent border-0 p-0 cursor-pointer text-[#93c5fd] text-[11.5px] hover:underline"
                  @click.stop="openDetail(r)"
                >
                  详情 →
                </button>
              </td>
            </tr>
            <tr v-if="!loading && items.length === 0">
              <td colspan="10" class="px-3 py-8 text-center text-[#6b7280] text-[12.5px] italic">
                暂无执行记录。
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- pagination -->
      <div class="flex items-center justify-between mt-4 text-[12.5px] text-[#9ca3af]">
        <span>共 {{ total }} 条 · 第 {{ page + 1 }} / {{ totalPages }} 页</span>
        <div class="flex gap-2">
          <button
            :disabled="page <= 0 || loading"
            @click="pageChanged(page - 1)"
            class="px-3 py-1.5 rounded-lg border border-[#2d3a4d] hover:text-white hover:border-[#3d4d64] transition-colors disabled:opacity-40"
          >
            ← 上一页
          </button>
          <button
            :disabled="page >= totalPages - 1 || loading"
            @click="pageChanged(page + 1)"
            class="px-3 py-1.5 rounded-lg border border-[#2d3a4d] hover:text-white hover:border-[#3d4d64] transition-colors disabled:opacity-40"
          >
            下一页 →
          </button>
        </div>
      </div>
    </div>
  </HubAuthGate>
</template>
