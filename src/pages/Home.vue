<template>
  <div class="flex h-full relative">
    <div v-show="!isGraphMode" class="absolute inset-0">
      <Map />
    </div>
    <div v-show="isGraphMode" class="absolute inset-0 z-0">
      <GraphMain />
    </div>

    <template v-if="store.isWarningView">
      <WarningLeftPanel class="absolute left-3 top-3 bottom-3 z-1000" />
      <WarningRightPanel class="absolute right-0 top-0 z-1000" />
      <button
        class="absolute top-3 left-1/2 -translate-x-1/2 z-1001 px-3 py-1 text-xs rounded bg-[#1d3557] text-blue-200 border border-blue-500/40 hover:bg-blue-600 transition-colors"
        @click="store.setWarningView(false)"
      >
        ← 返回
      </button>
    </template>

    <template v-else>
      <MapLeft />
      <!-- 战场图谱模式：隐藏右侧智能面板，改为显示聚合文章列表 -->
      <RightPanel v-show="!isGraphMode" />
      <RightGraphList v-show="isGraphMode" />

      <!-- 图谱刷新按钮：图谱右上方，RightGraphList 左侧 20px 处（面板宽度 w-95 = 380px，再向左 20px）。
           图谱模式下 30s 自动轮询已暂停，点击手动请求文章接口 -->
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";

const store = useHomeStore();
// 战场图谱模式：MapLeft.vue 的「战场图谱」标签（mapLeftTab === 'third'）激活时为真
const isGraphMode = computed(() => store.mapLeftTab === "third");

// 手动刷新文章数据：调用 Map.vue 注册的 store.articlesRefetch（force 绕过 enabled 门控）
const graphRefreshing = ref(false);
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
.graph-refresh-btn {
  position: absolute;
  top: 16px;
  right: calc(380px + 20px); /* RightGraphList 宽度 w-95 = 380px，再向左 20px */
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #f0d9a8;
  background: rgba(17, 22, 37, 0.92);
  border: 1px solid rgba(193, 164, 101, 0.55);
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.graph-refresh-btn:hover {
  background: rgba(26, 34, 52, 0.95);
  border-color: #c1a465;
}

.graph-refresh-btn:active {
  background: rgba(13, 19, 32, 0.95);
}

.graph-refresh-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.graph-refresh-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(193, 164, 101, 0.35);
  border-top-color: #c1a465;
  border-radius: 50%;
  animation: graph-refresh-spin 0.8s linear infinite;
}

@keyframes graph-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
