<template>
  <aside
    class="map-resource-legend"
    :style="legendStyle"
    aria-label="地图资源图标说明"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="legend-item"
    >
      <span class="legend-symbol" :class="symbolClass(item.tone)">{{ item.symbol }}</span>
      <span class="legend-label">{{ item.label }}</span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { mapResourceLegendItems, type MapResourceLegendItem } from "@/mock/mapResourceLegend";

const props = withDefaults(
  defineProps<{
    /** 图例项，默认 Mock */
    items?: MapResourceLegendItem[];
    /** 底部 Dock 占位高度（px），用于随 Dock 收起/展开浮动 */
    dockReservePx?: number;
  }>(),
  {
    items: () => mapResourceLegendItems,
    dockReservePx: 0,
  },
);

/** 距视口底边的偏移：Dock 高度 + 间距 */
const legendStyle = computed(() => ({
  bottom: `calc(12px + ${props.dockReservePx}px + 8px)`,
}));

/**
 * 图例符号颜色 class。
 * @param tone - 色调
 */
const symbolClass = (tone?: MapResourceLegendItem["tone"]) => {
  if (tone === "warn") return "legend-symbol--warn";
  if (tone === "orange") return "legend-symbol--orange";
  return "legend-symbol--default";
};
</script>

<style scoped>
.map-resource-legend {
  position: absolute;
  left: var(--map-chrome-left, 372px);
  z-index: 900;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  max-width: min(
    640px,
    calc(100vw - var(--map-chrome-left, 372px) - var(--map-chrome-right, 392px) - 12px)
  );
  transition: left 0.22s ease, max-width 0.22s ease;
  padding: 8px 12px;
  background: rgba(17, 24, 39, 0.88);
  border: 1px solid rgba(45, 58, 77, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  transition: bottom 0.2s ease;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
}

.legend-symbol {
  font-size: 12px;
  line-height: 1;
}

.legend-symbol--default {
  color: #e5e7eb;
}

.legend-symbol--warn {
  color: #fbbf24;
}

.legend-symbol--orange {
  color: #fb923c;
}

.legend-label {
  color: #9ca3af;
}
</style>