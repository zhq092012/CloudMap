<template>
  <div class="w-full h-full min-h-187.5 bg-[#0b0f19] flex flex-col relative select-none">
    <div class="p-3 bg-[#111625]/80 border-b border-slate-800/80 flex items-center justify-between z-10 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
          🧠 云脑多Agent并行推导
        </span>
      </div>

      <div class="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
        <span>画布操作: 鼠标滚轮缩放 | 拖拽任意画布与节点</span>
      </div>
    </div>

    <div ref="containerRef" class="flex-1 w-full h-full relative overflow-hidden">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-[#0b0f19]/90 z-20">
        <div class="text-center space-y-2">
          <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div class="text-xs text-slate-400 font-mono">
            正在渲染云脑智能推导拓扑图...
          </div>
        </div>
      </div>
    </div>

    <div class="shrink-0 border-t border-[#1e2d42] bg-[#080d16]/90" style="max-height: 260px; min-height: 120px;">
      <div class="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e2d42]">
        <el-icon class="text-[#38bdf8] text-sm"><Document /></el-icon>
        <span class="text-sm font-semibold text-slate-200">分析执行日志</span>
        <span v-if="store.progressLogs.length > 0" class="text-[10px] text-slate-500 font-mono">[{{ store.progressLogs.length }} 条]</span>
        <span v-if="store.isAnalyzing" class="ml-auto text-[10px] text-blue-400 animate-pulse">◉ 分析中...</span>
        <span v-else-if="store.progressLogs.some(l => l.type === 'success')" class="ml-auto text-[10px] text-emerald-400">✓ 完成</span>
        <span v-if="store.currentPhase >= 0" class="text-[10px] text-slate-400 font-mono">Phase {{
          store.currentPhase === 0 ? 'ORIGIN' : store.currentPhase === 1 ? 'INTENT' : store.currentPhase === 2 ? 'BLUE_PLAN' : store.currentPhase === 3 ? 'RED_PLAN' : 'EVALUATION'
        }}</span>
      </div>
      <div ref="logContainer" class="overflow-y-auto font-mono text-[11px] space-y-0.5 px-3" style="max-height: 230px;">
        <div v-for="(logItem, idx) in store.progressLogs" :key="idx"
          class="flex items-start gap-1.5 py-0.5 leading-relaxed"
          :class="{
            'text-blue-400': logItem.type === 'info',
            'text-emerald-400': logItem.type === 'success',
            'text-red-400': logItem.type === 'error',
            'text-amber-400': logItem.type === 'warning',
          }">
          <span class="text-slate-600 shrink-0 tabular-nums">{{ logItem.time }}</span>
          <span>{{ logItem.text }}</span>
        </div>
        <div v-if="store.progressLogs.length === 0" class="text-slate-600 text-center py-3">
          等待分析启动...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Graph } from "@antv/g6";
import type { EdgeData, GraphData, NodeData } from "@antv/g6";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { storeToRefs } from "pinia";
import { Document } from "@element-plus/icons-vue";

const store = useAnalysisStore();
const { rawNodes, rawEdges, selectedNode, progressLogs } = storeToRefs(store);
const containerRef = ref<HTMLDivElement | null>(null);
const logContainer = ref<HTMLDivElement | null>(null);
let graphInstance: Graph | null = null;
let resizeObserver: ResizeObserver | null = null;
const isLoading = ref(true);
let lastCanvasSize: { w: number; h: number } | null = null;
let resizeRaf = 0;
let renderChain: Promise<unknown> = Promise.resolve();

watch(
  () => progressLogs.value.length,
  async () => {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  }
);
// Handlers removed as they are currently unused in the template
async function doRenderGraph(fitView = false) {
  if (!graphInstance) return;

  graphInstance.setData(buildGraphData());
  await graphInstance.render();

  if (fitView) {
    const nodes = graphInstance.getNodeData();
    if (nodes && nodes.length > 0) {
      await graphInstance.fitView();
    }
  }
}

function renderGraph(fitView = false): Promise<unknown> {
  renderChain = renderChain.then(() => doRenderGraph(fitView)).catch(() => {});
  return renderChain;
}

// 监听节点和边的变化，重新构建图数据并自适应缩放视口
watch(
  [rawNodes, rawEdges],
  async () => {
    if (graphInstance) {
      await renderGraph(true);
    }
  },
  { deep: true },
);

// 监听选中节点的变化，更新高亮样式但不缩放视口以维持优良交互体验
watch(
  selectedNode,
  async () => {
    if (graphInstance) {
      await renderGraph(false);
    }
  }
);

function buildNodeData(node: NodeData): NodeData {
  let strokeColor = "#d97706"; // 默认边框颜色
  let labelFillColor = "#f8fafc"; // 默认标签颜色

  switch (node.type) {
    case "Origin":
      // 一级节点样式
      strokeColor = "#f59e0b";
      labelFillColor = "#f8fafc";
      break;
    case "Intent":
      // 二级节点样式
      strokeColor = "#10b981";
      labelFillColor = "#f8fafc";
      break;
    case "Attack":
      // 三级节点样式
      strokeColor = "#0ea5e9";
      labelFillColor = "#f8fafc";
      break;
    case "Defense":
      // 四级节点样式
      strokeColor = "#ef4444";
      labelFillColor = "#f8fafc";
      break;
    default:
      // 默认样式
      break;
  }

  const isSelected = store.selectedNode && store.selectedNode.id === node.id;

  // 判断是否需要粗虚线边框
  // 条件1: deleteStatus 为 1（已删除/已剪枝节点）
  const isDeleted = String(node.deleteStatus) === "1";

  // 条件2: isRecommended 值为 '不推荐'（从 nodeData JSON 解析）
  let parsedIsRecommended: any = undefined;
  let hasIsRecommended = false;
  try {
    const nd = node.nodeData;
    if (nd != null) {
      const parsed = typeof nd === "string" ? JSON.parse(nd) : nd;
      if (parsed && typeof parsed === "object" && "isRecommended" in parsed) {
        hasIsRecommended = true;
        parsedIsRecommended = parsed.isRecommended;
      }
    }
  } catch {
    // nodeData 解析失败，忽略
  }
  const isNotRecommended =
    hasIsRecommended &&
    (!parsedIsRecommended ||
      parsedIsRecommended === "不推荐" ||
      parsedIsRecommended === "false");
  const isDashed = isDeleted || isNotRecommended;

  return {
    id: node.id,
    type: "rect",
    text: node.text,
    _type: node.type || "Origin",
    isWarning: true,
    anomaly: node.anomaly,
    anomalyConf: node.anomalyConf,
    count: node.count,
    discoverTime: node.discoverTime,
    duration: node.duration,
    isAnalyzed: node.isAnalyzed,
    isHexagon: node.isHexagon,
    itemId: node.itemId,
    level: node.level,
    region: node.region,
    threat: node.threat,
    threatConf: node.threatConf,
    title: node.title,
    deleteStatus: node.deleteStatus,
    deleteReason: node.deleteReason,
    isRecommended: parsedIsRecommended,
    // 保留原始字段，供点击节点时获取
    confidence: node.confidence,
    createdAt: node.createdAt,
    nodeData: node.nodeData,
    nodeType: node.nodeType,
    style: {
      size: [360, 85] as [number, number],
      radius: 4,
      fill: "#141926",
      stroke: isSelected ? (node.type === "Defense" ? "#ff6b6b" : (node.type === "Attack" ? "#38bdf8" : (node.type === "Intent" ? "#34d399" : "#fbbf24"))) : strokeColor,
      lineWidth: isSelected ? 3.0 : (isDashed ? 2.5 : (node.isWarning ? 1.5 : 1)),
      lineDash: isDashed ? [8, 4] : undefined,
      shadowColor: isSelected ? strokeColor : "rgba(0,0,0,0.4)",
      shadowBlur: isSelected ? 18 : 8,
      labelText: String(node.text),
      labelFill: labelFillColor,
      labelFontSize: 10,
      labelFontFamily: "monospace, sans-serif",
      labelPlacement: "left-top",
      labelTextAlign: "left" as const,
      labelTextBaseline: "top" as const,
      labelWordWrap: true,
      labelMaxWidth: 340,
      labelLineHeight: 15,
      labelOffsetX: 12,
      labelOffsetY: 10,
      port: true,
      ports: [
        {
          key: "left-port",
          placement: [0, 0.5],
          visibility: "hidden",
        },
        {
          key: "right-port",
          placement: [1, 0.5],
          visibility: "hidden",
        },
      ],
    },
  };
}

function processedEdges(edge: any, index: number): EdgeData {
  const customColor = edge.dashed ? "#475569" : (edge.color || "#475569");
  return {
    id: `edge-${index}-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    sourcePort: "right-port",
    targetPort: "left-port",
    type: "cubic-horizontal",
    style: {
      stroke: customColor,
      lineWidth: 1.2,
      opacity: 0.65,
      endArrow: true,
      endArrowType: "triangle",
      endArrowSize: [5, 5] as any,
      endArrowFill: customColor,
      lineDash: edge.dashed ? [5, 5] : undefined,
    },
  };
}

function buildGraphData(): GraphData {
  const nodes = store.rawNodes.map((node) => {
    return buildNodeData(node as NodeData);
  });
  const nodeIds = new Set(nodes.map((n) => n.id as string));
  const edges = store.rawEdges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge, index) => {
      return processedEdges(edge as EdgeData, index);
    });
  return { nodes, edges };
}

onMounted(() => {
  nextTick(() => {
    if (!containerRef.value) {
      isLoading.value = false;
      return;
    }

    const initW = containerRef.value.scrollWidth || 1200;
    const initH = containerRef.value.scrollHeight || 750;
    lastCanvasSize = { w: initW, h: initH };

    // 创建画布实例
    graphInstance = new Graph({
      container: containerRef.value,
      width: initW,
      height: initH,
      node: {
        type: "rect",
      },
      edge: {
        type: "cubic-horizontal",
      },
      layout: {
        type: "dagre",
        rankdir: "LR",
        nodesep: 14,
        ranksep: 160,
      },
      animation: true,
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
    });

    // 渲染图表
    renderGraph(true).finally(() => {
      isLoading.value = false;
    });

    // 监听节点点击事件，根据节点类型切换右侧面板
    graphInstance.on("node:click", (event: any) => {
      console.log('-----', event)
      // G6 v5: 节点ID在 event.itemId，后备使用 event.target?.id
      const nodeId = event.itemId || event.target?.id;
      if (!nodeId) return;
      // 先从 graph 的渲染数据中获取节点数据（包含 _type 等自定义字段）
      const graphNodeData = graphInstance?.getNodeData(nodeId);
      // 同时从 store 的 rawNodes 中查找原始数据
      const rawNode = store.rawNodes.find((n) => n.id === nodeId);
      // 合并渲染数据和原始数据，确保 _type 字段可用
      const selectedNode = rawNode || graphNodeData;
      if (selectedNode) {
        store.setSelectedNode(selectedNode);
      }
    });
    // 监听大小改变
    resizeObserver = new ResizeObserver(() => {
      const el = containerRef.value;
      if (!el || !graphInstance) return;
      const w = el.scrollWidth;
      const h = el.scrollHeight;
      if (!w || !h) return;
      if (lastCanvasSize && w === lastCanvasSize.w && h === lastCanvasSize.h) return;
      lastCanvasSize = { w, h };
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!graphInstance) return;
        graphInstance.setSize(w, h);
        if (rawNodes.value.length > 0) {
          renderGraph(true);
        }
      });
    });
    resizeObserver.observe(containerRef.value);
  });
});

onUnmounted(() => {
  cancelAnimationFrame(resizeRaf);
  if (resizeObserver) resizeObserver.disconnect();
  if (graphInstance) graphInstance.destroy();
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
