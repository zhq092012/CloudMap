<!-- 云脑智能面板顶栏：标题 + 实时徽章 + 「⋯」更多菜单（态势 / 异常 / 深度分析共用） -->
<template>
  <header class="cb-panel-header">
    <div class="cb-panel-header__main">
      <span v-if="leadingIcon" class="cb-panel-header__pin" aria-hidden="true">{{ leadingIcon }}</span>
      <h2 class="cb-panel-header__title">{{ title }}</h2>
    </div>
    <div ref="headerActionsRef" class="cb-panel-header__actions">
      <span v-if="autoRefreshEnabled" class="cb-panel-header__live">● 实时</span>
      <div class="cb-panel-header__menu-anchor">
        <button
          type="button"
          class="cb-panel-header__icon-btn"
          title="更多"
          aria-label="更多"
          :aria-expanded="menuOpen"
          @click="toggleHeaderMenu"
        >
          ⋯
        </button>
        <div v-show="menuOpen" class="cb-panel-header__menu" role="menu">
          <button
            v-for="item in primaryMenuItems"
            :key="item.id"
            type="button"
            class="cb-panel-header__menu-item"
            role="menuitem"
            @click="onMenuAction(item.id)"
          >
            {{ item.label }}
          </button>
          <div class="cb-panel-header__menu-divider" role="separator" />
          <button
            v-for="item in secondaryMenuItems"
            :key="item.id"
            type="button"
            class="cb-panel-header__menu-item"
            role="menuitem"
            @click="onMenuAction(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

/** 顶栏更多菜单项 id */
export type CloudBrainPanelMenuActionId =
  | "copy-summary"
  | "export"
  | "pin"
  | "refresh"
  | "stop-auto-refresh";

const props = withDefaults(
  defineProps<{
    /** 顶栏标题 */
    title: string;
    /** 标题左侧图标字符，空则不显示 */
    leadingIcon?: string;
    /** 复制摘要用的纯文本 */
    summaryText?: string;
    /** 初始是否展示「实时」并启用自动刷新 */
    initialLive?: boolean;
  }>(),
  {
    leadingIcon: "⌁",
    summaryText: "",
    initialLive: true,
  },
);

const emit = defineEmits<{
  refresh: [];
  export: [];
  pin: [];
}>();

const menuOpen = ref(false);
const autoRefreshEnabled = ref(props.initialLive);
const headerActionsRef = ref<HTMLElement | null>(null);

const primaryMenuItems = [
  { id: "copy-summary" as const, label: "复制摘要" },
  { id: "export" as const, label: "导出" },
  { id: "pin" as const, label: "固定" },
];

const secondaryMenuItems = [
  { id: "refresh" as const, label: "刷新" },
  { id: "stop-auto-refresh" as const, label: "停止自动刷新" },
];

const toggleHeaderMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeHeaderMenu = () => {
  menuOpen.value = false;
};

const onMenuAction = async (id: CloudBrainPanelMenuActionId) => {
  closeHeaderMenu();
  switch (id) {
    case "copy-summary":
      if (!props.summaryText.trim()) {
        ElMessage.warning("暂无可复制的摘要");
        return;
      }
      try {
        await navigator.clipboard.writeText(props.summaryText);
        ElMessage.success("摘要已复制到剪贴板");
      } catch {
        ElMessage.error("复制失败，请检查浏览器权限");
      }
      break;
    case "export":
      emit("export");
      break;
    case "pin":
      emit("pin");
      break;
    case "refresh":
      emit("refresh");
      break;
    case "stop-auto-refresh":
      autoRefreshEnabled.value = false;
      ElMessage.warning("已停止自动刷新");
      break;
    default:
      break;
  }
};

const onDocumentPointerDown = (e: MouseEvent) => {
  if (!menuOpen.value) return;
  const root = headerActionsRef.value;
  if (root && !root.contains(e.target as Node)) closeHeaderMenu();
};

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<style scoped lang="scss">
.cb-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
  padding: 10px 10px 8px;
  border-bottom: 1px solid #2d3a4d;
}

.cb-panel-header__main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cb-panel-header__pin {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1;
  color: #60a5fa;
}

.cb-panel-header__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #93c5fd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cb-panel-header__actions {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cb-panel-header__live {
  flex-shrink: 0;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #4ade80;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.35);
  border-radius: 999px;
}

.cb-panel-header__menu-anchor {
  position: relative;
}

.cb-panel-header__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.cb-panel-header__icon-btn:hover {
  color: #e5e7eb;
  background: #253141;
}

.cb-panel-header__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  min-width: 140px;
  padding: 6px 0;
  background: #1e293b;
  border: 1px solid #3d4d64;
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.cb-panel-header__menu-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  font-size: 12px;
  line-height: 1.35;
  color: #e5e7eb;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.cb-panel-header__menu-item:hover {
  background: #253141;
  color: #f8fafc;
}

.cb-panel-header__menu-divider {
  height: 1px;
  margin: 4px 0;
  background: #334155;
}
</style>