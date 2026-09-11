<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import DeepAnalysisRightPanel from "@/components/DeepAnalysisRightPanel.vue";
import DeepAnalysisRightPanel_A from "@/components/DeepAnalysisRightPanel_A.vue";
import DeepAnalysisRightPanel_B from "@/components/DeepAnalysisRightPanel_B.vue";
import DeepAnalysisRightPanel_C from "@/components/DeepAnalysisRightPanel_C.vue";

const store = useAnalysisStore();
const route = useRoute();

onMounted(async () => {
  let queryIds: string[] | undefined;
  if (route.query.from === "homepage" && route.query.ids) {
    queryIds = String(route.query.ids).split(",");
  }
  await store.restoreByAnomalies(queryIds);
});
</script>

<template>
  <!-- 左中右布局 ，左侧panel，中间内容，右侧panel -->
  <div class="flex h-full">
    <DeepAnalysisLeftPanel />

    <DeepAnalysisMain class="flex-1" />

    <DeepAnalysisRightPanel v-if="store.analysisType === 'default'" />
    <DeepAnalysisRightPanel_A v-if="store.analysisType === 'attack'" />
    <DeepAnalysisRightPanel_B v-if="store.analysisType === 'defense'" />
    <DeepAnalysisRightPanel_C v-if="store.analysisType === 'evaluation'" />
  </div>
</template>
