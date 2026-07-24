<template>
  <div class="h-full w-full relative" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { useHomeStore } from "@/store/modules/homeStore";
import { Graph } from "@antv/g6";
import { onBeforeUnmount, onMounted, ref } from "vue";
const containerRef = ref<HTMLElement | null>(null);
let graph: Graph | null = null;
const store = useHomeStore();
// 初始化g6图表的函数，接受 graphData 和 Cesium viewer 作为参数
const initGraph = async (graphData: any) => {
  if (!containerRef.value) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  graph = new Graph({
    container: containerRef.value!, // v5 语法替换 container
    width,
    height,
    autoFit: "view", // v5 语法替换 fitView
    layout: {
      type: "force",
      preventOverlap: true,
      linkDistance: 100,
    },
  });
  // 设置基本交互
  graph.setBehaviors([
    "drag-canvas", // 拖拽画布
    "zoom-canvas", // 缩放画布
    "drag-element", // 拖拽元素
  ]);
  graph.setData(graphData); // v5 语法替换 graph.data()

  await graph.render(); // v5 的 render 是异步的
};

onMounted(() => {
  const graphData = store.graphData;
  initGraph(graphData);
});
onBeforeUnmount(() => {
  // 在组件卸载时销毁图表实例
  if (graph) {
    graph.destroy();
  }
});
</script>
