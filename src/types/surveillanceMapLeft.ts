/** 态势监控左栏「开源情报」列表行（由 API 文章映射而来） */
export interface MapLeftArticleRow {
  /** 文章主键，缺失时无法持久化分析结果 */
  id: number | null;
  /** 标题 */
  title: string;
  /** 情感标签 */
  sentiment: string;
  /** 发布时间 */
  publishedAt: string;
  /** 国家 */
  country: string;
  /** 区域 */
  region: string;
  /** 作者 */
  author: string;
  /** 机构 / 来源名 */
  agencyName: string;
  /** 原文链接 */
  url: string;
  /** 关键词 */
  keywords: string[];
  /** 主题 */
  topics: string[];
  /** 重要性评分 */
  importance: number | null;
  /** 正文或摘要 */
  content: string;
  /** 是否为异常（breaking）文章 */
  isBreaking: boolean;
}

/** 异常文章实时分析弹窗状态 */
export type WarningStreamState = "loading" | "streaming" | "ready" | "error";