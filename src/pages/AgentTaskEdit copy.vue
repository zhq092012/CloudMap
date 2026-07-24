<template>
  <div class="h-full bg-[#060c14] text-[#a3b8cc] font-sans flex select-none overflow-hidden custom-scrollbar">
    <div class="w-72 border-r border-[#142338] bg-[#09111a] flex flex-col flex-shrink-0">

      <div class="p-4 border-b border-[#142338]">
        <h2 class="text-white font-medium text-xs tracking-wider pb-2">
          分析功能节点列表
        </h2>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <svg class="w-3.5 h-3.5 text-[#526e8c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input v-model="searchQuery" type="text" placeholder="搜索功能节点"
            class="w-full bg-[#0c1624] border border-[#203554] rounded pl-8 pr-3 py-1.5 text-white placeholder-[#526e8c] focus:outline-none focus:border-[#00f3ff]/60 text-xs" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <div v-for="menu in menuData" :key="menu.title" class="space-y-1">
          <div @click="menu.expanded = !menu.expanded"
            class="flex items-center justify-between px-2 py-1.5 text-xs font-medium rounded hover:bg-[#121f30] cursor-pointer transition-colors">
            <span class="text-white flex items-center gap-1.5">
              <span class="text-[10px] transform transition-transform duration-200"
                :class="menu.expanded ? 'rotate-90' : ''">▶</span>
              {{ menu.title }}
            </span>
          </div>

          <div v-show="menu.expanded" class="pl-4 space-y-1">
            <div v-for="sub in filterSubNodes(menu.children)" :key="sub.id" draggable="true"
              @dragstart="handleDragStart($event, sub)" :class="[
                selectedSubNodeId === sub.id
                  ? 'border-[#00f3ff]/40 bg-[#112239] text-[#00f3ff]'
                  : 'border-[#1a2b42] bg-[#0c1421] hover:border-[#203a5e] hover:text-white',
                'border rounded px-3 py-2 text-[11px] flex justify-between items-center cursor-grab active:cursor-grabbing transition-all',
              ]" @click="selectedSubNodeId = sub.id">
              <span>{{ sub.name }}</span>
              <span class="text-[#526e8c] text-[10px]">({{ sub.agentCount }} agent)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-[#060c14]">
      <div class="h-12 border-b border-[#142338] bg-[#0a111a] flex items-center justify-between px-4 text-xs">
        <div class="flex items-center gap-2">
          <span class="text-[#526e8c]">当前选中：</span>
          <span class="text-white font-medium text-sm">意图穷举</span>
        </div>

        <div class="flex gap-2">
          <button @click="deleteSelected"
            class="bg-[#2d1616] hover:bg-[#3d1a1a] border border-[#4a1e1e] text-[#ef4444] px-3 py-1.5 rounded transition-colors mr-2 cursor-pointer">
            删除选中节点/线
          </button>

          <div class="flex items-center gap-2 bg-[#121f30] border border-[#223652] text-white px-3 py-1.5 rounded">
            <span>编辑模式:</span>
            <el-switch v-model="isCreateEdgeMode" size="medium" inline-prompt active-text="连线" inactive-text="拖拽" style="
                --el-switch-on-color: #075985;
                --el-switch-off-color: #c2410c;
              " />
          </div>
          <button
            class="bg-[#121f30] hover:bg-[#1d3047] border border-[#223652] text-white px-3 py-1.5 rounded transition-colors">
            查看agent清单
          </button>
          <button
            class="bg-[#11233b] hover:bg-[#183254] border border-[#203a5e] text-[#00f3ff] px-3 py-1.5 rounded transition-colors">
            导出agent配置
          </button>
        </div>
      </div>

      <div class="flex-1 p-4 relative">
        <div class="absolute inset-4 bg-[#09101a] border border-[#142338] rounded flex flex-col overflow-hidden">
          <div class="px-3 py-1.5 text-[11px] text-[#526e8c] bg-[#0d1522] border-b border-[#142338] select-none">
            Agent协作拓扑图 (按住 Shift 可进行手动节点拉线连结)
          </div>

          <div ref="graphContainer" class="flex-1 w-full h-full relative outline-none" @dragover.prevent
            @drop="handleDrop"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Graph } from "@antv/g6";
import type { AgentDefinition } from "@/types/agent";
import { getAgentList, previewWorkflow } from "@/api/agents-api";

// 接口及状态定义
interface SubNode {
  id: string;
  name: string;
  agentCount: number;
}
interface MenuModule {
  title: string;
  expanded: boolean;
  children: SubNode[];
}

const searchQuery = ref("");
const selectedSubNodeId = ref("blue-coa");
const graphContainer = ref<HTMLDivElement | null>(null);
let graphInstance: Graph | null = null;

// 被拖动的暂存节点数据
let draggedNodeData: SubNode | null = null;

// 数据集合
const agentsList = ref<AgentDefinition[]>([]);
async function fetchAgentsData() {
  try {
    const res = await getAgentList();
    agentsList.value = res;
    // 3. 当数据完全加载后，在这里动态为各个分类填充 children
    menuData.value[0].children = res
      .filter((agent) => agent.category === "TOOL")
      .map((agent) => ({
        id: agent.name,
        name: agent.displayName || agent.name,
        agentCount: 1,
      }));

    menuData.value[1].children = res
      .filter((agent) => agent.category === "ANALYSIS")
      .map((agent) => ({
        id: agent.name,
        name: agent.displayName || agent.name,
        agentCount: 1,
      }));

    menuData.value[2].children = res
      .filter((agent) => agent.category === "DECISION")
      .map((agent) => ({
        id: agent.name,
        name: agent.displayName || agent.name,
        agentCount: 1,
      }));
  } catch (error) {
    console.error("加载节点列表失败:", error);
  }
}

onMounted(() => {
  fetchAgentsData();
});

// 左侧列表数据模拟
const menuData = ref<MenuModule[]>([
  {
    title: "工具型",
    expanded: false,
    children: [],
  },
  {
    title: "分析型",
    expanded: false,
    children: [],
  },
  {
    title: "决策型",
    expanded: true,
    children: [],
  },
]);

// 节点检索过滤
const filterSubNodes = (nodes: SubNode[]) => {
  if (!searchQuery.value) return nodes;
  return nodes.filter((n) => n.name.includes(searchQuery.value));
};

// --- 拖拽处理部分 ---
const handleDragStart = (e: DragEvent, node: SubNode) => {
  draggedNodeData = node;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
  }
};

const handleDrop = (e: DragEvent) => {
  if (!graphInstance || !graphContainer.value || !draggedNodeData) return;

  const canvasPoint = graphInstance.getCanvasByClient([e.clientX, e.clientY]);
  const newId = `node-${Date.now()}`;

  graphInstance.addData({
    nodes: [
      {
        id: newId,
        style: {
          x: canvasPoint[0],
          y: canvasPoint[1],
        },
        data: {
          title: `${draggedNodeData.name}`,
          subText: `⚡ 内置协同: ${draggedNodeData.agentCount}个Agent`,
        },
      },
    ],
  });

  graphInstance.render();
  draggedNodeData = null;
};

const isCreateEdgeMode = ref(false);

watch(isCreateEdgeMode, (isCreating) => {
  if (!graphInstance) return;
  if (isCreating) {
    graphInstance.setBehaviors((behaviors) =>
      behaviors
        .filter((b) => b !== "drag-element")
        .concat({ type: "create-edge", trigger: "drag" }),
    );
  } else {
    graphInstance.setBehaviors((behaviors) =>
      behaviors
        .filter((b: any) => b.type !== "create-edge")
        .concat("drag-element"),
    );
  }
});

// --- 初始化 AntV G6 v5 ---
onMounted(async () => {
  await nextTick();

  if (!graphContainer.value) return;

  // 初始化拓扑图配置
  graphInstance = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
    autoResize: true,
    animation: true,
    behaviors: ["drag-canvas", "zoom-canvas", "drag-element", "click-select"],
    node: {
      type: "rect",
      style: {
        size: [180, 56],
        radius: 4,
        fill: "#121f30",
        stroke: "#1e3452",
        lineWidth: 1,
        labelText: (d: any) => d.data.title,
        labelFill: "#ffffff",
        labelFontSize: 11,
        labelWordWrap: true,
        labelMaxWidth: 160,
        labelPlacement: "center",
      },
      state: {
        selected: {
          stroke: "#00f3ff",
          lineWidth: 2,
          fill: "#162d4a",
        },
      },
    },
    edge: {
      type: "polyline",
      style: {
        stroke: "#2c4261",
        lineWidth: 1.5,
        endArrow: true,
        endArrowType: "vee",
        endArrowSize: 8,
        router: "orthogonal",
      },
      state: {
        selected: {
          stroke: "#00f3ff",
          lineWidth: 2,
        },
      },
    },
  });

  try {
    // 1. 获取工作流预览数据
    const workflow = await previewWorkflow();
    console.log("workflow", workflow);

    if (workflow && workflow.length > 0) {
      // 2. 按 stepOrder 升序排序，确保连线顺序无误
      const sortedWorkflow = [...workflow].sort(
        (a, b) => a.stepOrder - b.stepOrder,
      );

      // 3. 计算自适应网格位置（每行放 3 个节点，防止横向无限溢出）
      const COL_COUNT = 3;
      const X_SPACE = 240;
      const Y_SPACE = 140;
      const START_X = 120;
      const START_Y = 90;

      const nodes = sortedWorkflow.map((item, index) => {
        const col = index % COL_COUNT;
        const row = Math.floor(index / COL_COUNT);

        return {
          id: `step-${item.stepOrder}`, // 使用 stepOrder 作为唯一标识 ID
          style: {
            x: START_X + col * X_SPACE,
            y: START_Y + row * Y_SPACE,
          },
          data: {
            // 利用 \n 换行，完美契合现有的 labelWordWrap 配置
            title: `${item.stepOrder}. ${item.stepName}\n[${item.agent.displayName || item.agent.name}]`,
            subText: `🤖 驱动: ${item.agent.name}`,
          },
        };
      });

      // 4. 动态构建线性依赖关系边（1->2->3...->8->9）
      const edges = [];
      for (let i = 0; i < sortedWorkflow.length - 1; i++) {
        const current = sortedWorkflow[i];
        const next = sortedWorkflow[i + 1];
        edges.push({
          id: `edge-${current.stepOrder}-${next.stepOrder}`,
          source: `step-${current.stepOrder}`,
          target: `step-${next.stepOrder}`,
        });
      }

      // 5. 将转换好的数据注入 G6 实例中
      graphInstance.setData({ nodes, edges });
    }
  } catch (error) {
    console.error("拓扑图工作流数据解析/获取失败:", error);
  }

  // 6. 渲染画布
  graphInstance.render();
});

// 关键修正 3：完善节点与关系线的删除逻辑
const deleteSelected = () => {
  if (!graphInstance) return;

  // 利用 G6 自带的 'click-select' 行为，直接从图中查找处于 'selected' 状态的元素
  const selectedNodes = graphInstance.getElementDataByState("node", "selected");
  if (selectedNodes.length) {
    graphInstance.removeNodeData(
      selectedNodes
        .map((node) => node.id)
        .filter((id): id is string => id !== undefined),
    );
  }

  const selectedEdges = graphInstance.getElementDataByState("edge", "selected");
  if (selectedEdges.length) {
    graphInstance.removeEdgeData(
      selectedEdges
        .map((edge) => edge.id)
        .filter((id): id is string => id !== undefined),
    );
  }

  // 仅当有元素被删除时才重新渲染，避免不必要的操作
  if (selectedNodes.length || selectedEdges.length) {
    graphInstance.render();
  }
};

// 组件销毁清空画布实例
onUnmounted(() => {
  if (graphInstance) {
    graphInstance.destroy();
  }
});
</script>

<style scoped>
/* 自定义科技暗色调轻量滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #09111a;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #142338;
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #1e3452;
}
</style>
