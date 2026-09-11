<script setup lang="ts">
import { watch } from "vue";
import { useRoute } from "vue-router";
import MapLoading from "@/components/MapLoading.vue";
import { useLoadingStore } from "@/store/modules/loadingStore";

const route = useRoute();
const loadingStore = useLoadingStore();

// 第一时间（首屏渲染前，同步）开启全局 loading，
// 确保遮罩出现在初始 DOM 中，避免「先显示页面内容、再弹出 loading」的闪烁
loadingStore.startMapLoading();

// 兜底：当前路由不是地图主页（该页无 Map 组件）时，关闭 loading，防止卡死
watch(
  () => route.path,
  (path) => {
    if (path !== "/") {
      loadingStore.finishMapLoading();
    }
  },
  { immediate: true },
);
</script>

<template>
  <router-view />
  <MapLoading />
</template>
