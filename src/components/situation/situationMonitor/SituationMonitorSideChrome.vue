<template>
  <!-- 左栏：态势左栏 包含作战要素、开源情报、态势图谱 -->
  <CollapsibleSidePanel v-model:collapsed="leftCollapsed" side="left" layout="overlay" :width="360" label="态势左栏"
    aria-label="态势监控左栏">
    <SurveillanceMapLeft />
  </CollapsibleSidePanel>

  <!-- 左栏：地图态势条 潜在异常 + 威胁评估；图谱模式不展示以免遮挡关系网 -->
  <SituationStrip v-if="!isGraphMode" />

  <!-- 右栏：云脑面板 -->
  <CollapsibleSidePanel v-show="!isGraphMode" v-model:collapsed="rightCollapsed" side="right" layout="overlay"
    :width="380" label="云脑面板" aria-label="云脑智能面板">
    <RightPanel />
  </CollapsibleSidePanel>

  <!-- 右栏：图谱文章列表 -->
  <CollapsibleSidePanel v-show="isGraphMode" v-model:collapsed="rightCollapsed" side="right" layout="overlay"
    :width="380" label="文章列表" aria-label="图谱文章列表">
    <RightGraphList />
  </CollapsibleSidePanel>
</template>

<script setup lang="ts">
import CollapsibleSidePanel from "@/components/layout/CollapsibleSidePanel.vue";
import SituationStrip from "@/components/situation/SituationStrip.vue";
import RightPanel from "@/components/situation/CloudBrainPanel.vue";
import RightGraphList from "@/components/graph/RightGraphList.vue";
import SurveillanceMapLeft from "@/components/situation/SurveillanceMapLeft.vue";

defineProps<{
  /** 是否为态势图谱主视区（控制右栏与顶栏态势条） */
  isGraphMode: boolean;
}>();

/** 左栏收起 */
const leftCollapsed = defineModel<boolean>("leftCollapsed", { default: false });
/** 右栏收起（地图云脑 / 图谱文章列表共用） */
const rightCollapsed = defineModel<boolean>("rightCollapsed", { default: false });
</script>