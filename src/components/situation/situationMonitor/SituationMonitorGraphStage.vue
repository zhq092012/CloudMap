<template>
  <div class="situation-graph-stage">
    <GraphMain />
    <button
      type="button"
      class="situation-graph-stage__refresh"
      :disabled="graphRefreshing"
      title="手动刷新文章数据（图谱模式下已暂停 30s 自动轮询）"
      @click="handleGraphRefresh"
    >
      <span v-if="graphRefreshing" class="situation-graph-stage__spinner" aria-hidden="true"></span>
      <span>{{ graphRefreshing ? "刷新中…" : "刷新文章数据" }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";
import GraphMain from "@/components/graph/GraphMain.vue";

const store = useHomeStore();
const graphRefreshing = ref(false);

/** 图谱模式手动拉取文章，供 GraphMain 重渲染 */
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

<style scoped lang="scss">
.situation-graph-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.situation-graph-stage__refresh {
  position: absolute;
  top: 16px;
  right: var(--map-chrome-right, 392px);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #93c5fd;
  cursor: pointer;
  user-select: none;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(59, 130, 246, 0.45);
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  transition:
    right 0.22s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    background: rgba(27, 38, 55, 0.98);
    border-color: #3b82f6;
  }

  &:active {
    background: rgba(13, 19, 32, 0.98);
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
}

.situation-graph-stage__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: situation-graph-spin 0.8s linear infinite;
}

@keyframes situation-graph-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>