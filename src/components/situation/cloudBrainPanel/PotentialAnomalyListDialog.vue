<!-- 待研判潜在异常完整列表弹窗（Mock） -->
<template>
  <el-dialog
    v-model="visible"
    append-to-body
    class="pa-list-dialog"
    width="1080px"
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <template #header>
      <div class="pa-list-dialog__head">
        <h2 class="pa-list-dialog__title">待研判潜在异常 · 完整列表</h2>
        <p class="pa-list-dialog__hint">可搜索、排序；点击条目查看依据</p>
      </div>
    </template>

    <div class="pa-list-dialog__toolbar">
      <select v-model="typeFilter" class="toolbar-select">
        <option value="all">全部</option>
        <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
      </select>
      <input v-model="searchDraft" class="toolbar-search" type="text" placeholder="搜索…" />
      <span class="toolbar-sort">排序: deviation ↓</span>
      <span class="toolbar-count">共 {{ filteredRows.length }} 条</span>
    </div>

    <div class="pa-list-dialog__table-wrap custom-scrollbar">
      <table class="pa-list-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" :checked="allChecked" @change="toggleAll(($event.target as HTMLInputElement).checked)" />
            </th>
            <th>编号</th>
            <th>名称</th>
            <th>类型</th>
            <th>区域</th>
            <th class="col-num">偏离度 ↓</th>
            <th class="col-num">置信度 %</th>
            <th class="col-num">持续</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in filteredRows"
            :key="row.id"
            class="pa-list-table__row"
            @click="emit('open-detail', row.id)"
          >
            <td class="col-check" @click.stop>
              <input
                type="checkbox"
                :checked="selectedIds.has(row.id)"
                @change="toggleOne(row.id, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td class="mono">{{ row.id }}</td>
            <td class="col-title">{{ row.title }}</td>
            <td>{{ row.typeLabel }}</td>
            <td>{{ row.region }}</td>
            <td class="col-num num-warn">{{ row.deviation }}</td>
            <td class="col-num">{{ row.confidencePct }}</td>
            <td class="col-num">{{ row.durationDays }}天</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <div class="pa-list-dialog__footer">
        <span class="footer-summary">
          显示 {{ filteredRows.length }} / {{ rows.length }} 条 · 已选 {{ selectedIds.size }} 条
        </span>
        <button
          type="button"
          class="confirm-batch-btn"
          :disabled="selectedIds.size === 0"
          @click="emit('batch-confirm', [...selectedIds])"
        >
          逐条确认所选
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { PotentialAnomalyListRow } from "@/mock/potentialAnomalyDialogs";

const visible = defineModel<boolean>({ required: true });

const props = defineProps<{
  /** 列表行 Mock 数据 */
  rows: PotentialAnomalyListRow[];
}>();

const emit = defineEmits<{
  "open-detail": [id: string];
  "batch-confirm": [ids: string[]];
}>();

const searchDraft = ref("");
const typeFilter = ref("all");
const selectedIds = ref<Set<string>>(new Set());

/**
 * 类型筛选项（由列表数据去重）。
 */
const typeOptions = computed(() => [...new Set(props.rows.map((r) => r.typeLabel))]);

/**
 * 搜索 + 类型过滤后的列表，按偏离度降序。
 */
const filteredRows = computed(() => {
  const kw = searchDraft.value.trim().toLowerCase();
  return [...props.rows]
    .filter((r) => {
      if (typeFilter.value !== "all" && r.typeLabel !== typeFilter.value) return false;
      if (!kw) return true;
      const hay = `${r.id} ${r.title} ${r.region} ${r.typeLabel}`.toLowerCase();
      return hay.includes(kw);
    })
    .sort((a, b) => b.deviation - a.deviation);
});

const allChecked = computed(
  () => filteredRows.value.length > 0 && filteredRows.value.every((r) => selectedIds.value.has(r.id)),
);

const toggleOne = (id: string, on: boolean) => {
  const next = new Set(selectedIds.value);
  if (on) next.add(id);
  else next.delete(id);
  selectedIds.value = next;
};

const toggleAll = (on: boolean) => {
  const next = new Set(selectedIds.value);
  filteredRows.value.forEach((r) => {
    if (on) next.add(r.id);
    else next.delete(r.id);
  });
  selectedIds.value = next;
};

const onClosed = () => {
  searchDraft.value = "";
  typeFilter.value = "all";
  selectedIds.value = new Set();
};

watch(visible, (v) => {
  if (!v) onClosed();
});
</script>

<style scoped lang="scss">
.pa-list-dialog__head {
  padding-right: 24px;
}

.pa-list-dialog__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #f3f4f6;
}

.pa-list-dialog__hint {
  margin: 4px 0 0;
  font-size: 11px;
  color: #6b7280;
}

.pa-list-dialog__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 12px;
}

.toolbar-select,
.toolbar-search {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  color: #e5e7eb;
  background: #0f172a;
  border: 1px solid #3d4d64;
  border-radius: 6px;
}

.toolbar-search {
  flex: 1 1 160px;
  min-width: 120px;
}

.toolbar-sort,
.toolbar-count {
  color: #9ca3af;
  font-size: 11px;
}

.pa-list-dialog__table-wrap {
  max-height: min(55vh, 420px);
  overflow: auto;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
}

.pa-list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.pa-list-table th,
.pa-list-table td {
  padding: 8px 10px;
  text-align: left;
  border-bottom: 1px solid #2d3a4d50;
  color: #cbd5e1;
}

.pa-list-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #111827;
  color: #93c5fd;
  font-weight: 600;
}

.pa-list-table__row {
  cursor: pointer;
}

.pa-list-table__row:hover td {
  background: rgba(37, 49, 65, 0.55);
}

.col-check {
  width: 36px;
}

.col-num {
  width: 72px;
  text-align: right;
}

.col-title {
  min-width: 180px;
}

.mono {
  font-family: ui-monospace, monospace;
  font-size: 10.5px;
  color: #9ca3af;
}

.num-warn {
  color: #fbbf24;
  font-family: ui-monospace, monospace;
}

.pa-list-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.footer-summary {
  font-size: 11.5px;
  color: #9ca3af;
}

.confirm-batch-btn {
  padding: 6px 14px;
  font-size: 12px;
  color: #e5e7eb;
  background: #1e3a5f;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  cursor: pointer;
}

.confirm-batch-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.confirm-batch-btn:not(:disabled):hover {
  background: #2563eb;
}
</style>

<style lang="scss">
.pa-list-dialog.el-dialog {
  background: #111827;
  border: 1px solid #2d3a4d;
}

.pa-list-dialog .el-dialog__header {
  border-bottom: 1px solid #2d3a4d;
  padding-bottom: 8px;
}

.pa-list-dialog .el-dialog__footer {
  border-top: 1px solid #2d3a4d;
}
</style>