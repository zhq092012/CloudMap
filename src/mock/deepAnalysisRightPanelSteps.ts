import type { DeepAnalysisStepPanelContentByKey } from "@/types/deepAnalysisRightPanel";

const STEP_SUBTITLE = "步骤详情（数据层）— 操作入口见页面顶部步骤条";
const TABLES_HINT =
  "列数 ≤ 5 且行数 ≤ 8 的短表在栏内就地展开，宽表走主区居中弹窗";

/**
 * 八步「步骤」Tab Mock：结构固定（六段），文案与关键字段按设计稿 1~8 步区分。
 * key 与 {@link DEEP_ANALYSIS_UI_STEPS} 的 key 对齐。
 */
export const deepAnalysisRightPanelStepMock: DeepAnalysisStepPanelContentByKey = {
  intent_infer: {
    displayIndex: 1,
    stepTitle: "意图推断",
    phaseStatus: "awaiting",
    headline: "意图推断",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "根节点数", value: "3（2 个独立异常 + 1 个异常簇）" },
          { label: "证据条目", value: "7 条" },
          { label: "基线快照", value: "BP-20261021-001 ~ 003" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "按根节点数自适应分层穷举" },
          { text: "单根 → 组内组合 → 跨组组合 → 历史类比" },
          { text: "层间生长间隔 300ms" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "意图节点", value: "12 个（条数不设上限，按质量保留）" },
          { label: "保留意图", value: "7 个" },
          { label: "剪枝候选", value: "5 个" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "新增", text: "3 个根节点" },
          { emphasis: "新增", text: "12 个意图节点（分层 4 层）" },
          { text: "无虚线菱形、无种子节点" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["调度 Agent", "证据聚合 Agent", "意图推断 Agent"],
        pendingSuffix: "方案生成 Agent（待启动）",
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "分层穷举结果", rowCount: 4, colCount: 4 },
          { title: "根节点贡献度明细", rowCount: 3, colCount: 4 },
        ],
      },
    ],
  },
  intent_prune: {
    displayIndex: 2,
    stepTitle: "意图剪枝",
    phaseStatus: "awaiting",
    headline: "意图剪枝",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "剪枝候选", value: "5 个意图节点" },
          { label: "质量阈值", value: "置信度 < 62% 或贡献度 < 15%" },
          { label: "本轮已确认", value: "0 个" },
          { label: "人工覆写", value: "0 条" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "按候选队列生成剪枝理由与证据摘要" },
          { text: "支持栏内批量确认或对象 Tab 单点剪枝" },
          { text: "剪枝结果写回图谱 deleteStatus 与 deleteReason" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "已剪枝", value: "待确认（预估 3 个）" },
          { label: "保留意图", value: "7 个" },
          { label: "待复核", value: "2 个低置信候选" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "标记", text: "剪枝候选节点虚线边框" },
          { emphasis: "更新", text: "确认后节点置灰并保留追溯边" },
          { text: "裁剪后意图层数由 4 层收敛为 3 层（预估）" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["质量判定 Agent", "剪枝建议 Agent", "归因回写 Agent"],
        pendingSuffix: "关联扩展 Agent（待启动）",
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "剪枝候选清单", rowCount: 5, colCount: 5 },
          { title: "剪枝理由与证据对照", rowCount: 5, colCount: 4 },
        ],
      },
    ],
  },
  relation_expand: {
    displayIndex: 3,
    stepTitle: "关联扩展",
    phaseStatus: "awaiting",
    headline: "关联扩展",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "保留意图", value: "7 个" },
          { label: "情报包", value: "REL-20261021-A ~ C" },
          { label: "扩展深度", value: "2 跳" },
          { label: "战例库", value: "近 180 天同类事件 14 条" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "按意图节点拉取关联实体、装备编组与历史战例" },
          { text: "实体对齐后去重合并" },
          { text: "增量边写入图谱，主区同步增量布局" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "新增关联边", value: "18 条（预估）" },
          { label: "新增实体", value: "6 个" },
          { label: "命中战例", value: "2 条" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "增量", text: "关联扩展子图挂载至意图节点下层" },
          { emphasis: "新增", text: "战例类比虚线关联 2 条" },
          { text: "根节点 — 意图边保持不变" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["关联挖掘 Agent", "实体对齐 Agent", "图谱增量 Agent"],
        pendingSuffix: "方案生成 Agent（待启动）",
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "关联扩展候选", rowCount: 8, colCount: 5 },
          { title: "战例命中对照", rowCount: 2, colCount: 6 },
        ],
      },
    ],
  },
  plan_generate: {
    displayIndex: 4,
    stepTitle: "方案生成",
    phaseStatus: "awaiting",
    headline: "方案生成",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "目标意图", value: "已勾选 2 个（H3、H5）" },
          { label: "方案模板", value: "蓝方攻击默认模板 v3" },
          { label: "约束集", value: "时空窗口 72h · 资源档位 B" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "触发生成 Attack 节点与作战要素挂接" },
          { text: "并行走质量评估与冲突检测" },
          { text: "冲突项回流至图谱标注" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "Attack 节点", value: "3 个（待确认后继续）" },
          { label: "平均置信度", value: "68%" },
          { label: "冲突项", value: "1 处待人工裁决" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "新增", text: "3 个 Attack 方案节点" },
          { emphasis: "新增", text: "意图 → 方案 挂接边 2 条" },
          { text: "冲突节点橙色描边" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["方案生成 Agent", "冲突检测 Agent", "质量评估 Agent"],
        pendingSuffix: "方案画像 Agent（待启动）",
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "生成任务队列", rowCount: 3, colCount: 4 },
          { title: "方案要素矩阵", rowCount: 6, colCount: 8 },
        ],
      },
    ],
  },
  plan_profile: {
    displayIndex: 5,
    stepTitle: "方案画像",
    phaseStatus: "awaiting",
    headline: "方案画像",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "Attack 节点", value: "已选方案 1 个（ATT-α）" },
          { label: "画像维度", value: "目标 / 窗口 / 资源 / 约束 / 风险" },
          { label: "参考意图", value: "H5" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "汇总画像维度并生成可读摘要" },
          { text: "对齐战例库输出相似度" },
          { text: "摘要字段回填 Attack 节点" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "画像报告", value: "1 份（RPT-ATT-α-001）" },
          { label: "完整度", value: "92%" },
          { label: "战例相似度", value: "81%" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "更新", text: "Attack 节点 summary / nodeData" },
          { text: "画像维度徽标显示于节点副标题" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["画像编排 Agent", "报告渲染 Agent", "相似战例 Agent"],
        pendingSuffix: "方案核验 Agent（待启动）",
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "方案画像维度", rowCount: 6, colCount: 3 },
          { title: "资源消耗估算", rowCount: 4, colCount: 4 },
        ],
      },
    ],
  },
  plan_verify: {
    displayIndex: 6,
    stepTitle: "方案核验",
    phaseStatus: "awaiting",
    headline: "方案核验",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "待核验方案", value: "1 个 Attack（ATT-α）" },
          { label: "核验规则集", value: "红蓝对抗规则 v2.1" },
          { label: "风险阈值", value: "可行性 ≥ 70%" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "规则校验：资源、窗口、可达性、保密约束" },
          { text: "可行性评分与项级不通过原因" },
          { text: "核验状态写回节点元数据" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "核验结论", value: "有条件通过" },
          { label: "可行性", value: "74%" },
          { label: "不通过项", value: "1 条（保密窗口重叠）" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "标记", text: "核验通过绿标 / 待修改橙标" },
          { text: "不通过项挂载批注节点 1 个" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["核验 Agent", "可行性评分 Agent"],
        pendingSuffix: "红方防御 Agent（待启动）",
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "核验检查项", rowCount: 8, colCount: 3 },
          { title: "不通过项明细", rowCount: 1, colCount: 5 },
        ],
      },
    ],
  },
  red_defense: {
    displayIndex: 7,
    stepTitle: "红方防御",
    phaseStatus: "awaiting",
    headline: "红方防御",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "蓝方方案", value: "1 个（ATT-α，已核验）" },
          { label: "红方资源池", value: "防御编组 B 档" },
          { label: "推演窗口", value: "与蓝方方案对齐 72h" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "生成 Defense 节点与反制链路" },
          { text: "蓝红节点双边挂接" },
          { text: "对抗推演时间步长 1h" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "Defense 节点", value: "2 个" },
          { label: "反制覆盖率", value: "76%" },
          { label: "残余风险", value: "中" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "新增", text: "Defense 子图 2 节点 4 边" },
          { emphasis: "新增", text: "蓝 — 红 对抗关联边" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["红方防御 Agent", "对抗推演 Agent"],
        pendingSuffix: "对比筛选 Agent（待启动）",
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "防御对策矩阵", rowCount: 5, colCount: 5 },
          { title: "对抗推演时序", rowCount: 6, colCount: 4 },
        ],
      },
    ],
  },
  compare_filter: {
    displayIndex: 8,
    stepTitle: "对比筛选",
    phaseStatus: "awaiting",
    headline: "对比筛选",
    subtitle: STEP_SUBTITLE,
    sections: [
      {
        kind: "keyValue",
        title: "输入",
        rows: [
          { label: "Evaluation 候选", value: "3 个方案组合" },
          { label: "筛选规则", value: "置信度 + 风险 + 推荐位" },
          { label: "定稿策略", value: "Top1 推荐 + Top2 备选" },
        ],
      },
      {
        kind: "bullets",
        title: "处理",
        items: [
          { text: "多维度打分与排序" },
          { text: "方案对比矩阵生成" },
          { text: "推荐位写回 Evaluation 节点" },
        ],
      },
      {
        kind: "keyValue",
        title: "输出",
        rows: [
          { label: "推荐方案", value: "EVL-001（推荐）" },
          { label: "备选方案", value: "EVL-002" },
          { label: "定稿状态", value: "待「完成」确认" },
        ],
      },
      {
        kind: "bullets",
        title: "图谱变化",
        items: [
          { emphasis: "标记", text: "推荐 Evaluation 高亮与 ★ 徽标" },
          { text: "非推荐节点弱化展示" },
        ],
      },
      {
        kind: "pipeline",
        title: "副屏链路",
        agents: ["对比筛选 Agent", "定稿 Agent", "归档 Agent"],
      },
      {
        kind: "tables",
        title: "明细表",
        hint: TABLES_HINT,
        entries: [
          { title: "方案对比矩阵", rowCount: 6, colCount: 6 },
          { title: "推荐定稿摘要", rowCount: 3, colCount: 4 },
        ],
      },
    ],
  },
};