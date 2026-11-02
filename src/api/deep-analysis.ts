/**
 * API client for deep analysis workflow endpoints
 * Base: /api/v1/agent-flows
 * Backend: http://localhost:8080/api/v1/agent-flows
 */
import { requestAPI } from '@/utils/http/request'

export interface AgentFlow {
  workflowId: string
  title: string
  workflowType: string
  currentPhase: number
  status: 'PENDING' | 'RUNNING' | 'WAITING_USER' | 'COMPLETED' | 'FAILED'
  anomalyIds: string[]
  createdAt: string
  updatedAt: string
}

export interface WorkflowNode {
  nodeId: string
  parentNodeId: string | null
  nodeType: 'ORIGIN' | 'INTENT' | 'BLUE_PLAN' | 'RED_PLAN' | 'EVALUATION'
  nodeData: string
  confidence: number
  pruned: boolean
  pruneReason: string
  selected: boolean
  stepId: string
  createdAt: string
}

export interface PhaseResult {
  executionId: string
  phase: number
  status: string
  nodes: WorkflowNode[]
  startedAt: string
  completedAt: string
}

export async function listIncompleteWorkflows(): Promise<AgentFlow[]> {
  return requestAPI.get('/api/v1/agent-flows/workflows/incomplete')
}

export async function createDeepAnalysisWorkflow(anomalyIds: string[]): Promise<AgentFlow> {
  return requestAPI.post('/api/v1/agent-flows/workflow', { anomalyIds })
}

/** 向已有工作流增量补充异常（不重建工作流、不重复分析已存在异常），返回更新后的完整异常列表 */
export async function addAnomaliesToWorkflow(
  workflowId: string,
  anomalyIds: string[]
): Promise<AgentFlow> {
  return requestAPI.post(`/api/v1/agent-flows/workflow/${workflowId}/anomalies`, { anomalyIds })
}

export async function getDeepAnalysisWorkflow(workflowId: string): Promise<AgentFlow> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}`)
}

export async function selectDeepAnalysisNode(
  workflowId: string,
  nodeId: string,
  nodeType: string
): Promise<AgentFlow> {
  return requestAPI.post(`/api/v1/agent-flows/workflow/${workflowId}/select`, { nodeId, nodeType })
}

/** 批量多选：一次性选中多个节点（用于一次分析多个事件/轨迹，每个生成对应意图） */
export async function selectDeepAnalysisNodes(
  workflowId: string,
  nodeIds: string[],
  nodeType: string
): Promise<AgentFlow> {
  return requestAPI.post(`/api/v1/agent-flows/workflow/${workflowId}/select-nodes`, { nodeIds, nodeType })
}

/** 查库去重：返回已存在的意图节点(直接展示) + 尚未生成意图的 originNodeIds */
export interface IntentCheckResult {
  existingIntents: WorkflowNode[]
  uncoveredOriginNodeIds: string[]
}

export async function checkExistingIntents(
  workflowId: string,
  originNodeIds: string[]
): Promise<IntentCheckResult> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}/intents/check`, {
    originNodeIds: originNodeIds.join(','),
  })
}

/** 通用查库去重(蓝方/红方/校验阶段)：返回已有子步骤(直接展示) + 未覆盖的父节点ID */
export interface StepCheckResult {
  existingSteps: WorkflowNode[]
  uncoveredParentNodeIds: string[]
}

export async function checkExistingSteps(
  workflowId: string,
  parentNodeIds: string[],
  childType: 'BLUE_PLAN' | 'RED_PLAN' | 'EVALUATION'
): Promise<StepCheckResult> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}/steps/check`, {
    parentNodeIds: parentNodeIds.join(','),
    childType,
  })
}

/** 按异常批量查询其已生成的完整链路（ORIGIN/意图/蓝方/红方/校验），跨工作流全局去重 */
export interface ByAnomaliesResult {
  origins: WorkflowNode[]
  intents: WorkflowNode[]
  bluePlans: WorkflowNode[]
  redPlans: WorkflowNode[]
  evaluations: WorkflowNode[]
  defaultWorkflowId: string | null
  coveredAnomalyIds: string[]
}

export async function getChainsByAnomalies(
  anomalyIds: string[]
): Promise<ByAnomaliesResult> {
  return requestAPI.post('/api/v1/agent-flows/workflow/by-anomalies', { anomalyIds })
}

export async function startPhaseAnalysis(
  workflowId: string,
  phase: number
): Promise<{ workflowId: string; phase: number; status: string }> {
  return requestAPI.post(`/api/v1/agent-flows/workflow/${workflowId}/advance`, { phase })
}

export async function listDeepAnalysisNodes(workflowId: string): Promise<WorkflowNode[]> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}/nodes`)
}

export async function listDeepAnalysisNodesByType(
  workflowId: string,
  nodeType: string
): Promise<WorkflowNode[]> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}/nodes/${nodeType}`)
}

export async function listPhaseResults(workflowId: string): Promise<PhaseResult[]> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}/phases`)
}

export async function getPhaseResult(workflowId: string, phase: number): Promise<PhaseResult> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}/phases/${phase}`)
}

export async function pruneDeepAnalysisNode(
  workflowId: string,
  nodeId: string,
  reason?: string
): Promise<WorkflowNode> {
  return requestAPI.post(`/api/v1/agent-flows/workflow/${workflowId}/nodes/${nodeId}/prune`, { reason })
}

/** 获取阶段执行状态 (用于轮询异步执行结果) */
export interface ExecutionStatusResponse {
  status: string
  phase: number
  executionId: string
  resultCount: number
  startedAt: string
  completedAt: string | null
}

export interface AnalysisSSEEvent {
  eventType: 'dispatch' | 'log' | 'done' | 'error' | 'dataflow' | 'agent-input'
  data: Record<string, any>
}

/**
 * Start phase analysis with SSE stream for real-time progress.
 * POST to /advance-stream, read response as text/event-stream,
 * resolve when done/error event received.
 */
export function startPhaseAnalysisWithSSE(
  workflowId: string,
  phase: number,
  onEvent: (event: AnalysisSSEEvent) => void
): Promise<{ status: string }> {
  return new Promise((resolve) => {
    const url = `/api/v1/agent-flows/workflow/${workflowId}/advance-stream`
    const controller = new AbortController()

    /* Timeout after 30 minutes */
    const timeout = setTimeout(() => {
      controller.abort()
      resolve({ status: 'FAILED_TIMEOUT' })
    }, 30 * 60 * 1000)

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('claw_token') ? { Authorization: `Bearer ${localStorage.getItem('claw_token')}` } : {}),
      },
      body: JSON.stringify({ phase }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) {
        clearTimeout(timeout)
        resolve({ status: 'FAILED' })
        return
      }
      const reader = response.body?.getReader()
      if (!reader) {
        clearTimeout(timeout)
        resolve({ status: 'FAILED' })
        return
      }

      const decoder = new TextDecoder()
      let currentEventType = ''
      let currentData = ''
      let done = false

      try {
        while (!done) {
          const { value, done: streamDone } = await reader.read()
          if (streamDone) break
          const chunk = decoder.decode(value, { stream: true })

          // Process each line
          const segments = chunk.split('\n')

          // Handle incomplete last line (keep it in buffer)
          for (let i = 0; i < segments.length; i++) {
            const line = segments[i]
            if (line.startsWith('event:')) {
              currentEventType = line.substring(6).trim()
            } else if (line.startsWith('data:')) {
              currentData = line.substring(5).trim()
            } else if (line === '' && currentData) {
              // Empty line = end of SSE frame
              if (
                currentEventType &&
                !['dispatch', 'log', 'done', 'error', 'dataflow', 'agent-input'].includes(currentEventType)
              ) {
                // Unknown event type: skip with a warning, never crash the phase
                console.warn('[deep-analysis SSE] skip unknown event type:', currentEventType)
              } else {
                try {
                  const data = JSON.parse(currentData)
                  onEvent({
                    eventType: (currentEventType as any) || 'log',
                    data,
                  })

                  // Check for terminal events
                  if (data.status === 'COMPLETED' || data.status === 'FAILED') {
                    done = true
                  }
                  if (currentEventType === 'error') {
                    done = true
                  }
                } catch (e: any) {
                  // Corrupt data frame: skip with a warning, never crash the phase
                  console.warn(
                    '[deep-analysis SSE] skip corrupt data frame (JSON parse failed):',
                    e?.message
                  )
                }
              }
              currentEventType = ''
              currentData = ''
              if (done) break
            }
          }
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          /* unexpected error */
        }
      } finally {
        reader.releaseLock()
      }

      clearTimeout(timeout)
      if (!done) {
        resolve({ status: 'UNKNOWN' })
      } else {
        resolve({ status: 'COMPLETED' })
      }
    }).catch(() => {
      clearTimeout(timeout)
      resolve({ status: 'FAILED' })
    })
  })
}

export async function getExecutionStatus(
  workflowId: string,
  phase: number
): Promise<ExecutionStatusResponse> {
  return requestAPI.get(`/api/v1/agent-flows/workflow/${workflowId}/execution/${phase}/status`)
}

/** 前端展示类型 → 后端 NodeType 的映射 (用于同步选中状态到后端) */
const DISPLAY_TO_BACKEND_TYPE: Record<string, string> = {
  Origin: 'ORIGIN',
  Intent: 'INTENT',
  Attack: 'BLUE_PLAN',
  Defense: 'RED_PLAN',
  Evaluation: 'EVALUATION',
}

export function toBackendNodeType(displayType: string): string {
  return DISPLAY_TO_BACKEND_TYPE[displayType] || displayType.toUpperCase()
}
