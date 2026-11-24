<template>
  <div
    ref="dockRootRef"
    class="map-node-dock"
    :class="{ 'map-node-dock--collapsed': collapsed }"
    role="region"
    aria-label="地图节点统计分类"
  >
    <div class="dock-summary">
      <header class="dock-categories">
        <div
          v-for="cat in data.categories"
          :key="cat.key"
          class="dock-cat"
        >
          <div class="dock-cat__head">
            <span class="dock-cat__title">{{ cat.title }}</span>
            <span class="dock-cat__sub">{{ cat.subtitle }}</span>
          </div>
          <div class="dock-cat__value-row">
            <span class="dock-cat__value">{{ cat.value }}</span>
            <span class="dock-cat__delta">↑ +{{ cat.delta }}</span>
          </div>
          <div class="dock-cat__bar">
            <span
              v-for="(color, i) in cat.barColors"
              :key="i"
              class="dock-cat__bar-seg"
              :style="{ background: color }"
            />
          </div>
        </div>
      </header>
      <button
        type="button"
        class="dock-toggle"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? '展开节点列表' : '收起节点列表'"
        @click="toggleCollapsed"
      >
        <span class="dock-toggle__label">{{ collapsed ? "展开" : "收起" }}</span>
        <span class="dock-toggle__chevron" aria-hidden="true">{{ collapsed ? "⌃" : "⌄" }}</span>
      </button>
    </div>

    <template v-if="!collapsed">
    <div class="dock-filters">
      <button
        v-for="tab in filterTabs"
        :key="tab.id"
        type="button"
        class="filter-pill"
        :class="{ 'filter-pill--active': tab.id === activeFilterId }"
        @click="activeFilterId = tab.id"
      >
        {{ tab.label }} {{ tab.count }}
      </button>
    </div>

    <div class="dock-todo">
      <span class="dock-todo__text">
        报告建议待办 ({{ data.reportTodo.pendingCount }})
        <em>{{ data.reportTodo.reportId }}</em>
      </span>
      <div class="dock-todo__actions">
        <button type="button" class="todo-btn todo-btn--primary" @click="onViewReport">
          查看报告
        </button>
        <template v-for="s in data.reportTodo.suggestions" :key="s.id">
          <span class="todo-meta">{{ s.action }}</span>
          <button type="button" class="todo-link" @click="onTodoView(s.id)">{{ s.targetLabel }}</button>
          <button type="button" class="todo-link" @click="onTodoExec(s.id)">执行</button>
        </template>
      </div>
    </div>

    <ul class="dock-list custom-scrollbar">
      <li v-for="item in data.listItems" :key="item.id" class="dock-row">
        <label class="dock-row__check">
          <input
            v-model="selectedIds"
            type="checkbox"
            :value="item.id"
          />
        </label>
        <span class="dock-row__icon" :class="`dock-row__icon--${item.kind}`">{{ item.icon }}</span>
        <div class="dock-row__main">
          <div class="dock-row__title">{{ item.title }}</div>
          <div v-if="item.subtitle" class="dock-row__sub">{{ item.subtitle }}</div>
        </div>
        <div class="dock-row__right">
          <span class="dock-row__badge" :class="`dock-row__badge--${item.kind}`">{{ item.badge }}</span>
          <span v-if="item.time" class="dock-row__time">{{ item.time }}</span>
          <button type="button" class="row-btn" @click="onViewItem(item.id)">查看</button>
          <button type="button" class="row-btn row-btn--ghost" aria-label="更多">…</button>
        </div>
      </li>
    </ul>

    <footer class="dock-toolbar">
      <span class="toolbar-count">已选 {{ selectedIds.length }} 项</span>
      <div class="toolbar-btns">
        <button type="button" class="tool-btn" @click="onBatch('confirm')">批量确认</button>
        <button type="button" class="tool-btn" @click="onBatch('exclude')">批量排除</button>
        <button type="button" class="tool-btn" @click="onBatch('locate')">批量定位</button>
        <button type="button" class="tool-btn tool-btn--accent" @click="onBatch('basket')">加入分析篮</button>
      </div>
      <button type="button" class="toolbar-clear" @click="selectedIds = []">取消选择</button>
    </footer>
    </template>

    <el-dialog
      v-model="reportDialogVisible"
      plain
      width="1160px"
      append-to-body
      align-center
      :close-on-click-modal="false"
      modal-class="map-dock-report-overlay"
      class="map-dock-report-dialog"
      destroy-on-close
      title="综合态势报告"
    >
      <SituationReportDialog
        @close="reportDialogVisible = false"
        @map-locate="onReportMapLocate"
        @export-pdf="onReportExportPdf"
        @export-report="onReportExport"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import SituationReportDialog from "@/components/Dialogs/SituationReportDialog.vue";
import { mapNodeDockMock, type MapNodeDockMock } from "@/mock/mapNodeDock";

/** 收起状态持久化键 */
const COLLAPSE_STORAGE_KEY = "cloudmap.mapNodeDock.collapsed";

/** 父组件 v-model:collapsed，用于同步地图右侧开关占位高度 */
const collapsed = defineModel<boolean>("collapsed", { default: false });

const emit = defineEmits<{
  /** 组件实际渲染高度（px），供父级抬高地图控件 */
  "height-change": [heightPx: number];
}>();

/** 根节点，用于测量高度 */
const dockRootRef = ref<HTMLElement | null>(null);
let dockResizeObserver: ResizeObserver | null = null;

/**
 * 上报当前占位高度。
 * @param heightPx - contentRect 高度
 */
function reportDockHeight(heightPx: number) {
  emit("height-change", Math.ceil(heightPx));
}

const props = withDefaults(
  defineProps<{
    /** Mock 或 API 数据 */
    data?: MapNodeDockMock;
  }>(),
  {
    data: () => mapNodeDockMock,
  },
);

/** 当前筛选 Tab */
const activeFilterId = ref(
  props.data.filterTabs.find((t) => t.active)?.id ?? props.data.filterTabs[0]?.id ?? "all",
);

/** 带选中态的筛选项 */
const filterTabs = computed(() =>
  props.data.filterTabs.map((t) => ({
    ...t,
    active: t.id === activeFilterId.value,
  })),
);

/** 批量勾选的行 id */
const selectedIds = ref<string[]>([]);

/** 综合态势报告详情弹窗 */
const reportDialogVisible = ref(false);

onMounted(() => {
  try {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (stored === "1") collapsed.value = true;
  } catch {
    /* ignore */
  }

  if (dockRootRef.value && typeof ResizeObserver !== "undefined") {
    dockResizeObserver = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h != null && h > 0) reportDockHeight(h);
    });
    dockResizeObserver.observe(dockRootRef.value);
    reportDockHeight(dockRootRef.value.getBoundingClientRect().height);
  }
});

onUnmounted(() => {
  dockResizeObserver?.disconnect();
  dockResizeObserver = null;
});

watch(collapsed, (v) => {
  try {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
  requestAnimationFrame(() => {
    if (dockRootRef.value) {
      reportDockHeight(dockRootRef.value.getBoundingClientRect().height);
    }
  });
});

/** 切换收起：收起后仅保留顶部分类统计 */
const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};

const onViewReport = () => {
  reportDialogVisible.value = true;
};

const onReportMapLocate = () => {
  ElMessage.info("地图定位（Mock，待接业务）");
};

const onReportExportPdf = () => {
  ElMessage.info("导出 PDF（Mock）");
};

const onReportExport = () => {
  ElMessage.info("导出报告（Mock）");
};

const onTodoView = (id: string) => {
  ElMessage.info(`查看建议 ${id}（Mock）`);
};

const onTodoExec = (id: string) => {
  ElMessage.info(`执行建议 ${id}（Mock）`);
};

const onViewItem = (id: string) => {
  ElMessage.info(`查看节点 ${id}（Mock）`);
};

/**
 * 底部批量操作占位。
 * @param action - 操作类型
 */
const onBatch = (action: string) => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请先勾选列表项");
    return;
  }
  ElMessage.info(`批量${action}：${selectedIds.value.length} 项（Mock）`);
};
</script>

<style scoped>
.map-node-dock {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 8px;
  max-height: min(42vh, 320px);
  transition: max-height 0.2s ease, padding 0.2s ease;
  background: rgba(15, 23, 35, 0.92);
  border: 1px solid rgba(45, 58, 77, 0.95);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  color: #e5e7eb;
  font-size: 12px;
}

.map-node-dock--collapsed {
  max-height: none;
  padding-bottom: 10px;
}

.dock-summary {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.dock-summary .dock-categories {
  flex: 1;
  min-width: 0;
}

.dock-toggle {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 2px;
  padding: 4px 8px;
  font-size: 10px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.dock-toggle:hover {
  color: #bfdbfe;
  background: rgba(59, 130, 246, 0.2);
}

.dock-toggle__chevron {
  font-size: 12px;
  line-height: 1;
}

.dock-categories {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.dock-cat__head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 2px;
}

.dock-cat__title {
  font-weight: 600;
  font-size: 11.5px;
}

.dock-cat__sub {
  font-size: 9px;
  color: #6b7280;
  letter-spacing: 0.04em;
}

.dock-cat__value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.dock-cat__value {
  font-size: 22px;
  font-weight: 700;
  font-family: ui-monospace, monospace;
  line-height: 1;
}

.dock-cat__delta {
  font-size: 11px;
  color: #4ade80;
  font-family: ui-monospace, monospace;
}

.dock-cat__bar {
  display: flex;
  height: 4px;
  margin-top: 6px;
  border-radius: 2px;
  overflow: hidden;
  gap: 1px;
}

.dock-cat__bar-seg {
  flex: 1;
}

.dock-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-pill {
  padding: 3px 8px;
  font-size: 10.5px;
  color: #9ca3af;
  background: rgba(17, 24, 39, 0.9);
  border: 1px solid #2d3a4d;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.filter-pill--active {
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.55);
}

.dock-todo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(34, 211, 238, 0.25);
  border-radius: 6px;
}

.dock-todo__text {
  font-size: 11px;
  color: #67e8f9;
}

.dock-todo__text em {
  font-style: normal;
  margin-left: 6px;
  color: #9ca3af;
  font-family: ui-monospace, monospace;
  font-size: 10px;
}

.dock-todo__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.todo-btn {
  padding: 2px 8px;
  font-size: 10px;
  border-radius: 4px;
  border: 1px solid #2d3a4d;
  cursor: pointer;
}

.todo-btn--primary {
  color: #fff;
  background: #2563eb;
  border-color: #3b82f6;
}

.todo-meta {
  font-size: 10px;
  color: #9ca3af;
}

.todo-link {
  padding: 0;
  font-size: 10px;
  color: #93c5fd;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.dock-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1 1 auto;
  min-height: 72px;
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid #2d3a4d50;
  border-radius: 6px;
  background: rgba(17, 24, 39, 0.55);
}

.dock-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid #2d3a4d40;
}

.dock-row:last-child {
  border-bottom: none;
}

.dock-row__check input {
  width: 14px;
  height: 14px;
  accent-color: #3b82f6;
}

.dock-row__icon {
  width: 20px;
  text-align: center;
  font-size: 12px;
  flex-shrink: 0;
}

.dock-row__icon--hotspot {
  color: #fb923c;
}

.dock-row__icon--conflict {
  color: #fbbf24;
}

.dock-row__icon--intel {
  color: #93c5fd;
}

.dock-row__main {
  flex: 1;
  min-width: 0;
}

.dock-row__title {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dock-row__sub {
  font-size: 10px;
  color: #6b7280;
  margin-top: 1px;
}

.dock-row__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dock-row__badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
}

.dock-row__badge--hotspot {
  color: #fdba74;
  background: rgba(249, 115, 22, 0.15);
}

.dock-row__badge--conflict {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.12);
}

.dock-row__badge--intel {
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.12);
}

.dock-row__time {
  font-size: 10px;
  color: #6b7280;
  font-family: ui-monospace, monospace;
}

.row-btn {
  padding: 2px 6px;
  font-size: 10px;
  color: #cbd5e1;
  background: #1a2332;
  border: 1px solid #2d3a4d;
  border-radius: 3px;
  cursor: pointer;
}

.row-btn--ghost {
  min-width: 22px;
  padding: 2px 4px;
}

.dock-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid #2d3a4d50;
}

.toolbar-count {
  font-size: 10.5px;
  color: #9ca3af;
}

.toolbar-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}

.tool-btn {
  padding: 4px 8px;
  font-size: 10px;
  color: #cbd5e1;
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  cursor: pointer;
}

.tool-btn--accent {
  color: #5eead4;
  border-color: rgba(45, 212, 191, 0.4);
}

.toolbar-clear {
  padding: 0;
  font-size: 10px;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 3px;
}

</style>