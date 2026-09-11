/**
 * API client for global anomaly briefing endpoints
 * Base: /api/v1/briefings
 * Backend: http://localhost:8080/api/v1/briefings
 */
import { requestAPI } from '@/utils/http/request'

export interface AnomalyBriefing {
  id: number
  briefingDate: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  content: string
  anomalyCount: number
  agentId?: string
  executionId?: string
  errorMessage?: string
  createdAt?: string
  updatedAt?: string
}

// 今天还没简报 → 后端 404 空 body。用 validateStatus 放行 404(避免全局 404 toast),
// 调用方按"无 id"判定为无简报并走即时生成。
export async function getTodayBriefing(): Promise<AnomalyBriefing | null> {
  const data = await requestAPI.get<AnomalyBriefing | ''>(
    '/api/v1/briefings/today',
    undefined,
    {},
    { validateStatus: (s: number) => s === 200 || s === 404 },
  )
  return data && typeof data === 'object' && 'id' in data ? (data as AnomalyBriefing) : null
}

// 最新一篇 COMPLETED 简报（优先当天）。404 → null，容错逻辑同 getTodayBriefing。
export async function getLatestBriefing(): Promise<AnomalyBriefing | null> {
  const data = await requestAPI.get<AnomalyBriefing | ''>(
    '/api/v1/briefings/latest',
    undefined,
    {},
    { validateStatus: (s: number) => s === 200 || s === 404 },
  )
  return data && typeof data === 'object' && 'id' in data ? (data as AnomalyBriefing) : null
}

// 200=生成成功(新简报); 409=已有生成进行中; 500=生成失败(body {message})。
// 三者都放行给调用方自行处理状态,不走全局错误 toast。
export async function generateBriefing(): Promise<{
  briefing: AnomalyBriefing | null
  error: string | null
}> {
  const data = await requestAPI.post<{ id?: number; message?: string }>(
    '/api/v1/briefings/generate',
    undefined,
    {},
    { validateStatus: (s: number) => s === 200 || s === 409 || s === 500 },
  )
  if (data && typeof data === 'object' && 'id' in data) {
    return { briefing: data as unknown as AnomalyBriefing, error: null }
  }
  return { briefing: null, error: (data && data.message) || '简报生成失败' }
}
