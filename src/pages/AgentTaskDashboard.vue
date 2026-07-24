<template>
  <div class="h-full bg-[#060c14] text-[#a3b8cc] font-sans select-none flex flex-col custom-scrollbar">


    <div class="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
      <div class="flex items-center gap-3 shrink-0">
        <div class="relative w-64">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg class="w-3.5 h-3.5 text-[#526e8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input v-model="searchQuery" type="text" placeholder="键入标题 / 标签 / 描述检索"
            class="w-full bg-[#0c1624] border border-[#203554] rounded pl-9 pr-3 py-1.5 text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60 text-xs" />
        </div>
        <button
          class="bg-[#0f1b2d] hover:bg-[#16273f] border border-[#1e3452] text-xs text-[#a3b8cc] px-3 py-1.5 rounded transition-colors">
          历史审计日志
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl shrink-0">
        <div v-for="status in statusTabs" :key="status.key" @click="activeStatus = status.key" :class="[
          activeStatus === status.key
            ? 'border-[#00f3ff]/40 bg-[#112239] shadow-[inset_0_0_10px_rgba(0,243,255,0.15)]'
            : 'border-[#1b2e4a] bg-[#0b1422]/60 hover:border-[#2a4365]',
          'border rounded px-4 py-2 flex justify-between items-center cursor-pointer transition-all duration-200',
        ]">
          <span :class="[
            activeStatus === status.key
              ? 'text-white font-medium'
              : 'text-[#708aa6]',
            'text-xs',
          ]">
            {{ status.label }}
          </span>
          <span :class="[
            status.key === 'RUNNING' ? 'text-[#00ffc4]' : 'text-white',
            'font-mono text-sm font-bold bg-[#142338]/80 px-2 py-0.5 rounded min-w-[24px] text-center',
          ]">
            {{ status.count }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        <div v-for="task in filteredTasks" :key="task.id"
          class="bg-[#0f1927]/80 border border-[#1e324f] rounded p-4 text-xs flex flex-col justify-between space-y-4 hover:border-[#2e4c75] transition-colors relative">
          <div class="flex justify-between items-start gap-4">
            <h3 class="text-white font-medium tracking-wide text-[13px] leading-tight flex-1 truncate"
              :title="task.title">
              <span class="text-[#526e8c] font-mono mr-1.5">#{{ task.id }}</span>
              {{ task.title }}
            </h3>
            <span :class="[
              statusMap[task.status]?.color || 'text-[#708aa6]',
              'flex-shrink-0 font-semibold font-sans',
            ]">
              {{ statusMap[task.status]?.label || task.status }}
            </span>
          </div>

          <div class="space-y-2 text-[#708aa6] flex-1">
            <p
              class="text-[11px] leading-relaxed text-[#526e8c] bg-[#0a121c]/50 border border-[#142236] p-2 rounded line-clamp-2 h-10 mb-2">
              {{ task.description || "暂无该分析任务的特征描述。" }}
            </p>

            <div class="flex flex-wrap gap-y-1 gap-x-4">
              <div>
                部署时间:
                <span class="text-[#a3b8cc] font-mono">{{
                  task.createdAt
                }}</span>
              </div>
              <div>
                同步变更:
                <span class="text-[#a3b8cc] font-mono">{{
                  task.updatedAt
                }}</span>
              </div>
            </div>

            <div class="flex items-start gap-1 leading-relaxed">
              <span class="shrink-0 text-[#526e8c]">研判标签:</span>
              <div v-if="task.keywords && task.keywords.length > 0" class="flex flex-wrap gap-1">
                <span v-for="keyword in task.keywords" :key="keyword"
                  class="text-[#00f3ff] bg-[#00f3ff]/5 border border-[#00f3ff]/20 px-1 rounded text-[10px]">
                  {{ keyword }}
                </span>
              </div>
              <span v-else class="italic text-slate-700">未标记特征</span>
            </div>

            <div>
              执行凭证 (createdBy):
              <span class="text-[#a3b8cc] font-mono">{{
                task.createdBy || "SYSTEM"
              }}</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-[#1a2b42]">
            <button v-if="task.status === 'RUNNING' || task.status === 'PENDING'"
              class="bg-[#2d1616]/40 hover:bg-[#3d1a1a]/60 border border-[#4a1e1e] text-[#ef4444] px-2.5 py-1 rounded transition-colors cursor-pointer">
              取消任务
            </button>
            <button
              class="bg-[#121f30] hover:bg-[#1d3047] border border-[#223652] text-[#a3b8cc] hover:text-white px-2.5 py-1 rounded transition-colors cursor-pointer"
              @click="handleOpenDetail(task)">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>

    <AgentTaskDetail :is-open="sidebarOpen" :task-detail="selectedTask" @close="sidebarOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import AgentTaskDetail from "@/components/AgentTaskDetail.vue";
import { getTaskList } from "@/api/agents-api";
import type { TaskInstance } from "@/types/agent"; // 👈 严格绑定 TS 模型类型

// 搜索绑定值与当前激活的状态 Tab (对应后端的 ENUM 值大写字符串)
const searchQuery = ref("");
const activeStatus = ref("WAITING_INPUT");

const sidebarOpen = ref(false);
const selectedTask = ref<TaskInstance | null>(null);

// 核心数据模型源
const tasksData = ref<TaskInstance[]>([]);

// 状态本地映射解析字典
const statusMap: Record<string, { label: string; color: string }> = {
  WAITING: { label: "等待用户输入", color: "text-[#00ffc4]" },
  PENDING: { label: "未开始", color: "text-[#00f3ff]" },
  RUNNING: { label: "正在执行", color: "text-[#facc15]" },
  COMPLETED: { label: "已完成", color: "text-[#22c55e]" },
  FAILED: { label: "失败", color: "text-[#ef4444]" },
};

// 🌟 改良：将状态卡片重构为动态计算属性，数量实时根据 tasksData 进行过滤盘点
const statusTabs = computed(() => {
  const counts = {
    WAITING: 0,
    PENDING: 0,
    RUNNING: 0,
    COMPLETED: 0,
    FAILED: 0,
  };

  // 累加汇总数量
  tasksData.value.forEach((task) => {
    if (task.status in counts) {
      counts[task.status as keyof typeof counts]++;
    }
  });

  return [
    { label: "未开始", key: "PENDING", count: counts.PENDING },
    { label: "正在执行", key: "RUNNING", count: counts.RUNNING },
    { label: "等待输入", key: "WAITING", count: counts.WAITING },
    { label: "已完成", key: "COMPLETED", count: counts.COMPLETED },
    { label: "失败", key: "FAILED", count: counts.FAILED },
  ];
});

// 🔍 多条件过滤核心逻辑
const filteredTasks = computed(() => {
  return tasksData.value.filter((task) => {
    if (task.status !== activeStatus.value) return false;

    // 2. 文本模糊联想检索
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      const matchTitle = (task.title || "").toLowerCase().includes(query);
      const matchId = String(task.id).includes(query);
      const matchDesc = (task.description || "").toLowerCase().includes(query);
      const matchKeyword = task.keywords?.some((k) =>
        k.toLowerCase().includes(query),
      );

      return matchTitle || matchId || matchDesc || matchKeyword;
    }

    return true;
  });
});

// 单击调配详情数据处理
const handleOpenDetail = (task: TaskInstance) => {
  selectedTask.value = task;
  sidebarOpen.value = true;
};

// 轮询句柄管理
let pollTimer: ReturnType<typeof setInterval> | null = null;

async function fetchDashboardTasks() {
  try {
    const res = await getTaskList();
    tasksData.value = res || [];
  } catch (error) {
    console.error("看板数据管道同步异常:", error);
  }
}

onMounted(() => {
  // 首次挂载立即执行数据拉取
  fetchDashboardTasks();

  // 注入安全的轮询刷新流（每 5000ms 刷新一次）
  pollTimer = setInterval(fetchDashboardTasks, 5000);
});

onUnmounted(() => {
  // 离开页面时务必销毁定时器，防止内存泄漏
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #060c14;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #2e394e;
}
</style>
