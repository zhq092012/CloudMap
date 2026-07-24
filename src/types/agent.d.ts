// ==========================================
// 1. 基础数据模型参考
// ==========================================

import type { string } from "three/src/nodes/TSL.js";

/** Agent 定义模型 */
export interface AgentDefinition {
  id: number;
  name: string;
  displayName: string;
  description: string;
  agentType: string;
  category: string;
  modelName: string;
  skillNames: string[];
  configJson: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  stance: string; // 红方/蓝方
}

/** 任务实例模型 */
export interface TaskInstance {
  id: number;
  title: string;
  description: string;
  status: string; // PENDING, RUNNING, COMPLETED, FAILED 等
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/** 任务执行节点结果模型 */
export interface TaskNodeResult {
  id: number;
  taskId: number;
  agentId: string;
  agentName: string;
  status: string; // PENDING, RUNNING, COMPLETED, FAILED 等
  inputSummary: string;
  outputJson: string;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  sessionId: string;
  parentNodeId: number | null;
  childCount: number;
  completedChildCount: number;
  seq: number;
}

/** 任务收集的信息条目模型 */
export interface InformationItem {
  id: number;
  taskId: number;
  sourceNodeId: number;
  seq: number;
  title: string;
  content: string;
  contentCn: string;
  source: string;
  url: string;
  language: string;
  publishedAt: string;
  collectedAt: string;
  tags: string[];
  credibility: number;
  metadata: string;
  status: string;
  embedding: string;
}

/** 异常排名/评分数据模型 */
export interface AnomalyRank {
  id: number;
  taskId: number;
  sourceNodeId: number;
  itemId: number;
  dimension: string;
  score: number;
  weight: number;
  reason: string;
  detail: string;
  rank: number;
  itemTitle: string;
  date: string;
}

/** 情报分析报告模型 */
export interface IntelligenceReport {
  id: number;
  taskId: number;
  sourceNodeId: number;
  itemId: number;
  seq: number;
  title: string;
  summary: string;
  threatLevel: string;
  intentType: string;
  parentReportId: number | null;
  analysisJson: string;
  createdAt: string;
  status: string;
  deleteStatus?: string;
  deleteReason?: string;
}

/** 应急响应计划模型 */
export interface ResponsePlan {
  id: number;
  analysisJson: string;
  createdAt: string;
  intentId: number;
  itemId: number;
  seq: number;
  sourceNodeId: number;
  status: string;
  summary: string;
  taskId: number;
  threatLevel: string;
  title: string;
  deleteStatus?: string;
  deleteReason?: string;
}
export interface ResponseDefensePlan {
  contentJson: string;
  createdAt: string;
  id: number;
  intentType: string;
  reportId: number;
  seq: number;
  sourceNodeId: number;
  status: string;
  taskId: number;
  summary: string;
  title: string;
  version: string | null;
}

/** 评估报告模型 */
export interface EvaluationReport {
  id: number;
  planId: number;
  taskId: number;
  sourceNodeId: number;
  seq: number;
  contentJson: string;
  createdAt: string;
}

/** 评审内容模型 */
export interface PlanReview {
  id: number;
  planId: number;
  sourceNodeId: number;
  seq: number;
  reviewer: string;
  reviewJson: string;
  passed: boolean;
  createdAt: string;
}

/** Agent 简要信息（工作流预览嵌套） */
export interface AgentInfo {
  name: string;
  displayName: string;
  category: string;
  skills: Array<Record<string, string>>;
}

/** 工作流预览结构模型 */
export interface WorkflowPreviewDTO {
  stepOrder: number;
  stepName: string;
  description: string;
  autoExecute: boolean;
  requiresInput: boolean;
  agent: AgentInfo;
}
/** 任务流程信息 */
export interface TaskFlowInformations {
  agentId: number;
  backup: null | string;
  childNode: number | null;
  eventId: number;
  id: number;
  level: string;
  outputContent: null | string;
  parentNode: number | null;
  taskId: number;
  taskType: string;
  thinkContent: null | string;
}
// ==========================================
// 2. 接口请求体与复合响应体模型
// ==========================================

/** 获取 Agent 定义文件内容响应体 */
export interface AgentDefinitionFileContent {
  name: string;
  content: string;
  tools: string[];
  skills: Array<{
    name: string;
    content: string;
  }>;
}

/** 创建任务请求参数 */
export interface CreateTaskParams {
  title?: string;
  description?: string;
  loadLocalFiles?: boolean;
}

/** 获取任务详情响应体 */
export interface TaskDetailsResponse {
  task: TaskInstance;
  waitingNodeAgentId: string;
}

/** 选中条目对象（创建子节点用） */
export interface SelectedItem {
  itemId: number;
  field: string;
}

/** 创建子节点请求参数 */
export interface CreateChildNodeParams {
  childAgentId?: string;
  parentAgentId?: string | null;
  selectedItems: SelectedItem[];
}
