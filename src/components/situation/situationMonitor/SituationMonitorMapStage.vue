<template>
  <div class="situation-map-stage map-stage" :style="mapStageDockStyle">
    <Map />
    <MapViewportToolbar v-if="showMapChrome" />
    <MapResourceLegend v-if="showDockChrome" :dock-reserve-px="mapDockReservePx" />
    <div v-if="showDockChrome" class="situation-map-stage__dock-host">
      <MapNodeStatsDock v-model:collapsed="mapNodeDockCollapsed" @height-change="onMapNodeDockHeight" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Map from "@/components/map/Map.vue";
import MapViewportToolbar from "@/components/map/MapViewportToolbar.vue";
import MapResourceLegend from "@/components/map/MapResourceLegend.vue";
import MapNodeStatsDock from "@/components/map/MapNodeStatsDock.vue";
import {
  MAP_NODE_DOCK_RESERVE_PX,
  MAP_NODE_DOCK_RESERVE_COLLAPSED_PX,
  MAP_NODE_DOCK_CLEARANCE_GAP_PX,
} from "@/mock/mapNodeDock";

const props = defineProps<{
  /** 地图主视区是否处于展示态（与图谱模式互斥，用于 v-show） */
  visible: boolean;
}>();

/** 与 visible 一致：控制工具条、图例、底部 Dock */
const showMapChrome = computed(() => props.visible);
const showDockChrome = computed(() => props.visible);

const mapNodeDockCollapsed = ref(false);
const mapDockReservePx = ref(MAP_NODE_DOCK_RESERVE_PX);

/**
 * 计算地图主视区底部 Dock 预留高度 CSS 变量。
 * 返回 undefined 或无 Dock 时为空对象键。
 */
const mapStageDockStyle = computed(() => {
  if (!showDockChrome.value) return undefined;
  return {
    "--map-dock-reserve": `${mapDockReservePx.value}px`,
  } as Record<string, string>;
});

const onMapNodeDockHeight = (dockHeightPx: number) => {
  mapDockReservePx.value = dockHeightPx + MAP_NODE_DOCK_CLEARANCE_GAP_PX;
};

/**
 * 监听 Dock 折叠态以同步图例与图层开关的底部留白。
 * 回调不返回清理函数。
 */
watch(mapNodeDockCollapsed, (collapsed) => {
  mapDockReservePx.value = collapsed
    ? MAP_NODE_DOCK_RESERVE_COLLAPSED_PX + MAP_NODE_DOCK_CLEARANCE_GAP_PX
    : MAP_NODE_DOCK_RESERVE_PX + MAP_NODE_DOCK_CLEARANCE_GAP_PX;
});
</script>

<style scoped lang="scss">
.situation-map-stage {
  position: absolute;
  inset: 0;
}

.situation-map-stage__dock-host {
  position: absolute;
  z-index: 1000;
  left: var(--map-chrome-left, 372px);
  right: var(--map-chrome-right, 392px);
  bottom: 12px;
  pointer-events: none;
  transition: left 0.22s ease, right 0.22s ease;
}
</style>