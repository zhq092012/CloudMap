<template>
  <!-- 中部态势条：潜在异常 + 威胁评估（左右分栏） -->
  <div ref="observeRef" class="situation-strip-observe" aria-hidden="true" />
  <div class="situation-strip-host">
    <section class="situation-strip" :class="{ 'is-collapsed': isCollapsed }">
      <div class="strip-summary">
        <span class="strip-summary-label">
          潜在异常 <b>{{ pendingItems.length }}</b>
        </span>
        <span class="strip-summary-label">
          威胁评估 <b>{{ threatTotal }}</b>
        </span>
        <button
          type="button"
          class="strip-collapse"
          :aria-label="isCollapsed ? '展开列表' : '收起列表'"
          @click="toggleCollapsed"
        >
          {{ isCollapsed ? "展开" : "收起" }}
        </button>
      </div>

      <div v-show="!isCollapsed" class="strip-cards strip-cards--dual">
        <section class="situation-card situation-card--anomaly">
          <header>
            <svg
              class="card-icon card-icon--warn"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <path d="M12 3 2 21h20L12 3Z" />
              <path d="M12 9v5m0 3v1" />
            </svg>
            <b>潜在异常</b>
            <span class="yt-tag tag-orange">{{ pendingItems.length }}</span>
            <button type="button" class="btn-link" @click="goAnomaly">查看全部</button>
          </header>

          <div class="situation-rows">
            <div v-for="row in topPendingRows" :key="row.id" class="situation-row">
              <button type="button" class="strip-name" :title="row.tip" @click="goAnomaly">
                {{ row.name }}
              </button>
              <span class="row-muted">{{ row.confidenceText }}</span>
              <span class="yt-tag" :class="row.scoreClass">{{ row.scoreText }}</span>
              <span class="row-trend" aria-hidden="true">⇅</span>
            </div>
            <p v-if="!topPendingRows.length" class="situation-empty">暂无待处理条目</p>
          </div>
        </section>

        <section class="situation-card situation-card--threat">
          <header>
            <svg
              class="card-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              aria-hidden="true"
            >
              <path d="M12 3 2 21h20L12 3Z" />
              <path d="M12 9v5m0 3v1" />
            </svg>
            <b>威胁评估</b>
            <span class="yt-tag tag-gray-outline">{{ threatTotal }}</span>
            <button type="button" class="btn-link" @click="onThreatViewAll">查看全部</button>
          </header>

          <div class="situation-rows">
            <div v-for="row in threatTopRows" :key="row.id" class="situation-row">
              <button type="button" class="strip-name" :title="row.name" @click="onThreatViewAll">
                {{ row.name }}
              </button>
              <span class="row-threat-label">{{ row.threatLabel }}</span>
              <span class="yt-tag tag-red">{{ row.score }}</span>
              <span class="row-trend" aria-hidden="true">⇅</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useHomeStore } from "@/store/modules/homeStore";
import { situationStripThreatMock } from "@/mock/situationStrip";

const COLLAPSE_KEY = "cloudmap.situation.strip.collapsed";
const HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** 视口中部可用宽度低于此值时默认收起（仍可手动展开） */
const AUTO_COLLAPSE_WIDTH = 520;

const store = useHomeStore();
const router = useRouter();

/** 用于 ResizeObserver 的占位（全宽，不受条高度影响） */
const observeRef = ref<HTMLElement | null>(null);
/** 用户手动收起 */
const collapsed = ref(localStorage.getItem(COLLAPSE_KEY) === "1");
/** 窄屏建议收起 */
const autoCollapsed = ref(false);
/** 用户手动展开后，暂不跟随自动收起 */
const userExpandedLock = ref(false);

const isCollapsed = computed(() => {
  if (collapsed.value) return true;
  if (userExpandedLock.value) return false;
  return autoCollapsed.value;
});

const toggleCollapsed = () => {
  if (isCollapsed.value) {
    collapsed.value = false;
    userExpandedLock.value = true;
    localStorage.setItem(COLLAPSE_KEY, "0");
  } else {
    collapsed.value = true;
    userExpandedLock.value = false;
    localStorage.setItem(COLLAPSE_KEY, "1");
  }
};

let observer: ResizeObserver | null = null;
onMounted(() => {
  if (!observeRef.value || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width ?? 0;
    const next = width > 0 && width < AUTO_COLLAPSE_WIDTH;
    if (next !== autoCollapsed.value) autoCollapsed.value = next;
  });
  observer.observe(observeRef.value);
});
onBeforeUnmount(() => observer?.disconnect());

const parseTs = (value?: string | null): number => {
  if (!value) return NaN;
  const text = String(value);
  const ts = Date.parse(text.replace(" ", "T"));
  return Number.isNaN(ts) ? Date.parse(text) : ts;
};

const formatScore = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

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
      const confidence = Number(marker.confidence);
      const confidencePct = Number.isFinite(confidence)
        ? confidence <= 1
          ? Math.round(confidence * 100)
          : Math.round(confidence)
        : null;
      return {
        id: marker.id,
        name,
        region,
        deviation,
        deviationText: formatScore(deviation),
        confidencePct,
        tip: `${name} · ${region}`,
      };
    })
    .sort((a, b) => b.deviation - a.deviation);
});

const topPendingRows = computed(() => {
  const fromStore = pendingItems.value.slice(0, 3).map((row) => ({
    id: row.id,
    name: row.name,
    tip: row.tip,
    confidenceText:
      row.confidencePct != null ? `${row.confidencePct}%` : "—",
    scoreText: row.deviationText,
    scoreClass:
      row.deviation >= 80
        ? "tag-red"
        : row.deviation >= 60
          ? "tag-orange"
          : "tag-gray",
  }));

  if (fromStore.length >= 3) return fromStore;

  const mockFill = [
    {
      id: "mock-p1",
      name: "霍尔木兹海峡货轮 AIS 静默",
      tip: "霍尔木兹海峡货轮 AIS 静默",
      confidenceText: "76%",
      scoreText: "74",
      scoreClass: "tag-orange",
    },
    {
      id: "mock-p2",
      name: "伊朗东北部地面部队集结",
      tip: "伊朗东北部地面部队集结",
      confidenceText: "71%",
      scoreText: "68",
      scoreClass: "tag-orange",
    },
    {
      id: "mock-p3",
      name: "西海岸雷达站电子干扰增强",
      tip: "西海岸雷达站电子干扰增强",
      confidenceText: "74%",
      scoreText: "63",
      scoreClass: "tag-orange",
    },
  ];

  const used = new Set(fromStore.map((r) => r.name));
  for (const m of mockFill) {
    if (fromStore.length >= 3) break;
    if (!used.has(m.name)) fromStore.push(m);
  }
  return fromStore.slice(0, 3);
});

const threatTotal = computed(() => situationStripThreatMock.total);

const threatTopRows = computed(() => situationStripThreatMock.items);

const goAnomaly = () => router.push({ name: "AnomalySigns" });

const onThreatViewAll = () => {
  ElMessage.info("威胁评估列表（Mock，待接业务）");
};
</script>

<style scoped>
.situation-strip-observe {
  position: absolute;
  top: 12px;
  left: var(--map-chrome-left, 372px);
  right: var(--map-chrome-right, 392px);
  height: 1px;
  pointer-events: none;
  visibility: hidden;
}

.situation-strip-host {
  position: absolute;
  top: 12px;
  right: var(--map-chrome-right, 392px);
  z-index: 900;
  pointer-events: none;
  transition: right 0.22s ease;
}

.situation-strip {
  width: min(
    640px,
    calc(100vw - var(--map-chrome-left, 372px) - var(--map-chrome-right, 392px) - 12px)
  );
  transition: width 0.22s ease;
  margin-left: auto;
  pointer-events: auto;
  font-size: 12px;
  color: var(--text);
}

.strip-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 32px;
  padding: 0 10px;
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
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  font: inherit;
  font-size: 11px;
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
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

.strip-cards--dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.situation-strip.is-collapsed .strip-summary {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.situation-card {
  min-width: 0;
  padding: 8px 10px;
}

.situation-card--anomaly {
  border-right: 1px solid var(--border);
}

.situation-card header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--text);
}

.card-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}

.card-icon--warn {
  color: #fbbf24;
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

.situation-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.strip-name {
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 11.5px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.strip-name:hover {
  color: var(--accent);
}

.row-muted {
  font-size: 11px;
  color: var(--text-muted);
  font-family: ui-monospace, monospace;
}

.row-threat-label {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.row-trend {
  font-size: 10px;
  color: var(--text-faint);
  cursor: default;
}

.situation-empty {
  margin: 0;
  padding: 10px 0 4px;
  color: var(--text-faint);
  font-size: 11px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.yt-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 18px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 11px;
  line-height: 1;
  font-family: ui-monospace, monospace;
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

.tag-gray-outline {
  background: transparent;
  color: var(--text-2);
  border-color: rgba(107, 114, 128, 0.55);
}
</style>