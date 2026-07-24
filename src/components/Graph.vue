<template>
  <div class="h-full w-full relative" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Graph } from "@antv/g6";

const containerRef = ref<HTMLElement | null>(null);

const initGraph = () => {
  const graph = new Graph({
    container: containerRef.value as HTMLElement,
    width: 800,
    height: 600,

    layout: {
      type: "force",
      preventOverlap: true,
      linkDistance: 200,
    },
  });
  // 设置基本交互
  graph.setBehaviors([
    "drag-canvas", // 拖拽画布
    "zoom-canvas", // 缩放画布
    "drag-element", // 拖拽元素
  ]);
  const data = {
    nodes: [
      { id: "node1", label: "Node 1" },
      { id: "node2", label: "Node 2" },
      { id: "node3", label: "Node 3" },
    ],
    edges: [
      { source: "node1", target: "node2" },
      { source: "node2", target: "node3" },
    ],
  };

  graph.setData(data);
  graph.render();
};

onMounted(() => {
  if (containerRef.value) {
    //    初始化antv/g6图表
    initGraph();
  }
});
</script>
