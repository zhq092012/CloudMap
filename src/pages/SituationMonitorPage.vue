<template>
  <!-- 态势监控页根：左栏 + 右栏/图谱侧栏 + 中央主视区（地图或关系网）并列，互不占路由分支 -->
  <div class="situation-monitor-page" :style="sideLayoutStyle">
    <!--
      主视区 · 地图模式（!isGraphMode）
      isGraphMode = homeStore.mapLeftTab === "third"（左栏切到「战场图谱」）
      mapStageDockStyle：底部 Dock 抬高时写入 --map-dock-reserve，供 Map 与右上图层开关留白
    -->
    <div v-show="!isGraphMode" class="absolute inset-0 map-stage" :style="mapStageDockStyle">
      <!-- Cesium 底图、设施/异常图层与 Store 注册的 refetch -->
      <Map />
      <!-- 左上：道路地名、缩放、全览；与 Dock/图例同显隐（showMapChrome === showMapNodeDock） -->
      <MapViewportToolbar v-if="showMapChrome" />
      <!-- 底部统计条上方的资源图例；随 Dock 实测高度上移 -->
      <MapResourceLegend v-if="showMapNodeDock" :dock-reserve-px="mapDockReservePx" />
      <!-- 底部居中统计 Dock 宿主（pointer-events: none，子组件内再开启交互） -->
      <div v-if="showMapNodeDock" class="map-node-dock-host">
        <MapNodeStatsDock
          v-model:collapsed="mapNodeDockCollapsed"
          @height-change="onMapNodeDockHeight"
        />
      </div>
    </div>

    <!-- 主视区 · 图谱模式（isGraphMode）：全屏 GraphMain，与地图模式二选一展示 -->
    <div v-show="isGraphMode" class="absolute inset-0 z-0">
      <GraphMain />
    </div>

    <CollapsibleSidePanel
      v-model:collapsed="leftPanelCollapsed"
      side="left"
      layout="overlay"
      :width="360"
      label="态势左栏"
      aria-label="态势监控左栏"
    >
      <SurveillanceMapLeft />
    </CollapsibleSidePanel>

    <!-- 地图中部态势条：潜在异常 + 威胁评估；图谱模式不展示以免遮挡关系网 -->
    <SituationStrip v-if="!isGraphMode" />

  <CollapsibleSidePanel
    v-show="!isGraphMode"
    v-model:collapsed="rightPanelCollapsed"
    side="right"
    layout="overlay"
    :width="380"
    label="云脑面板"
    aria-label="云脑智能面板"
  >
    <RightPanel />
  </CollapsibleSidePanel>

  <CollapsibleSidePanel
    v-show="isGraphMode"
    v-model:collapsed="rightPanelCollapsed"
    side="right"
    layout="overlay"
    :width="380"
    label="文章列表"
    aria-label="图谱文章列表"
  >
    <RightGraphList />
  </CollapsibleSidePanel>

    <!-- 图谱模式：手动拉文章（store.articlesRefetch）；该模式下 Map 内 30s 轮询已暂停 -->
    <button
      v-if="isGraphMode"
      class="graph-refresh-btn"
      :disabled="graphRefreshing"
      title="手动刷新文章数据（图谱模式下已暂停 30s 自动轮询）"
      @click="handleGraphRefresh"
    >
      <span v-if="graphRefreshing" class="graph-refresh-spinner"></span>
      <span>{{ graphRefreshing ? "刷新中…" : "刷新文章数据" }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 态势监控页：地图 / 战场图谱、左栏作战要素与情报、右栏云脑面板与态势条。
 * 与「异常征候」路由完全分离，互不共享页面级分支逻辑。
 */
import { computed, ref, watch } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";
import CollapsibleSidePanel from "@/components/layout/CollapsibleSidePanel.vue";

/** 地图与右栏之间的底部态势条（潜在异常 + 威胁评估）；仅非图谱模式挂载。 */
import SituationStrip from "@/components/SituationStrip.vue";
/** 右侧云脑智能面板（区块折叠 + 指令终端 mock）；地图模式下显示。 */
import RightPanel from "@/components/RightPanel.vue";
/** 战场图谱模式右侧文章节点列表。 */
import RightGraphList from "@/components/RightGraphList.vue";
/** 主视区 Cesium 地图与数据图层。 */
import Map from "@/components/Map.vue";
/** 战场图谱（文章关系网）主画布，读取 homeStore.graphFilter。 */
import GraphMain from "@/components/GraphMain.vue";
/** 态势监控左栏 Tab（要素 / 情报 / 图谱），与 homeStore.mapLeftTab 双向绑定。 */
import SurveillanceMapLeft from "@/components/SurveillanceMapLeft.vue";
/** 底部居中节点统计与分类 Dock，支持折叠与「查看报告」。 */
import MapNodeStatsDock from "@/components/MapNodeStatsDock.vue";
/** 地图视口左上工具条（道路地名、缩放、全览）。 */
import MapViewportToolbar from "@/components/MapViewportToolbar.vue";
/** 叠在 Dock 上方的地图资源图例。 */
import MapResourceLegend from "@/components/MapResourceLegend.vue";
import {
  MAP_NODE_DOCK_RESERVE_PX,
  MAP_NODE_DOCK_RESERVE_COLLAPSED_PX,
  MAP_NODE_DOCK_CLEARANCE_GAP_PX,
} from "@/mock/mapNodeDock";
import { mapChromeLayoutVars } from "@/constants/mapChromeLayout";

const store = useHomeStore();

/** 左侧态势栏收起态 */
const leftPanelCollapsed = ref(false);
/** 右侧栏收起态（地图云脑 / 图谱文章列表共用） */
const rightPanelCollapsed = ref(false);

/**
 * 根据左右侧栏收起态为 Dock、刷新按钮等提供边距 CSS 变量。
 * 返回内联 style 对象。
 */
/**
 * 计算左右侧栏收起态对应的地图浮层边距 CSS 变量。
 * 返回内联 style，供工具条、图例、态势条、图层开关、底部 Dock 同步靠边。
 */
const sideLayoutStyle = computed(() =>
  mapChromeLayoutVars(leftPanelCollapsed.value, rightPanelCollapsed.value),
);

/**
 * 计算是否为战场图谱主视区模式。
 * 返回 boolean。左栏 el-tabs 激活「third」（战场图谱）时为 true。
 * 作用：template 在地图层与 GraphMain 之间切换，并控制右栏用 RightPanel 还是 RightGraphList。
 */
const isGraphMode = computed(() => store.mapLeftTab === "third");

/**
 * 计算是否展示底部节点 Dock 及地图装饰（工具条、图例）。
 * 返回 boolean。与 isGraphMode 互斥，图谱模式不显示 Dock。
 * 作用：统一控制 MapViewportToolbar、MapResourceLegend、MapNodeStatsDock 的 v-if。
 */
const showMapNodeDock = computed(() => !isGraphMode.value);

/** 与 showMapNodeDock 同源，左上地图工具条与之同显隐。 */
const showMapChrome = showMapNodeDock;

/** Dock 折叠态，折叠时 watch 回退为估算预留高度。 */
const mapNodeDockCollapsed = ref(false);
/** 地图底部为 Dock + 间隙预留的像素值，供图例与 Map 样式变量消费。 */
const mapDockReservePx = ref(MAP_NODE_DOCK_RESERVE_PX);

/**
 * 计算地图主视区的内联样式（CSS 变量）。
 * 返回 undefined 或含 --map-dock-reserve 的对象。无 Dock 时不注入变量。
 * 作用：抬高地图内容区，避免被底部 Dock 遮挡。
 */
const mapStageDockStyle = computed(() => {
  if (!showMapNodeDock.value) return undefined;
  return {
    "--map-dock-reserve": `${mapDockReservePx.value}px`,
  } as Record<string, string>;
});

/**
 * 根据 Dock 实测高度更新地图底部预留空间。
 * @param dockHeightPx - MapNodeStatsDock 内容高度（px）
 */
const onMapNodeDockHeight = (dockHeightPx: number) => {
  mapDockReservePx.value = dockHeightPx + MAP_NODE_DOCK_CLEARANCE_GAP_PX;
};

/**
 * 监听 Dock 折叠态。
 * 回调不返回清理函数。
 * 作用：折叠时用常量估算高度，展开时恢复默认预留，使图例与图层开关位置与视觉一致。
 */
watch(mapNodeDockCollapsed, (collapsed) => {
  mapDockReservePx.value = collapsed
    ? MAP_NODE_DOCK_RESERVE_COLLAPSED_PX + MAP_NODE_DOCK_CLEARANCE_GAP_PX
    : MAP_NODE_DOCK_RESERVE_PX + MAP_NODE_DOCK_CLEARANCE_GAP_PX;
});

/** 图谱模式手动刷新进行中，防止连点。 */
const graphRefreshing = ref(false);

/** 图谱模式下调用 store.articlesRefetch 强制刷新文章（供 GraphMain 消费）。 */
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
.situation-monitor-page {
  position: relative;
  display: flex;
  height: 100%;
}

.map-node-dock-host {
  position: absolute;
  z-index: 1000;
  left: var(--map-chrome-left, 372px);
  right: var(--map-chrome-right, 392px);
  transition: left 0.22s ease, right 0.22s ease;
  bottom: 12px;
  pointer-events: none;
}

.graph-refresh-btn {
  position: absolute;
  top: 16px;
  right: var(--map-chrome-right, 392px);
  transition: right 0.22s ease;
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