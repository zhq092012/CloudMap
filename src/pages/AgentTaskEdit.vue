<template>
  <div class="h-full bg-[#060c14] text-[#a3b8cc] font-sans flex select-none overflow-hidden custom-scrollbar">
    <div class="w-72 border-r border-[#142338] bg-[#09111a] flex flex-col shrink-0">

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
              ]" @click="handleMenuClick(sub)">
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
          <span class="text-white font-medium text-sm">{{ currentTaskType || '未选择' }}</span>
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
          <button @click="isRightSidebarVisible = !isRightSidebarVisible"
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
          <!-- 逐行添加图graph 产生的过程说明，并一个节点一个节点进行绘制 -->
          <div ref="graphContainer" class="flex-1 w-full h-full relative outline-none" @dragover.prevent
            @drop="handleDrop">
            <!-- AI 推理过程文字叠加层 -->
            <div v-if="reasoningText" class="reasoning-overlay">
              <div class="reasoning-header">
                <span class="reasoning-icon">🧠</span>
                <span class="reasoning-label">AI 推理过程</span>
                <span v-if="isReasoning" class="reasoning-status">思考中...</span>
                <span v-else class="reasoning-done">✓ 完成</span>
              </div>
              <div class="reasoning-body custom-scrollbar" ref="reasoningBodyRef">
                <span class="reasoning-content" v-html="reasoningText"></span>
                <span v-if="isReasoning" class="typing-cursor">▌</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧侧边栏：Agent清单 -->
    <div v-if="isRightSidebarVisible"
      class="w-80 border-l border-[#142338] bg-[#09111a] flex flex-col shrink-0 transition-all duration-300">
      <div class="h-12 border-b border-[#142338] bg-[#0a111a] flex items-center justify-between px-4 text-xs shrink-0">
        <span class="text-white font-medium text-xs">Agent 列表清单</span>
        <button @click="isRightSidebarVisible = false" class="text-[#526e8c] hover:text-white cursor-pointer">
          关闭
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        <div v-for="agent in agentStore.agentsList" :key="agent.id" draggable="true"
          @dragstart="handleAgentDragStart($event, agent)" :class="[
            'p-3 bg-[#0c1421] border rounded text-xs space-y-2 transition-all cursor-grab active:cursor-grabbing',
            agent.stance === 'RED'
              ? 'border-[#ef4444]/50 hover:border-[#ef4444] hover:text-white'
              : agent.stance === 'BLUE'
                ? 'border-[#3b82f6]/50 hover:border-[#3b82f6] hover:text-white'
                : 'border-[#203554] hover:border-[#00f3ff]/40 hover:text-white',
          ]">
          <div class="flex justify-between items-start">
            <span class="text-white font-semibold">{{
              agent.displayName || agent.name
            }}</span>
            <span :class="[
              'px-1.5 py-0.5 rounded text-[9px] font-semibold border scale-90 origin-right',
              agent.enabled
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-700 text-slate-400',
            ]">
              {{ agent.enabled ? "启用" : "禁用" }}
            </span>
          </div>

          <div class="text-[10px] text-[#526e8c] flex gap-2">
            <span class="bg-[#121f30] px-1.5 py-0.5 rounded text-[#00f3ff]">{{
              agent.agentType
            }}</span>
            <span class="bg-[#121f30] px-1.5 py-0.5 rounded text-amber-500">{{
              agent.category
            }}</span>
          </div>

          <p class="text-[11px] text-[#708aa6] leading-relaxed">
            {{ agent.description || "暂无描述" }}
          </p>

          <div class="pt-2 border-t border-[#142338] text-[9px] text-[#526e8c] space-y-1">
            <div>
              模型: <span class="text-slate-300">{{ agent.modelName }}</span>
            </div>
            <div class="flex flex-wrap gap-1" v-if="agent.skillNames && agent.skillNames.length">
              <span>技能:</span>
              <span v-for="skill in agent.skillNames" :key="skill"
                class="bg-slate-900 border border-slate-800 text-slate-400 px-1 rounded-sm">
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, nextTick, watch } from "vue";
import { Graph } from "@antv/g6";
import type { AgentDefinition } from "@/types/agent";
import { useAgentStore } from "@/store/modules/agentStore";
import { getTaskFlowInformations } from "@/api/agents-api";
import { storeToRefs } from "pinia";

const agentStore = useAgentStore();
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
const selectedSubNodeId = ref("sa-brief");
const graphContainer = ref<HTMLDivElement | null>(null);

const taskTypeToSubNodeIdMap: Record<string, string> = {
  '态势感知': 'sa-brief',
  '潜在异常': 'sa-abnormal',
  '意图穷举': 'da-exhaust',
  '蓝方方案': 'da-expand',
  '红方方案': 'blue-coa'
};

const handleMenuClick = (sub: SubNode) => {
  selectedSubNodeId.value = sub.id;
  agentStore.setCurrentTaskType(sub.name as any);
};
const reasoningBodyRef = ref<HTMLDivElement | null>(null);
let graphInstance: Graph | null = null;

// AI 推理文字相关状态
const reasoningText = ref("");
const isReasoning = ref(false);

// 逐字打字机效果函数
const typeText = async (text: string, charDelay = 30) => {
  for (let i = 0; i < text.length; i++) {
    if (!graphInstance) return; // 组件销毁时停止
    reasoningText.value += text[i];
    // 自动滚动到底部
    await nextTick();
    if (reasoningBodyRef.value) {
      reasoningBodyRef.value.scrollTop = reasoningBodyRef.value.scrollHeight;
    }
    await new Promise((r) => setTimeout(r, charDelay));
  }
};



// 被拖动的暂存节点数据
let draggedNodeData: SubNode | null = null;
let draggedAgentData: AgentDefinition | null = null;

// 左侧列表数据模拟
const menuData = reactive<MenuModule[]>([
  {
    title: "态势感知模块",
    expanded: true,
    children: [
      { id: "sa-brief", name: "态势感知", agentCount: 6 },
    ],
  },
  {
    title: "异常征候模块",
    expanded: true,
    children: [{ id: "sa-abnormal", name: "潜在异常", agentCount: 5 }],
  },
  {
    title: "深度分析模块",
    expanded: true,
    children: [
      { id: "da-exhaust", name: "意图穷举", agentCount: 8 },
      { id: "da-expand", name: "蓝方方案", agentCount: 5 },
      { id: "blue-coa", name: "红方方案", agentCount: 9 },
    ],
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
  draggedAgentData = null;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
  }
};

const handleAgentDragStart = (e: DragEvent, agent: AgentDefinition) => {
  draggedAgentData = agent;
  draggedNodeData = null;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
  }
};

const handleDrop = (e: DragEvent) => {
  if (!graphInstance || !graphContainer.value) return;

  const canvasPoint = graphInstance.getCanvasByClient([e.clientX, e.clientY]);
  const newId = `node-${Date.now()}`;

  if (draggedNodeData) {
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
    draggedNodeData = null;
  } else if (draggedAgentData) {
    graphInstance.addData({
      nodes: [
        {
          id: newId,
          style: {
            x: canvasPoint[0],
            y: canvasPoint[1],
          },
          data: {
            title: `${draggedAgentData.displayName || draggedAgentData.name}`,
            subText: `🧠 模型: ${draggedAgentData.modelName}`,
          },
        },
      ],
    });
    draggedAgentData = null;
  } else {
    return;
  }

  graphInstance.render();
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
const isRightSidebarVisible = ref(true);
const { currentTaskType, eventId } = storeToRefs(agentStore);

// 根据 TaskFlowInformations 列表构建节点、关系和推理过程的渲染逻辑
const renderGraph = async (flowData: any[]) => {
  if (!graphContainer.value) return;

  // 1. 若已有实例，先销毁清理
  if (graphInstance) {
    graphInstance.destroy();
    graphInstance = null;
  }

  // 2. 清空并启动推理文字层
  reasoningText.value = "";
  isReasoning.value = true;

  // 3. 动态计算节点布局坐标
  const levelXMap: Record<string, number> = {
    "1": 240,
    "2": 580,
    "3": 900,
  };

  // 按 level 对节点进行分组
  const levelGroups: Record<string, any[]> = {};
  flowData.forEach((item) => {
    const lvl = item.level || "1";
    if (!levelGroups[lvl]) {
      levelGroups[lvl] = [];
    }
    levelGroups[lvl].push(item);
  });

  const allNodes: any[] = [];
  const allEdges: any[] = [];

  // 计算每组节点在画布上的 (x, y) 位置
  Object.keys(levelGroups).forEach((lvl) => {
    const group = levelGroups[lvl];
    const numNodes = group.length;
    const x = levelXMap[lvl] || 200 + (parseInt(lvl) - 1) * 320;

    group.forEach((item, index) => {
      let y = 320;
      if (numNodes > 1) {
        const spacing = 100;
        y = 320 + (index - (numNodes - 1) / 2) * spacing;
      }

      // 匹配 agentStore 中的定义获取显示名称和模型
      const agent = agentStore.agentsList.find((a) => a.id === item.agentId);
      const title = agent ? (agent.displayName || agent.name) : (item.outputContent ? item.outputContent.split("：")[0].replace("**", "") : `智能体-${item.agentId}`);
      const subText = agent ? `🧠 模型: ${agent.modelName}` : `ID: ${item.agentId}`;

      allNodes.push({
        id: String(item.agentId),
        style: { x, y },
        data: {
          title,
          subText,
          thinkContent: item.thinkContent,
          outputContent: item.outputContent,
        },
      });
    });
  });

  // 收集并去重连接关系边
  const edgeSet = new Set<string>();
  const addEdge = (source: string, target: string) => {
    const key = `${source}->${target}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      allEdges.push({
        id: `e_${source}_${target}`,
        source,
        target,
      });
    }
  };

  flowData.forEach((item) => {
    const currentId = String(item.agentId);
    if (item.parentNode !== null && item.parentNode !== undefined) {
      addEdge(String(item.parentNode), currentId);
    }
    if (item.childNode !== null && item.childNode !== undefined) {
      addEdge(currentId, String(item.childNode));
    }
  });

  // 4. 创建 G6 Graph 实例
  graphInstance = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
    autoResize: true,
    animation: true,
    behaviors: [
      "drag-canvas",
      "zoom-canvas",
      "drag-element",
      "click-select",
    ],
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
    data: {
      nodes: [],
      edges: [],
    },
  });

  // 首次渲染空画布
  await graphInstance.render();

  // 5. 启动打字机逻辑与拓扑元素动态绘制
  const initText = `正在初始化 Agent 协作拓扑画布……\n分析【${currentTaskType.value || "态势感知"}】任务编排结构，准备构建节点拓扑关系图。\n\n`;
  await typeText(initText, 15);

  const nodeDelay = 150;
  for (let i = 0; i < allNodes.length; i++) {
    if (!graphInstance) return;

    const node = allNodes[i];
    const nodeText = `► 创建节点【${node.data.title}】\n` +
      `  - 任务分级: Level ${flowData[i]?.level || "未知"}\n` +
      `  - 思考过程: ${node.data.thinkContent || "正在对任务条件进行推理解析..."}\n\n`;

    // 动态调整打字机字符打印速度，确保长段文本打印体验流畅不拖沓
    const charDelay = Math.max(2, Math.min(15, Math.floor(1000 / nodeText.length)));
    await typeText(nodeText, charDelay);

    await new Promise((resolve) => setTimeout(resolve, nodeDelay));
    if (!graphInstance) return;

    graphInstance.addData({ nodes: [node] });
    await graphInstance.render();
  }

  const edgeIntroText = "所有分析节点绘制就绪，正在生成多智能体协同网络边……\n\n";
  await typeText(edgeIntroText, 15);

  const edgeDelay = 100;
  for (let i = 0; i < allEdges.length; i++) {
    if (!graphInstance) return;

    const edge = allEdges[i];
    const sourceNode = allNodes.find((n) => n.id === edge.source);
    const targetNode = allNodes.find((n) => n.id === edge.target);
    const sourceName = sourceNode ? sourceNode.data.title : `智能体-${edge.source}`;
    const targetName = targetNode ? targetNode.data.title : `智能体-${edge.target}`;

    const edgeText = `→ 连线构建: 【${sourceName}】 ──► 【${targetName}】 (建立数据汇聚与协同研判通道)\n`;
    await typeText(edgeText, 12);

    await new Promise((resolve) => setTimeout(resolve, edgeDelay));
    if (!graphInstance) return;

    graphInstance.addData({ edges: [edge] });
    await graphInstance.render();
  }

  const doneText = `\n✅ 协同拓扑关系网络构建成功！\n共注册 ${allNodes.length} 个分析节点与 ${allEdges.length} 条协作关系通道。\n您可以随时对节点进行拖拽调整或执行新增连线。`;
  await typeText(doneText, 15);
  isReasoning.value = false;
};

// 监听任务类型变化
watch(
  () => currentTaskType.value,
  async (newType) => {
    if (newType) {
      if (taskTypeToSubNodeIdMap[newType]) {
        selectedSubNodeId.value = taskTypeToSubNodeIdMap[newType];
      }
      // 确保 DOM 容器已挂载
      await nextTick();
      // 确保 store 中的 Agent 列表数据已加载，以映射节点展示的详情
      if (!agentStore.agentsList || agentStore.agentsList.length === 0) {
        await agentStore.fetchAgentsData();
      }
      switch (newType) {
        case '意图穷举':
          // 请求对应的任务编排工作流
          getTaskFlowInformations(1, eventId.value || 1, '意图穷举').then((res) => {
            if (res && res.length) {
              renderGraph(res);
            }
          });
          break;
        case '态势感知':
          // 请求对应的任务编排工作流
          getTaskFlowInformations(1, eventId.value || 1, '态势感知').then((res) => {
            if (res && res.length) {
              renderGraph(res);
            }
          });
          break;
        case '潜在异常':
          // 请求对应的任务编排工作流
          getTaskFlowInformations(1, eventId.value || 1, '潜在异常').then((res) => {
            if (res && res.length) {
              renderGraph(res);
            }
          });
          break;
        case '蓝方方案':
          // 请求对应的任务编排工作流
          getTaskFlowInformations(1, eventId.value || 1, '蓝方方案').then((res) => {
            if (res && res.length) {
              renderGraph(res);
            }
          });
          break;
        case '红方方案':
          // 请求对应的任务编排工作流
          getTaskFlowInformations(1, eventId.value || 1, '红方方案').then((res) => {
            if (res && res.length) {
              renderGraph(res);
            }
          });
          break;
        default:
          break;
      }





    }
  },
  { immediate: true }
);

onMounted(async () => {


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

/* ===== AI 推理过程叠加层样式 ===== */
.reasoning-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 340px;
  max-height: calc(100% - 24px);
  background: rgba(6, 12, 20, 0.92);
  border: 1px solid #1e3452;
  border-radius: 8px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(0, 243, 255, 0.05);
  overflow: hidden;
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid #142338;
  background: rgba(13, 21, 34, 0.8);
  font-size: 11px;
  flex-shrink: 0;
}

.reasoning-icon {
  font-size: 13px;
}

.reasoning-label {
  color: #00f3ff;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.reasoning-status {
  margin-left: auto;
  color: #f59e0b;
  font-size: 10px;
  animation: pulse-status 1.5s ease-in-out infinite;
}

.reasoning-done {
  margin-left: auto;
  color: #34d399;
  font-size: 10px;
}

.reasoning-body {
  padding: 10px 12px;
  font-size: 11px;
  line-height: 1.7;
  color: #8faabe;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.reasoning-content {
  color: #8faabe;
}

/* 闪烁的打字光标 */
.typing-cursor {
  color: #00f3ff;
  font-weight: bold;
  animation: blink-cursor 0.8s step-end infinite;
}

@keyframes blink-cursor {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

@keyframes pulse-status {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}
</style>
