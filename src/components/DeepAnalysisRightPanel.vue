<template>
  <div
    class="w-100 shrink-0 h-full bg-[#080d16] text-gray-200 p-4 border-l border-[#16253b] flex flex-col overflow-y-auto custom-scrollbar font-sans text-sm selection:bg-sky-500 selection:text-white">
    <div class="text-base font-semibold text-white mb-4 tracking-wide">
      意图详情
    </div>

    <div class="grid grid-cols-1 gap-3 mb-4">
      <button
        :disabled="!isIntentSelected"
        class="py-2 px-3 bg-[#112035] border border-[#1d4ed8]/60 text-[#38bdf8] hover:bg-[#162e4e] hover:border-[#38bdf8] transition-all rounded text-xs font-medium tracking-wider shadow-inner disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#112035] disabled:hover:border-[#1d4ed8]/60"
        @click="planAnalysis">
        方案画像分析
      </button>
    </div>
    <!-- 选中节点信息卡片 -->
    <div v-if="isIntentSelected"
      class="border border-[#10b981]/50 bg-[#0c1f1a]/80 rounded p-3 mb-4 shadow-lg animate-fade-in">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>
        <span class="text-[11px] text-[#10b981] font-semibold tracking-wider">当前选中 · 意图节点</span>
      </div>
      <div class="text-white font-medium text-sm leading-relaxed tracking-wide">
        {{
          store.selectedNode.text || store.selectedNode.title || "未命名节点"
        }}
      </div>
      <div class="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
        <span>ID:
          <span class="text-gray-300 font-mono">{{
            store.selectedNode.id
          }}</span></span>
        <span v-if="store.selectedNode.itemId">关联项:
          <span class="text-gray-300 font-mono">{{
            store.selectedNode.itemId
          }}</span></span>
      </div>
    </div>

    <div class="flex items-center gap-5 text-xs text-gray-400 mb-2.5 font-medium">
      <div class="flex items-center gap-1.5">
        <span>置信度</span>
        <span class="text-[#4ade80] font-bold font-mono text-[13px] tracking-normal glow-text">
          {{ nodeConfidenceText }}
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <span>状态</span>
        <span :class="[
          store.selectedNode?.deleteStatus == '1'
            ? 'text-[#f59e0b] glow-text-orange'
            : 'text-[#4ade80] glow-text'
        ]" class="font-bold text-[13px]">
          {{ store.selectedNode?.deleteStatus == '1' ? '已剪枝' : '活跃' }}
        </span>
      </div>
    </div>
    <!-- 如果被剪枝，展示具体剪枝理由 -->
    <div v-if="store.selectedNode?.deleteStatus == '1'"
      class="px-3 pb-3 pt-2 bg-[#f59e0b]/5 text-xs border-t border-[#f59e0b]/20">
      <div class="text-[#f59e0b] font-semibold mb-1 flex items-center gap-1">
        <el-icon>
          <Warning />
        </el-icon>
        <span>剪枝理由：</span>
      </div>
      <div class="text-gray-300 leading-relaxed font-sans pl-4">
        {{ store.selectedNode?.deleteReason || "未提供具体剪枝理由" }}
      </div>
    </div>

    <!--
    <div class="border border-[#ea580c] bg-[#141214]/60 rounded p-3 mb-4 shadow-md">
      <div class="flex items-center gap-1.5 text-[#f97316] font-bold text-sm mb-1">
        <el-icon class="text-base">
          <WarningFilled />
        </el-icon>
        <span>检测到问题 装备能力不符</span>
      </div>
      <div
        class="text-[11px] text-gray-400 mb-3 cursor-pointer hover:text-gray-200 transition-colors inline-flex items-center gap-1">
        点击展开检测过程
        <el-icon class="text-[10px]">
          <ArrowDown />
        </el-icon>
      </div>

      <div class="bg-[#090f17] border border-[#1a2b44] rounded p-1 relative min-h-62.5 overflow-hidden">
        <span
          class="absolute top-2 left-2 text-[11px] text-gray-500 font-medium font-sans z-10 select-none pointer-events-none">
          判断证据 (AntV G6 v5 驱动)
        </span>
        <div ref="g6Container" class="w-full h-60 relative"></div>
      </div>
    </div>
    -->



    <!--
    <div class="mb-4">
      <div class="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
        <span class="w-1 h-3 bg-[#0284c7] inline-block rounded-sm"></span>
        <span>涉及异常与支撑证据</span>
      </div>

      <el-collapse v-model="activeCollapse" class="custom-collapse-panel">
        <el-collapse-item name="evidence-1">
          <template #title>
            <div class="flex items-center justify-between w-full pr-1 text-xs select-none">
              <div class="flex items-center gap-1.5 text-gray-200">
                <span class="text-[#f59e0b] text-xs font-serif">◆</span>
                <span class="font-medium tracking-wide">巴林乌代德基地F-15E转场异常</span>
              </div>
              <div class="flex items-center gap-2 text-[11px] font-mono scale-95 origin-right">
                <span class="text-gray-400">威胁度 <span class="text-[#f97316] font-bold">87</span>
                  <span class="text-[#f59e0b]/80">(置信度82)</span></span>
                <span class="text-gray-400">异常度 <span class="text-white font-bold">94</span>
                  <span class="text-gray-400/80">(置信度91)</span></span>
              </div>
            </div>
          </template>
          <div class="text-xs text-gray-400 p-3 bg-[#090f17] border-t border-[#1a2b44] leading-relaxed">
            此处可填充由后端返回的详细检测路径数据、多维时序异常点或是关联实体详情等支撑证据。
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
    -->

    <div class="mb-4">
      <div class="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
        <span class="w-1 h-3 bg-[#0284c7] inline-block rounded-sm"></span>
        <span>行动分析</span>
      </div>
      <div class="bg-[#111925] border border-[#1a2b44] rounded p-3 space-y-3.5 text-xs">
        <div v-if="resultDataText?.summary">
          <div class="text-gray-500 mb-1.5 font-medium">方案摘要</div>
          <div class="text-gray-200 bg-[#142030] p-2 rounded border border-[#1e324d] tracking-wide">
            {{ resultDataText?.summary || "" }}
          </div>
        </div>
        <DetailSectionAccordion v-if="resultDataText?.details" :detail="resultDataText?.details" />
        <!-- 异常事件(ORIGIN)等节点的 output_json 无 summary/details 字段时，
             直接以键值列表展示 output_json 的其余字段，避免框内空白 -->
        <div v-else-if="outputJsonEntries.length > 0" class="space-y-3">
          <div v-for="entry in outputJsonEntries" :key="entry.key">
            <div class="text-gray-500 mb-1.5 font-medium">{{ entry.label }}</div>
            <div class="text-gray-200 bg-[#142030] p-2 rounded border border-[#1e324d] tracking-wide leading-relaxed break-words">
              {{ entry.value }}
            </div>
          </div>
        </div>
        <!-- <div>
          <div class="text-gray-500 mb-1.5 font-medium">行动方向</div>
          <div class="text-gray-200 bg-[#142030] p-2 rounded border border-[#1e324d] font-mono tracking-wide">
            巴林乌代德基地 → 伊朗境内
          </div>
        </div>
        <div>
          <div class="text-gray-500 mb-1.5 font-medium">行动性质</div>
          <div class="text-gray-200 bg-[#142030] p-2 rounded border border-[#1e324d] tracking-wide">
            进攻性 / 常规对地攻击
          </div>
        </div> -->
      </div>
    </div>

    <!--
    <div class="mb-2">
      <div class="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
        <span class="w-1 h-3 bg-[#0284c7] inline-block rounded-sm"></span>
        <span>历史战例匹配</span>
      </div>
      <div class="bg-[#111925] border border-[#1a2b44] rounded p-3 text-xs space-y-2">
        <div class="text-gray-200 font-medium tracking-wide">
          2021年以色列空袭加沙前F-15挂载模式 · 匹配度
          <span class="text-[#38bdf8] font-bold font-mono">59%</span>
        </div>
        <div class="text-gray-300 flex items-start gap-1 leading-normal">
          <span class="text-gray-500 shrink-0 select-none">关键相似点：</span>
          <span>挂载构型从巡逻构型转换为打击构型</span>
        </div>
        <div class="text-gray-300 flex items-start gap-1 leading-normal">
          <span class="text-gray-500 shrink-0 select-none">差异点：</span>
          <span>加沙案例中F-15挂载为通用爆破弹(Mk-84)，非钻地弹</span>
        </div>
      </div>
    </div>
    -->

    <!--
    <div class="text-sm font-semibold text-white tracking-wide mb-1">
      关联扩展情报
    </div>

    <div class="bg-[#121a26] border border-[#1e2d42] rounded p-3 transition-all hover:border-[#38bdf8]/50 mb-2">
      <div class="flex items-start gap-2">
        <el-icon class="text-[#38bdf8] text-base mt-0.5 shrink-0">
          <Connection />
        </el-icon>
        <div class="space-y-1">
          <div class="text-gray-100 font-medium leading-tight">
            EA-18G Milan ↔ F-35I Link-16交互频次
            <span class="text-[#f43f5e] font-bold font-mono">↑ 320%</span>
          </div>
          <div class="text-gray-400 text-[11px] leading-normal">
            联军协同目标分配演练确认，打击时间窗口逼近
          </div>
        </div>
      </div>
    </div>

    <div class="bg-[#121a26] border border-[#1e2d42] rounded p-3 transition-all hover:border-[#38bdf8]/50 mb-2">
      <div class="flex items-start gap-2">
        <el-icon class="text-[#38bdf8] text-base mt-0.5 shrink-0">
          <Radar />
        </el-icon>
        <div class="space-y-1">
          <div class="text-gray-100 font-medium leading-tight">
            伊朗格什姆岛防空指挥所通信量突增
            <span class="text-[#f43f5e] font-bold font-mono">400%</span>
          </div>
          <div class="text-gray-400 text-[11px] leading-normal">
            伊方已感知异常（反向印证蓝方行动真实性）
          </div>
        </div>
      </div>
    </div>

    <div class="bg-[#121a26] border border-[#1e2d42] rounded p-3 space-y-2 mb-2">
      <div class="flex items-center gap-2">
        <el-icon class="text-[#a855f7] text-base shrink-0">
          <Camera />
        </el-icon>
        <div class="text-gray-100 font-medium leading-tight">
          以色列内瓦廷基地跑道维护异常，频次和强度均超出常规预估
        </div>
      </div>
      <div
        class="w-full aspect-video bg-[#090f17] border border-[#1e2d42] rounded overflow-hidden relative flex items-center justify-center group">
        <img src="" alt="卫星侦察航拍图"
          class="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
        <div
          class="absolute inset-0 flex flex-col items-center justify-center text-gray-600 space-y-1 bg-[#0d1520]/80 pointer-events-none">
          <el-icon class="text-xl">
            <Picture />
          </el-icon>
          <span class="text-[10px] font-mono tracking-widest">SATELLITE IMAGING RECON</span>
        </div>
      </div>
    </div>

    <div
      class="bg-[#121a26] border border-[#1e2d42] rounded p-2.5 flex items-center gap-2.5 transition-all hover:bg-[#162234] mb-2">
      <el-icon class="text-gray-400 text-sm shrink-0">
        <Document />
      </el-icon>
      <div class="text-gray-200 font-medium truncate">
        美军中央司令部更新霍尔木兹航行警告至<span class="text-[#f97316] font-bold">“最高风险”</span>
      </div>
    </div>

    <div
      class="bg-[#121a26] border border-[#1e2d42] rounded p-2.5 flex items-center gap-2.5 transition-all hover:bg-[#162234] mb-2">
      <el-icon class="text-gray-400 text-sm shrink-0">
        <Document />
      </el-icon>
      <div class="text-gray-200 font-medium truncate">
        以色列总理办公室拒评“是否参与联军行动”<span class="text-[#f59e0b] ml-1">（反常）</span>
      </div>
    </div>

    <div
      class="bg-[#121a26] border border-[#1e2d42] rounded p-2.5 flex items-center gap-2.5 transition-all hover:bg-[#162234] mb-2">
      <el-icon class="text-gray-400 text-sm shrink-0">
        <Document />
      </el-icon>
      <div class="text-gray-200 font-medium truncate">
        巴林乌代德基地JP-8油料补给异常规模
      </div>
    </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Warning } from "@element-plus/icons-vue";
// import { Graph, type GraphData } from "@antv/g6";
// 引入 Element Plus 内置图标
// import {
//   Connection,
//   Opportunity as Radar,
//   Camera,
//   Picture,
//   Document,
// } from "@element-plus/icons-vue";
import { useAnalysisStore } from "@/store/modules/analysisStore";
import { useAgentStore } from "@/store/modules/agentStore";
import DetailSectionAccordion from "@/components/DetailSectionAccordion.vue";
const store = useAnalysisStore();
const agentStore = useAgentStore();

// 选中节点的 nodeData / confidence 展示用计算属性
const normalizeObjectLikeValue = (value: unknown): unknown => {
  if (value == null) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return value;

    try {
      const parsed = JSON.parse(trimmed);
      return normalizeObjectLikeValue(parsed);
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeObjectLikeValue(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, any>).map(([key, item]) => [
        key,
        normalizeObjectLikeValue(item),
      ])
    );
  }

  return value;
};

const resultDataText = computed<Record<string, any>>(() => {
  const nd = store.selectedNode?.nodeData;
  if (nd == null) return {};

  try {
    const obj = typeof nd === "string" ? JSON.parse(nd) : nd;
    const normalized = normalizeObjectLikeValue(obj);
    if (normalized && typeof normalized === "object" && !Array.isArray(normalized)) {
      return normalized as Record<string, any>;
    }
    return { value: normalized };
  } catch {
    return { value: typeof nd === "string" ? nd : String(nd) };
  }
});
const nodeConfidenceText = computed(() => {
  const c = store.selectedNode?.confidence;
  if (c == null || !Number.isFinite(Number(c))) return "N/A";
  return Math.round(Number(c)) + "%";
});

// 当前选中节点是否为意图节点（控制"方案画像分析"按钮可用性）
const isIntentSelected = computed(() => {
  const node = store.selectedNode;
  return !!node && (node.type === "Intent" || node._type === "Intent");
});

const OUTPUT_FIELD_LABELS: Record<string, string> = {
  name: "事件名称",
  title: "标题",
  type: "事件类型",
  asset_type: "资产类型",
  location: "地理位置",
  relatedEntities: "关联实体",
  source: "情报来源",
  threatLevel: "威胁度",
  threatScore: "威胁度",
  deviationScore: "偏离度",
  confidence: "置信度",
  analysisReason: "研判理由",
  description: "描述",
  analysis: "分析",
  finding: "发现",
  report: "报告",
};

const outputJsonEntries = computed<Array<{ key: string; label: string; value: string }>>(
  () => {
    const obj = resultDataText.value;
    if (!obj) return [];
    const score = (obj as Record<string, any>).threatScore;
    const scoreText =
      typeof score === "number" && Number.isFinite(score)
        ? String(Math.round(score * 10) / 10)
        : null;
    return Object.entries(obj)
      .filter(
        ([k, v]) =>
          k !== "summary" &&
          k !== "details" &&
          k !== "threatScore" &&
          v !== null &&
          v !== undefined &&
          String(v).trim() !== ""
      )
      .map(([k, v]) => {
        let value: string = typeof v === "object" ? JSON.stringify(v) : String(v);
        if (k === "threatLevel" && scoreText) {
          const s = String(v).trim();
          value = /^\d+(\.\d+)?$/.test(s)
            ? ` ${scoreText}`
            : `${s}（${scoreText}）`;
        }
        return { key: k, label: OUTPUT_FIELD_LABELS[k] || k, value };
      });
  }
);

// const activeCollapse = ref(["evidence-1"]);
// const g6Container = ref<HTMLDivElement | null>(null);
// let graphInstance: Graph | null = null;

// 初始化 AntV G6 v5 图表
/*
const initG6Graph = () => {
  if (!g6Container.value) return;

  const width = g6Container.value.clientWidth || 420;
  const height = g6Container.value.clientHeight || 240;

  // 定义图表数据 (节点规范完全适配 G6 v5 格式)
  const graphData: GraphData = {
    nodes: [
      // 主武器/载具节点
      {
        id: "f35i",
        style: {
          x: 45,
          y: 115,
          size: 28,
          fill: "#0284c7",
          stroke: "#38bdf8",
          lineWidth: 2,
          labelText: "F-35I",
          labelPosition: "bottom",
          labelFill: "#94a3b8",
          labelFontSize: 10,
          labelFontWeight: "bold",
          labelDy: 4,
        },
      },
      {
        id: "gbu31",
        style: {
          x: 135,
          y: 65,
          size: 24,
          fill: "#0284c7",
          stroke: "#38bdf8",
          lineWidth: 1,
          labelText: "GBU-31(V)3/B\n(精确制导钻地弹)",
          labelPosition: "bottom",
          labelFill: "#e2e8f0",
          labelFontSize: 9,
          labelDy: 4,
        },
      },
      {
        id: "mk84",
        style: {
          x: 135,
          y: 165,
          size: 24,
          fill: "#0284c7",
          stroke: "#38bdf8",
          lineWidth: 1,
          labelText: "Mk-84爆破弹",
          labelPosition: "bottom",
          labelFill: "#e2e8f0",
          labelFontSize: 9,
          labelDy: 4,
        },
      },
      // 右侧末端属性指标节点
      {
        id: "attr1",
        style: {
          x: 250,
          y: 35,
          size: 6,
          fill: "#38bdf8",
          labelText: "钻地弹",
          labelPosition: "right",
          labelFill: "#94a3b8",
          labelFontSize: 9,
          labelDx: 4,
        },
      },
      {
        id: "attr2",
        style: {
          x: 250,
          y: 85,
          size: 6,
          fill: "#38bdf8",
          labelText: "穿透6m混凝土",
          labelPosition: "right",
          labelFill: "#94a3b8",
          labelFontSize: 9,
          labelDx: 4,
        },
      },
      {
        id: "attr3",
        style: {
          x: 330,
          y: 85,
          size: 6,
          fill: "#38bdf8",
          labelText: "地下加固设施",
          labelPosition: "right",
          labelFill: "#94a3b8",
          labelFontSize: 9,
          labelDx: 4,
        },
      },
      {
        id: "attr4",
        style: {
          x: 250,
          y: 135,
          size: 6,
          fill: "#38bdf8",
          labelText: "爆破弹",
          labelPosition: "right",
          labelFill: "#94a3b8",
          labelFontSize: 9,
          labelDx: 4,
        },
      },
      {
        id: "attr5",
        style: {
          x: 250,
          y: 175,
          size: 6,
          fill: "#38bdf8",
          labelText: "表面爆炸",
          labelPosition: "right",
          labelFill: "#94a3b8",
          labelFontSize: 9,
          labelDx: 4,
        },
      },
      {
        id: "attr6",
        style: {
          x: 330,
          y: 175,
          size: 6,
          fill: "#38bdf8",
          labelText: "地面目标",
          labelPosition: "right",
          labelFill: "#94a3b8",
          labelFontSize: 9,
          labelDx: 4,
        },
      },
      {
        id: "attr7",
        style: {
          x: 250,
          y: 215,
          size: 6,
          fill: "#38bdf8",
          labelText: "地面目标",
          labelPosition: "right",
          labelFill: "#94a3b8",
          labelFontSize: 9,
          labelDx: 4,
        },
      },
    ],
    edges: [
      // 基础属性关联线
      {
        source: "f35i",
        target: "gbu31",
        style: {
          labelText: "技能",
          stroke: "#334155",
          lineWidth: 1.2,
          labelFill: "#64748b",
          labelFontSize: 9,
        },
      },
      {
        source: "f35i",
        target: "mk84",
        style: {
          labelText: "技能",
          stroke: "#334155",
          lineWidth: 1.2,
          labelFill: "#64748b",
          labelFontSize: 9,
        },
      },
      {
        source: "gbu31",
        target: "attr1",
        style: {
          labelText: "类型",
          stroke: "#334155",
          lineWidth: 1.2,
          labelFill: "#64748b",
          labelFontSize: 9,
        },
      },
      {
        source: "gbu31",
        target: "attr2",
        style: {
          labelText: "效果",
          stroke: "#334155",
          lineWidth: 1.2,
          labelFill: "#64748b",
          labelFontSize: 9,
        },
      },
      {
        source: "attr2",
        target: "attr3",
        style: { stroke: "#334155", lineWidth: 1.2 },
      },
      {
        source: "mk84",
        target: "attr4",
        style: {
          labelText: "类型",
          stroke: "#334155",
          lineWidth: 1.2,
          labelFill: "#64748b",
          labelFontSize: 9,
        },
      },
      {
        source: "mk84",
        target: "attr5",
        style: {
          labelText: "效果",
          stroke: "#334155",
          lineWidth: 1.2,
          labelFill: "#64748b",
          labelFontSize: 9,
        },
      },
      {
        source: "mk84",
        target: "attr7",
        style: {
          labelText: "目标类型",
          stroke: "#334155",
          lineWidth: 1.2,
          labelFill: "#64748b",
          labelFontSize: 9,
        },
      },
      {
        source: "attr5",
        target: "attr6",
        style: { stroke: "#334155", lineWidth: 1.2 },
      },

      // 橙色高亮冲突判定连线 (使用 G6 标签背景实现遮挡效果)
      {
        source: "attr1",
        target: "attr4",
        style: {
          stroke: "#ea580c",
          lineWidth: 2,
          labelText: "× 冲突",
          labelFill: "#ea580c",
          labelFontSize: 9,
          labelFontWeight: "bold",
          labelBackground: true,
          labelBackgroundFill: "#090f17",
          labelBackgroundRadius: 2,
          labelBackgroundPadding: [2, 4],
        },
      },
      {
        source: "attr2",
        target: "attr5",
        style: {
          stroke: "#ea580c",
          lineWidth: 2,
          labelText: "× 冲突",
          labelFill: "#ea580c",
          labelFontSize: 9,
          labelFontWeight: "bold",
          labelBackground: true,
          labelBackgroundFill: "#090f17",
          labelBackgroundRadius: 2,
          labelBackgroundPadding: [2, 4],
        },
      },
      {
        source: "attr3",
        target: "attr6",
        style: {
          stroke: "#ea580c",
          lineWidth: 2,
          labelText: "× 冲突",
          labelFill: "#ea580c",
          labelFontSize: 9,
          labelFontWeight: "bold",
          labelBackground: true,
          labelBackgroundFill: "#090f17",
          labelBackgroundRadius: 2,
          labelBackgroundPadding: [2, 4],
        },
      },
    ],
  };

  // 实例化图表
  graphInstance = new Graph({
    container: g6Container.value,
    width,
    height,
    // v5 内置交互行为映射
    behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
    autoFit: "view",
  });
  graphInstance.setData(graphData);
  // 执行渲染
  graphInstance.render();
};
*/
const planAnalysis = async () => {
  const selectedIntents = store.rawNodes.filter(
    (n: any) => n.type === "Intent" && n._selected
  ).map((n: any) => n.id)
  const intentIds = selectedIntents.length > 0 ? selectedIntents : [store.selectedNode?.id]
  if (!intentIds[0]) return
  agentStore.setCurrentTaskType("蓝方方案")
  await store.proceedToBluePlan(intentIds)
};
// onMounted(() => {
//   initG6Graph();
// });
//
// onUnmounted(() => {
//   // 销毁实例，防止内存泄漏
//   if (graphInstance) {
//     graphInstance.destroy();
//   }
// });
</script>

<style scoped>
.glow-text {
  text-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
}

.tracking-wide {
  letter-spacing: 0.05em;
}

/* 深度修改 Element Plus Collapse 样式以完美复刻暗黑军工UI */
:deep(.custom-collapse-panel) {
  border: 1px solid #1a2b44 !important;
  background-color: #111925 !important;
  border-radius: 4px;
  overflow: hidden;
}

:deep(.custom-collapse-panel .el-collapse-item__header) {
  background-color: #111925 !important;
  color: #e2e8f0 !important;
  border-bottom: none !important;
  height: auto !important;
  padding: 10px 12px !important;
  line-height: 1.6 !important;
}

:deep(.custom-collapse-panel .el-collapse-item__wrap) {
  background-color: transparent !important;
  border-bottom: none !important;
}

:deep(.custom-collapse-panel .el-collapse-item__content) {
  padding: 0 !important;
  color: #94a3b8 !important;
}

:deep(.custom-collapse-panel .el-collapse-item__arrow) {
  color: #64748b !important;
  margin-left: 4px !important;
}

/* 自定义纤细低调的滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #080d16;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #334155;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
