<!-- 综合态势报告弹窗（Mock 结构化报告 + 异常态势简报真实数据） -->
<template>
  <div class="srd">
    <header class="srd-header">
      <div class="srd-header__main">
        <span class="srd-header__icon" aria-hidden="true">📄</span>
        <h2 class="srd-header__title">{{ headerTitle }}</h2>
      </div>
      <span class="srd-header__id">{{ headerReportId }}</span>
    </header>

    <div class="srd-body">
      <main class="srd-doc custom-scrollbar">
        <!-- 简报：加载 / 生成 / 错误 / Markdown 正文 -->
        <template v-if="isBriefingMode">
          <div v-if="loadState === 'loading'" class="srd-phase">🔎 正在查询今日简报…</div>
          <div v-else-if="loadState === 'generating'" class="srd-phase">
            ⏳ 正在调用「态势简报生成Agent」生成过去24小时全局异常态势简报，约需 1 分钟，请勿关闭…
          </div>
          <div v-else-if="loadState === 'error'" class="srd-error">
            <div>{{ briefingErrorText || "简报生成失败，请重试。" }}</div>
            <el-button type="primary" size="small" @click="emit('regenerate')">重新生成</el-button>
          </div>
          <div v-else class="markdown-body" v-html="renderMarkdown(briefing?.content || '')"></div>
        </template>

        <!-- Mock：多章节结构化报告 -->
        <template v-else>
          <section v-for="sec in data.sections" :key="sec.number" class="srd-sec">
            <h3 class="srd-sec__title">
              <span class="srd-sec__num">{{ sec.number }}</span>
              {{ sec.title }}
            </h3>

            <p v-if="sec.kind === 'paragraph'" class="srd-p">
              {{ sec.text }}
            </p>

            <ul v-else-if="sec.kind === 'bullets'" class="srd-ul">
              <li v-for="(line, i) in sec.items" :key="i">{{ line }}</li>
            </ul>

            <div v-else-if="sec.kind === 'table'" class="srd-table-wrap">
              <table class="srd-table">
                <thead>
                  <tr>
                    <th v-for="col in sec.columns" :key="col">{{ col }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in sec.rows" :key="ri">
                    <td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else-if="sec.kind === 'actions'" class="srd-actions">
              <div v-for="row in sec.rows" :key="row.id" class="srd-action-row">
                <span class="srd-pri" :class="`srd-pri--${row.priority.toLowerCase()}`">
                  {{ row.priority }}
                </span>
                <div class="srd-action-main">
                  <div class="srd-action-top">
                    <span class="srd-action-tag">{{ row.tag }}</span>
                    <strong class="srd-action-title">{{ row.title }}</strong>
                  </div>
                  <p class="srd-action-desc">{{ row.description }}</p>
                  <div class="srd-action-related">
                    关联对象：
                    <span class="srd-link">{{ row.relatedObject }}</span>
                  </div>
                </div>
                <div class="srd-action-side">
                  <div class="srd-status">{{ row.status }}</div>
                  <div v-if="row.statusRef" class="srd-status-ref">{{ row.statusRef }}</div>
                  <div class="srd-action-btns">
                    <button
                      v-if="row.actionMode === 'execute'"
                      type="button"
                      class="srd-btn srd-btn--primary"
                      @click="onExecuteAction(row.id)"
                    >
                      执行
                    </button>
                    <button v-else type="button" class="srd-btn srd-btn--muted" @click="onAdoptAction(row.id)">
                      建议采纳
                    </button>
                    <button type="button" class="srd-text-btn" @click="onViewAction(row.id)">
                      查看该条
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="sec.kind === 'evidence'" class="srd-evidence">
              <div class="srd-evidence-head">{{ sec.countLabel }} 关联对象与依据</div>
              <ul class="srd-evidence-list">
                <li v-for="ev in sec.items" :key="ev.id">
                  <span class="srd-ev-id">{{ ev.id }}</span>
                  · {{ ev.summary }} →
                  <span class="srd-link">{{ ev.target }}</span>
                </li>
              </ul>
            </div>
          </section>
        </template>
      </main>

      <aside class="srd-aside custom-scrollbar">
        <dl class="srd-meta">
          <template v-if="isBriefingMode">
            <div v-if="briefing" class="srd-meta-row">
              <dt>简报日期</dt>
              <dd>{{ briefing.briefingDate }}</dd>
            </div>
            <div v-if="briefing" class="srd-meta-row">
              <dt>纳入异常</dt>
              <dd>{{ briefing.anomalyCount }} 条（过去24小时）</dd>
            </div>
            <div v-if="briefing?.updatedAt" class="srd-meta-row">
              <dt>生成时间</dt>
              <dd>{{ formatBriefingTime(briefing.updatedAt) }}</dd>
            </div>
            <div v-if="briefing?.status" class="srd-meta-row">
              <dt>状态</dt>
              <dd>{{ briefingStatusLabel }}</dd>
            </div>
            <div v-if="briefing" class="srd-meta-row">
              <dt>简报编号</dt>
              <dd class="mono">BRF-{{ briefing.id }}</dd>
            </div>
          </template>
          <template v-else>
            <div class="srd-meta-row">
              <dt>报告编号</dt>
              <dd class="mono">{{ data.meta.reportId }}</dd>
            </div>
            <div class="srd-meta-row">
              <dt>生成时间</dt>
              <dd>{{ data.meta.generatedAt }}</dd>
            </div>
            <div class="srd-meta-row">
              <dt>置信度</dt>
              <dd class="srd-meta-accent">{{ data.meta.confidencePct }}%</dd>
            </div>
            <div class="srd-meta-row">
              <dt>覆盖范围</dt>
              <dd>{{ data.meta.coverage }}</dd>
            </div>
            <div class="srd-meta-row">
              <dt>统计周期</dt>
              <dd>{{ data.meta.period }}</dd>
            </div>
          </template>
        </dl>
        <div v-if="!isBriefingMode" class="srd-core">
          <h4 class="srd-core__title">核心要点</h4>
          <ol class="srd-core__list">
            <li v-for="(pt, i) in data.meta.corePoints" :key="i">{{ pt }}</li>
          </ol>
        </div>
      </aside>
    </div>

    <footer class="srd-footer">
      <template v-if="isBriefingMode">
        <button
          type="button"
          class="srd-btn srd-btn--primary"
          :disabled="loadState === 'loading' || loadState === 'generating'"
          @click="emit('regenerate')"
        >
          {{ loadState === 'loading' || loadState === 'generating' ? '生成中…' : '立即重新生成' }}
        </button>
        <button type="button" class="srd-btn srd-btn--ghost" @click="emit('close')">关闭</button>
      </template>
      <template v-else>
        <button type="button" class="srd-btn srd-btn--ghost" @click="emit('map-locate')">地图定位</button>
        <button type="button" class="srd-btn srd-btn--ghost" @click="emit('export-pdf')">导出 PDF</button>
        <button type="button" class="srd-btn srd-btn--primary" @click="emit('export-report')">导出报告</button>
        <button type="button" class="srd-btn srd-btn--ghost" @click="emit('close')">关闭</button>
      </template>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElMessage } from "element-plus";
import MarkdownIt from "markdown-it";
import type { AnomalyBriefing } from "@/api/briefings";
import {
  situationReportDetailMock,
  type SituationReportDetailMock,
} from "@/mock/situationReportDetail";

/** 简报加载 / 生成状态 */
export type BriefingDialogState = "loading" | "generating" | "ready" | "error";

/** 弹窗展示形态：结构化 Mock 报告 vs 接口简报 */
export type SituationReportDialogVariant = "structured" | "briefing";

const props = withDefaults(
  defineProps<{
    /** structured=地图等 Mock 长报告；briefing=异常态势接口 Markdown */
    variant?: SituationReportDialogVariant;
    /** Mock 结构化报告详情（地图节点等场景） */
    data?: SituationReportDetailMock;
    /** 简报加载 / 生成 / 就绪 / 失败（variant=briefing 时由父组件传入） */
    loadState?: BriefingDialogState;
    briefing?: AnomalyBriefing | null;
    error?: string;
    /** 简报标题（态势监控 / 异常征候） */
    heading?: string;
  }>(),
  {
    variant: "structured",
    data: () => situationReportDetailMock,
    loadState: "loading",
    heading: "全局异常态势简报",
  },
);

const emit = defineEmits<{
  close: [];
  regenerate: [];
  "map-locate": [];
  "export-pdf": [];
  "export-report": [];
}>();

/**
 * 是否以异常态势简报（API）模式渲染。
 * 必须由调用方显式传入 variant="briefing"，避免与结构化 Mock 混显。
 */
const isBriefingMode = computed(() => props.variant === "briefing");

const loadState = computed(() => props.loadState);
const briefing = computed(() => props.briefing ?? null);
const briefingErrorText = computed(() => props.error ?? "");

const headerTitle = computed(() =>
  isBriefingMode.value ? props.heading : props.data.meta.title,
);

const headerReportId = computed(() => {
  if (isBriefingMode.value && props.briefing) {
    return `BRF-${props.briefing.id}`;
  }
  if (isBriefingMode.value) {
    return "—";
  }
  return props.data.meta.reportId;
});

/** 后端简报状态中文展示 */
const briefingStatusLabel = computed(() => {
  const s = props.briefing?.status;
  if (s === "RUNNING") return "生成中";
  if (s === "COMPLETED") return "已完成";
  if (s === "FAILED") return "失败";
  return s ?? "—";
});

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
const renderMarkdown = (src: string) => md.render(src);

const formatBriefingTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const onExecuteAction = (id: string) => {
  ElMessage.info(`执行建议 ${id}（Mock）`);
};

const onAdoptAction = (id: string) => {
  ElMessage.success(`已采纳建议 ${id}（Mock）`);
};

const onViewAction = (id: string) => {
  ElMessage.info(`查看建议 ${id}（Mock）`);
};
</script>

<style scoped>
.srd {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: min(82vh, 720px);
  min-height: 0;
  color: #e5e7eb;
  font-size: 12.5px;
  line-height: 1.6;
}

.srd-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #2d3a4d;
}

.srd-header__main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.srd-header__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.srd-header__id {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  color: #9ca3af;
  border: 1px solid #2d3a4d;
  border-radius: 999px;
}

.srd-body {
  display: grid;
  grid-template-columns: 1fr 260px;
  grid-template-rows: minmax(0, 1fr);
  gap: 14px;
  flex: 1 1 auto;
  min-height: 280px;
  max-height: min(68vh, 600px);
  overflow: hidden;
}

.srd-doc {
  min-height: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px 14px;
  border: 1px solid #2d3a4d;
  border-radius: 8px;
  background: #0f1622;
}

.srd-aside {
  min-height: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid #2d3a4d;
  border-radius: 8px;
  background: #1a2332;
}

.srd-phase {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  font-size: 12px;
  color: #9ca3af;
}

.srd-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: center;
  min-height: 160px;
  font-size: 12px;
  color: #fca5a5;
}

.srd-sec {
  margin-bottom: 16px;
}

.srd-sec:last-child {
  margin-bottom: 0;
}

.srd-sec__title {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #93c5fd;
}

.srd-sec__num {
  margin-right: 6px;
  color: #6b7280;
  font-weight: 600;
}

.srd-p {
  margin: 0;
  color: #cbd5e1;
}

.srd-ul {
  margin: 0;
  padding-left: 18px;
  color: #cbd5e1;
}

.srd-ul li {
  margin: 4px 0;
}

.srd-table-wrap {
  overflow-x: auto;
}

.srd-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}

.srd-table th,
.srd-table td {
  border: 1px solid #2d3a4d;
  padding: 6px 8px;
  text-align: left;
}

.srd-table th {
  background: #1a2332;
  color: #93c5fd;
  font-weight: 600;
}

.srd-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.srd-action-row {
  display: grid;
  grid-template-columns: 42px 1fr 150px;
  gap: 10px;
  padding: 10px;
  border: 1px solid #2d3a4d;
  border-radius: 6px;
  background: #111827;
}

.srd-pri {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  border: 2px solid;
}

.srd-pri--p1 {
  color: #fecaca;
  border-color: #ef4444;
}

.srd-pri--p2 {
  color: #fde68a;
  border-color: #f59e0b;
}

.srd-pri--p3 {
  color: #bfdbfe;
  border-color: #3b82f6;
}

.srd-action-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.srd-action-tag {
  padding: 1px 6px;
  font-size: 10px;
  color: #93c5fd;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 3px;
}

.srd-action-title {
  font-size: 12.5px;
  color: #f3f4f6;
}

.srd-action-desc {
  margin: 0 0 6px;
  font-size: 11px;
  color: #9ca3af;
}

.srd-action-related {
  font-size: 11px;
  color: #9ca3af;
}

.srd-link {
  color: #93c5fd;
}

.srd-action-side {
  text-align: right;
  font-size: 11px;
}

.srd-status {
  color: #e5e7eb;
  font-weight: 500;
}

.srd-status-ref {
  color: #6b7280;
  font-family: ui-monospace, monospace;
  margin-top: 2px;
}

.srd-action-btns {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.srd-evidence-head {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.srd-evidence-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.srd-evidence-list li {
  padding: 6px 0;
  border-bottom: 1px solid #2d3a4d40;
  font-size: 11.5px;
  color: #cbd5e1;
}

.srd-ev-id {
  font-family: ui-monospace, monospace;
  color: #9ca3af;
}

.srd-meta {
  margin: 0 0 14px;
}

.srd-meta-row {
  margin-bottom: 10px;
}

.srd-meta-row dt {
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 2px;
}

.srd-meta-row dd {
  margin: 0;
  font-size: 12px;
  color: #e5e7eb;
}

.srd-meta-row dd.mono {
  font-family: ui-monospace, monospace;
}

.srd-meta-accent {
  color: #5eead4 !important;
}

.srd-core__title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
}

.srd-core__list {
  margin: 0;
  padding-left: 16px;
  font-size: 11.5px;
  color: #9ca3af;
}

.srd-core__list li {
  margin: 6px 0;
}

.srd-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
  padding-top: 8px;
  border-top: 1px solid #2d3a4d;
}

.srd-btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid #2d3a4d;
  cursor: pointer;
  transition: background 0.15s ease;
}

.srd-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.srd-btn--primary {
  color: #fff;
  background: #2563eb;
  border-color: #3b82f6;
}

.srd-btn--primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.srd-btn--ghost {
  color: #cbd5e1;
  background: transparent;
}

.srd-btn--ghost:hover {
  background: #253141;
}

.srd-btn--muted {
  color: #9ca3af;
  background: #1f2937;
}

.srd-text-btn {
  padding: 0;
  font-size: 11px;
  color: #93c5fd;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #2d3a4d;
  border-radius: 3px;
}

/* Markdown 暗色主题（与 BriefingDialog / WarningDialog 一致） */
.markdown-body {
  font-size: 12px;
  line-height: 1.75;
  color: #cbd5e1;
  word-break: break-word;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  font-weight: 700;
  margin: 8px 0 4px;
  color: #93c5fd;
  line-height: 1.35;
}
.markdown-body :deep(h1) {
  font-size: 14px;
}
.markdown-body :deep(h2) {
  font-size: 13px;
}
.markdown-body :deep(h3) {
  font-size: 12px;
}
.markdown-body :deep(h4) {
  font-size: 12px;
}
.markdown-body :deep(p) {
  margin: 4px 0;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}
.markdown-body :deep(li) {
  margin: 2px 0;
}
.markdown-body :deep(ul li) {
  list-style: disc;
}
.markdown-body :deep(ol li) {
  list-style: decimal;
}
.markdown-body :deep(strong) {
  color: #bfdbfe;
  font-weight: 700;
}
.markdown-body :deep(em) {
  color: #cbd5e1;
}
.markdown-body :deep(a) {
  color: #93c5fd;
  text-decoration: underline;
}
.markdown-body :deep(code) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: #fca5a5;
}
.markdown-body :deep(pre) {
  background: #111827;
  border: 1px solid #2d3a4d;
  border-radius: 4px;
  padding: 8px 10px;
  overflow-x: auto;
  margin: 6px 0;
}
.markdown-body :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
  color: #cbd5e1;
  font-size: 11px;
}
.markdown-body :deep(blockquote) {
  border-left: 3px solid #3b82f6;
  padding-left: 8px;
  color: #cbd5e1;
  margin: 6px 0;
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2d3a4d;
  margin: 8px 0;
}
</style>