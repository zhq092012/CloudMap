<template>
  <Transition
    enter-active-class="transition ease-in-out duration-300 transform"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition ease-in-out duration-300 transform"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed inset-y-0 right-0 w-[500px] bg-[#09101a] border-l border-[#1e2e4a] shadow-2xl z-50 flex flex-col text-[#a3b8cc] overflow-hidden"
    >
      <div
        class="p-4 border-b border-[#1e2e4a] flex justify-between items-center bg-[#0d1624]"
      >
        <div class="flex items-center gap-2">
          <span class="text-[#00f3ff] font-mono font-bold text-sm">{{
            taskDetail?.id || "#2026-0221-006"
          }}</span>
          <h2 class="text-white font-medium text-sm">任务详情</h2>
        </div>
        <button
          @click="$emit('close')"
          class="text-[#526e8c] hover:text-white transition-colors"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div
        class="p-3 grid grid-cols-3 gap-2 border-b border-[#142338] bg-[#0b131f]/30 text-center"
      >
        <button
          class="bg-[#121f30] border border-[#223652] hover:border-[#00f3ff]/50 text-xs py-1.5 rounded text-white transition-colors"
        >
          跳转思维树
        </button>
        <button
          class="bg-[#121f30] border border-[#223652] hover:border-[#00f3ff]/50 text-xs py-1.5 rounded text-white transition-colors"
          @click="exportTaskReport(taskDetail?.id)"
        >
          导出数据报告
        </button>
        <button
          class="bg-[#2d1616] border border-[#4a1e1e] hover:bg-[#3d1a1a] text-xs py-1.5 rounded text-[#ef4444] transition-colors"
        >
          中止任务
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        <div
          class="bg-[#0f1927] border border-[#1a2b42] p-3 rounded space-y-2.5 text-[11px]"
        >
          <div class="flex justify-between items-center">
            <span class="text-white font-medium text-xs">{{
              taskDetail?.title || "蓝方方案生成 · P1"
            }}</span>
            <span
              class="text-[#00ffc4] bg-[#00ffc4]/10 px-1.5 py-0.5 rounded border border-[#00ffc4]/20"
            >
              {{ getLabel(taskDetail?.status) || "执行中" }}
            </span>
          </div>

          <div class="text-[#708aa6] space-y-1">
            <div>
              创建时间：<span class="text-white font-mono">{{
                taskDetail?.createdAt || "14:30:18"
              }}</span>
            </div>
            <div>
              当前耗时：<span class="text-[#00f3ff] font-mono">{{
                Date.now() -
                new Date(
                  taskDetail?.createdAt || "2024-06-21T14:30:18Z",
                ).getTime()
              }}</span>
            </div>
            <div class="leading-relaxed">
              协同伙伴：
              <span class="space-x-1.5 inline-block">
                <span
                  v-for="agent in taskDetail?.keywords || [
                    '任务分发agent',
                    'COA架构解析agent',
                    '历史战例研究员',
                  ]"
                  :key="agent"
                  class="text-[#00f3ff] hover:underline cursor-pointer"
                >
                  {{ agent }}
                </span>
              </span>
            </div>
          </div>

          <div class="pt-1.5 border-t border-[#1a2b42]">
            <div class="flex justify-between text-[#708aa6] mb-1">
              <span>当前阶段：{{ "串联分析 3/6已完成" }}</span>
              <span class="text-[#00f3ff] font-mono">50%</span>
            </div>
            <div class="w-full h-1 bg-[#1a2b42] rounded-full overflow-hidden">
              <div
                class="w-1/2 h-full bg-[#00f3ff] shadow-[0_0_6px_#00f3ff]"
              ></div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-xs font-medium text-white flex items-center gap-1.5">
            <span class="w-1 h-3 bg-[#00f3ff] rounded-sm"></span>流转步骤节点
          </h3>

          <div class="space-y-2 pl-1">
            <div class="flex gap-3">
              <div class="flex flex-col items-center flex-shrink-0">
                <div
                  class="w-6 h-6 rounded-full bg-[#16273d] border border-[#00f3ff]/40 flex items-center justify-center text-[#00f3ff]"
                >
                  <span class="text-[10px] font-mono">01</span>
                </div>
                <div class="w-px h-full bg-[#1e2e4a] my-1"></div>
              </div>
              <div class="pb-3 text-[11px]">
                <div class="font-medium text-white">
                  目标架构分解
                  <span class="text-[#526e8c] ml-1">已耗时: 2.1s</span>
                </div>
                <p class="text-[#708aa6] mt-0.5">调度：COA架构解析agent</p>
                <p class="text-[#526e8c] mt-0.5">
                  提取高阶战术目标，生成约束条件树。
                </p>
              </div>
            </div>

            <div class="flex gap-3">
              <div class="flex flex-col items-center flex-shrink-0">
                <div
                  class="w-6 h-6 rounded-full bg-[#16273d] border border-[#00f3ff]/40 flex items-center justify-center text-[#00f3ff]"
                >
                  <span class="text-[10px] font-mono">02</span>
                </div>
                <div class="w-px h-full bg-[#1e2e4a] my-1"></div>
              </div>
              <div class="pb-3 text-[11px]">
                <div class="font-medium text-white">
                  历史相似战例匹配
                  <span class="text-[#526e8c] ml-1">已耗时: 3.2s</span>
                </div>
                <p class="text-[#708aa6] mt-0.5">调度：历史战例研究员agent</p>
                <p class="text-[#526e8c] mt-0.5">
                  成功检索到 2 例高拟合度历史联合封锁战例。
                </p>
              </div>
            </div>

            <div class="flex gap-3">
              <div class="flex flex-col items-center flex-shrink-0">
                <div
                  class="w-6 h-6 rounded-full bg-[#102a3a] border border-[#00f3ff] flex items-center justify-center text-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.4)]"
                >
                  <svg
                    class="w-3 h-3 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
              </div>
              <div class="text-[11px]">
                <div class="font-medium text-[#00f3ff]">
                  多维方案协同推演 <span class="animate-pulse">● 运行中</span>
                </div>
                <p class="text-[#708aa6] mt-0.5">
                  调度：行动路线规划 / 波次编排agent
                </p>
                <p
                  class="text-[#a3b8cc] mt-1 bg-[#101b2b] p-1.5 rounded border border-[#1b314f]"
                >
                  正在解算突防路线空间无碰撞校验，以及波次武器匹配时序链...
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="text-xs font-medium text-white flex items-center gap-1.5">
            <span class="w-1 h-3 bg-[#00f3ff] rounded-sm"></span>实时内核日志
          </h3>
          <div
            class="bg-[#060c14] border border-[#1a2b42] rounded p-2.5 font-mono text-[10px] space-y-1 max-h-48 overflow-y-auto leading-relaxed text-[#708aa6] custom-scrollbar"
          >
            <div v-for="(log, idx) in mockLogs" :key="idx" class="flex gap-2">
              <span class="text-[#415973] select-none">{{ log.time }}</span>
              <span class="text-[#a3b8cc]">{{ log.msg }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { getTaskReports } from "@/api/agents-api";
import type { TaskInstance } from "@/types/agent";
import { ref } from "vue";
const exportTaskReport = async (taskId: number | undefined) => {
  if (!taskId) {
    console.warn("无法导出报告：任务 ID 未定义");
    return;
  }

  await getTaskReports(taskId)
    .then((response) => {
      console.log("导出报告成功:", response);
      // 这里可以处理下载逻辑，例如创建一个下载链接
    })
    .catch((error) => {
      console.error("导出报告失败:", error);
    });
  // 模拟导出逻辑
  console.log(`正在导出任务报告，任务 ID: ${taskId}`);
  // 实际应用中可以调用后端 API 或生成文件下载
};
// 严格的 TypeScript 属性声明
defineProps<{
  isOpen: boolean;
  taskDetail: TaskInstance | null;
}>();

const getLabel = (status: string | undefined) => {
  const statusMap: Record<string, string> = {
    WAITING: "等待用户输入",
    PENDING: "未开始",
    RUNNING: "正在执行",
    COMPLETED: "已完成",
    FAILED: "失败",
  };
  return status ? statusMap[status] : undefined;
};

defineEmits<{
  (e: "close"): void;
}>();

// 内置轻量模拟日志数据
const mockLogs = ref([
  { time: "14:30:18.001", msg: "Kernel: 异步注册任务中心 ID #2026-0221-006" },
  { time: "14:30:18.120", msg: "COA-Agent: 开始解析顶层推演架构规则描述" },
  { time: "14:30:20.215", msg: "Kernel: 阶段一输出成功，通过总线广播交配矩阵" },
  {
    time: "14:30:20.300",
    msg: "History-Agent: 激活向量数据库，索引匹配度 > 0.70",
  },
  { time: "14:30:23.355", msg: "Kernel: 阶段二归档。并行调派多波次规划编排簇" },
  { time: "14:30:24.102", msg: "Route-Agent: 启动进入点地理空间防区重叠校核" },
]);
</script>

<style scoped>
/* 精细化网格大屏滚动条风格 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #060c14;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1b2e47;
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #00f3ff/40;
}
</style>
