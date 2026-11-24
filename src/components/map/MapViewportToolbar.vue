<template>
  <nav class="map-vp-toolbar" aria-label="地图视图控制">
    <label class="map-vp-check">
      <input v-model="roadLabels" type="checkbox" class="map-vp-check__input" />
      <span>道路地名</span>
    </label>
    <div class="map-vp-actions">
      <button type="button" class="map-vp-btn" title="放大" aria-label="放大" @click="zoomIn">+</button>
      <button type="button" class="map-vp-btn" title="缩小" aria-label="缩小" @click="zoomOut">−</button>
      <button type="button" class="map-vp-btn map-vp-btn--text" @click="fitOverview">全览</button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useHomeStore } from "@/store/modules/homeStore";

const homeStore = useHomeStore();

const roadLabels = ref(false);

watch(roadLabels, (visible) => {
  const api = homeStore.mapViewportApi;
  if (api?.setRoadLabelsVisible) {
    api.setRoadLabelsVisible(visible);
    return;
  }
  if (visible) {
    ElMessage.warning("地图尚未就绪，请稍候再试");
    roadLabels.value = false;
  }
});

const zoomIn = () => {
  homeStore.mapViewportApi?.zoomIn?.();
};

const zoomOut = () => {
  homeStore.mapViewportApi?.zoomOut?.();
};

const fitOverview = () => {
  homeStore.mapViewportApi?.fitOverview?.();
};
</script>

<style scoped>
.map-vp-toolbar {
  position: absolute;
  top: 12px;
  left: var(--map-chrome-left, 372px);
  transition: left 0.22s ease;
  z-index: 900;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid rgba(45, 58, 77, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  pointer-events: auto;
  user-select: none;
}

.map-vp-check {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #e5e7eb;
  white-space: nowrap;
  cursor: pointer;
}

.map-vp-check__input {
  width: 14px;
  height: 14px;
  accent-color: #3b82f6;
}

.map-vp-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.map-vp-btn {
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  font-size: 16px;
  line-height: 1;
  color: #e5e7eb;
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.map-vp-btn:hover {
  background: #253141;
  border-color: #3d4d64;
}

.map-vp-btn--text {
  min-width: 44px;
  font-size: 12px;
  font-weight: 500;
}
</style>