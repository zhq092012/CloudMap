<template>
  <div
    class="w-120 bg-[#111625]/95 text-slate-200 border border-slate-800 rounded-lg shadow-2xl p-4 font-sans select-none overflow-hidden relative backdrop-blur-md"
  >
    <div
      class="flex items-center justify-between border-b border-slate-800 pb-3 mb-3"
    >
      <h2 class="text-base font-bold tracking-wide text-slate-100">装备详情</h2>
    </div>

    <div class="flex gap-4 items-start mb-4">
      <div
        class="w-16 h-16 bg-[#1a233a] border border-blue-500/40 rounded flex items-center justify-center shrink-0 shadow-inner"
      >
        <svg
          class="w-10 h-10 text-blue-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2L9 9H3L8 13L6 20L12 16L18 20L16 13L21 9H15L12 2Z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-black text-slate-100 tracking-wider">{{
            homeStore.selectedEntity?.name
          }}</span>
        </div>
        <div class="text-xs text-slate-300 mt-1 flex items-center gap-1">
          <span class="text-xs text-slate-400 font-mono"
            >编号：{{ homeStore.selectedEntity?.id }}</span
          >
        </div>

        <div class="text-xs text-slate-300 mt-1 flex items-center gap-1">
          <span class="text-slate-400">所属部队</span>
          <span class="text-blue-400 font-medium"
            >以色列空军第140“金鹰”中队</span
          >
        </div>
        <div class="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
          <span class="text-slate-400">状态</span>
          <span
            class="text-emerald-400 font-bold px-1 py-0.2 bg-emerald-500/10 border border-emerald-500/20 rounded-sm"
            >战备值班</span
          >
        </div>
      </div>
    </div>

    <div
      class="border-t border-b border-slate-800/60 py-2.5 my-3 space-y-1.5 text-xs font-mono"
    >
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="text-slate-500 mr-2">注册号</span
          ><span class="text-slate-300">IDF-2024-0140-007</span>
        </div>
        <div>
          <span class="text-slate-500 mr-2">ICAO</span
          ><span class="text-slate-300">738A4B</span>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <span class="text-slate-500 mr-2">经度</span
          ><span class="text-slate-200">36.340E</span>
        </div>
        <div>
          <span class="text-slate-500 mr-2">纬度</span
          ><span class="text-slate-200">36.340N</span>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-2">
        <div>
          <span class="text-slate-500 mr-2">海拔</span
          ><span class="text-slate-200">+28m（机库内停放）</span>
        </div>
        <div>
          <span class="text-slate-500 mr-2">速度</span
          ><span class="text-slate-200">0 km/h（地面停放）</span>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-1">
        <div>
          <span class="text-slate-500 mr-1">马赫</span
          ><span class="text-slate-400">N/A</span>
        </div>
        <div>
          <span class="text-slate-500 mr-1">航向</span
          ><span class="text-slate-400">N/A</span>
        </div>
        <div>
          <span class="text-slate-500 mr-1">航向</span
          ><span class="text-slate-400">N/A</span>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-1 pt-1 border-t border-slate-800/40">
        <div>
          <span class="text-slate-500 mr-2">当地时间</span
          ><span class="text-slate-300">19:25:58（黄昏）</span>
        </div>
        <div>
          <span class="text-slate-500 mr-2">天气</span
          ><span class="text-slate-300"
            >无遮挡天空 - 无雨 - 15°C - 风/海 0</span
          >
        </div>
      </div>
    </div>

    <div
      class="w-full bg-[#0d1322] border border-slate-800/80 rounded p-2 relative"
    >
      <div ref="g6ChartRef" class="w-full h-64"></div>
    </div>

    <div class="flex gap-2 mt-4 text-xs">
      <button
        class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/50 transition-colors"
      >
        查看完整画像
      </button>
      <button
        class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/50 transition-colors"
      >
        查看历史轨迹
      </button>
      <button
        class="flex-1 py-1.5 bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 rounded border border-blue-500/30 transition-colors"
      >
        加入监视列表
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Graph } from "@antv/g6";
import { useHomeStore } from "@/store/modules/homeStore";

const homeStore = useHomeStore();
const g6ChartRef = ref<HTMLDivElement | null>(null);
let graph: Graph | null = null;

// Mock 图谱节点与边数据
const initG6Graph = () => {
  if (!g6ChartRef.value) return;

  const data = {
    nodes: [
      {
        id: "f35",
        label: "F-35I",
        size: 45,
        style: { fill: "#1d4ed8", stroke: "#38bdf8", lineWidth: 2 },
        labelDeltaY: 28,
      },
      { id: "p1", label: "阿米尔·埃舍尔少将", type: "person" },
      { id: "p2", label: "库查尔中队长", type: "person" },
      { id: "base", label: "XXXX空军基地", type: "base" },
      { id: "airforce", label: "以色列空军", type: "org" },
      { id: "f16", label: "F-16I", type: "plane" },
      { id: "f15", label: "F-15I", type: "plane" },
      { id: "news1", label: "最新升级曝光...", type: "news" },
      { id: "news2", label: "没想到以色列空...", type: "news" },
      { id: "news3", label: "美军遇到大麻烦...", type: "news" },
    ],
    edges: [
      { source: "p1", target: "f35", label: "指挥" },
      { source: "p2", target: "f35", label: "提及" },
      { source: "f35", target: "airforce", label: "隶属" },
      { source: "f35", target: "base", label: "驻扎" },
      { source: "f35", target: "f16", label: "相关" },
      { source: "f35", target: "f15", label: "相关" },
      { source: "f35", target: "news1", label: "提及" },
      { source: "f35", target: "news2", label: "提及" },
      { source: "f35", target: "news3", label: "提及" },
      { source: "f16", target: "airforce", label: "隶属" },
      { source: "f15", target: "airforce", label: "隶属" },
      { source: "base", target: "airforce", label: "隶属" },
    ],
  };

  // 针对不同节点类型进行统一样式格式化
  const formattedNodes = data.nodes.map((node: any) => {
    if (node.id === "f35") return node; // 核心节点保持原样

    let fill = "#1e293b";
    let stroke = "#475569";
    if (node.type === "person" || node.type === "org" || node.type === "base") {
      fill = "#0284c7";
      stroke = "#0ea5e9";
    } else if (node.type === "plane") {
      fill = "#0369a1";
      stroke = "#38bdf8";
    } else if (node.type === "news") {
      fill = "#0f172a";
      stroke = "#334155";
    }

    return {
      ...node,
      size: node.size || 30,
      style: {
        fill,
        stroke,
        lineWidth: 1.5,
      },
      labelCfg: {
        position: "bottom",
        offset: 5,
        style: {
          fill: "#94a3b8",
          fontSize: 10,
        },
      },
    };
  });

  // 实例化 G6
  graph = new Graph({
    container: g6ChartRef.value,
    width: g6ChartRef.value.clientWidth,
    height: g6ChartRef.value.clientHeight,
    autoResize: true,
    layout: {
      type: "force",
      // 防止节点重叠
      preventOverlap: true,
      // 节点大小
      nodeSize: 30,
      // 向心力
      gravity: 1.5,
      // 迭代次数
      iterations: 100,
    },
    node: {
      type: "circle",
    },
    edge: {
      type: "line",
      style: {
        stroke: "#334155",
        lineWidth: 1,
        endArrow: true,
        endArrowType: "vee", // 箭头类型
        endArrowSize: 10, // 箭头大小
        labelCfg: {
          autoRotate: true,
          style: {
            fill: "#475569",
            fontSize: 9,
            background: {
              fill: "#0d1322",
              padding: [2, 4],
            },
          },
        },
      },
    },
  });
  // 设置基本交互
  graph.setBehaviors([
    "drag-canvas", // 拖拽画布
    "zoom-canvas", // 缩放画布
    "drag-element", // 拖拽元素
  ]);
  graph.setData({ nodes: formattedNodes, edges: data.edges });
  graph.render();
};

onMounted(() => {
  // 延迟微调，确保父容器宽度已生成

  initG6Graph();

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (graph) graph.destroy();
});

const handleResize = () => {
  if (graph && g6ChartRef.value) {
    graph.setSize(g6ChartRef.value.clientWidth, g6ChartRef.value.clientHeight);
  }
};
</script>

<style scoped>
/* 针对 G6 内部文本做基础防模糊控制 */
canvas {
  image-rendering: -webkit-optimize-contrast;
}
</style>
