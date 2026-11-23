<template>
  <div class="flex h-full relative">
    <!-- 态势图谱Tab未激活时，展示地图模式 -->
    <div
      v-show="!isGraphMode"
      class="absolute inset-0 map-stage"
      :style="mapStageDockStyle">
      <Map />
      <div v-if="showMapNodeDock" class="map-node-dock-host">
        <MapNodeStatsDock
          v-model:collapsed="mapNodeDockCollapsed"
          @height-change="onMapNodeDockHeight"
        />
      </div>
    </div>
    <!-- 态势图谱Tab激活时，展示图谱模式 -->
    <div v-show="isGraphMode" class="absolute inset-0 z-0">
      <GraphMain />
    </div>
    <!-- 异常征候菜单 -->
    <template v-if="store.isWarningView">
      <WarningLeftPanel class="absolute left-3 top-3 bottom-3 z-1000" />
      <WarningRightPanel class="absolute right-0 top-0 z-1000" />
      <button
        class="absolute top-3 left-1/2 -translate-x-1/2 z-1001 px-3 py-1 text-[12px] rounded-md bg-[#1a2332] text-[#93c5fd] border border-[rgba(59,130,246,0.45)] hover:bg-[rgba(59,130,246,0.22)] transition-colors"
        @click="store.setWarningView(false)">
        ← 返回
      </button>
    </template>
    <!-- 态势监控菜单 -->
    <template v-else>
      <MapLeft />
      <!-- 潜在异常浮窗 -->
      <SituationStrip v-if="!isAnomalyMode && !isGraphMode" />
      <!-- 异常征候视图（/anomaly）：右栏换成云脑智能面板（WarningRightPanel） -->
      <WarningRightPanel v-if="isAnomalyMode" class="absolute right-0 top-0 z-1000" />
      <template v-else>
        <!-- 右侧面板-非图谱模式 -->
        <RightPanel v-show="!isGraphMode" />
        <!-- 右侧面板-图谱模式 -->
        <RightGraphList v-show="isGraphMode" />

        <!-- 图谱刷新按钮 -->
        <button v-if="isGraphMode" class="graph-refresh-btn" :disabled="graphRefreshing"
          title="手动刷新文章数据（图谱模式下已暂停 30s 自动轮询）" @click="handleGraphRefresh">
          <span v-if="graphRefreshing" class="graph-refresh-spinner"></span>
          <span>{{ graphRefreshing ? "刷新中…" : "刷新文章数据" }}</span>
        </button>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";
import SituationStrip from "@/components/SituationStrip.vue";
import RightPanel from '@/components/RightPanel.vue';
import RightGraphList from '@/components/RightGraphList.vue';
import WarningLeftPanel from '@/components/WarningLeftPanel.vue';
import WarningRightPanel from '@/components/WarningRightPanel.vue';
import Map from '@/components/Map.vue';
import GraphMain from '@/components/GraphMain.vue';
import MapLeft from '@/components/MapLeft.vue';
import MapNodeStatsDock from "@/components/MapNodeStatsDock.vue";
import {
  MAP_NODE_DOCK_RESERVE_PX,
  MAP_NODE_DOCK_RESERVE_COLLAPSED_PX,
  MAP_NODE_DOCK_CLEARANCE_GAP_PX,
} from "@/mock/mapNodeDock";

const store = useHomeStore();
const route = useRoute();
/** 异常征候模式 */
const isAnomalyMode = computed(() => route.name === "Anomaly");
/** 战场图谱模式 */
const isGraphMode = computed(() => store.mapLeftTab === "third" && !isAnomalyMode.value);
/** 地图底部节点统计条（态势监控主视图） */
const showMapNodeDock = computed(
  () => !store.isWarningView && !isAnomalyMode.value && !isGraphMode.value,
);
const mapNodeDockCollapsed = ref(false);
/** 底部 Dock 实测高度 + 间隙，用于抬高右侧图层开关（回退为估算常量） */
const mapDockReservePx = ref(MAP_NODE_DOCK_RESERVE_PX);

const mapStageDockStyle = computed(() => {
  if (!showMapNodeDock.value) return undefined;
  return {
    "--map-dock-reserve": `${mapDockReservePx.value}px`,
  } as Record<string, string>;
});

/**
 * 根据 Dock 实测高度更新抬高量。
 * @param dockHeightPx - MapNodeStatsDock 内容高度
 */
const onMapNodeDockHeight = (dockHeightPx: number) => {
  mapDockReservePx.value = dockHeightPx + MAP_NODE_DOCK_CLEARANCE_GAP_PX;
};

watch(mapNodeDockCollapsed, (collapsed) => {
  mapDockReservePx.value = collapsed
    ? MAP_NODE_DOCK_RESERVE_COLLAPSED_PX + MAP_NODE_DOCK_CLEARANCE_GAP_PX
    : MAP_NODE_DOCK_RESERVE_PX + MAP_NODE_DOCK_CLEARANCE_GAP_PX;
});

// 手动刷新文章数据：调用 Map.vue 注册的 store.articlesRefetch（force 绕过 enabled 门控）
const graphRefreshing = ref(false);
const handleGraphRefresh = async () => {
  if (graphRefreshing.value) return;
  graphRefreshing.value = true;
  try {
    await store.articlesRefetch?.();
  } finally {
    graphRefreshing.value = false;
  }
};
</script>

<style scoped>
.map-node-dock-host {
  position: absolute;
  z-index: 1000;
  left: calc(360px + 12px);
  right: calc(380px + 12px);
  bottom: 12px;
  pointer-events: none;
}

.graph-refresh-btn {
  position: absolute;
  top: 16px;
  right: calc(380px + 20px);
  /* RightGraphList 宽度 w-95 = 380px，再向左 20px */
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #93c5fd;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(59, 130, 246, 0.45);
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.graph-refresh-btn:hover {
  background: rgba(27, 38, 55, 0.98);
  border-color: #3b82f6;
}

.graph-refresh-btn:active {
  background: rgba(13, 19, 32, 0.98);
}

.graph-refresh-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.graph-refresh-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: graph-refresh-spin 0.8s linear infinite;
}

@keyframes graph-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
