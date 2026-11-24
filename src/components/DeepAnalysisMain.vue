<template>
  <div class="w-full h-full min-h-187.5 bg-[var(--bg)] flex flex-col relative select-none">
    <div class="h-11 px-4 bg-[var(--bg-sunken)] border-b border-[var(--border)] flex items-center justify-between z-10 shrink-0">
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="da-chip shrink-0">
          🧠 云脑多Agent并行推导
        </span>
      </div>

      <!-- 画布提示：中部区域窄时让位给标题，避免挤成多行 -->
      <div class="hidden xl:flex items-center gap-1 text-[12px] text-[var(--text-faint)] font-mono whitespace-nowrap">
        <span>画布操作: 鼠标滚轮缩放 | 拖拽任意画布与节点</span>
      </div>
    </div>

    <div ref="containerRef" class="flex-1 w-full h-full relative overflow-hidden">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-[rgba(10,14,23,0.9)] z-20">
        <div class="text-center space-y-2">
          <div class="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div class="text-[12px] text-[var(--text-muted)] font-mono">
            正在渲染云脑智能推导拓扑图...
          </div>
        </div>
      </div>

      <Teleport to="body" :disabled="logMode === 'docked'">
      <div :class="logPanelClass" :style="logPanelStyle">
        <div class="flex items-center gap-2 px-3.5 h-9 border-b border-[var(--border)] shrink-0 overflow-hidden whitespace-nowrap"
          :class="{ 'cursor-move': logMode === 'popup' }"
          @mousedown="startLogHeaderDrag">
          <el-icon class="shrink-0 text-[var(--accent-text)] text-[13px]"><Document /></el-icon>
          <span class="shrink-0 text-[12.5px] font-semibold text-[var(--text)]">分析执行日志</span>
          <span v-if="store.progressLogs.length > 0" class="shrink-0 text-[12px] text-[var(--text-faint)] font-mono">[{{ store.progressLogs.length }} 条]</span>
          <span v-if="store.isAnalyzing" class="ml-auto shrink-0 text-[12px] text-[var(--accent-text)] animate-pulse">◉ 分析中...</span>
          <span v-else-if="store.progressLogs.some(l => l.type === 'success')" class="ml-auto shrink-0 text-[12px] text-[var(--green)]">✓ 完成</span>
          <span v-if="store.currentPhase >= 0" class="shrink-0 text-[12px] text-[var(--text-muted)] font-mono">Phase {{
            store.currentPhase === 0 ? 'ORIGIN' : store.currentPhase === 1 ? 'INTENT' : store.currentPhase === 2 ? 'BLUE_PLAN' : store.currentPhase === 3 ? 'RED_PLAN' : 'EVALUATION'
          }}</span>
          <el-icon class="ml-auto shrink-0 cursor-pointer text-[var(--text-muted)] hover:text-[var(--accent-text)]"
            :title="logMode === 'docked' ? '转换为弹出窗口' : '收回到底部'"
            @click="toggleLogPopup" @mousedown.stop>
            <Expand v-if="logMode === 'docked'" />
            <Fold v-else />
          </el-icon>
        </div>
        <div ref="logContainer" class="flex-1 min-h-0 overflow-y-auto font-mono text-[11.5px] space-y-0.5 px-3.5 py-1.5">
        <div v-for="(logItem, idx) in store.progressLogs" :key="idx"
          class="py-0.5 leading-relaxed"
          :class="{
            'text-[var(--accent-text)]': logItem.type === 'info',
            'text-[var(--green)]': logItem.type === 'success',
            'text-[#f87171]': logItem.type === 'error',
            'text-[#fbbf24]': logItem.type === 'warning',
          }">
          <div class="flex items-start gap-1.5">
            <span class="text-[var(--text-faint)] shrink-0 tabular-nums">{{ logItem.time }}</span>
            <span class="flex-1 min-w-0"
              :class="isExpandable(logItem)
                ? 'underline decoration-[var(--border-strong)] underline-offset-2 cursor-pointer hover:text-[var(--accent-text)]'
                : ''"
              @click="isExpandable(logItem) && toggleExpand(logItem)">{{ logItem.text }}</span>
            <span v-if="isExpandable(logItem)"
              class="shrink-0 cursor-pointer text-[var(--text-faint)] hover:text-[var(--text)] px-0.5 opacity-70"
              @click="toggleExpand(logItem)">{{ logItem.expanded ? '▾' : '▸' }}</span>
          </div>
          <pre v-if="isExpandable(logItem) && logItem.expanded"
            class="whitespace-pre-wrap break-words text-[var(--text-2)] max-h-60 overflow-auto my-1 pl-4 border-l border-[var(--border)]">{{ expandText(logItem) }}</pre>
        </div>
        <div v-if="store.progressLogs.length === 0" class="text-[var(--text-faint)] text-center py-3">
          等待分析启动...
        </div>
      </div>
      <div v-if="logMode === 'popup'" class="absolute right-[-1px] top-2 bottom-2 w-1.5 cursor-ew-resize" @mousedown="startLogResize('e', $event)"></div>
      <div v-if="logMode === 'popup'" class="absolute bottom-[-1px] left-2 right-2 h-1.5 cursor-ns-resize" @mousedown="startLogResize('s', $event)"></div>
      <div v-if="logMode === 'popup'" class="absolute right-[-2px] bottom-[-2px] w-3.5 h-3.5 cursor-nwse-resize" @mousedown="startLogResize('se', $event)"></div>
      </div>
      </Teleport>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Graph, Rect, ExtensionCategory, register } from "@antv/g6";
import { Rect as GRect, Text as GText } from "@antv/g";
import type { EdgeData, GraphData, NodeData } from "@antv/g6";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { storeToRefs } from "pinia";
import { Document, Expand, Fold } from "@element-plus/icons-vue";
import { parseDetailSections, stripInferredSuffix } from "@/utils/detailSections";

const store = useAnalysisStore();
const { rawNodes, rawEdges, selectedNode, progressLogs } = storeToRefs(store);
const containerRef = ref<HTMLDivElement | null>(null);
const logContainer = ref<HTMLDivElement | null>(null);
let graphInstance: Graph | null = null;
let resizeObserver: ResizeObserver | null = null;
const isLoading = ref(true);
let lastCanvasSize: { w: number; h: number } | null = null;
let resizeRaf = 0;
let renderChain: Promise<unknown> = Promise.resolve();

watch(
  () => progressLogs.value.length,
  async () => {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  }
);

function isExpandable(logItem: any): boolean {
  return logItem?.kind === "dataflow" || logItem?.kind === "dispatch" || logItem?.kind === "agent-input";
}

function toggleExpand(logItem: any) {
  logItem.expanded = !logItem.expanded;
}

/* ── 4.1.1 执行日志浮动窗口（docked=覆盖画布底部的浮动栏；popup=可拖拽/可调整大小的独立弹出窗口） ── */
const logMode = ref<"docked" | "popup">("docked");
const LOG_DOCK_H = 180;
const POPUP_MIN_W = 360;
const POPUP_MIN_H = 180;
const popupPos = ref({ x: 48, y: 48 });
const popupSize = ref({ w: 720, h: 300 });
let logDragState:
  | { mode: "move" | "e" | "s" | "se"; mx: number; my: number; x: number; y: number; w: number; h: number }
  | null = null;

const logPanelClass = computed(() =>
  logMode.value === "docked"
    ? "absolute inset-x-0 bottom-0 z-30 flex flex-col border-t border-[var(--border)] bg-[rgba(17,24,39,0.97)] shadow-[0_-6px_18px_rgba(0,0,0,0.45)]"
    : "fixed z-[9999] flex flex-col rounded-md border border-[var(--border-strong)] bg-[var(--bg-sunken)] shadow-2xl"
);

const logPanelStyle = computed(() =>
  logMode.value === "docked"
    ? { height: `${LOG_DOCK_H}px` }
    : {
        left: `${popupPos.value.x}px`,
        top: `${popupPos.value.y}px`,
        width: `${popupSize.value.w}px`,
        height: `${popupSize.value.h}px`,
      }
);

function toggleLogPopup() {
  if (logMode.value === "docked") {
    const r = containerRef.value?.getBoundingClientRect() ?? null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = r ? r.width : vw * 0.6;
    const ch = r ? r.height : vh * 0.6;
    const w = Math.min(Math.max(POPUP_MIN_W, Math.round(cw * 0.82)), 1200, vw - 32);
    const h = Math.min(LOG_DOCK_H + 160, ch + 60, vh - 48);
    popupSize.value = { w, h };
    const x = r ? Math.max(8, Math.round(r.left + (r.width - w) / 2)) : Math.round((vw - w) / 2);
    const y = r ? Math.max(8, Math.round(r.top + ch - h - 16)) : vh - h - 16;
    popupPos.value = { x: Math.min(x, Math.max(8, vw - w - 8)), y: Math.min(y, Math.max(8, vh - h - 8)) };
    logMode.value = "popup";
  } else {
    logMode.value = "docked";
  }
}

function onLogDragMove(e: MouseEvent) {
  if (!logDragState) return;
  const s = logDragState;
  const dx = e.clientX - s.mx;
  const dy = e.clientY - s.my;
  const cw = window.innerWidth;
  const ch = window.innerHeight;
  if (s.mode === "move") {
    const loX = -(s.w - 80);
    const hiX = Math.max(loX, cw - 80);
    const loY = -(s.h - 32);
    const hiY = Math.max(loY, ch - 32);
    popupPos.value = {
      x: Math.min(hiX, Math.max(loX, s.x + dx)),
      y: Math.min(hiY, Math.max(loY, s.y + dy)),
    };
  } else {
    const w = s.mode === "s" ? s.w : Math.max(POPUP_MIN_W, Math.min(Math.max(POPUP_MIN_W, cw - s.x), s.w + dx));
    const h = s.mode === "e" ? s.h : Math.max(POPUP_MIN_H, Math.min(Math.max(POPUP_MIN_H, ch - s.y), s.h + dy));
    popupSize.value = { w, h };
  }
}

function stopLogDrag() {
  logDragState = null;
  window.removeEventListener("mousemove", onLogDragMove);
  window.removeEventListener("mouseup", stopLogDrag);
}

function beginLogDrag(e: MouseEvent, mode: "move" | "e" | "s" | "se") {
  if (logMode.value !== "popup") return;
  e.preventDefault();
  logDragState = {
    mode,
    mx: e.clientX,
    my: e.clientY,
    x: popupPos.value.x,
    y: popupPos.value.y,
    w: popupSize.value.w,
    h: popupSize.value.h,
  };
  window.addEventListener("mousemove", onLogDragMove);
  window.addEventListener("mouseup", stopLogDrag);
}

function startLogHeaderDrag(e: MouseEvent) {
  const t = e.target as HTMLElement | null;
  if (t && t.closest(".cursor-pointer, button")) return;
  beginLogDrag(e, "move");
}

function startLogResize(mode: "e" | "s" | "se", e: MouseEvent) {
  e.stopPropagation();
  beginLogDrag(e, mode);
}

/* 完整方案/报告弹窗仅由右侧详情面板的方案名点击触发（画布节点点击易误操作，不再联动）；
   画布节点点击只负责选中与切换右侧面板 */

/** 日志行展开内容；超过 20000 字符截断并追加 …(已截断) */
function expandText(logItem: any): string {
  let content = "";
  if (logItem?.kind === "dispatch") {
    content = String(logItem.data?.sysPrompt ?? "");
  } else if (logItem?.kind === "dataflow") {
    const data = (logItem.data ?? {}) as { type?: string; payload?: any };
    const payload = data.payload && typeof data.payload === "object" ? data.payload : {};
    if (data.type === "TEXT" || data.type === "THINKING" || data.type === "AGENT_RESULT") {
      content = String(payload?.text ?? "");
    } else if (data.type === "TOOL_CALL") {
      content = `[args]\n${payload?.args ?? ""}\n[result ${payload?.result?.state ?? ""}]\n${
        payload?.result?.text ?? ""
      }`;
    } else {
      content = JSON.stringify(payload, null, 2);
    }
  } else if (logItem?.kind === "agent-input") {
    const d = (logItem.data ?? {}) as Record<string, any>;
    let c = typeof d.prompt === "string" ? d.prompt : "";
    if (typeof d.knowledgeGraph === "string" && d.knowledgeGraph.trim()) {
      // prompt 本体已内嵌同一段知识图谱参考时不重复追加；仅当 prompt 缺失或被 8000 字截断导致 KG 段缺失时补充展示
      if (!c.includes(d.knowledgeGraph)) {
        const n =
          typeof d.knowledgeGraphChars === "number" ? d.knowledgeGraphChars : d.knowledgeGraph.length;
        c += (c ? "\n\n" : "") + `—— 知识图谱参考（${n} 字）——\n${d.knowledgeGraph}`;
      }
    }
    content = c || JSON.stringify(d, null, 2);
  }
  if (content.length > 20000) {
    content = content.substring(0, 20000) + "…(已截断)";
  }
  return content;
}
// Handlers removed as they are currently unused in the template
async function doRenderGraph(fitView = false) {
  if (!graphInstance) return;

  graphInstance.setData(buildGraphData());
  await graphInstance.render();

  if (fitView) {
    const nodes = graphInstance.getNodeData();
    if (nodes && nodes.length > 0) {
      await graphInstance.fitView();
    }
  }
}

function renderGraph(fitView = false): Promise<unknown> {
  renderChain = renderChain.then(() => doRenderGraph(fitView)).catch(() => {});
  return renderChain;
}

// 监听节点和边的变化，重新构建图数据并自适应缩放视口
watch(
  [rawNodes, rawEdges],
  async () => {
    if (graphInstance) {
      await renderGraph(true);
    }
  },
  { deep: true },
);

// 监听选中节点的变化，更新高亮样式但不缩放视口以维持优良交互体验
watch(
  selectedNode,
  async () => {
    if (graphInstance) {
      await renderGraph(false);
    }
  }
);

/* ── 画布节点：卡片式自绘节点（对齐页面 da-card 风格） ─────────────────────────
   G6 5.x 一个节点只有一个内置 label（labelText 不支持数组、也不能逐行配色），
   要做到「类型徽标 + 摘要 + 目标 + 方向」分行分色，只能自绘：继承 Rect，
   在 keyShape 之上用 @antv/g 的 Rect / Text 追加装饰层（upsert 保证更新复用）。 */

const ANALYSIS_NODE_TYPE = "analysis-node";
const CARD_W = 360;
const CARD_PAD_X = 12;
const CARD_PAD_Y = 10;
const CARD_RADIUS = 8;
const CHIP_H = 16;
const BODY_FONT = 10.5;
const BODY_LINE_H = 15;
const SUB_LINE_H = 15;
const FONT_SANS =
  "system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif";

/* 各类型节点的色彩（沿用全站 token：橙=异常、绿=意图、蓝=蓝方、红=红方、灰=校验） */
const NODE_TYPE_META: Record<string, { label: string; accent: string; accentText: string }> = {
  Origin: { label: "异常事件", accent: "#f59e0b", accentText: "#fbbf24" },
  Intent: { label: "意图", accent: "#10b981", accentText: "#34d399" },
  Attack: { label: "蓝方方案", accent: "#3b82f6", accentText: "#93c5fd" },
  Defense: { label: "红方方案", accent: "#ef4444", accentText: "#f87171" },
  Evaluation: { label: "校验评估", accent: "#94a3b8", accentText: "#cbd5e1" },
};

const CJK_RE = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/;
function charUnits(ch: string): number {
  return CJK_RE.test(ch) ? 1 : 0.55;
}
function textUnits(text: string): number {
  let u = 0;
  for (const ch of text) u += charUnits(ch);
  return u;
}
function truncateByUnits(text: string, maxUnits: number): string {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  let out = "";
  let u = 0;
  for (const ch of s) {
    const w = charUnits(ch);
    if (u + w > maxUnits) return out + "…";
    u += w;
    out += ch;
  }
  return out;
}

/* 正文折行：按每行 30 单位估算（卡片内可用宽度 ≈ 333px，字号 10.5）。
   ① 先按「汉字/标点逐字、英文数字成词」切词，避免把 GBU-31、F-35I 从中间劈开；
   ② 超出 3 行先截断到「总容量 - 1」再补省略号，避免末行只有一两个字；
   ③ 末行不足 8 单位时按行数重新均分，避免「末行孤字」。 */
function tokenizeForWrap(text: string): string[] {
  const tokens: string[] = [];
  let buf = "";
  for (const ch of text) {
    if (CJK_RE.test(ch) || /\s/.test(ch)) {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
      if (!/\s/.test(ch)) tokens.push(ch);
      else tokens.push(" ");
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

function wrapAtUnits(text: string, unitsPerLine: number, maxLines: number): string {
  const tokens = tokenizeForWrap(text);
  let out = "";
  let lineUnits = 0;
  let lines = 1;
  for (const tk of tokens) {
    const w = textUnits(tk);
    if (lineUnits + w > unitsPerLine && lineUnits > 0) {
      lines++;
      if (lines > maxLines) return out.trimEnd() + "…";
      out = out.trimEnd() + "\n";
      lineUnits = 0;
    }
    out += tk;
    lineUnits += w;
  }
  return out.trimEnd();
}

function wrapCardBody(text: string, unitsPerLine = 30, maxLines = 3): string {
  const cap = unitsPerLine * maxLines;
  let src = text;
  if (textUnits(src) > cap) src = truncateByUnits(src, cap - 1);

  const out = wrapAtUnits(src, unitsPerLine, maxLines);
  const lines = out.split("\n");
  if (lines.length < 2) return out;

  // 末行太短（只剩一两个字）时，只把最后两行合并后对半分，前三行保持满行
  const lastUnits = textUnits(lines[lines.length - 1]);
  if (lastUnits >= 8) return out;
  const tail = lines.slice(-2).join("").replace(/\n/g, "");
  const half = Math.ceil(textUnits(tail) / 2);
  const balanced = wrapAtUnits(tail, half, 2).split("\n");
  return [...lines.slice(0, -2), ...balanced].join("\n");
}

/* 目标行折行：一行放得下就直接显示整句，超过 maxLines 行才截断补省略号。
   单位换算同上（10px 字号，卡片内可用宽度 ≈ 333px，每行按 30 单位估算）。 */
function wrapSubLine(text: string, unitsPerLine = 30, maxLines = 2): string {
  const cap = unitsPerLine * maxLines;
  let src = text;
  if (textUnits(src) > cap) src = truncateByUnits(src, cap - 1);
  return wrapAtUnits(src, unitsPerLine, maxLines);
}

function parseNodeObject(node: any): Record<string, any> {
  const nd = node?.nodeData;
  if (nd == null) return {};
  try {
    const obj = typeof nd === "string" ? JSON.parse(nd) : nd;
    return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

/* 右侧详情里的「目标 / 方向」来自 nodeData.details 的小节
   （形如 "目标：…；方向：…"，由 parseDetailSections 拆成小节）。
   details 缺失时再回退到 nodeData 上的同义字段。 */
function sectionValue(parsed: Record<string, any>, titles: string[]): string {
  const sections = parseDetailSections(String(parsed?.details ?? ""));
  for (const t of titles) {
    const hit = sections.find((s) => stripInferredSuffix(s.title) === t);
    if (hit?.content?.trim()) return hit.content.trim();
  }
  return "";
}

/* 组装节点卡片所需的全部文本 + 高度 */
function buildNodeCard(node: any) {
  const typeMeta = NODE_TYPE_META[node.type] ?? NODE_TYPE_META.Origin;
  const parsed = parseNodeObject(node);
  const raw = String(node.text || "");

  // 类型徽标（蓝方方案1 / 红方方案2 这类带序号的前缀直接做成徽标，正文里就不再重复）
  const prefixMatch = raw.match(/^(蓝方方案|红方方案|校验评估)\d+/);
  let chip = typeMeta.label;
  let bodySource = raw;
  if (prefixMatch) {
    chip = prefixMatch[0];
    bodySource = raw.slice(prefixMatch[0].length).replace(/^[\s:：]+/, "");
  }
  // 方案类节点的正文优先用 nodeData.summary（比 store 里缓存的 text 更完整）
  if (node.type === "Attack" || node.type === "Defense" || node.type === "Evaluation") {
    const full = String(parsed?.summary ?? "").trim();
    if (full) bodySource = full.slice(0, 90);
  }

  const body = bodySource ? wrapCardBody(bodySource) : "";
  const bodyLines = body ? body.split("\n").length : 0;

  const confRaw = node?.confidence ?? parsed?.confidence;
  const conf =
    confRaw != null && Number.isFinite(Number(confRaw))
      ? `${Math.round(Number(confRaw))}%`
      : "N/A";
  const pruned = String(node?.deleteStatus) === "1";
  const metaText = `置信度 ${conf} · 状态 ${pruned ? "已剪枝" : "正常"}`;

  // 校验评估节点额外展示「风险等级 + 是否推荐」（口径与右栏 DeepAnalysisEvaluationRightPanel 一致）
  const isEvaluation = node.type === "Evaluation";
  const riskRaw = String(parsed?.riskLevel ?? node?.riskLevel ?? "").trim().toUpperCase();
  const riskLevel = riskRaw || "MEDIUM";
  const riskColor =
    riskLevel === "CRITICAL"
      ? "#f87171"
      : riskLevel === "HIGH"
        ? "#fb923c"
        : riskLevel === "MEDIUM"
          ? "#fbbf24"
          : "#34d399";
  const recRaw = parsed?.isRecommended ?? node?.isRecommended;
  const recommended =
    recRaw == null
      ? false
      : typeof recRaw === "boolean"
        ? recRaw
        : !["", "不推荐", "false", "no", "0"].includes(String(recRaw).trim().toLowerCase());
  const riskText = isEvaluation ? `风险等级 ${riskLevel}` : "";
  const recText = isEvaluation ? (recommended ? "· 推荐" : "· 不推荐") : "";

  const target =
    sectionValue(parsed, ["目标", "任务目标"]) || String(parsed?.target ?? "").trim();
  const direction =
    sectionValue(parsed, ["方向", "行动路线"]) || String(parsed?.direction ?? "").trim();

  // 方案类节点（蓝方方案 / 红方方案）不展示「方向」，其余节点（意图、校验等）保留
  const isPlan =
    node.type === "Attack" ||
    node.type === "Defense" ||
    chip.startsWith("蓝方方案") ||
    chip.startsWith("红方方案");
  const targetText = target ? wrapSubLine(`目标：${target}`) : "";
  const targetLines = targetText ? targetText.split("\n").length : 0;
  const directionText = !isPlan && direction ? `方向：${truncateByUnits(direction, 25)}` : "";

  let height = CARD_PAD_Y + CHIP_H + 8;
  if (bodyLines > 0) height += bodyLines * BODY_LINE_H + 8;
  height += SUB_LINE_H; // 置信度 · 状态
  if (riskText) height += SUB_LINE_H; // 风险等级 · 是否推荐（校验评估）
  if (targetLines > 0) height += targetLines * SUB_LINE_H;
  if (directionText) height += SUB_LINE_H;
  height += CARD_PAD_Y;

  return {
    chip,
    chipWidth: Math.round(textUnits(chip) * 9.4 + 14),
    body,
    bodyLines,
    metaText,
    metaColor: pruned ? "#f87171" : "#9ca3af",
    riskText,
    riskColor,
    // 第二段（是否推荐）紧接在风险等级后面：宽度按字符单位估算（10px 字号 ≈ 每单位 10px）+ 6px 间隔
    recText,
    recColor: recommended ? "#34d399" : "#9ca3af",
    riskWidth: riskText ? Math.round(textUnits(riskText) * 10) + 6 : 0,
    target: targetText,
    targetLines,
    direction: directionText,
    height,
  };
}

/* 自绘节点：rect 底 + 左侧类型色条 + 类型徽标 + 摘要 + 置信度/状态 + 目标 + 方向 */
class AnalysisNode extends Rect {
  render(
    attributes: Record<string, any> = (this as any).parsedAttributes,
    container: any = this,
  ) {
    super.render(attributes as any, container);
    const deco = attributes?.deco;
    if (!deco) return;

    const [w, h] = this.getSize(attributes);
    const left = -w / 2;
    const top = -h / 2;
    let y = top + CARD_PAD_Y;

    // 左侧类型色条（与页面 da-card 左侧强调条一致）
    this.upsert(
      "deco-bar",
      GRect,
      {
        x: left,
        y: top + 8,
        width: 3,
        height: Math.max(h - 16, 6),
        radius: [0, 2, 2, 0],
        fill: deco.accent,
      },
      container,
    );

    // 类型徽标
    this.upsert(
      "deco-chip",
      GRect,
      {
        x: left + CARD_PAD_X,
        y,
        width: deco.chipWidth,
        height: CHIP_H,
        radius: 4,
        fill: deco.chipFill,
        stroke: deco.chipStroke,
        lineWidth: 1,
      },
      container,
    );
    this.upsert(
      "deco-chip-text",
      GText,
      {
        x: left + CARD_PAD_X + deco.chipWidth / 2,
        y: y + CHIP_H / 2,
        text: deco.chip,
        fill: deco.accentText,
        fontSize: 9.5,
        fontFamily: FONT_SANS,
        textAlign: "center",
        textBaseline: "middle",
      },
      container,
    );

    // 徽标行结束，正文从下一行开始
    y += CHIP_H + 8;

    // 摘要正文
    if (deco.bodyLines > 0) {
      this.upsert(
        "deco-body",
        GText,
        {
          x: left + CARD_PAD_X,
          y,
          text: deco.body,
          fill: "#e5e7eb",
          fontSize: BODY_FONT,
          lineHeight: BODY_LINE_H,
          fontFamily: FONT_SANS,
          textAlign: "left",
          textBaseline: "top",
        },
        container,
      );
      y += deco.bodyLines * BODY_LINE_H + 8;
    }

    // 置信度 · 状态（独立一行，位于「目标 / 方向」正上方）
    this.upsert(
      "deco-meta",
      GText,
      {
        x: left + CARD_PAD_X,
        y,
        text: deco.metaText,
        fill: deco.metaColor,
        fontSize: 9.5,
        fontFamily: FONT_SANS,
        textAlign: "left",
        textBaseline: "top",
      },
      container,
    );
    y += SUB_LINE_H;

    // 风险等级 · 是否推荐（仅校验评估节点，紧接在「置信度 · 状态」下面）
    if (deco.riskText) {
      this.upsert(
        "deco-risk",
        GText,
        {
          x: left + CARD_PAD_X,
          y,
          text: deco.riskText,
          fill: deco.riskColor,
          fontSize: 10,
          fontFamily: FONT_SANS,
          textAlign: "left",
          textBaseline: "top",
        },
        container,
      );
      this.upsert(
        "deco-rec",
        GText,
        {
          x: left + CARD_PAD_X + deco.riskWidth,
          y,
          text: deco.recText,
          fill: deco.recColor,
          fontSize: 10,
          fontFamily: FONT_SANS,
          textAlign: "left",
          textBaseline: "top",
        },
        container,
      );
      y += SUB_LINE_H;
    }

    // 目标 / 方向（来自右侧详情 nodeData.details），排在置信度·状态之下
    // 目标最多两行：一行放得下就整句显示，超过两行时末尾补省略号
    if (deco.targetLines > 0) {
      this.upsert(
        "deco-target",
        GText,
        {
          x: left + CARD_PAD_X,
          y,
          text: deco.target,
          fill: "#fbbf24",
          fontSize: 10,
          lineHeight: SUB_LINE_H,
          fontFamily: FONT_SANS,
          textAlign: "left",
          textBaseline: "top",
        },
        container,
      );
      y += deco.targetLines * SUB_LINE_H;
    }
    this.upsert(
      "deco-direction",
      GText,
      {
        x: left + CARD_PAD_X,
        y,
        text: deco.direction || "",
        fill: "#93c5fd",
        fontSize: 10,
        fontFamily: FONT_SANS,
        textAlign: "left",
        textBaseline: "top",
        visibility: deco.direction ? "visible" : "hidden",
      },
      container,
    );
  }
}

let analysisNodeRegistered = false;
function ensureAnalysisNode() {
  if (analysisNodeRegistered) return;
  analysisNodeRegistered = true;
  try {
    register(ExtensionCategory.NODE, ANALYSIS_NODE_TYPE, AnalysisNode);
  } catch {
    /* HMR 重复注册同名节点时忽略 */
  }
}


function buildNodeData(node: NodeData): NodeData {
  // 节点描边/强调色：与 NODE_TYPE_META 同一套（蓝方原 #0ea5e9 的青蓝已并入主蓝）
  const typeMeta = NODE_TYPE_META[(node as any).type] ?? NODE_TYPE_META.Origin;
  const strokeColor = typeMeta.accent;
  const card = buildNodeCard(node);

  const isSelected = store.selectedNode && store.selectedNode.id === node.id;

  // 判断是否需要粗虚线边框
  // 条件1: deleteStatus 为 1（已删除/已剪枝节点）
  const isDeleted = String(node.deleteStatus) === "1";

  // 条件2: isRecommended 值为 '不推荐'（从 nodeData JSON 解析）
  let parsedIsRecommended: any = undefined;
  let hasIsRecommended = false;
  try {
    const nd = node.nodeData;
    if (nd != null) {
      const parsed = typeof nd === "string" ? JSON.parse(nd) : nd;
      if (parsed && typeof parsed === "object" && "isRecommended" in parsed) {
        hasIsRecommended = true;
        parsedIsRecommended = parsed.isRecommended;
      }
    }
  } catch {
    // nodeData 解析失败，忽略
  }
  const isNotRecommended =
    hasIsRecommended &&
    (!parsedIsRecommended ||
      parsedIsRecommended === "不推荐" ||
      parsedIsRecommended === "false");
  const isDashed = isDeleted || isNotRecommended;

  return {
    id: node.id,
    type: ANALYSIS_NODE_TYPE,
    text: node.text,
    _type: node.type || "Origin",
    isWarning: true,
    anomaly: node.anomaly,
    anomalyConf: node.anomalyConf,
    count: node.count,
    discoverTime: node.discoverTime,
    duration: node.duration,
    isAnalyzed: node.isAnalyzed,
    isHexagon: node.isHexagon,
    itemId: node.itemId,
    level: node.level,
    region: node.region,
    threat: node.threat,
    threatConf: node.threatConf,
    title: node.title,
    deleteStatus: node.deleteStatus,
    deleteReason: node.deleteReason,
    isRecommended: parsedIsRecommended,
    // 保留原始字段，供点击节点时获取
    confidence: node.confidence,
    createdAt: node.createdAt,
    nodeData: node.nodeData,
    nodeType: node.nodeType,
    style: {
      size: [CARD_W, card.height] as [number, number],
      radius: CARD_RADIUS,
      fill: "#1a2332",
      stroke: isSelected ? "#93c5fd" : strokeColor,
      lineWidth: isSelected ? 2 : isDashed ? 1.5 : 1,
      lineDash: isDashed ? [7, 4] : undefined,
      shadowColor: isSelected ? "rgba(59,130,246,0.45)" : "rgba(0,0,0,0.35)",
      shadowBlur: isSelected ? 16 : 6,
      // 关闭 G6 内置 label（单色单块），改用自绘装饰层
      label: false,
      deco: {
        chip: card.chip,
        chipWidth: card.chipWidth,
        chipFill: `${typeMeta.accent}24`, // 约 14% 透明度的同色底
        chipStroke: `${typeMeta.accent}73`, // 约 45% 透明度的同色描边
        accent: typeMeta.accent,
        accentText: typeMeta.accentText,
        metaText: card.metaText,
        metaColor: card.metaColor,
        riskText: card.riskText,
        riskColor: card.riskColor,
        riskWidth: card.riskWidth,
        recText: card.recText,
        recColor: card.recColor,
        body: card.body,
        bodyLines: card.bodyLines,
        target: card.target,
        targetLines: card.targetLines,
        direction: card.direction,
      },
      port: true,
      ports: [
        {
          key: "left-port",
          placement: [0, 0.5],
          visibility: "hidden",
        },
        {
          key: "right-port",
          placement: [1, 0.5],
          visibility: "hidden",
        },
      ],
    },
  };
}

function processedEdges(edge: any, index: number): EdgeData {
  const customColor = edge.dashed ? "#475569" : (edge.color || "#475569");
  return {
    id: `edge-${index}-${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    sourcePort: "right-port",
    targetPort: "left-port",
    type: "cubic-horizontal",
    style: {
      stroke: customColor,
      lineWidth: 1.2,
      opacity: 0.65,
      endArrow: true,
      endArrowType: "triangle",
      endArrowSize: [5, 5] as any,
      endArrowFill: customColor,
      lineDash: edge.dashed ? [5, 5] : undefined,
    },
  };
}

function buildGraphData(): GraphData {
  const nodes = store.rawNodes.map((node) => {
    return buildNodeData(node as NodeData);
  });
  const nodeIds = new Set(nodes.map((n) => n.id as string));
  const edges = store.rawEdges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge, index) => {
      return processedEdges(edge as EdgeData, index);
    });
  return { nodes, edges };
}

onMounted(() => {
  nextTick(() => {
    if (!containerRef.value) {
      isLoading.value = false;
      return;
    }

    const initW = containerRef.value.scrollWidth || 1200;
    const initH = containerRef.value.scrollHeight || 750;
    lastCanvasSize = { w: initW, h: initH };

    // 创建画布实例
    ensureAnalysisNode();
    graphInstance = new Graph({
      container: containerRef.value,
      width: initW,
      height: initH,
      node: {
        type: ANALYSIS_NODE_TYPE,
      },
      edge: {
        type: "cubic-horizontal",
      },
      layout: {
        type: "dagre",
        rankdir: "LR",
        nodesep: 14,
        ranksep: 160,
      },
      animation: true,
      behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
    });

    // 渲染图表
    renderGraph(true).finally(() => {
      isLoading.value = false;
    });

    // 监听节点点击事件，根据节点类型切换右侧面板
    graphInstance.on("node:click", (event: any) => {
      // G6 v5: 节点ID在 event.itemId，后备使用 event.target?.id
      const nodeId = event.itemId || event.target?.id;
      if (!nodeId) return;
      // 先从 graph 的渲染数据中获取节点数据（包含 _type 等自定义字段）
      const graphNodeData = graphInstance?.getNodeData(nodeId);
      // 同时从 store 的 rawNodes 中查找原始数据
      const rawNode = store.rawNodes.find((n) => n.id === nodeId);
      // 合并渲染数据和原始数据，确保 _type 字段可用
      const selectedNode = rawNode || graphNodeData;
      if (selectedNode) {
        store.setSelectedNode(selectedNode);
      }
    });
    // 监听大小改变
    resizeObserver = new ResizeObserver(() => {
      const el = containerRef.value;
      if (!el || !graphInstance) return;
      const w = el.scrollWidth;
      const h = el.scrollHeight;
      if (!w || !h) return;
      if (lastCanvasSize && w === lastCanvasSize.w && h === lastCanvasSize.h) return;
      lastCanvasSize = { w, h };
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!graphInstance) return;
        graphInstance.setSize(w, h);
        if (rawNodes.value.length > 0) {
          renderGraph(true);
        }
      });
    });
    resizeObserver.observe(containerRef.value);
  });
});

onUnmounted(() => {
  cancelAnimationFrame(resizeRaf);
  if (resizeObserver) resizeObserver.disconnect();
  if (graphInstance) graphInstance.destroy();
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
