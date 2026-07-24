<template>
  <div
    class="h-full w-full bg-[#060c14] text-[#a3b8cc] p-6 font-sans overflow-y-auto custom-scrollbar flex flex-col space-y-4 select-none animate-fadeIn"
  >
    <div class="flex items-center shrink-0">
      <button
        @click="backToAgentsList"
        class="bg-[#0f1b2d] hover:bg-[#16273f] border border-[#1e3452] text-xs text-[#a3b8cc] hover:text-white px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        返回 Agent 列表
      </button>
    </div>

    <div
      class="bg-[#0f1927]/90 border border-[#1e324f] rounded-lg p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative group"
    >
      <div class="absolute top-0 left-0 w-3 h-[1px] bg-[#00f3ff]"></div>
      <div class="absolute top-0 left-0 w-[1px] h-3 bg-[#00f3ff]"></div>

      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-lg border border-[#00f3ff]/40 flex items-center justify-center bg-[#132337] shadow-[inset_0_0_10px_rgba(0,243,255,0.3)] shrink-0"
        >
          <svg
            class="w-6 h-6 text-[#00f3ff]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div>
          <h2
            class="text-white font-semibold text-lg tracking-wide flex items-center gap-2"
          >
            {{ store.currentAgent?.displayName || store.currentAgent?.name }}
          </h2>
          <p class="text-xs text-[#526e8c] font-mono mt-0.5">
            #agent-{{ store.currentAgent?.id }}
            <span class="text-[#2c4261]">|</span>
            {{ store.currentAgent?.name }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="handleDeleteAgent(store.currentAgent?.id)"
          class="bg-[#121f30] hover:bg-[#1c324d] border border-[#ef4444]/30 text-[#ef4444] hover:border-[#ef4444] text-xs px-4 py-2 rounded transition-all font-medium"
        >
          删除
        </button>
        <button
          @click="handleToggleStatus(store.currentAgent?.id)"
          :class="[
            store.currentAgent?.enabled
              ? 'border-[#ef4444]/30 bg-[#2d1616]/30 text-[#ef4444] hover:bg-[#2d1616]/60 hover:border-[#ef4444]'
              : 'border-[#00ffc4]/30 bg-[#112d27]/30 text-[#00ffc4] hover:bg-[#112d27]/60 hover:border-[#00ffc4]',
          ]"
          class="border text-xs px-4 py-2 rounded transition-all font-medium cursor-pointer"
        >
          {{ store.currentAgent?.enabled ? "禁用" : "启用" }}
        </button>
      </div>
    </div>

    <div
      class="bg-[#0b131f]/70 border border-[#142338] rounded-lg p-5 space-y-4"
    >
      <h3
        class="text-xs font-semibold text-white tracking-wider flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-[#00f3ff] rounded-sm"></div>
        基本信息
      </h3>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-xs border-t border-[#142338]/60 pt-4"
      >
        <div class="space-y-1">
          <div class="text-[#526e8c]">内部集群 ID</div>
          <div class="text-white font-mono font-medium">
            {{ store.currentAgent?.id }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-[#526e8c]">Agent 标识码 (ID)</div>
          <div class="text-white font-mono font-medium">
            {{ store.currentAgent?.name }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-[#526e8c]">系统显示名称</div>
          <div class="text-white font-medium">
            {{ store.currentAgent?.displayName || "未命名" }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-[#526e8c]">当前运行状态</div>
          <div class="flex items-center gap-1.5 font-medium">
            <span
              :class="[
                store.currentAgent?.enabled
                  ? 'bg-[#00ffc4] shadow-[0_0_6px_#00ffc4]'
                  : 'bg-[#526e8c]',
                'w-1.5 h-1.5 rounded-full',
              ]"
            ></span>
            <span
              :class="
                store.currentAgent?.enabled
                  ? 'text-[#00ffc4]'
                  : 'text-[#708aa6]'
              "
            >
              {{ store.currentAgent?.enabled ? "已启用运行" : "关闭/离线" }}
            </span>
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-[#526e8c]">集群调度类型</div>
          <div class="text-white font-medium">
            {{ store.currentAgent?.agentType }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-[#526e8c]">核心专属领域</div>
          <div class="text-[#00f3ff] font-medium">
            {{ store.currentAgent?.category }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-[#526e8c]">大模型驱动引擎</div>
          <div class="text-white font-mono font-medium">
            {{ store.currentAgent?.modelName }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-[#526e8c]">核心同步状态</div>
          <div class="text-[#708aa6] font-mono">SYNC_OK</div>
        </div>
        <div class="space-y-1 col-span-1 md:col-span-2">
          <div class="text-[#526e8c]">集群初始注册时间</div>
          <div class="text-[#708aa6] font-mono">
            {{ store.currentAgent?.createdAt || "---" }}
          </div>
        </div>
        <div class="space-y-1 col-span-1 md:col-span-2">
          <div class="text-[#526e8c]">最后热更同步时间</div>
          <div class="text-[#708aa6] font-mono">
            {{ store.currentAgent?.updatedAt || "---" }}
          </div>
        </div>
      </div>
    </div>

    <div
      class="bg-[#0b131f]/70 border border-[#142338] rounded-lg p-5 space-y-3"
    >
      <h3
        class="text-xs font-semibold text-white tracking-wider flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-[#00f3ff] rounded-sm"></div>
        描述
      </h3>
      <p
        class="text-xs text-[#a3b8cc] leading-relaxed pt-2 border-t border-[#142338]/60 text-justify"
      >
        {{
          store.currentAgent?.description ||
          "暂无该智能体节点的业务职责与数据研判范围描述信息。"
        }}
      </p>
    </div>

    <div
      class="bg-[#0b131f]/70 border border-[#142338] rounded-lg p-5 space-y-3"
    >
      <h3
        class="text-xs font-semibold text-white tracking-wider flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-[#00f3ff] rounded-sm"></div>
        核心技能栈 (Core Skills)
      </h3>
      <div class="pt-2 border-t border-[#142338]/60 flex flex-wrap gap-2">
        <template
          v-if="
            store.currentAgent?.skillNames &&
            store.currentAgent.skillNames.length > 0
          "
        >
          <div
            v-for="skill in store.currentAgent?.skillNames || []"
            :key="skill"
            class="bg-[#121f30] border border-[#1e2e4a] px-3 py-1 rounded text-xs text-[#a3b8cc] hover:border-[#00f3ff]/40 transition-colors flex items-center gap-1.5"
          >
            <span class="w-1 h-1 bg-[#00f3ff]/70 rounded-full"></span>
            {{ skill }}
          </div>
        </template>
        <div v-else class="text-xs text-[#526e8c] italic">
          该节点当前未编排绑定任何专项子大模型原子微技能。
        </div>
      </div>
    </div>

    <div
      class="bg-[#0b131f]/70 border border-[#142338] rounded-lg p-5 space-y-3 flex-1 flex flex-col"
    >
      <h3
        class="text-xs font-semibold text-white tracking-wider flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-[#00f3ff] rounded-sm"></div>
        配置
      </h3>
      <div
        class="bg-[#050b12] border border-[#16273d] rounded-lg overflow-hidden flex-1 flex flex-col min-h-[180px]"
      >
        <div
          class="bg-[#0b1421] px-4 py-1.5 border-b border-[#16273d] flex justify-between items-center select-none text-[10px] font-mono text-[#526e8c]"
        >
          <span class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#ef4444]/60"></span>
            <span class="w-2 h-2 rounded-full bg-[#fb923c]/60"></span>
            <span class="w-2 h-2 rounded-full bg-[#00ffc4]/60"></span>
            <span class="ml-1">CONFIG_STREAM_OUTPUT</span>
          </span>
          <span>JSON</span>
        </div>
        <pre
          class="p-4 text-[11px] font-mono text-[#00ffc4] overflow-auto flex-1 custom-scrollbar leading-relaxed bg-black/40 text-left"
          >{{ formattedConfig }}</pre
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAgentStore } from "@/store/modules/agentStore";
import { useRouter } from "vue-router";
import { deleteAgent, getAgentById } from "@/api/agents-api";
const store = useAgentStore();
const router = useRouter();
const backToAgentsList = () => {
  store.setCurrentAgent(null);
  router.push({ name: "AgentsManage" });
};

const handleToggleStatus = async (id: number | undefined) => {
  try {
    if (!id) return;
    await store.toggleCurrentAgentStatus();
    backToAgentsList();
  } catch (error) {
    console.error("切换智能体状态异常:", error);
  }
};

const handleDeleteAgent = async (id: number | undefined) => {
  if (
    !confirm(
      "⚠️ 警告：确定要彻底注销删除该智能体吗？此操作在集群环境中不可逆！",
    )
  )
    return;
  try {
    if (!id) return;
    await deleteAgent(id);
    backToAgentsList();
  } catch (error) {
    console.error("删除智能体异常:", error);
  }
};

// 安全格式化配置参数
const formattedConfig = computed(() => {
  if (!store.currentAgent?.configJson) return "{}";
  try {
    const parsed = JSON.parse(store.currentAgent.configJson);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return store.currentAgent?.configJson || "{}";
  }
});

// 查询agent 详情
const getAgentDetail = async (id: number | undefined) => {
  try {
    if (!id) return;
    const res = await getAgentById(id);
    console.log("res", res);
  } catch (error) {
    console.error("查询agent 详情异常:", error);
  }
};

onMounted(() => {
  getAgentDetail(store.currentAgent?.id);
});
</script>

<style scoped>
/* 优雅的全屏入场微渐变动效 */
.animate-fadeIn {
  animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 科技暗色调轻量滚动条系统 */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #060c14;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #142338;
  border-radius: 2.5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #1e3452;
}
</style>
