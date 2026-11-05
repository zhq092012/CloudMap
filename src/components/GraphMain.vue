<template>
  <div class="graph-wrapper relative h-full w-full bg-[#0b0f1a]">
    <!-- 画布（置于最底层，铺满容器） -->
    <div ref="containerRef" class="graph-canvas absolute inset-0"></div>

    <!-- 加载提示（力导向布局收敛期间展示，不拦截交互） -->
    <div v-if="loading && !isEmpty" class="graph-loading">
      <span class="graph-loading-spinner"></span>
      图谱加载中…
    </div>

    <!-- 选中节点信息卡 -->
    <div v-if="selectedNode" class="graph-info">
      <div class="info-title">{{ selectedNode.title }}</div>
      <template v-if="selectedNode.kind === 'country'">
        <div class="info-type">类型：国家聚合节点</div>
        <div class="info-type">关联文章：{{ selectedNode.count }} 篇</div>
      </template>
      <template v-else-if="selectedNode.kind === 'author'">
        <div class="info-type">类型：作者聚合节点</div>
        <div class="info-type" v-if="selectedNode.authorName">作者：{{ selectedNode.authorName }}</div>
        <div class="info-type">关联文章：{{ selectedNode.count }} 篇</div>
      </template>
      <template v-else>
        <div class="info-type">国家：{{ selectedNode.country || "未知" }}</div>
        <div class="info-type">作者：{{ selectedNode.authorName || "未知" }}</div>
        <div class="info-type">
          情感：<span :style="{ color: sentimentColor(selectedNode.sentiment) }">{{ sentimentLabel(selectedNode.sentiment) }}</span>
          <span v-if="selectedNode.isBreaking" class="info-breaking">· 异常</span>
        </div>
        <div class="info-type" v-if="selectedNode.source">来源：{{ selectedNode.source }}</div>
        <div class="info-type" v-if="selectedNode.publishedAt">发布：{{ selectedNode.publishedAt.slice(0, 10) }}</div>
      </template>
      <div class="info-hint">点击空白处取消选中</div>
    </div>

    <!-- 空数据提示 -->
    <div v-if="isEmpty" class="graph-empty">{{ emptyMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { Graph } from "@antv/g6";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useHomeStore } from "@/store/modules/homeStore";

const store = useHomeStore();
const containerRef = ref<HTMLElement | null>(null);
let graph: Graph | null = null;
// 渲染令牌：用于取消被更新的渲染（避免新旧布局并存导致查到已移除节点）
let renderToken = 0;
// 最近一次渲染的数据指纹：相同则走快速路径跳过重建（避免重复重排）
let lastDataKey = "";
let settleTimers: any[] = [];
const selectedNode = ref<{
  title: string;
  kind: string;
  country?: string;
  authorName?: string;
  sentiment?: string;
  isBreaking?: boolean;
  source?: string;
  publishedAt?: string;
  count?: number;
} | null>(null);
const isEmpty = ref(false);
const emptyMsg = ref("暂无图谱数据，请确认开源情报文章已加载。");
const loading = ref(false);

const MAX_NODES = 400;

const sentimentColor = (s?: string): string => {
  switch (s) {
    case "negative":
      return "#ef4444";
    case "positive":
      return "#22c55e";
    default:
      return "#94a3b8";
  }
};
const sentimentLabel = (s?: string): string => {
  switch (s) {
    case "negative":
      return "消极";
    case "positive":
      return "积极";
    default:
      return "中立";
  }
};

const authorKeyOf = (a: any): string => a.author || a.agencyName || a.source || "未知来源";
const countryKeyOf = (a: any): string => a.country || "未知国家";

// 将 store 中的文章构建为按「国家 + 作者」聚合的关系网：
// - 国家聚合锚点（金色三角形）、作者聚合锚点（紫色菱形）
// - 文章节点形状按聚合归属：同作者（组内≥2）=> 菱形；否则同国家（组内≥2）=> 三角形；独立 => 正方形
// - 边：文章→国家锚点（国家关联，金）、文章→作者锚点（作者关联，紫）、同主题文章链状相连（主题关联，蓝虚线）
const buildArticleGraph = () => {
  const base: any[] = (store.clusterArticles ?? store.articles) || [];
  const f = store.graphFilter;

  // 1) 搜索 / 情感 / 仅异常 过滤
  const kw = (f.search || "").trim().toLowerCase();
  let arts = base.filter((a: any) => {
    if (f.onlyBreaking && a.isBreaking !== true) return false;
    if (f.sentiment !== "all" && (a.sentiment || "neutral") !== f.sentiment) return false;
    if (kw) {
      const hay = `${a.title || ""} ${a.country || ""} ${a.author || ""} ${a.agencyName || ""} ${(a.topics || []).join(" ")}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });

  // 2) 取最近 MAX_NODES 篇，避免节点过多导致力导向布局卡顿
  arts = [...arts]
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    .slice(0, MAX_NODES);

  const nodes: any[] = [];
  const edges: any[] = [];

  // 聚合组计数（用于决定文章节点形状）
  const countryGroup = new Map<string, number>();
  const authorGroup = new Map<string, number>();
  arts.forEach((a: any) => {
    const c = countryKeyOf(a);
    const an = authorKeyOf(a);
    countryGroup.set(c, (countryGroup.get(c) || 0) + 1);
    authorGroup.set(an, (authorGroup.get(an) || 0) + 1);
  });

  // 主题关联：每个 topic 串成一条链（首个含该 topic 的文章为锚点）
  const topicFirst = new Map<string, string>();

  arts.forEach((a: any, i: number) => {
    const c = countryKeyOf(a);
    const authorName = authorKeyOf(a);
    const id = `art:${a.id ?? i}`;
    const sentiment = a.sentiment || "neutral";
    const isBreaking = a.isBreaking === true;
    const fill = isBreaking ? "#ef4444" : sentimentColor(sentiment);
    const stroke = isBreaking ? "#7f1d1d" : "#334155";
    const rawTitle = a.title || "无标题";
    const label = rawTitle.length > 16 ? rawTitle.slice(0, 16) + "…" : rawTitle;

    // 文章节点形状：同作者组(≥2)=菱形，否则同国家组(≥2)=三角形，独立=正方形
    const aCount = authorGroup.get(authorName) || 0;
    const cCount = countryGroup.get(c) || 0;
    const shape = aCount >= 2 ? "diamond" : cCount >= 2 ? "triangle" : "rect";

    nodes.push({
      id,
      type: shape,
      data: {
        title: rawTitle,
        rawType: "article",
        kind: "article",
        country: c,
        authorName,
        sentiment,
        isBreaking,
        source: a.source || a.agencyName || "",
        publishedAt: a.publishedAt || "",
      },
      style: {
        size: isBreaking ? 16 : 11,
        fill,
        stroke,
        lineWidth: isBreaking ? 2 : 1,
        zIndex: 1,
        labelText: label,
        labelFill: "#e2e8f0",
        labelFontSize: 10,
        labelPlacement: "bottom",
        labelBackground: true,
        labelBackgroundFill: "rgba(11,15,26,0.75)",
        labelBackgroundRadius: 3,
        labelPadding: [2, 4],
      },
    });

    // 国家关联边：文章 → 所属国家锚点（金色实线）
    edges.push({
      id: `e-c:${id}`,
      source: id,
      target: `country:${c}`,
      type: "line",
      style: { stroke: "rgba(193,164,101,1)", lineWidth: 1, opacity: 1 },
    });

    // 作者关联边：文章 → 所属作者锚点（紫色实线）
    edges.push({
      id: `e-a:${id}`,
      source: id,
      target: `author:${authorName}`,
      type: "line",
      style: { stroke: "rgba(167,139,250,1)", lineWidth: 1, opacity: 1 },
    });

    // 主题关联边：与首个含该 topic 的文章相连（链状，蓝色虚线）
    (a.topics || []).forEach((tp: string) => {
      const key = String(tp);
      if (topicFirst.has(key)) {
        edges.push({
          id: `e-t:${id}:${key}`,
          source: id,
          target: topicFirst.get(key)!,
          type: "line",
          style: { stroke: "rgba(56,189,248,1)", lineWidth: 1, opacity: 1, lineDash: [4, 4] },
        });
      } else {
        topicFirst.set(key, id);
      }
    });
  });

  // 聚合锚点统一在文章节点之后追加 → 绘制在最上层（zIndex 高），
  // 避免被埋在文章星型簇中心而点不中；同时加大尺寸 + 光晕，便于识别与点击。
  // 国家聚合锚点（金色三角形，带光晕）
  [...countryGroup.keys()].forEach((c) => {
    const count = countryGroup.get(c)!;
    nodes.push({
      id: `country:${c}`,
      type: "triangle",
      data: { title: c, rawType: "country", kind: "country", count },
      style: {
        size: 46 + Math.min(count, 30),
        fill: "#c1a465",
        stroke: "#fff3d6",
        lineWidth: 3,
        zIndex: 100,
        shadowColor: "rgba(193,164,101,0.65)",
        shadowBlur: 18,
        labelText: `${c} (${count})`,
        labelFill: "#fde9b8",
        labelFontSize: 13,
        labelPlacement: "bottom",
        labelFontWeight: 700,
        labelBackground: false,
      },
    });
  });

  // 作者聚合锚点（紫色菱形，带光晕）
  [...authorGroup.keys()].forEach((name) => {
    const count = authorGroup.get(name)!;
    nodes.push({
      id: `author:${name}`,
      type: "diamond",
      data: { title: name, rawType: "author", kind: "author", count, authorName: name },
      style: {
        size: 32 + Math.min(count, 22),
        fill: "#a78bfa",
        stroke: "#ede9fe",
        lineWidth: 3,
        zIndex: 100,
        shadowColor: "rgba(167,139,250,0.65)",
        shadowBlur: 18,
        labelText: `${name} (${count})`,
        labelFill: "#f3eefe",
        labelFontSize: 12,
        labelPlacement: "bottom",
        labelFontWeight: 700,
        labelBackground: false,
      },
    });
  });

  return { nodes, edges, total: base.length, shown: arts.length };
};

const destroyGraph = () => {
  settleTimers.forEach((t) => clearTimeout(t));
  settleTimers = [];
  if (graph) {
    try {
      graph.destroy();
    } catch {
      /* ignore */
    }
    graph = null;
  }
};

const render = async () => {
  if (!containerRef.value) return;
  const token = ++renderToken;
  const data = buildArticleGraph();

  if (data.nodes.length === 0) {
    destroyGraph();
    lastDataKey = "";
    loading.value = false;
    isEmpty.value = true;
    emptyMsg.value =
      (store.clusterArticles ?? store.articles)?.length === 0
        ? "暂无图谱数据，请确认开源情报文章已加载。"
        : "当前筛选条件下没有匹配的文章，请调整搜索 / 筛选。";
    return;
  }
  isEmpty.value = false;

  // 数据指纹：节点 id + 形状 + 填充色。相同视为「数据未变」
  const dataKey = data.nodes
    .map((n: any) => `${n.id}|${n.type}|${n.style?.fill}`)
    .join("~");

  // 快速路径：实例仍在且数据未变（如切 tab 回来 / 文章轮询返回相同数据）→
  // 只恢复尺寸并自适应，不销毁重建、不重跑力导向布局，秒开
  if (graph && dataKey === lastDataKey) {
    try {
      const el = containerRef.value;
      const cw = el.clientWidth || el.parentElement?.clientWidth || window.innerWidth;
      const ch = el.clientHeight || el.parentElement?.clientHeight || window.innerHeight;
      graph.setSize(cw, ch);
      graph.fitView();
      graph.zoomTo(graph.getZoom() * 0.7);
      return;
    } catch {
      destroyGraph(); // 恢复失败则回退到完整重建
    }
  }
  lastDataKey = dataKey;
  loading.value = true;

  // 销毁旧实例并重建：彻底清除上一轮布局/节点，避免动态更新时引用到已移除的节点
  destroyGraph();

  try {
    const el = containerRef.value;
    // 测量容器尺寸；若因布局时机拿到 0，则回退到父元素 / 视口尺寸，避免画布高度塌陷
    const cw = el.clientWidth || el.parentElement?.clientWidth || window.innerWidth;
    const ch = el.clientHeight || el.parentElement?.clientHeight || window.innerHeight;
    graph = new Graph({
      container: el,
      width: cw,
      height: ch,
      autoResize: true,
      autoFit: "view",
      data,
      layout: {
        type: "force",
        // 关键修复：nodeStrength 必须为正（斥力权重 = weightParam * nodeStrength），
        // 之前写成负数 -60 会变成「吸力」，导致所有节点聚成一团。
        preventOverlap: true,
        collideStrength: 1,
        nodeSize: 55, // 碰撞直径（含留白），防止节点重叠
        gravity: 1.5, // 低中心引力 → 节点向四周散开，而不是被吸向中心
        factor: 1.2, // 库伦斥力系数，越大越分散
        nodeStrength: 1800, // 斥力（正）= 节点互相推开
        edgeStrength: 1,
        linkDistance: 280, // 连接边更长，让聚类之间分开
        maxIteration: 600, // 充分迭代让布局收敛、分散稳定
      },
      // 注意：不要设置 node: { type: "circle" } 之类的全局默认——
      // G6 v5 的 getElementType 取 `options[node].type || datum.type`，
      // 全局默认会覆盖数据里每个节点的 type，导致三角形/菱形/正方形全部变圆形。
      edge: { type: "line" },
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element", "hover-activate"],
      animation: true,
    });

    // 点击节点查看详情（try/catch 防御：极端情况下节点可能已被重建移除）
    graph.on("node:click", (evt: any) => {
      try {
        const id = evt.itemId ?? evt.target?.id;
        if (!id) return;
        const d = graph?.getNodeData(id);
        const raw = (d?.data || {}) as Record<string, any>;
        selectedNode.value = {
          title: (raw.title as string) ?? id,
          kind: (raw.kind as string) ?? "article",
          country: raw.country,
          authorName: raw.authorName,
          sentiment: raw.sentiment,
          isBreaking: raw.isBreaking,
          source: raw.source,
          publishedAt: raw.publishedAt,
          count: raw.count,
        };
        // 点击聚合锚点（国家 / 作者）时，把 id 写入 store，供右侧 RightGraphList 列出对应文章
        if (raw.kind === "country" || raw.kind === "author") {
          store.selectedGraphAggId = id;
        } else if (raw.kind === "article") {
          // 文章节点本身不是聚合点，但点击它也应给出相关文章：
          // 回退到其所属「国家聚合」，使右侧列出该国全部文章（任何节点点击都有结果）
          store.selectedGraphAggId = `country:${raw.country || "未知国家"}`;
        }
      } catch {
        /* 节点不存在时忽略 */
      }
    });

    graph.on("canvas:click", () => {
      selectedNode.value = null;
      store.selectedGraphAggId = null;
    });

    await graph.render();
  } catch {
    loading.value = false;
    return;
  }

  // 力导向布局异步收敛，渲染后延时重新自适应视口，并额外缩小默认显示比例
  const settle = () => {
    if (token !== renderToken || !graph) return;
    try {
      graph.fitView();
      if (graph) graph.zoomTo(graph.getZoom() * 0.7);
    } catch {
      /* ignore */
    }
    loading.value = false;
  };
  if (token === renderToken) {
    settleTimers.push(setTimeout(settle, 600));
    settleTimers.push(setTimeout(settle, 1400));
  }
};

// 筛选 / 数据变化时的防抖重渲染，避免每次按键都重排
let renderTimer: any = null;
const scheduleRender = () => {
  if (store.mapLeftTab !== "third") return;
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    nextTick(() => render());
  }, 300);
};

const handleResize = () => {
  // 仅在图谱模式且实例存在时调整尺寸（隐藏状态下 0 尺寸的 resize 无意义）
  if (!graph || !containerRef.value || store.mapLeftTab !== "third") return;
  try {
    graph.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight);
  } catch {
    /* ignore */
  }
};

// 进入「态势图谱」模式时渲染（此时容器才有真实尺寸）
watch(
  () => store.mapLeftTab,
  (tab) => {
    if (tab === "third") {
      nextTick(() => render());
    } else {
      // 切出图谱：仅清空选中态与挂起的渲染任务，保留 G6 实例不销毁，
      // 切回时 render() 走快速路径（数据未变即 setSize+fitView 秒开，不重跑力导向布局）
      selectedNode.value = null;
      store.selectedGraphAggId = null;
      if (renderTimer) clearTimeout(renderTimer);
      settleTimers.forEach((t) => clearTimeout(t));
      settleTimers = [];
      loading.value = false;
    }
  },
);

// 筛选条件 / 文章数据变化 → 防抖重渲染
watch(
  () => [store.graphFilter, store.articles, store.clusterArticles],
  () => scheduleRender(),
  { deep: true },
);

onMounted(() => {
  window.addEventListener("resize", handleResize);
  if (store.mapLeftTab === "third") nextTick(() => render());
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (renderTimer) clearTimeout(renderTimer);
  destroyGraph();
});
</script>

<style lang="scss" scoped>
.graph-wrapper {
  overflow: hidden;
  color: #e5e7eb;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.graph-canvas {
  width: 100%;
  height: 100%;

  :deep(canvas) {
    display: block;
  }
}

.graph-info {
  position: absolute;
  top: 16px;
  right: 20px;
  min-width: 200px;
  max-width: 280px;
  padding: 10px 14px;
  background: rgba(17, 24, 39, 0.92);
  border: 1px solid #2d3a4d;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  z-index: 10;

  .info-title {
    font-size: 13.5px;
    font-weight: 600;
    color: #e5e7eb;
    word-break: break-all;
  }

  .info-type {
    margin-top: 4px;
    font-size: 11.5px;
    color: #93c5fd;
  }

  .info-breaking {
    margin-left: 4px;
    color: #ef4444;
    font-weight: 700;
  }

  .info-hint {
    margin-top: 6px;
    font-size: 11px;
    color: #9ca3af;
  }
}

.graph-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #9ca3af;
  z-index: 5;
  text-align: center;
  padding: 0 24px;
}

.graph-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  letter-spacing: 0.5px;
  color: #94a3b8;
  background: rgba(17, 24, 39, 0.55);
  z-index: 6;
  pointer-events: none;

  .graph-loading-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: graph-spin 0.8s linear infinite;
  }
}

@keyframes graph-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
