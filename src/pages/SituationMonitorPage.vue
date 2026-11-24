<template>
  <div class="situation-monitor-page" :style="sideLayoutStyle">
    <!-- 地图主视区 -->
    <SituationMonitorMapStage v-show="!isGraphMode" :visible="!isGraphMode" />
    <!-- 图谱主视区 -->
    <SituationMonitorGraphStage v-show="isGraphMode" />
    <!-- 左右侧栏 -->
    <SituationMonitorSideChrome
      v-model:left-collapsed="leftPanelCollapsed"
      v-model:right-collapsed="rightPanelCollapsed"
      :is-graph-mode="isGraphMode"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 态势监控路由页：编排地图/图谱主视区与左右侧栏，自身不直接挂载地图子组件。
 */
import { computed, ref, watch } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";
import { mapChromeLayoutVars } from "@/constants/mapChromeLayout";
import SituationMonitorMapStage from "@/components/situation/situationMonitor/SituationMonitorMapStage.vue";
import SituationMonitorGraphStage from "@/components/situation/situationMonitor/SituationMonitorGraphStage.vue";
import SituationMonitorSideChrome from "@/components/situation/situationMonitor/SituationMonitorSideChrome.vue";

const store = useHomeStore();

const leftPanelCollapsed = ref(false);
const rightPanelCollapsed = ref(false);

/**
 * 计算左右侧栏收起态对应的地图浮层边距 CSS 变量。
 * 作用：工具条、图例、态势条、刷新按钮、底部 Dock 随侧栏靠边。
 */
const sideLayoutStyle = computed(() =>
  mapChromeLayoutVars(leftPanelCollapsed.value, rightPanelCollapsed.value),
);

/**
 * 计算是否为态势图谱主视区。
 * 返回 boolean。左栏 Tab 为 graph 时为 true。
 */
const isGraphMode = computed(() => store.mapLeftTab === "graph");

/** 侧栏收起/展开改变浮层边距时通知图谱重算 fitView padding（画布尺寸本身不变） */
watch([leftPanelCollapsed, rightPanelCollapsed], () => {
  window.dispatchEvent(new Event("situation-chrome-change"));
});
</script>

<style scoped lang="scss">
.situation-monitor-page {
  position: relative;
  display: flex;
  height: 100%;
}
</style>