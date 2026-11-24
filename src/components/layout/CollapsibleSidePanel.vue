<!-- 可折叠侧边栏 -->
<template>
  <aside class="csp" :class="[
    `csp--${side}`,
    `csp--${layout}`,
    { 'csp--collapsed': collapsed },
  ]" :style="rootStyle" :aria-label="ariaLabel || label">
    <button v-if="collapsed" type="button" class="csp__rail-btn" :title="`展开${label}`" @click="collapsed = false">
      <span class="csp__rail-icon" aria-hidden="true">{{ side === "left" ? "›" : "‹" }}</span>
      <span class="csp__rail-label">{{ label }}</span>
    </button>

    <template v-else>
      <button type="button" class="csp__edge-collapse" :class="`csp__edge-collapse--${side}`" :title="`收起${label}`"
        :aria-label="`收起${label}`" @click="collapsed = true">
        <span class="csp__edge-collapse-icon" aria-hidden="true">{{
          side === "left" ? "‹" : "›"
        }}</span>
      </button>
      <div class="csp__body">
        <slot />
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 贴左或贴右 */
    side: "left" | "right";
    /** flex：参与父级 flex 布局；overlay：地图页绝对定位浮层 */
    layout?: "flex" | "overlay";
    /** 展开宽度（px） */
    width?: number;
    /** 收起窄条宽度（px） */
    railWidth?: number;
    /** 收起态竖排标签 */
    label?: string;
    /** 无障碍整体标签 */
    ariaLabel?: string;
  }>(),
  {
    layout: "flex",
    width: 380,
    railWidth: 36,
    label: "侧栏",
    ariaLabel: "",
  },
);

/** 是否收起 */
const collapsed = defineModel<boolean>("collapsed", { default: false });

const rootStyle = computed(() => ({
  "--csp-width": `${props.width}px`,
  "--csp-rail": `${props.railWidth}px`,
}));
</script>

<style scoped lang="scss">
.csp {
  --csp-width: 380px;
  --csp-rail: 36px;
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  min-height: 0;
  width: var(--csp-width);
  transition: width 0.22s ease;
  user-select: none;
  overflow: visible;
}

.csp--collapsed {
  width: var(--csp-rail);
  overflow: hidden;
}

.csp--overlay {
  position: absolute;
  top: 0;
  height: 100%;
  z-index: 1000;

  &.csp--left {
    left: 0;
  }

  &.csp--right {
    right: 0;
  }
}

.csp--flex.csp--left {
  border-right: 1px solid var(--border, #2d3a4d);
}

.csp--flex.csp--right {
  border-left: 1px solid var(--border, #2d3a4d);
}

.csp--overlay.csp--collapsed {
  background: rgba(17, 24, 39, 0.92);
  border: 1px solid #2d3a4d;
}

.csp__rail-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  padding: 12px 4px;
  border: none;
  background: transparent;
  color: #93c5fd;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }
}

.csp__rail-icon {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  color: #cbd5e1;
}

.csp__edge-collapse-icon {
  display: block;
  font-size: 18px;
  line-height: 1;
}

.csp__rail-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #93c5fd;
}

.csp__edge-collapse {
  position: absolute;
  top: 50%;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 52px;
  margin-top: -26px;
  padding: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  color: #cbd5e1;
  background: rgba(17, 24, 39, 0.98);
  border: 1px solid #475569;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  pointer-events: auto;
  border-radius: 8px;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    color: #ffffff;
    background: #253141;
    border-color: #93c5fd;
    box-shadow: 0 2px 16px rgba(59, 130, 246, 0.25);
  }

  /* 贴边居中，避免有一半落在侧栏内被内容盖住 */
  &--left {
    right: 0;
    transform: translateX(50%);
  }

  &--right {
    left: 0;
    transform: translateX(-50%);
  }
}

.csp--overlay .csp__edge-collapse {
  z-index: 1101;
}

.csp__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 地图页子面板自带 absolute + 固定宽时，在壳内铺满 */
.csp__body :deep(> *) {
  position: relative !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  z-index: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  min-height: 0;
  box-sizing: border-box;
}
</style>