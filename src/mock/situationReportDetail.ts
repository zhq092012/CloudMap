/**
 * 综合态势报告详情弹窗 Mock（左侧长文档 + 右侧元数据）。
 */

/** 报告侧边栏元数据 */
export interface SituationReportDetailMeta {
  reportId: string;
  title: string;
  generatedAt: string;
  confidencePct: number;
  coverage: string;
  period: string;
  /** 核心要点 */
  corePoints: string[];
}

/** 建议行动优先级 */
export type ReportActionPriority = "P1" | "P2" | "P3";

/** 建议行动行 */
export interface SituationReportActionRow {
  id: string;
  priority: ReportActionPriority;
  tag: string;
  title: string;
  description: string;
  relatedObject: string;
  status: string;
  statusRef?: string;
  /** 执行 | 建议采纳 */
  actionMode: "execute" | "adopt";
}

/** 关联依据条目 */
export interface SituationReportEvidence {
  id: string;
  summary: string;
  target: string;
}

/** 文档段落节 */
export interface ReportDocParagraph {
  kind: "paragraph";
  number: string;
  title: string;
  text: string;
}

/** 文档列表节 */
export interface ReportDocBullets {
  kind: "bullets";
  number: string;
  title: string;
  items: string[];
}

/** 文档表格节 */
export interface ReportDocTable {
  kind: "table";
  number: string;
  title: string;
  columns: string[];
  rows: string[][];
}

/** 建议行动节 */
export interface ReportDocActions {
  kind: "actions";
  number: string;
  title: string;
  rows: SituationReportActionRow[];
}

/** 关联对象节 */
export interface ReportDocEvidence {
  kind: "evidence";
  number: string;
  title: string;
  countLabel: string;
  items: SituationReportEvidence[];
}

/** 左侧文档块联合类型 */
export type SituationReportDocSection =
  | ReportDocParagraph
  | ReportDocBullets
  | ReportDocTable
  | ReportDocActions
  | ReportDocEvidence;

/** 完整报告详情 */
export interface SituationReportDetailMock {
  meta: SituationReportDetailMeta;
  sections: SituationReportDocSection[];
}

export const situationReportDetailMock: SituationReportDetailMock = {
  meta: {
    reportId: "RPT-20261021-1430",
    title: "10-21 14:30 中东战区综合态势报告",
    generatedAt: "10-21 14:30",
    confidencePct: 86,
    coverage: "中东战区 · 扎哈尔 / 阿巴斯港 / 霍尔木兹",
    period: "10-15 ~ 10-21",
    corePoints: [
      "扎哈尔方向 7 项指标同步越限，ISR 侦察强度连续 6 日上升，建议提升该区监视等级。",
      "阿巴斯港低空抵近活动 5 日内持续，岸基防空前推部署与海上编队间距缩短。",
      "霍尔木兹海峡 AIS 静默船次由 3 增至 22/日，航运节奏与历史常态偏离明显。",
      "西海岸雷达站受干扰数量增至 9 个，电子战活动范围向东延伸约 120km。",
    ],
  },
  sections: [
    {
      kind: "paragraph",
      number: "1.0",
      title: "总体态势判断",
      text:
        "统计周期内中东战区综合态势由「紧张」向「高度紧张」演进。扎哈尔—阿巴斯港轴线仍是主矛盾方向，红方在侦察、电子战与前沿部署上持续加压；蓝方保持 ISR 优势但反导与机动投送节奏略滞后。建议以潜在异常研判为先导，联动热点追踪与冲突监控分级响应。",
    },
    {
      kind: "table",
      number: "1.1",
      title: "区域态势等级",
      columns: ["区域", "态势等级", "主要威胁", "变化程度"],
      rows: [
        ["扎哈尔", "严重", "前沿兵力集结、空域对峙", "↑ 显著上升"],
        ["阿巴斯港", "高", "岸基防空前推、舰艇集结", "↑ 上升"],
        ["霍尔木兹", "中高", "AIS 异常、航道挤压", "→ 持平偏升"],
        ["西海岸", "中", "雷达干扰、电子压制", "↑ 上升"],
      ],
    },
    {
      kind: "bullets",
      number: "1.2",
      title: "力量部署变化",
      items: [
        "扎哈尔外围新增地面装甲分队 2 个营级单位，后勤车队频次 +35%。",
        "阿巴斯港东岸 S-300 阵地前推 18km，与 10-18 卫星影像一致。",
        "霍尔木兹以南护航编队由 4 艘增至 7 艘，间距缩短至 12 海里以内。",
        "西海岸 3 套搜索雷达进入高戒备，备用阵地开工迹象明显。",
      ],
    },
    {
      kind: "bullets",
      number: "1.3",
      title: "装备与系统状态",
      items: [
        "区域雷达覆盖综合指数 92%，较上周 +4。",
        "旗舰通信链路可用率 97%，卫星备份通道切换 2 次。",
        "陆基防空弹药战备率 78%，近岸导弹单元轮换延迟 6 小时。",
      ],
    },
    {
      kind: "bullets",
      number: "1.4",
      title: "侦察情报活动",
      items: [
        "扎哈尔方向高强度 ISR 架次 14 架次/日，较基线 +62%。",
        "商业卫星过境分析锁定 5 处新建掩体与 2 处油料集结点。",
        "开源渠道显示社交媒体后勤招募信息 3 条，置信度 72%。",
      ],
    },
    {
      kind: "bullets",
      number: "1.5",
      title: "电子战活动",
      items: [
        "西海岸雷达站窄带干扰事件 9 起，峰值时段集中于 02:00–05:00。",
        "VHF 频段异常噪声区向东扩展，影响友方数据链时隙约 11%。",
        "纳坦兹方向未检出大规模压制，但局部跳频密度上升。",
      ],
    },
    {
      kind: "bullets",
      number: "1.6",
      title: "后勤与保障",
      items: [
        "马什哈德—边境公路重卡流量 +28%，与地面部队集结时间窗重合。",
        "阿巴斯港油品卸载量周内 +19%，储罐周转加快。",
        "前沿医疗后送编队待命等级由 III 提升至 II。",
      ],
    },
    {
      kind: "table",
      number: "1.7",
      title: "潜在异常研判调整",
      columns: ["编号", "类型", "置信度", "处置建议"],
      rows: [
        ["PA-20261021-004", "ISR 强化", "88%", "优先确认并提升监视"],
        ["PA-20261021-011", "后勤用电", "71%", "复核后建议排除"],
        ["PA-20261021-003", "地面集结", "85%", "维持待研判并定位"],
        ["ANO-20261021-003", "已确认异常", "91%", "纳入冲突升级跟踪"],
      ],
    },
    {
      kind: "bullets",
      number: "1.8",
      title: "威胁评估要点",
      items: [
        "空域对峙升级概率 7 日内评估为 42%（较上期 +9）。",
        "岸基火力覆盖重叠区扩大，商船误闯风险上升。",
        "电子战与物理打击组合施压可能在黄昏窗口出现。",
      ],
    },
    {
      kind: "table",
      number: "1.9",
      title: "战力能力变化",
      columns: ["维度", "蓝方得分", "变化", "归因"],
      rows: [
        ["侦察监视", "88", "↑ 12", "ISR 架次与多源融合增强"],
        ["电子战", "81", "↑ 9", "干扰源识别与反制预案完善"],
        ["持续保障", "58", "↓ 5", "前沿油料补给节奏放缓"],
        ["指挥控制", "86", "→ 1", "链路稳定，决策时延略降"],
      ],
    },
    {
      kind: "actions",
      number: "1.10",
      title: "建议行动",
      rows: [
        {
          id: "act-1",
          priority: "P1",
          tag: "监视升级",
          title: "提升扎哈尔方向综合监视等级至 LEVEL-2",
          description:
            "联动热点追踪与异常 PA-20261021-004，开启 30 分钟粒度轨迹复核。",
          relatedObject: "扎哈尔综合监视区 MON-ZHR-01",
          status: "待执行",
          statusRef: "REC-001",
          actionMode: "execute",
        },
        {
          id: "act-2",
          priority: "P2",
          tag: "冲突管控",
          title: "对外围空域对峙事件启动升级研判流程",
          description:
            "关联冲突事件 CE-20261021-08，同步空域警告与友方编队间距规则。",
          relatedObject: "扎哈尔外围空域 CE-20261021-08",
          status: "进行中",
          statusRef: "REC-002",
          actionMode: "execute",
        },
        {
          id: "act-3",
          priority: "P3",
          tag: "资源投入",
          title: "为西海岸雷达站补充电子防护资源",
          description:
            "按模板 EWO-RES-07 调拨滤波与备用天线单元，48 小时内完成前推部署复核。",
          relatedObject: "西海岸预警雷达站 FAC-RADAR-045",
          status: "待执行",
          statusRef: "REC-005",
          actionMode: "execute",
        },
        {
          id: "act-4",
          priority: "P3",
          tag: "建议采纳",
          title: "保持全区域 60s 情报轮询节奏不变",
          description:
            "当前轮询负载在阈值内，避免短期调整引入情报空窗；下期报告再评估。",
          relatedObject: "（通用建议，不指向具体对象）",
          status: "待执行",
          actionMode: "adopt",
        },
      ],
    },
    {
      kind: "evidence",
      number: "1.11",
      title: "关联对象与依据",
      countLabel: "12 / 12",
      items: [
        {
          id: "REC-001",
          summary: "复核并研判扎哈尔高频 ISR 侦察潜在异常",
          target: "PA-20261021-004",
        },
        {
          id: "REC-002",
          summary: "扎哈尔外围空域对峙纳入冲突升级跟踪",
          target: "CE-20261021-08",
        },
        {
          id: "REC-003",
          summary: "排除纳坦兹夜间用电异常（置信不足）",
          target: "PA-20261021-011",
        },
        {
          id: "REC-004",
          summary: "霍尔木兹 AIS 静默聚集模式与历史同期对比",
          target: "HS-AIS-CLUSTER-19",
        },
        {
          id: "REC-005",
          summary: "为西海岸雷达站补充电子防护资源",
          target: "FAC-RADAR-045",
        },
        {
          id: "REC-006",
          summary: "阿巴斯港岸基防空前推阵地卫星交叉验证",
          target: "FAC-AD-ABB-02",
        },
      ],
    },
  ],
};