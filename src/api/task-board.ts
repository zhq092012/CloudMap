// ============================================================
// 智能任务看板（agent 执行历史）API
// Base: /api/v1/task-board
// Backend: http://192.168.100.16:8080/api/v1/task-board
// ============================================================
import { requestAPI } from '@/utils/http/request'

export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface TaskBoardExecutionItem {
  executionId: string
  workflowId: string | null
  workflowTitle: string | null
  workflowType: string | null
  workflowStatus: string | null
  phase: number | null
  status: ExecutionStatus
  callerUserId: string | null
  currentStepIdx: number | null
  totalSteps: number | null
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  resultCount: number
  anomalies: { anomalyId: string; name: string; isOrigin: boolean }[]
  processingAnomalies: { anomalyId: string; name: string }[]
  errorMessage: string | null
}

export interface TaskBoardExecutionPage {
  total: number
  page: number
  size: number
  items: TaskBoardExecutionItem[]
}

export interface TaskBoardAnomalyInfo {
  anomalyId: string
  name: string
  isOrigin: boolean
}

export interface TaskBoardStepItem {
  stepId: string
  stepIndex: number | null
  parentStepId: string | null
  stepType: string
  agentId: string
  agentName: string | null
  sessionKey: string | null
  sourceAnomalyId: string | null
  sourceAnomalyName: string | null
  nodeId: string | null
  status: string
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  agentResultType: string | null
  resultConfidence: number | null
  resultPruned: boolean | null
  selected: boolean | null
  errorMessage: string | null
}

export interface TaskBoardStepStats {
  total: number
  running: number
  completed: number
  failed: number
}

export interface TaskBoardExecutionDetail {
  execution: {
    executionId: string
    workflowId: string | null
    phase: number | null
    status: string
    callerUserId: string | null
    businessId: string | null
    currentStepIdx: number | null
    totalSteps: number | null
    startedAt: string | null
    completedAt: string | null
    durationMs: number | null
    resultCount: number | null
    anomalyIds: string[]
    sourceNodeIds: unknown[]
    targetNodes: {
      nodeId: string
      stepId: string
      type: string
      summary: string | null
      sourceAnomalyName: string | null
    }[]
    errorMessage: string | null
    parentExecutionId: string | null
  }
  workflow: {
    workflowId: string
    title: string | null
    workflowType: string | null
    status: string | null
    currentPhase: number | null
    createdBy: string | null
    createdAt: string | null
    updatedAt: string | null
  } | null
  anomalies: TaskBoardAnomalyInfo[]
  steps: TaskBoardStepItem[]
  stats: TaskBoardStepStats
}

/** 展开步骤时懒加载既有 /api/v1/steps/{stepId}（含输入/输出 JSON） */
export interface FlowStep {
  stepId: string
  executionId: string
  stepIndex: number | null
  parentStepId: string | null
  stepType: string
  agentId: string
  sessionKey: string | null
  inputJson: string | null
  outputJson: string | null
  status: string
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface TaskBoardListParams {
  page?: number
  size?: number
  status?: ExecutionStatus
  phase?: number
  keyword?: string
}

export function listTaskBoardExecutions(params: TaskBoardListParams) {
  // requestAPI.get 的第二个参数就是 query params 对象本身（见 anomalies.ts 用法）
  return requestAPI.get<TaskBoardExecutionPage>('/api/v1/task-board/executions', params)
}

export function getTaskBoardExecution(executionId: string) {
  return requestAPI.get<TaskBoardExecutionDetail>(
    `/api/v1/task-board/executions/${encodeURIComponent(executionId)}`,
  )
}

export function getFlowStep(stepId: string) {
  return requestAPI.get<FlowStep>(`/api/v1/steps/${encodeURIComponent(stepId)}`)
}
