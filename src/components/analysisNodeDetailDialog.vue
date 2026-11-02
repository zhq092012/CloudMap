<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="920px"
    :close-on-click-modal="false"
    draggable
    class="plan-detail-dialog"
    append-to-body
    destroy-on-close
    @update:model-value="(v: boolean) => emit('update:visible', v)"
    @closed="emit('update:visible', false)"
  >
    <div v-if="node" class="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
      <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono">
        <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          置信度 {{ confidenceText }}
        </span>
        <span v-if="isPruned" class="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-700/50">
          已剪枝{{ pruneReason ? `：${pruneReason}` : "" }}
        </span>
        <span v-else class="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
          未剪枝
        </span>
        <span class="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/60">
          {{ typeText }}
        </span>
      </div>

      <div class="px-2 py-1.5 rounded bg-slate-800/40 border border-slate-700/50 text-xs text-slate-200 break-all">
        {{ nodeLabel }}
      </div>

      <!-- 红方方案：双栏并排「对应蓝方方案 | 本红方方案」 -->
      <div v-if="node.type === 'Defense'" class="grid grid-cols-2 gap-3">
        <section class="rounded border border-sky-800/50 bg-[#101625]/60 p-2.5 min-w-0">
          <h4 class="text-xs font-bold text-sky-400 mb-2">
            对应蓝方方案{{ pairedAttack ? `（${pairedViaText}）` : "" }}
          </h4>
          <template v-if="pairedAttackData">
            <div class="text-[10px] text-slate-500 font-mono mb-1.5 break-all">
              {{ pairedAttackData.label }}
            </div>
            <p class="text-xs text-slate-300 leading-relaxed break-words mb-2">
              {{ pairedAttackData.summary || "（无）" }}
            </p>
            <div class="bg-[#0b0f19] border border-slate-800 rounded p-2.5">
              <AnalysisDetailBlocks v-if="pairedAttackData.details" :text="pairedAttackData.details" accent="sky" />
              <span v-else class="text-xs text-slate-500">（无）</span>
            </div>
          </template>
          <p v-else class="text-xs text-slate-500">未找到对应蓝方方案</p>
        </section>
        <section class="rounded border border-red-800/50 bg-[#101625]/60 p-2.5 min-w-0">
          <h4 class="text-xs font-bold text-red-400 mb-2">本红方方案</h4>
          <p class="text-xs text-slate-300 leading-relaxed break-words mb-2">
            {{ summary || "（无）" }}
          </p>
          <div class="bg-[#0b0f19] border border-slate-800 rounded p-2.5">
            <AnalysisDetailBlocks v-if="details" :text="details" accent="red" />
            <span v-else class="text-xs text-slate-500">（无）</span>
          </div>
        </section>
      </div>

      <!-- 蓝方方案 / 评估报告：单栏 -->
      <div v-else class="space-y-2.5">
        <section>
          <h4 class="text-xs font-bold text-slate-300 mb-1.5">摘要</h4>
          <p class="text-xs text-slate-300 leading-relaxed break-words">
            {{ summary || "（无）" }}
          </p>
        </section>
        <section>
          <h4 class="text-xs font-bold text-slate-300 mb-1.5">
            {{ node.type === "Evaluation" ? "评估报告全文" : "方案详情全文" }}
          </h4>
          <div class="bg-[#0b0f19] border border-slate-800 rounded p-2.5">
            <AnalysisDetailBlocks v-if="details" :text="details" accent="sky" />
            <span v-else class="text-xs text-slate-500">（无）</span>
          </div>
        </section>
      </div>
    </div>
    <template #footer>
      <div class="flex w-full items-center justify-between">
        <div class="text-[10px] text-slate-500">提示：拖拽标题栏可移动窗口 · 拖拽右下角可调整窗口大小</div>
        <div class="dialog-resize-grip" title="拖拽调整窗口大小" @mousedown="startDialogResize"></div>
      </div>
    </template>
  </el-dialog>
</template>

<style>
/* 方案详情弹窗：body 纵向 flex，内容区(stretch)跟随窗口高度，滚动统一在内容根上 */
.plan-detail-dialog .el-dialog__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
/* 右下角缩放手柄 */
.plan-detail-dialog .dialog-resize-grip {
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  border-right: 2px solid #334155;
  border-bottom: 2px solid #334155;
  background: linear-gradient(
    135deg,
    transparent 0%, transparent 40%,
    #64748b 40%, #64748b 47%,
    transparent 47%, transparent 60%,
    #64748b 60%, #64748b 67%,
    transparent 67%, transparent 80%,
    #64748b 80%, #64748b 87%,
    transparent 87%
  );
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import AnalysisDetailBlocks from "@/components/analysisDetailBlocks.vue";

const props = defineProps<{ visible: boolean; node: any }>();
const emit = defineEmits<{ (e: "update:visible", value: boolean): void }>();

const store = useAnalysisStore();

/* 强制 dialog/body 为纵向 flex（class 穿透在 EP 2.13 不可靠，内联兜底）：
   否则 body 按内容自然高度撑开，缩小窗口高度时内层不跟随 */
function ensureDialogLayout(dlg: HTMLElement) {
  if (dlg.style.display !== "flex") {
    dlg.style.display = "flex";
    dlg.style.flexDirection = "column";
  }
  const body = dlg.querySelector<HTMLElement>(".el-dialog__body");
  if (body) {
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.flex = "1";
    body.style.minHeight = "0";
    body.style.overflow = "hidden";
  }
}

/* 弹窗右下角拖拽调整大小（CSS resize 在 EP 2.13 的 dialog 上实测无效，改用 JS 直接改 .el-dialog 宽高） */
function startDialogResize(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  const overlay = (e.currentTarget as HTMLElement).closest?.(".el-overlay") || document;
  const dlg = overlay.querySelector<HTMLElement>(".plan-detail-dialog .el-dialog") || overlay.querySelector<HTMLElement>(".el-dialog");
  if (!dlg) return;
  ensureDialogLayout(dlg);
  const sx = e.clientX;
  const sy = e.clientY;
  const sw = dlg.offsetWidth;
  const sh = dlg.offsetHeight;
  const onMove = (ev: MouseEvent) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    dlg.style.width = Math.min(Math.max(sw + ev.clientX - sx, 560), vw - 16) + "px";
    dlg.style.height = Math.min(Math.max(sh + ev.clientY - sy, 240), vh - 16) + "px";
  };
  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

function parseNodeData(node: any): Record<string, any> {
  const nd = node?.nodeData;
  if (nd == null) return {};
  try {
    const obj = typeof nd === "string" ? JSON.parse(nd) : nd;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return obj as Record<string, any>;
    }
    return {};
  } catch {
    return {};
  }
}

function textOf(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

const parsed = computed(() => parseNodeData(props.node));
const summary = computed(() => textOf(parsed.value?.summary));
const details = computed(() => textOf(parsed.value?.details));

const confidenceText = computed(() => {
  const c = props.node?.confidence ?? parsed.value?.confidence;
  return c != null && Number.isFinite(Number(c)) ? `${Math.round(Number(c))}%` : "N/A";
});

const isPruned = computed(() => {
  if (String(props.node?.deleteStatus) === "1") return true;
  return !!props.node?.raw?.pruned;
});

const pruneReason = computed(() =>
  props.node?.deleteReason || props.node?.raw?.pruneReason || ""
);

const nodeLabel = computed(() => props.node?.text || props.node?.summary || "（无标签）");

const typeText = computed(() => {
  const t = props.node?.type;
  if (t === "Attack") return "蓝方方案";
  if (t === "Defense") return "红方方案";
  if (t === "Evaluation") return "评估报告";
  if (t === "Intent") return "意图";
  return "节点";
});

const dialogTitle = computed(() => {
  const t = props.node?.type;
  if (t === "Attack") return "蓝方方案详情";
  if (t === "Defense") return "红方方案详情（含对应蓝方方案）";
  if (t === "Evaluation") return "评估报告详情";
  return "节点详情";
});

/* 红方方案 ← 对应蓝方方案：
   1) 沿 raw.parentNodeId 上溯 ≤2 跳找 type === "Attack" 的祖先（防环）；
   2) 找不到则用本红方 parsed.sourceNodeId（指向同一意图的 nodeId）匹配同父蓝方。 */
const pairedAttack = computed<{
  node: any;
  via: "parent-hop" | "sourceNodeId";
} | null>(() => {
  if (props.node?.type !== "Defense") return null;
  const nodes: any[] = store.rawNodes || [];
  const visited = new Set<string>();
  let pid: string = (props.node?.raw?.parentNodeId as string) || "";
  for (let hop = 0; hop < 2 && pid; hop++) {
    if (visited.has(pid)) break;
    visited.add(pid);
    const r = nodes.find((x) => x.id === pid || x.raw?.stepId === pid);
    if (!r) break;
    if (r.type === "Attack") return { node: r, via: "parent-hop" };
    pid = (r.raw?.parentNodeId as string) || "";
  }
  const src = parsed.value?.sourceNodeId;
  if (src) {
    const paired = nodes.find(
      (n) => n.type === "Attack" && parseNodeData(n)?.sourceNodeId === src
    );
    if (paired) return { node: paired, via: "sourceNodeId" };
  }
  return null;
});

const pairedViaText = computed(() =>
  pairedAttack.value?.via === "parent-hop" ? "父节点上溯" : "同源意图匹配"
);

const pairedAttackData = computed(() => {
  const p = pairedAttack.value?.node;
  if (!p) return null;
  const pParsed = parseNodeData(p);
  return {
    label: p.text || p.summary || "（无标签）",
    summary: textOf(pParsed?.summary),
    details: textOf(pParsed?.details),
  };
});
</script>
