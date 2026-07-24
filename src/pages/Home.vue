<template>
  <!-- 左中右布局 ，左侧panel，中间内容，右侧panel -->
  <div class="flex h-full">
    <LeftPanel />
    <HormuzMap class="flex-1" v-if="!store.graphData" />
    <GraphMain class="flex-1 min-w-0 overflow-hidden" v-else />

    <RightPanel />
  </div>
</template>
<script setup lang="ts">
import { useHomeStore } from "@/store/modules/homeStore";

const store = useHomeStore();
</script>
