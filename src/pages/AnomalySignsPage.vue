<template>
  <!-- 异常征候页根：全屏地图 + 左栏异常分组 + 右栏云脑 -->
  <div class="anomaly-signs-page" :style="chromeLayoutStyle">
    <div class="anomaly-signs-page__stage map-stage">
      <Map />
      <MapViewportToolbar />
      <MapResourceLegend :dock-reserve-px="0" />
    </div>

    <CollapsibleSidePanel
      v-model:collapsed="leftCollapsed"
      side="left"
      layout="overlay"
      :width="360"
      label="异常征候"
      aria-label="异常征候左栏"
    >
      <AnomalySignsLeftPanel />
    </CollapsibleSidePanel>

    <CollapsibleSidePanel
      v-model:collapsed="rightCollapsed"
      side="right"
      layout="overlay"
      :width="380"
      label="云脑面板"
      aria-label="云脑智能面板"
    >
      <AnomalySignsRightPanel />
    </CollapsibleSidePanel>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import CollapsibleSidePanel from "@/components/layout/CollapsibleSidePanel.vue";
import { mapChromeLayoutVars } from "@/constants/mapChromeLayout";
import Map from "@/components/map/Map.vue";
import MapViewportToolbar from "@/components/map/MapViewportToolbar.vue";
import MapResourceLegend from "@/components/map/MapResourceLegend.vue";
import AnomalySignsLeftPanel from "@/components/anomaly/AnomalySignsLeftPanel.vue";
import AnomalySignsRightPanel from "@/components/anomaly/AnomalySignsRightPanel.vue";

/** 左栏收起态 */
const leftCollapsed = ref(false);
/** 右栏收起态 */
const rightCollapsed = ref(false);

/**
 * 侧栏收起时缩小 --map-chrome-left/right，使缩放工具条与图例随主视区靠边。
 */
const chromeLayoutStyle = computed(() =>
  mapChromeLayoutVars(leftCollapsed.value, rightCollapsed.value),
);
</script>

<style scoped lang="scss">
.anomaly-signs-page {
  position: relative;
  display: flex;
  height: 100%;
}

.anomaly-signs-page__stage {
  position: absolute;
  inset: 0;
}
</style>