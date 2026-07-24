<script setup lang="ts">
import { useAnalysisStore } from "@/store/modules/analysisStore";

const store = useAnalysisStore();
</script>

<template>
  <!-- 左中右布局 ，左侧panel，中间内容，右侧panel -->
  <div class="flex h-full">
    <DeepAnalysisLeftPanel />
    <DeepAnalysisMain class="flex-1" />
    <DeepAnalysisRightPanel v-if="store.analysisType === 'default'" />
    <DeepAnalysisRightPanel_A v-if="store.analysisType === 'attack'" />
    <DeepAnalysisRightPanel_B v-if="store.analysisType === 'defense'" />
  </div>
</template>
