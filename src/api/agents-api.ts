import { requestAPI } from "@/utils/http/request";
import type {
  AgentDefinition,
  AgentDefinitionFileContent,
  CreateTaskParams,
  TaskInstance,
  TaskDetailsResponse,
  TaskNodeResult,
  CreateChildNodeParams,
  InformationItem,
  WorkflowPreviewDTO,
  AnomalyRank,
  IntelligenceReport,
  ResponsePlan,
  EvaluationReport,
  ResponseDefensePlan,
  TaskFlowInformations,
} from "@/types/agent";

// ==========================================
// 一、 Agent 管理接口
// ==========================================

/** 1. 获取 Agent 列表 */
export const getAgentList = () => {
  const url = `/api/agents`;
  return requestAPI.get<AgentDefinition[]>(url);
};

/** 2. 根据 ID 获取指定 Agent 的详细信息 */
export const getAgentById = (id: number | string) => {
  const url = `/api/agents/${id}`;
  return requestAPI.get<AgentDefinition>(url);
};

/** 3. 注册一个新的 Agent 定义 */
export const createAgent = (data: Partial<AgentDefinition>) => {
  const url = `/api/agents`;
  return requestAPI.post<AgentDefinition>(url, data);
};

/** 4. 更新指定 Agent 的定义信息 */
export const updateAgent = (id: number | string, data: AgentDefinition) => {
  const url = `/api/agents/${id}`;
  return requestAPI.put<AgentDefinition>(url, data);
};

/** 5. 删除指定 Agent */
export const deleteAgent = (id: number | string) => {
  const url = `/api/agents/${id}`;
  return requestAPI.delete<void>(url);
};

/** 6. 切换 Agent 的启用/禁用状态 */
export const toggleAgentStatus = (id: number | string) => {
  const url = `/api/agents/${id}/toggle`;
  return requestAPI.post<void>(url);
};

/** 7. 获取 Agent 的 Markdown 定义文件内容 */
export const getAgentDefinition = (id: number | string) => {
  const url = `/api/agents/${id}/definition`;
  return requestAPI.get<AgentDefinitionFileContent>(url);
};

// ==========================================
// 二、 任务 management 接口
// ==========================================

/** 1. 创建一个新的深度扫描任务 */
export const createTask = (data: CreateTaskParams) => {
  const url = `/api/tasks`;
  return requestAPI.post<TaskInstance>(url, data);
};

/** 2. 获取所有任务实例 */
export const getTaskList = () => {
  const url = `/api/tasks`;
  return requestAPI.get<TaskInstance[]>(url);
};

/** 3. 获取指定任务的详细信息（含等待处理节点） */
export const getTaskDetails = (id: number | string) => {
  const url = `/api/tasks/${id}`;
  return requestAPI.get<TaskDetailsResponse>(url);
};

/** 4. 触发执行指定任务的完整工作流 */
export const executeTaskWorkflow = (id: number | string) => {
  const url = `/api/tasks/${id}/execute`;
  return requestAPI.post<void>(url);
};

/** 5. 获取任务下所有执行节点的结果 */
export const getTaskNodes = (id: number | string) => {
  const url = `/api/tasks/${id}/nodes`;
  return requestAPI.get<TaskNodeResult[]>(url);
};

/** 6. 获取任务节点的链式结果（按执行顺序） */
export const getTaskNodeChain = (id: number | string) => {
  const url = `/api/tasks/${id}/nodes/chain`;
  return requestAPI.get<TaskNodeResult[]>(url);
};

/** 7. 获取指定父节点下的所有子节点 */
export const getChildNodes = (
  id: number | string,
  parentId: number | string,
) => {
  const url = `/api/tasks/${id}/nodes/${parentId}/children`;
  return requestAPI.get<TaskNodeResult[]>(url);
};

/** 8. 为指定父节点创建子节点（人机协作场景） */
export const createChildNode = (
  taskId: number | string,
  parentId: number | string,
  data: CreateChildNodeParams,
) => {
  const url = `/api/tasks/${taskId}/nodes/${parentId}/children`;
  return requestAPI.post<TaskNodeResult[]>(url, data);
};

/** 9. 获取任务收集的所有信息条目 */
export const getTaskInformationItems = (id: number | string) => {
  const url = `/api/tasks/${id}/information-items`;
  return requestAPI.get<InformationItem[]>(url);
};

/** 10. 根据条目 ID 获取单个信息条目 */
export const getInformationItemById = (itemId: number | string) => {
  const url = `/api/tasks/items/${itemId}`;
  return requestAPI.get<InformationItem>(url);
};

/** 11. 预览完整的工作流结构 */
export const previewWorkflow = () => {
  const url = `/api/tasks/workflow/preview`;
  return requestAPI.get<WorkflowPreviewDTO[]>(url);
};

/** 12. 获取任务的异常排名/评分数据 */
export const getTaskAnomalyRanks = (id: number | string) => {
  const url = `/api/tasks/${id}/anomaly-ranks`;
  return requestAPI.get<AnomalyRank[]>(url);
};

/** 13. 获取任务生成的所有情报分析报告 */
export const getTaskReports = (id: number | string) => {
  const url = `/api/tasks/${id}/reports`;
  return requestAPI.get<IntelligenceReport[]>(url);
};
/** 14. 获取任务的所有响应计划 */
export const getTaskActionPlans = (id: number | string) => {
  const url = `/api/tasks/${id}/action-plans`;
  return requestAPI.get<ResponsePlan[]>(url);
};
/** 15. 获取任务的所有响应计划 */
export const getTaskPlans = (id: number | string) => {
  const url = `/api/tasks/${id}/plans`;
  return requestAPI.get<ResponseDefensePlan[]>(url);
};

/** 16. 获取任务的所有评估报告（对响应计划的评估） */
export const getTaskEvaluations = (id: number | string) => {
  const url = `/api/tasks/${id}/evaluations`;
  return requestAPI.get<EvaluationReport[]>(url);
};

/** 17. 获取 特定任务 特定事件 特定任务类型 的任务工作流（ IntelligenceItem ） */
export const getTaskFlowInformations = (
  taskId: number,
  eventId: number,
  taskType: string,
) => {
  const url = `/api/tasks/task-flow?taskId=${taskId}&eventId=${eventId}&taskType=${taskType}`;
  return requestAPI.get<TaskFlowInformations[]>(url);
};
