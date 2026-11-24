/**
 * 中部态势条「威胁评估」Mock（接口未就绪时展示，可与 store 数据合并）。
 */

/** 威胁评估列表项 */
export interface SituationStripThreatRow {
  id: string;
  name: string;
  threatLabel: string;
  confidencePct: number;
  score: number;
}

/** 威胁评估 Mock */
export interface SituationStripThreatMock {
  total: number;
  items: SituationStripThreatRow[];
}

export const situationStripThreatMock: SituationStripThreatMock = {
  total: 23,
  items: [
    {
      id: "threat-1",
      name: "扎哈尔 ISR 侦察体系",
      threatLabel: "高威胁",
      confidencePct: 86,
      score: 86,
    },
    {
      id: "threat-2",
      name: "扎哈尔核设施活动评估",
      threatLabel: "高威胁",
      confidencePct: 82,
      score: 82,
    },
    {
      id: "threat-3",
      name: "阿巴斯港军民两用码头活动评估",
      threatLabel: "高威胁",
      confidencePct: 80,
      score: 80,
    },
  ],
};