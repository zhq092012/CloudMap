<template>
  <!-- 潜在异常浮窗 -->
  <div ref="hostRef" class="situation-strip-host">
    <section class="situation-strip" :class="{ 'is-collapsed': isCollapsed }">
      <div class="strip-summary">
        <span class="strip-summary-label">
          潜在异常 <b>{{ pendingItems.length }}</b>
        </span>
        <button v-if="!autoCollapsed" type="button" class="strip-collapse" :aria-label="isCollapsed ? '展开列表' : '收起列表'"
          @click="toggleCollapsed">
          {{ isCollapsed ? "展开" : "收起" }}
        </button>
      </div>

      <div v-if="!isCollapsed" class="strip-cards">
        <section class="situation-card">
          <header>
            <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
              aria-hidden="true">
              <path d="M12 3 2 21h20L12 3Z" />
              <path d="M12 9v5m0 3v1" />
            </svg>
            <b>潜在异常</b>
            <span class="yt-tag tag-orange">{{ pendingItems.length }}</span>
            <button type="button" class="btn-link" @click="goAnomaly">查看全部</button>
          </header>

          <div class="situation-meta">
            待研判 {{ pendingItems.length }} 项 · 最高偏离 {{ maxDeviation }}
          </div>

          <div class="situation-rows">
            <div v-for="row in topRows" :key="row.id" class="situation-row">
              <button type="button" class="strip-name" :title="row.tip" @click="goAnomaly">
                {{ row.name }}
              </button>
              <span class="yt-tag" :class="row.toneClass">{{ row.deviationText }}</span>
            </div>
            <p v-if="!topRows.length" class="situation-empty">暂无待处理条目</p>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useHomeStore } from "@/store/modules/homeStore";

// 收起状态持久化（同原型 yuntu.situation.strip.collapsed.v1 的行为）
const COLLAPSE_KEY = "cloudmap.situation.strip.collapsed";
// 与 MapLeft 的「待研判 / 历史」口径一致：满一周归入历史，不再算待处理
const HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// 中部可用宽度小于该值时自动折叠：左右面板各占 360/380，1024 宽屏只剩 128px，
// 卡片会挤成竖条。参考原型对「地图过矮就自动收起」的处理。
const AUTO_COLLAPSE_WIDTH = 300;

const store = useHomeStore();
const router = useRouter();

const hostRef = ref<HTMLElement | null>(null);
const collapsed = ref(localStorage.getItem(COLLAPSE_KEY) === "1");
const autoCollapsed = ref(false);
const isCollapsed = computed(() => collapsed.value || autoCollapsed.value);

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
  localStorage.setItem(COLLAPSE_KEY, collapsed.value ? "1" : "0");
};

let observer: ResizeObserver | null = null;
onMounted(() => {
  if (!hostRef.value || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0;
    const next = width > 0 && width < AUTO_COLLAPSE_WIDTH;
    if (next !== autoCollapsed.value) autoCollapsed.value = next;
  });
  observer.observe(hostRef.value);
});
onBeforeUnmount(() => observer?.disconnect());

// 兼容 "2026-10-28 10:00:00" 与 ISO 两种写法
const parseTs = (value?: string | null): number => {
  if (!value) return NaN;
  const text = String(value);
  const ts = Date.parse(text.replace(" ", "T"));
  return Number.isNaN(ts) ? Date.parse(text) : ts;
};

const formatScore = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

// 待研判 = 未满一周且 status 不是 CONFIRMED（与 MapLeft.anomalyBuckets 同口径）
const pendingItems = computed(() => {
  const now = Date.now();
  return (store.warningMarkers || [])
    .filter((marker) => {
      const ts = parseTs(marker.createdAt);
      if (!Number.isNaN(ts) && now - ts > HISTORY_WINDOW_MS) return false;
      return String(marker.status || "").toUpperCase() !== "CONFIRMED";
    })
    .map((marker) => {
      const name = (marker.name || "").trim() || "未知警告";
      const region = marker.description || "未知区域";
      const deviation = Number(marker.score) || 0;
      // 只展示后端真实返回的偏离度（deviationScore）。
      // 原型的「置信度%」在本项目没有可靠来源（anomaly 列表的 confidence 字段无任何校验/其它消费方，
      // 缺失时会被兜成 0%），按需求整列去掉，不再显示百分比。
      return {
        id: marker.id,
        name,
        region,
        deviation,
        deviationText: formatScore(deviation),
        tip: `${name} · ${region}`,
      };
    })
    .sort((a, b) => b.deviation - a.deviation);
});

const topRows = computed(() =>
  pendingItems.value.slice(0, 3).map((row) => ({
    ...row,
    toneClass:
      row.deviation >= 80 ? "tag-red" : row.deviation >= 60 ? "tag-orange" : "tag-gray",
  })),
);

const maxDeviation = computed(() =>
  pendingItems.value.length ? pendingItems.value[0].deviationText : "0",
);

// 查看全部 → 异常征候页（Home.vue 在 /anomaly 下切换成异常征候视图）。
// 条目本身点击也进同一页：本项目的事件详情弹窗在异常征候左栏卡片里，不在这里重复实现。
const goAnomaly = () => router.push({ name: "Anomaly" });
</script>

<style scoped>
/* 挂载位置：中部主区顶部右侧（右栏 380 + 12）。
   容器仍横跨整个中部可用宽度（供 ResizeObserver 判断窄视口自动折叠），
   卡片靠右对齐（margin-left:auto），因此窄屏时向左收窄而不会被右栏切掉。 */
.situation-strip-host {
  position: absolute;
  top: 12px;
  left: 300px;
  /* right: calc(380px + 12px); */
  /* Leaflet 的 .leaflet-pane 自身带 400~700 的 z-index，地图容器又没建层叠上下文，
     这里必须高于 pane 才能浮在地图之上（原型是自绘地图，只用了 20） */
  z-index: 900;
  height: 0;
  pointer-events: none;
}

.situation-strip {
  /* 宽度按需求收为原设计的一半（640 → 320），条目只保留「名称 + 偏离度」两列 */
  width: min(320px, 100%);
  margin-left: auto;
  pointer-events: auto;
  font-size: 12px;
  color: var(--text);
}

.strip-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 28px;
  padding: 0 8px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-bottom: 0;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.strip-summary-label {
  color: var(--text-muted);
  white-space: nowrap;
}

.strip-summary-label b {
  margin-left: 6px;
  color: var(--text);
  font-weight: 600;
}

.strip-collapse {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}

.strip-collapse:hover {
  color: var(--accent-text);
}

.strip-cards {
  border: 1px solid var(--border);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  overflow: hidden;
  background: var(--bg-panel);
}

.situation-strip.is-collapsed .strip-cards {
  display: none;
}

.situation-strip.is-collapsed .strip-summary {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.situation-card {
  min-width: 0;
  padding: 8px;
}

.situation-card header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--text);
}

.card-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

.btn-link {
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent-text);
  font: inherit;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
}

.btn-link:hover {
  color: var(--accent);
}

.situation-meta {
  padding: 6px 0;
  color: var(--text-muted);
  font-size: 11px;
}

.situation-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.strip-name {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.strip-name:hover {
  color: var(--accent);
}

.situation-empty {
  margin: 0;
  padding: 10px 0 4px;
  color: var(--text-faint);
  font-size: 11px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* 徽标：沿用原型 .yt-tag 的尺寸与配色 */
.yt-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 18px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.tag-orange {
  background: rgba(245, 158, 11, 0.14);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.38);
}

.tag-red {
  background: rgba(239, 68, 68, 0.14);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.38);
}

.tag-gray {
  background: rgba(107, 114, 128, 0.16);
  color: var(--text-2);
  border-color: rgba(107, 114, 128, 0.4);
}
</style>
