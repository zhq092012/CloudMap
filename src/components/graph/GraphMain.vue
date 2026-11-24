<!-- 图谱主画布 -->
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
      <template v-else-if="selectedNode.kind === 'sentiment'">
        <div class="info-type">类型：情感聚合节点</div>
        <div class="info-type">
          情感：<span :style="{ color: sentimentColor(selectedNode.sentiment) }">{{
            sentimentLabel(selectedNode.sentiment)
          }}</span>
        </div>
        <div class="info-type">关联文章：{{ selectedNode.count }} 篇</div>
      </template>
      <template v-else>
        <div class="info-type">国家：{{ selectedNode.country || "未知" }}</div>
        <div class="info-type">作者：{{ selectedNode.authorName || "未知" }}</div>
        <div class="info-type">
          情感：<span :style="{ color: sentimentColor(selectedNode.sentiment) }">{{ sentimentLabel(selectedNode.sentiment)
            }}</span>
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
import { CanvasEvent, Graph } from "@antv/g6";
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

/** 情感聚合锚点固定三类（与后端 sentiment 字段对齐） */
const SENTIMENT_GROUP_KEYS = ["positive", "negative", "neutral"] as const;

/** 情感 Circle Combo 填充色（大圆分组底） */
const sentimentComboFill = (s: string): string => {
  switch (s) {
    case "positive":
      return "rgba(34, 197, 94, 0.12)";
    case "negative":
      return "rgba(239, 68, 68, 0.12)";
    default:
      return "rgba(148, 163, 184, 0.12)";
  }
};

/** 组内力导向参数（geo 全图 / 情感 combo 内层共用） */
const graphForceLayout = {
  type: "force" as const,
  preventOverlap: true,
  collideStrength: 1,
  nodeSize: 140,
  gravity: 1.5,
  factor: 1.2,
  nodeStrength: 1800,
  edgeStrength: 1,
  linkDistance: 280,
  maxIteration: 600,
};

const authorKeyOf = (a: any): string => a.author || a.agencyName || a.source || "未知来源";
const countryKeyOf = (a: any): string => a.country || "未知国家";

// 将 store 中的文章构建为关系网：
// - groupBy=geo：国家锚点（金三角）+ 作者锚点（紫菱形）
// - groupBy=sentiment：积极 / 消极 / 中立 三个 Circle Combo（大圆包裹组内文章）
// - 文章节点形状按国家/作者组内规模决定；颜色按情感 / 异常
// - 主题关联：同 topic 链状相连（蓝虚线）
const buildArticleGraph = () => {
  const base: any[] = (store.clusterArticles ?? store.articles) || [];
  const f = store.graphFilter;
  const groupBy = f.groupBy === "sentiment" ? "sentiment" : "geo";

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
  const combos: any[] = [];
  const sentimentMemberIds: Record<(typeof SENTIMENT_GROUP_KEYS)[number], string[]> = {
    positive: [],
    negative: [],
    neutral: [],
  };

  // 聚合组计数（用于决定文章节点形状）
  const countryGroup = new Map<string, number>();
  const authorGroup = new Map<string, number>();
  const sentimentGroup = new Map<string, number>();
  arts.forEach((a: any) => {
    const c = countryKeyOf(a);
    const an = authorKeyOf(a);
    const s = a.sentiment || "neutral";
    countryGroup.set(c, (countryGroup.get(c) || 0) + 1);
    authorGroup.set(an, (authorGroup.get(an) || 0) + 1);
    sentimentGroup.set(s, (sentimentGroup.get(s) || 0) + 1);
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
    const label = rawTitle.length > 18 ? rawTitle.slice(0, 18) + "…" : rawTitle;

    // 文章节点形状：同作者组(≥2)=菱形，否则同国家组(≥2)=三角形，独立=正方形
    const aCount = authorGroup.get(authorName) || 0;
    const cCount = countryGroup.get(c) || 0;
    const shape = aCount >= 2 ? "diamond" : cCount >= 2 ? "triangle" : "rect";

    const nodeDatum: any = {
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
        size: isBreaking ? 54 : 50,
        fill,
        stroke,
        lineWidth: isBreaking ? 3 : 2,
        zIndex: 1,
        labelText: label,
        labelFill: "#e2e8f0",
        labelFontSize: 50,
        labelFontWeight: 600,
        labelPlacement: "bottom",
        labelBackground: true,
        labelBackgroundFill: "rgba(11,15,26,0.88)",
        labelBackgroundRadius: 6,
        labelPadding: [4, 8],
      },
    };
    if (groupBy === "sentiment") {
      nodeDatum.combo = `combo-sentiment-${sentiment}`;
      const sk = sentiment as (typeof SENTIMENT_GROUP_KEYS)[number];
      if (SENTIMENT_GROUP_KEYS.includes(sk)) {
        sentimentMemberIds[sk].push(id);
      } else {
        sentimentMemberIds.neutral.push(id);
      }
    }
    nodes.push(nodeDatum);

    if (groupBy === "geo") {
      edges.push({
        id: `e-c:${id}`,
        source: id,
        target: `country:${c}`,
        type: "line",
        style: { stroke: "rgba(193,164,101,1)", lineWidth: 1, opacity: 1 },
      });
      edges.push({
        id: `e-a:${id}`,
        source: id,
        target: `author:${authorName}`,
        type: "line",
        style: { stroke: "rgba(167,139,250,1)", lineWidth: 1, opacity: 1 },
      });
    }

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

  // 聚合锚点统一在文章节点之后追加 → 绘制在最上层（zIndex 高），便于点击。
  if (groupBy === "geo") {
    [...countryGroup.keys()].forEach((c) => {
      const count = countryGroup.get(c)!;
      nodes.push({
        id: `country:${c}`,
        type: "triangle",
        data: { title: c, rawType: "country", kind: "country", count },
        style: {
          size: 56 + Math.min(count, 28),
          fill: "#c1a465",
          stroke: "#fff3d6",
          lineWidth: 3.5,
          zIndex: 100,
          shadowColor: "rgba(193,164,101,0.65)",
          shadowBlur: 20,
          labelText: `${c} (${count})`,
          labelFill: "#fde9b8",
          labelFontSize: 15,
          labelPlacement: "bottom",
          labelFontWeight: 700,
          labelBackground: false,
        },
      });
    });

    [...authorGroup.keys()].forEach((name) => {
      const count = authorGroup.get(name)!;
      nodes.push({
        id: `author:${name}`,
        type: "diamond",
        data: { title: name, rawType: "author", kind: "author", count, authorName: name },
        style: {
          size: 42 + Math.min(count, 20),
          fill: "#a78bfa",
          stroke: "#ede9fe",
          lineWidth: 3.5,
          zIndex: 100,
          shadowColor: "rgba(167,139,250,0.65)",
          shadowBlur: 20,
          labelText: `${name} (${count})`,
          labelFill: "#f3eefe",
          labelFontSize: 14,
          labelPlacement: "bottom",
          labelFontWeight: 700,
          labelBackground: false,
        },
      });
    });
  } else {
    SENTIMENT_GROUP_KEYS.forEach((s) => {
      const count = sentimentGroup.get(s) || 0;
      combos.push({
        id: `combo-sentiment-${s}`,
        type: "circle",
        data: {
          kind: "sentiment",
          sentiment: s,
          label: sentimentLabel(s),
          count,
        },
        style: {
          padding: 40,
          fill: sentimentComboFill(s),
          fillOpacity: 0.45,
          stroke: sentimentColor(s),
          strokeOpacity: 0.95,
          lineWidth: 3,
          lineDash: [0],
          labelText: `${sentimentLabel(s)} · ${count} 篇`,
          labelFill: "#f1f5f9",
          labelFontSize: 70,
          labelFontWeight: 700,
          labelPlacement: "top",
          labelBackground: true,
          labelBackgroundFill: "rgba(15, 23, 42, 0.88)",
          labelBackgroundRadius: 8,
          labelPadding: [8, 14],
        },
      });
    });
  }

  return {
    nodes,
    edges,
    combos,
    sentimentMemberIds,
    total: base.length,
    shown: arts.length,
    groupBy,
  };
};

/** 情感分组外轮廓（布局完成后随节点位置包裹，强化「成簇」观感） */
const buildSentimentHullPlugins = (memberIds: Record<(typeof SENTIMENT_GROUP_KEYS)[number], string[]>) =>
  SENTIMENT_GROUP_KEYS.filter((s) => memberIds[s].length > 0).map((s) => ({
    type: "hull",
    key: `sentiment-hull-${s}`,
    members: memberIds[s],
    padding: 48,
    concavity: Infinity,
    corner: "rounded" as const,
    fill: sentimentComboFill(s),
    fillOpacity: 0.22,
    stroke: sentimentColor(s),
    strokeOpacity: 0.85,
    lineWidth: 2.5,
  }));

/** @antv/layout v2 combo-combined：外层 grid 摆放大圆，内层 force 排文章 */
/** 当前关系高亮的焦点节点 id；点空白或切换节点时重置 */
let focusedGraphNodeId: string | null = null;
/** 图谱初始节点 / 边样式快照，用于恢复高亮（主题关联边须保留 lineDash） */
const nodeStyleBase = new Map<string, Record<string, unknown>>();
const edgeStyleBase = new Map<string, Record<string, unknown>>();

/** 记录构建数据中的 style，作为高亮还原基准 */
const captureGraphStyleBaseline = (nodes: any[], edges: any[]) => {
  nodeStyleBase.clear();
  edgeStyleBase.clear();
  focusedGraphNodeId = null;
  nodes.forEach((n) => {
    if (n.id && n.style) nodeStyleBase.set(n.id, { ...n.style });
  });
  edges.forEach((e) => {
    if (e.id && e.style) edgeStyleBase.set(e.id, { ...e.style });
  });
};

/** 高亮增量样式：不设置 lineDash，避免主题虚线被改成实线 */
const graphHighlightStyle = {
  focusNode: { opacity: 1, lineWidth: 5, shadowBlur: 26, shadowColor: "rgba(248,250,252,0.5)" },
  neighborNode: { opacity: 1, lineWidth: 3.5 },
  dimNode: { opacity: 0.18 },
  relatedEdge: { opacity: 1, lineWidth: 2.5 },
  dimEdge: { opacity: 0.1, lineWidth: 1 },
} as const;

/** 样式补丁写入后刷新画布，保证取消高亮立即可见 */
const refreshGraphAfterStyleChange = () => {
  if (!graph) return;
  void graph.draw();
};

/** 清空选中信息与关系高亮（点画布空白时） */
const clearGraphSelection = () => {
  selectedNode.value = null;
  store.selectedGraphAggId = null;
  resetGraphRelationHighlight();
};

/** 取消节点关系高亮，恢复全部节点与边的初始样式 */
const resetGraphRelationHighlight = () => {
  if (!graph) return;
  focusedGraphNodeId = null;
  try {
    const nodes = graph.getNodeData();
    if (nodes.length) {
      graph.updateNodeData(
        nodes.map((n) => ({
          id: n.id,
          style: { ...(nodeStyleBase.get(n.id) ?? {}) },
        })),
      );
    }
    const edgePatches = graph
      .getEdgeData()
      .filter((e) => e.id)
      .map((e) => ({
        id: e.id as string,
        style: { ...(edgeStyleBase.get(e.id as string) ?? {}) },
      }));
    if (edgePatches.length) graph.updateEdgeData(edgePatches);
    refreshGraphAfterStyleChange();
  } catch {
    /* 实例重建中忽略 */
  }
};

/**
 * 高亮当前节点及一度相邻节点、关联边；其余元素淡化。
 * 先 reset 再应用，保证切换节点时取消上一次高亮。
 */
const applyGraphRelationHighlight = (nodeId: string) => {
  if (!graph) return;
  resetGraphRelationHighlight();
  focusedGraphNodeId = nodeId;

  const neighborIds = new Set<string>();
  const relatedEdgeIds = new Set<string>();

  try {
    graph.getEdgeData().forEach((edge) => {
      const eid = edge.id;
      if (!eid) return;
      const src = String(edge.source);
      const tgt = String(edge.target);
      if (src === nodeId || tgt === nodeId) {
        relatedEdgeIds.add(eid);
        if (src !== nodeId) neighborIds.add(src);
        if (tgt !== nodeId) neighborIds.add(tgt);
      }
    });

    graph.updateNodeData(
      graph.getNodeData().map((n) => {
        const base = { ...(nodeStyleBase.get(n.id) ?? {}) };
        if (n.id === nodeId) {
          return { id: n.id, style: { ...base, ...graphHighlightStyle.focusNode } };
        }
        if (neighborIds.has(n.id)) {
          return { id: n.id, style: { ...base, ...graphHighlightStyle.neighborNode } };
        }
        return { id: n.id, style: { ...base, ...graphHighlightStyle.dimNode } };
      }),
    );

    const edgePatches = graph
      .getEdgeData()
      .filter((e) => e.id)
      .map((e) => {
        const id = e.id as string;
        const base = { ...(edgeStyleBase.get(id) ?? {}) };
        if (relatedEdgeIds.has(id)) {
          return { id, style: { ...base, ...graphHighlightStyle.relatedEdge } };
        }
        return { id, style: { ...base, ...graphHighlightStyle.dimEdge } };
      });
    if (edgePatches.length) graph.updateEdgeData(edgePatches);
    refreshGraphAfterStyleChange();
  } catch {
    /* 实例重建中忽略 */
  }
};

const buildSentimentComboLayout = () => ({
  type: "combo-combined",
  comboPadding: 40,
  comboSpacing: 140,
  layout: (comboId: string | null) => {
    if (comboId == null) {
      return {
        type: "grid",
        cols: 3,
        rows: 1,
        sortBy: "id",
        preventOverlap: true,
        nodeSpacing: 100,
      };
    }
    return {
      type: "force",
      preventOverlap: true,
      collideStrength: 1,
      nodeSize: 135,
      gravity: 0.6,
      factor: 0.9,
      nodeStrength: 900,
      edgeStrength: 0.55,
      linkDistance: 180,
      maxIteration: 450,
    };
  },
});

const destroyGraph = () => {
  settleTimers.forEach((t) => clearTimeout(t));
  settleTimers = [];
  focusedGraphNodeId = null;
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
  captureGraphStyleBaseline(data.nodes, data.edges);

  // 数据指纹：节点 id + 形状 + 填充色。相同视为「数据未变」
  const dataKey = `${store.graphFilter.groupBy}|${(data.combos ?? [])
    .map((c: any) => c.id)
    .join(",")}|${data.nodes
    .map((n: any) => `${n.id}|${n.type}|${n.style?.fill}|${n.combo ?? ""}`)
    .join("~")}`;

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
    const graphData = {
      nodes: data.nodes,
      edges: data.edges,
      combos: data.combos ?? [],
    };
    const isSentimentCombo = data.groupBy === "sentiment";
    graph = new Graph({
      container: el,
      width: cw,
      height: ch,
      autoResize: true,
      autoFit: "view",
      data: graphData,
      layout: isSentimentCombo ? buildSentimentComboLayout() : { ...graphForceLayout },
      combo: isSentimentCombo
        ? {
            type: "circle",
            style: {
              fillOpacity: 0.4,
              strokeOpacity: 0.95,
              lineWidth: 3,
            },
          }
        : undefined,
      plugins: isSentimentCombo ? buildSentimentHullPlugins(data.sentimentMemberIds) : [],
      // 注意：不要设置 node: { type: "circle" } 之类的全局默认——
      // G6 v5 的 getElementType 取 `options[node].type || datum.type`，
      // 全局默认会覆盖数据里每个节点的 type，导致三角形/菱形/正方形全部变圆形。
      edge: { type: "line" },
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element", "hover-activate"],
      // 关闭节点/视口过渡动画，布局结果直接落位
      animation: false,
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
          if (store.graphFilter.groupBy === "sentiment") {
            store.selectedGraphAggId = `sentiment:${raw.sentiment || "neutral"}`;
          } else {
            store.selectedGraphAggId = `country:${raw.country || "未知国家"}`;
          }
        }
        applyGraphRelationHighlight(id);
      } catch {
        /* 节点不存在时忽略 */
      }
    });

    graph.on("combo:click", (evt: any) => {
      try {
        resetGraphRelationHighlight();
        const id = evt.itemId ?? evt.target?.id;
        if (!id) return;
        const d = graph?.getComboData(id);
        const raw = (d?.data || {}) as Record<string, any>;
        if (raw.kind !== "sentiment") return;
        store.selectedGraphAggId = `sentiment:${raw.sentiment}`;
        selectedNode.value = {
          title: String(raw.label ?? sentimentLabel(String(raw.sentiment))),
          kind: "sentiment",
          sentiment: raw.sentiment as string,
          count: raw.count as number,
        };
      } catch {
        /* ignore */
      }
    });

    /** 画布空白处：取消选中与关系高亮 */
    graph.on(CanvasEvent.CLICK, () => {
      clearGraphSelection();
    });

    /**
     * 情感模式下大圆 Combo 占据大部分可视区，点击其空白不会触发 canvas:click；
     * 点 Combo 空白时仍取消节点关系高亮（详情由 combo:click 更新）。
     */
    graph.on("click", (evt: any) => {
      if (evt.targetType === "combo" && focusedGraphNodeId) {
        resetGraphRelationHighlight();
      }
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
  if (store.mapLeftTab !== "graph") return;
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    nextTick(() => render());
  }, 300);
};

const handleResize = () => {
  // 仅在图谱模式且实例存在时调整尺寸（隐藏状态下 0 尺寸的 resize 无意义）
  if (!graph || !containerRef.value || store.mapLeftTab !== "graph") return;
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
    if (tab === "graph") {
      nextTick(() => render());
    } else {
      // 切出图谱：仅清空选中态与挂起的渲染任务，保留 G6 实例不销毁，
      // 切回时 render() 走快速路径（数据未变即 setSize+fitView 秒开，不重跑力导向布局）
      clearGraphSelection();
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
  if (store.mapLeftTab === "graph") nextTick(() => render());
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
