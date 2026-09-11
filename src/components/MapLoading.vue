<template>
  <transition name="map-loading-fade">
    <div v-if="loadingStore.mapLoading" class="map-loading-mask">
      <div class="map-loading-inner">
        <!-- loading 图标：旋转环形 spinner -->
        <svg class="map-loading-spinner" viewBox="0 0 50 50" aria-hidden="true">
          <circle
            class="map-loading-spinner__track"
            cx="25"
            cy="25"
            r="20"
            fill="none"
          />
          <circle
            class="map-loading-spinner__arc"
            cx="25"
            cy="25"
            r="20"
            fill="none"
          />
        </svg>
        <div class="map-loading-text">正在加载地图...</div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from "@/store/modules/loadingStore";

const loadingStore = useLoadingStore();
</script>

<style scoped>
/* 全屏遮罩：覆盖整个视口，置于最顶层 */
.map-loading-mask {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 40%, #0e1626 0%, #060a12 100%);
  user-select: none;
}

.map-loading-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

/* 旋转 spinner */
.map-loading-spinner {
  width: 64px;
  height: 64px;
  animation: map-loading-rotate 1s linear infinite;
}

.map-loading-spinner__track {
  stroke: rgba(148, 163, 184, 0.18);
  stroke-width: 4;
}

.map-loading-spinner__arc {
  stroke: #06b6d4;
  stroke-width: 4;
  stroke-linecap: round;
  /* 留出缺口，形成一段弧线（loading 图标） */
  stroke-dasharray: 80 200;
  stroke-dashoffset: 0;
  filter: drop-shadow(0 0 6px rgba(6, 182, 212, 0.55));
}

.map-loading-text {
  font-size: 16px;
  letter-spacing: 2px;
  color: #cbd5e1;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
}

@keyframes map-loading-rotate {
  to {
    transform: rotate(360deg);
  }
}

/* 淡入淡出过渡 */
.map-loading-fade-enter-active,
.map-loading-fade-leave-active {
  transition: opacity 0.35s ease;
}
.map-loading-fade-enter-from,
.map-loading-fade-leave-to {
  opacity: 0;
}
</style>
