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

      <Teleport to="body" :disabled="logMode === 'docked'">
      <div :class="logPanelClass" :style="logPanelStyle">
        <div class="flex items-center gap-2 px-3 py-1.5 border-b border-[#1e2d42] shrink-0"
          :class="{ 'cursor-move': logMode === 'popup' }"
          @mousedown="startLogHeaderDrag">
          <el-icon class="text-[#38bdf8] text-sm"><Document /></el-icon>
          <span class="text-sm font-semibold text-slate-200">分析执行日志</span>
          <span v-if="store.progressLogs.length > 0" class="text-[10px] text-slate-500 font-mono">[{{ store.progressLogs.length }} 条]</span>
          <span v-if="store.isAnalyzing" class="ml-auto text-[10px] text-blue-400 animate-pulse">◉ 分析中...</span>
          <span v-else-if="store.progressLogs.some(l => l.type === 'success')" class="ml-auto text-[10px] text-emerald-400">✓ 完成</span>
          <span v-if="store.currentPhase >= 0" class="text-[10px] text-slate-400 font-mono">Phase {{
            store.currentPhase === 0 ? 'ORIGIN' : store.currentPhase === 1 ? 'INTENT' : store.currentPhase === 2 ? 'BLUE_PLAN' : store.currentPhase === 3 ? 'RED_PLAN' : 'EVALUATION'
          }}</span>
          <el-icon class="ml-auto cursor-pointer text-slate-400 hover:text-[#38bdf8]"
            :title="logMode === 'docked' ? '转换为弹出窗口' : '收回到底部'"
            @click="toggleLogPopup" @mousedown.stop>
            <Expand v-if="logMode === 'docked'" />
            <Fold v-else />
          </el-icon>
        </div>
        <div ref="logContainer" class="flex-1 min-h-0 overflow-y-auto font-mono text-[11px] space-y-0.5 px-3 py-1">
        <div v-for="(logItem, idx) in store.progressLogs" :key="idx"
          class="py-0.5 leading-relaxed"
          :class="{
            'text-blue-400': logItem.type === 'info',
            'text-emerald-400': logItem.type === 'success',
            'text-red-400': logItem.type === 'error',
            'text-amber-400': logItem.type === 'warning',
          }">
          <div class="flex items-start gap-1.5">
            <span class="text-slate-600 shrink-0 tabular-nums">{{ logItem.time }}</span>
            <span class="flex-1 min-w-0"
              :class="isExpandable(logItem)
                ? 'underline decoration-slate-500/70 underline-offset-2 cursor-pointer hover:text-sky-300'
                : ''"
              @click="isExpandable(logItem) && toggleExpand(logItem)">{{ logItem.text }}</span>
            <span v-if="isExpandable(logItem)"
              class="shrink-0 cursor-pointer text-slate-500 hover:text-slate-200 px-0.5 opacity-60"
              @click="toggleExpand(logItem)">{{ logItem.expanded ? '▾' : '▸' }}</span>
          </div>
          <pre v-if="isExpandable(logItem) && logItem.expanded"
            class="whitespace-pre-wrap break-words text-slate-300 max-h-60 overflow-auto my-1 pl-4 border-l border-slate-700">{{ expandText(logItem) }}</pre>
        </div>
        <div v-if="store.progressLogs.length === 0" class="text-slate-600 text-center py-3">
          等待分析启动...
        </div>
      </div>
      <div v-if="logMode === 'popup'" class="absolute right-[-1px] top-2 bottom-2 w-1.5 cursor-ew-resize" @mousedown="startLogResize('e', $event)"></div>
      <div v-if="logMode === 'popup'" class="absolute bottom-[-1px] left-2 right-2 h-1.5 cursor-ns-resize" @mousedown="startLogResize('s', $event)"></div>
      <div v-if="logMode === 'popup'" class="absolute right-[-2px] bottom-[-2px] w-3.5 h-3.5 cursor-nwse-resize" @mousedown="startLogResize('se', $event)"></div>
      </div>
      </Teleport>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Graph } from "@antv/g6";
import type { EdgeData, GraphData, NodeData } from "@antv/g6";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { storeToRefs } from "pinia";
import { Document, Expand, Fold } from "@element-plus/icons-vue";

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

function isExpandable(logItem: any): boolean {
  return logItem?.kind === "dataflow" || logItem?.kind === "dispatch" || logItem?.kind === "agent-input";
}

function toggleExpand(logItem: any) {
  logItem.expanded = !logItem.expanded;
}

/* ── 4.1.1 执行日志浮动窗口（docked=覆盖画布底部的浮动栏；popup=可拖拽/可调整大小的独立弹出窗口） ── */
const logMode = ref<"docked" | "popup">("docked");
const LOG_DOCK_H = 180;
const POPUP_MIN_W = 360;
const POPUP_MIN_H = 180;
const popupPos = ref({ x: 48, y: 48 });
const popupSize = ref({ w: 720, h: 300 });
let logDragState:
  | { mode: "move" | "e" | "s" | "se"; mx: number; my: number; x: number; y: number; w: number; h: number }
  | null = null;

const logPanelClass = computed(() =>
  logMode.value === "docked"
    ? "absolute inset-x-0 bottom-0 z-30 flex flex-col border-t border-[#1e2d42] bg-[#080d16]/95 shadow-[0_-6px_18px_rgba(0,0,0,0.45)]"
    : "fixed z-[9999] flex flex-col rounded-md border border-[#2a3f5f] bg-[#080d16] shadow-2xl"
);

const logPanelStyle = computed(() =>
  logMode.value === "docked"
    ? { height: `${LOG_DOCK_H}px` }
    : {
        left: `${popupPos.value.x}px`,
        top: `${popupPos.value.y}px`,
        width: `${popupSize.value.w}px`,
        height: `${popupSize.value.h}px`,
      }
);

function toggleLogPopup() {
  if (logMode.value === "docked") {
    const r = containerRef.value?.getBoundingClientRect() ?? null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = r ? r.width : vw * 0.6;
    const ch = r ? r.height : vh * 0.6;
    const w = Math.min(Math.max(POPUP_MIN_W, Math.round(cw * 0.82)), 1200, vw - 32);
    const h = Math.min(LOG_DOCK_H + 160, ch + 60, vh - 48);
    popupSize.value = { w, h };
    const x = r ? Math.max(8, Math.round(r.left + (r.width - w) / 2)) : Math.round((vw - w) / 2);
    const y = r ? Math.max(8, Math.round(r.top + ch - h - 16)) : vh - h - 16;
    popupPos.value = { x: Math.min(x, Math.max(8, vw - w - 8)), y: Math.min(y, Math.max(8, vh - h - 8)) };
    logMode.value = "popup";
  } else {
    logMode.value = "docked";
  }
}

function onLogDragMove(e: MouseEvent) {
  if (!logDragState) return;
  const s = logDragState;
  const dx = e.clientX - s.mx;
  const dy = e.clientY - s.my;
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  if (s.mode === "move") {
    const loX = -(s.w - 80);
    const hiX = Math.max(loX, cw - 80);
    const loY = -(s.h - 32);
    const hiY = Math.max(loY, ch - 32);
    popupPos.value = {
      x: Math.min(hiX, Math.max(loX, s.x + dx)),
      y: Math.min(hiY, Math.max(loY, s.y + dy)),
    };
  } else {
    const w = s.mode === "s" ? s.w : Math.max(POPUP_MIN_W, Math.min(Math.max(POPUP_MIN_W, cw - s.x), s.w + dx));
    const h = s.mode === "e" ? s.h : Math.max(POPUP_MIN_H, Math.min(Math.max(POPUP_MIN_H, ch - s.y), s.h + dy));
    popupSize.value = { w, h };
  }
}

function stopLogDrag() {
  logDragState = null;
  window.removeEventListener("mousemove", onLogDragMove);
  window.removeEventListener("mouseup", stopLogDrag);
}

function beginLogDrag(e: MouseEvent, mode: "move" | "e" | "s" | "se") {
  if (logMode.value !== "popup") return;
  e.preventDefault();
  logDragState = {
    mode,
    mx: e.clientX,
    my: e.clientY,
    x: popupPos.value.x,
    y: popupPos.value.y,
    w: popupSize.value.w,
    h: popupSize.value.h,
  };
  window.addEventListener("mousemove", onLogDragMove);
  window.addEventListener("mouseup", stopLogDrag);
}

function startLogHeaderDrag(e: MouseEvent) {
  const t = e.target as HTMLElement | null;
  if (t && t.closest(".cursor-pointer, button")) return;
  beginLogDrag(e, "move");
}

function startLogResize(mode: "e" | "s" | "se", e: MouseEvent) {
  e.stopPropagation();
  beginLogDrag(e, mode);
}

/* 完整方案/报告弹窗仅由右侧详情面板的方案名点击触发（画布节点点击易误操作，不再联动）；
   画布节点点击只负责选中与切换右侧面板 */

/** 日志行展开内容；超过 20000 字符截断并追加 …(已截断) */
function expandText(logItem: any): string {
  let content = "";
  if (logItem?.kind === "dispatch") {
    content = String(logItem.data?.sysPrompt ?? "");
  } else if (logItem?.kind === "dataflow") {
    const data = (logItem.data ?? {}) as { type?: string; payload?: any };
    const payload = data.payload && typeof data.payload === "object" ? data.payload : {};
    if (data.type === "TEXT" || data.type === "THINKING" || data.type === "AGENT_RESULT") {
      content = String(payload?.text ?? "");
    } else if (data.type === "TOOL_CALL") {
      content = `[args]\n${payload?.args ?? ""}\n[result ${payload?.result?.state ?? ""}]\n${
        payload?.result?.text ?? ""
      }`;
    } else {
      content = JSON.stringify(payload, null, 2);
    }
  } else if (logItem?.kind === "agent-input") {
    const d = (logItem.data ?? {}) as Record<string, any>;
    let c = typeof d.prompt === "string" ? d.prompt : "";
    if (typeof d.knowledgeGraph === "string" && d.knowledgeGraph.trim()) {
      // prompt 本体已内嵌同一段知识图谱参考时不重复追加；仅当 prompt 缺失或被 8000 字截断导致 KG 段缺失时补充展示
      if (!c.includes(d.knowledgeGraph)) {
        const n =
          typeof d.knowledgeGraphChars === "number" ? d.knowledgeGraphChars : d.knowledgeGraph.length;
        c += (c ? "\n\n" : "") + `—— 知识图谱参考（${n} 字）——\n${d.knowledgeGraph}`;
      }
    }
    content = c || JSON.stringify(d, null, 2);
  }
  if (content.length > 20000) {
    content = content.substring(0, 20000) + "…(已截断)";
  }
  return content;
}
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

/* 节点标签(名字+摘要)：手动折行，最多 3 行，超出追加省略号。
   按 labelWordWrapWidth 340 / 字号 10 估算行宽（CJK≈1 单位、ASCII≈0.55，每行 32 单位留余量）插入显式换行。
   注意：G6 5.1.1 标签 Text 元素默认 maxLines=1，必须显式设 labelMaxLines=3，
   否则 wordWrap（含手动 \n）会在首行后截断，导致只显示一行。 */
function wrapLabelTo3Lines(text: string, unitsPerLine = 32, maxLines = 3): string {
  let out = "";
  let lineUnits = 0;
  let lines = 1;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    const w = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f\u2014\u2018\u2019\u201c\u201d]/.test(ch)
      ? 1
      : 0.55;
    if (lineUnits + w > unitsPerLine) {
      lines++;
      if (lines > maxLines) return out + "…";
      out += "\n";
      lineUnits = w;
    } else {
      lineUnits += w;
    }
    out += ch;
  }
  return out;
}

/* 标签文本：直接从 nodeData 读取完整摘要（90 字截断）。
   不依赖 store 缓存的 node.text —— 其由 addNodeFromWorkflow 在页面加载时生成，
   pinia 的 HMR 不会替换已注册 store 的 actions，旧版 30 字截断文字可能长期残留 */
function buildLabelText(node: any): string {
  const t = node.type;
  const raw = String(node.text || "");
  if (t === "Attack" || t === "Defense" || t === "Evaluation") {
    let full = "";
    try {
      const nd = typeof node.nodeData === "string" ? JSON.parse(node.nodeData) : node.nodeData;
      full = nd && typeof nd === "object" ? String((nd as any).summary ?? "") : "";
    } catch {
      full = "";
    }
    if (full) {
      const m = raw.match(/^(蓝方方案|红方方案|校验评估)\d+\s/);
      if (m) return wrapLabelTo3Lines(m[0] + full.slice(0, 90));
    }
  }
  return wrapLabelTo3Lines(raw);
}

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
      labelText: buildLabelText(node),
      labelFill: labelFillColor,
      labelFontSize: 10,
      labelFontFamily: "monospace, sans-serif",
      labelPlacement: "left-top",
      labelTextAlign: "left" as const,
      labelTextBaseline: "top" as const,
      labelWordWrap: true,
      labelWordWrapWidth: 340,
      labelMaxLines: 3,
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
