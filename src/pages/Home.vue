<script setup lang="ts">
/**
 * 兼容旧路由组件路径：重定向到态势监控页。
 * 路由定义已改为 SituationMonitorPage，保留本文件避免外部 deep import 断裂。
 */
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  void router.replace({ name: "SituationMonitor" });
});
</script>

<template>
  <div class="h-full w-full flex items-center justify-center text-[#9ca3af] text-sm">
    正在进入态势监控…
  </div>
</template>