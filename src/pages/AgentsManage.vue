<template>
  <div class="h-full bg-[#060c14] text-[#a3b8cc] p-6 font-sans select-none overflow-y-auto custom-scrollbar">

    <div
      class="bg-[#0b131f]/60 border border-[#1a2b42] rounded px-6 py-4 flex items-center justify-between mb-6 text-sm">
      <div class="flex items-center gap-2">
        <div class="w-2 h-4 bg-[#00f3ff] rounded-sm"></div>
        <span class="text-white font-medium text-base">云脑智能体管理中心</span>
      </div>

      <div class="flex items-center gap-12 text-xs">
        <div>
          智能体总量
          <span class="text-white text-lg font-mono ml-2 font-bold">{{
            store.agentsList.length
          }}</span>
        </div>
        <div class="border-l border-[#1a2b42] h-4"></div>
        <div>
          运行中
          <span class="text-[#00ffc4] text-lg font-mono ml-2 font-bold">{{
            store.runningAgents.length
          }}</span>
        </div>
        <div class="border-l border-[#1a2b42] h-4"></div>
        <div>
          空闲中
          <span class="text-[#00ffc4] text-lg font-mono ml-2 font-bold">{{
            idleAgents
          }}</span>
        </div>
        <div class="border-l border-[#1a2b42] h-4"></div>
        <div>
          离线中
          <span class="text-[#ef4444] text-lg font-mono ml-2 font-bold">{{
            offlineAgents
          }}</span>
        </div>
        <div class="border-l border-[#1a2b42] h-4"></div>
        <div>
          总任务
          <span class="text-white text-lg font-mono ml-2 font-bold">1</span>
        </div>
        <div class="border-l border-[#1a2b42] h-4"></div>
        <div>
          成功率
          <span class="text-[#00f3ff] text-lg font-mono ml-2 font-bold">89.2%</span>
        </div>
      </div>
    </div>

    <div class="bg-[#0b131f]/40 border border-[#142338] rounded p-4 mb-6 space-y-4 text-xs">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="relative w-72">
          <input v-model="searchQuery" type="text" placeholder="搜索agent"
            class="w-full bg-[#0c1624] border border-[#203554] rounded px-3 py-1.5 text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60 text-xs" />
        </div>
        <div class="flex gap-2">
          <button
            class="bg-[#11233b] hover:bg-[#183254] border border-[#203a5e] text-[#00f3ff] px-3 py-1.5 rounded transition-colors"
            @click="openAddModal">
            + 新增agent
          </button>
          <button
            class="bg-[#0f1b2d] hover:bg-[#16273f] border border-[#1e3452] px-3 py-1.5 rounded transition-colors cursor-pointer"
            @click="$router.push('/agentTaskEdit')">
            分析任务编排
          </button>
          <button
            class="bg-[#0f1b2d] hover:bg-[#16273f] border border-[#1e3452] px-3 py-1.5 rounded transition-colors cursor-pointer"
            @click="$router.push('/agentsdashboard')">
            实时任务看板
          </button>
        </div>
      </div>

      <div class="space-y-3 pt-2 border-t border-[#122033]">
        <div v-for="filter in filterConfigs" :key="filter.label" class="flex items-start gap-4">
          <span class="text-[#526e8c] w-20 py-1 flex-shrink-0 text-right">{{
            filter.label
          }}</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button v-for="option in filter.options" :key="option" @click="handleFilterChange(filter.key, option)"
              :class="[
                activeFilters[filter.key] === option
                  ? 'bg-[#162d4a] text-white border-[#2b5384]'
                  : 'bg-[#0b1421] text-[#708aa6] border-[#16253a] hover:border-[#223957] hover:text-[#a3b8cc]',
                'border px-2 py-0.5 rounded transition-all min-w-[48px] text-center',
              ]">
              {{ option }}
            </button>
          </div>
        </div>

        <div v-if="activeFilters['domain'] === '军事'"
          class="flex items-start gap-4 bg-[#09101a] p-2 rounded border border-[#132238] ml-24">
          <span class="text-[#415973] py-0.5 text-[11px]">选择子领域</span>
          <div class="flex gap-1.5">
            <button v-for="sub in [
              '全部',
              '天基',
              '空基',
              '地基',
              '海基',
              '网基',
              '认知',
            ]" :key="sub" @click="activeSubDomain = sub" :class="activeSubDomain === sub
              ? 'border-[#00f3ff]/50 text-[#00f3ff] bg-[#10243a]'
              : 'border-[#1b2e47] text-[#526e8c] bg-[#0c1521]'
              " class="border px-2 py-0.5 rounded text-[11px]">
              {{ sub }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AgentCard v-for="agent in filteredAgents" :key="agent.id" :agent="agent" @view-detail="openDetail"
        @edit="openEditModal" @delete="handleDeleteAgent" @toggle-status="handleToggleStatus" />
    </div>
    <AgentFormModal :is-open="formModalOpen" :initial-data="store.currentAgent" @delete="handleDeleteAgent"
      @toggle-status="handleToggleStatus" @close="formModalOpen = false" @submit="handleFormSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import AgentCard from "@/components/AgentCard.vue";
import type { AgentDefinition } from "@/types/agent";
import AgentFormModal from "@/components/AgentFormModal.vue"; // 👈 引入表单
import {
  createAgent,
  updateAgent,
  deleteAgent,
  toggleAgentStatus,
} from "@/api/agents-api"; // 👈 整合全套 CRUD 接口
import { useAgentStore } from "@/store/modules/agentStore";
import { useRouter } from "vue-router";
const store = useAgentStore();
// 搜索文本
const searchQuery = ref("");
const activeSubDomain = ref("全部");
const router = useRouter();
// 筛选维度配置
const filterConfigs = [
  {
    label: "Agent类型",
    key: "type",
    options: ["全部", "角色模拟型", "功能型", "调度型"],
  },
  {
    label: "分类",
    key: "classification",
    options: ["全部", "红方", "蓝方"],
  },
  {
    label: "领域",
    key: "domain",
    options: ["全部", "军事", "地缘", "经济", "社会", "情报"],
  },
  {
    label: "当前状态",
    key: "status",
    options: ["全部", "运行中", "空闲中", "离线中"],
  },
  {
    label: "成功率区间",
    key: "successRate",
    options: [
      "全部",
      ">90%",
      ">80%",
      ">70%",
      ">60%",
      ">50%",
      ">40%",
      ">30%",
      ">20%",
      ">10%",
      "<10%",
    ],
  },
  {
    label: "底层模型",
    key: "model",
    options: ["全部", "GPT-4o", "Deepseek-R1", "GEMINI 3.1"],
  },
];

// 当前选中的筛选值
const activeFilters = reactive<Record<string, string>>({
  type: "全部",
  classification: "全部",
  domain: "全部",
  status: "全部",
  successRate: "全部",
  model: "全部",
});

// 更改筛选处理
const handleFilterChange = (key: string, option: string) => {
  activeFilters[key] = option;
};

// 计算属性：客户端多重过滤
const filteredAgents = computed(() => {
  return store.agentsList.filter((agent) => {
    // 1. 搜索词过滤
    if (searchQuery.value && !agent.name.includes(searchQuery.value))
      return false;

    // 2. 类型过滤 (主行)
    if (
      activeFilters.type !== "全部" &&
      !agent.category.includes(activeFilters.type)
    )
      return false;

    // 3. 模型过滤
    if (
      activeFilters.model !== "全部" &&
      agent.modelName !== activeFilters.model
    )
      return false;

    // 4. 状态过滤
    // if (
    //   activeFilters.status !== "全部" &&
    //   agent.status !== activeFilters.status
    // )
    //   return false;

    // 5.红方蓝方
    const stance = activeFilters.classification === "红方" ? "RED" : "BLUE";
    if (activeFilters.classification !== "全部" && agent.stance !== stance)
      return false;

    return true;
  });
});

// 点击查看详情，填充并展开侧边栏（对接图3完整结构数据）
const openDetail = (agent: AgentDefinition) => {
  store.setCurrentAgent(agent);
  router.push({ name: "AgentDetail", query: { id: agent.id } });
};

const idleAgents = ref(0);
const offlineAgents = ref(0);


// 弹窗控制状态
const formModalOpen = ref(false);
// 打开新增弹窗
const openAddModal = () => {
  store.setCurrentAgent(null);
  formModalOpen.value = true;
};

// 打开编辑弹窗
const openEditModal = (agent: AgentDefinition) => {
  store.setCurrentAgent(agent);
  formModalOpen.value = true;
};

// 二与三、增与改的处理 (Create & Update)
const handleFormSubmit = async (formData: any) => {
  try {
    if (store.currentAgent) {
      // 存在旧数据 -> 执行更新 (Update)
      await updateAgent(formData.id, formData);
      console.log(`Agent ${formData.name} 更新成功`);
    } else {
      // 无旧数据 -> 执行注册 (Create)
      await createAgent(formData);
      console.log(`新 Agent ${formData.name} 注册成功`);
    }
    formModalOpen.value = false;
    store.fetchAgentsData(); // 重新加载列表数据
  } catch (error) {
    console.error("提交数据异常:", error);
    alert("基础服务异常，保存失败，请检查网络后台。");
  }
};

// 四、删 (Delete)
const handleDeleteAgent = async (id: number | string) => {
  if (
    !confirm(
      "⚠️ 警告：确定要彻底注销删除该智能体吗？此操作在集群环境中不可逆！",
    )
  )
    return;
  try {
    await deleteAgent(id);
    store.fetchAgentsData(); // 刷新
  } catch (error) {
    console.error("删除智能体异常:", error);
  }
};

// 五、状态快速切换 (Partial Toggle Update)
const handleToggleStatus = async (id: number | string) => {
  try {
    await toggleAgentStatus(id);
    store.fetchAgentsData(); // 状态改变后重载以保持同步数据
  } catch (error) {
    console.error("集群状态调配异常:", error);
  }
};


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
