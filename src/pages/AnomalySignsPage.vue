<template>
  <!-- 异常征候页根：全屏地图 + 左栏异常分组 + 右栏云脑（无态势条 / Dock / 图谱分支） -->
  <div class="flex h-full relative">
    <!-- 主视区：仅地图层，异常条目由 Map 渲染并与 homeStore.warningMarkers 同步 -->
    <div class="absolute inset-0 map-stage">
      <Map />
    </div>

    <!-- 左栏：待研判 / 异常 / 分析栏 / 历史 四分 Tab 与批量操作 -->
    <AnomalySignsLeftPanel />

    <!-- 右栏：云脑面板与简报区（原 WarningRightPanel 能力），贴右侧全高 -->
    <AnomalySignsRightPanel class="absolute right-0 top-0 z-1000" />
  </div>
</template>

<script setup lang="ts">
/**
 * 异常征候页：地图 + 异常左栏（分组列表）+ 云脑右栏。
 * 与态势监控页独立路由，不再通过 Home 内分支切换。
 */
/** 主视区地图，承载异常点位与 refetch 回调。 */
import Map from "@/components/Map.vue";
/** 异常征候专用左栏（分组列表、详情弹窗、深度分析跳转）。 */
import AnomalySignsLeftPanel from "@/components/AnomalySignsLeftPanel.vue";
/** 异常征候专用右栏（统计总览、简报与云脑区块）。 */
import AnomalySignsRightPanel from "@/components/AnomalySignsRightPanel.vue";
</script>