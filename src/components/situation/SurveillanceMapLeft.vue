<template>
  <div class="smap-left">
    <el-tabs v-model="activeName" class="tabs" stretch>
      <el-tab-pane name="elements">
        <template #label>
          <span class="tabs-label">
            <el-icon><List /></el-icon>
            <span>作战要素</span>
          </span>
        </template>
        <SurveillanceMapLeftElementsPanel />
      </el-tab-pane>

      <el-tab-pane name="intelligence">
        <template #label>
          <span class="tabs-label">
            <el-icon><Management /></el-icon>
            <span>开源情报</span>
          </span>
        </template>
        <SurveillanceMapLeftIntelligencePanel />
      </el-tab-pane>

      <el-tab-pane name="graph">
        <template #label>
          <span class="tabs-label">
            <el-icon><TrendCharts /></el-icon>
            <span>态势图谱</span>
          </span>
        </template>
        <SurveillanceMapLeftGraphPanel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { List, Management, TrendCharts } from "@element-plus/icons-vue";
import { useHomeStore } from "@/store/modules/homeStore";
import SurveillanceMapLeftElementsPanel from "@/components/situation/surveillanceLeft/SurveillanceMapLeftElementsPanel.vue";
import SurveillanceMapLeftIntelligencePanel from "@/components/situation/surveillanceLeft/SurveillanceMapLeftIntelligencePanel.vue";
import SurveillanceMapLeftGraphPanel from "@/components/situation/surveillanceLeft/SurveillanceMapLeftGraphPanel.vue";

const homeStore = useHomeStore();

/**
 * 与 homeStore.mapLeftTab 双向绑定。
 * 地图点击聚合时会切到 intelligence（开源情报）。
 */
const activeName = computed({
  get: () => homeStore.mapLeftTab,
  set: (v) => {
    homeStore.mapLeftTab = v;
  },
});
</script>

<style scoped lang="scss">
@use "@/components/situation/surveillanceLeft/surveillanceLeftTokens.scss" as *;

.smap-left {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 360px;
  height: 100%;
  padding: 10px;
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: $text;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid $border;
  backdrop-filter: blur(4px);
  user-select: none;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background: $border;
  border-radius: 3px;

  &:hover {
    background: $border-strong;
  }
}

:deep(.tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .el-tabs__header {
    flex: 0 0 auto;
    margin: 0 0 10px;
  }

  .el-tabs__content {
    flex: 1;
    min-height: 0;
  }

  .el-tab-pane {
    height: 100%;
  }

  .el-tabs__nav-wrap::after {
    height: 1px;
    background: $border;
  }

  .el-tabs__item {
    color: $text-2;
    font-size: 12.5px;
    font-weight: 500;
    transition: color $ease;

    .tabs-label {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    &:hover {
      color: $text;
    }
  }

  .el-tabs__item.is-active {
    color: $accent-text;
    font-weight: 600;
  }

  .el-tabs__active-bar {
    height: 2px;
    border-radius: 2px;
    background: $accent;
  }
}
</style>