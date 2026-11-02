/**
 * API client for anomaly event endpoints
 * Base: /api/v1/anomalies
 * Backend: http://localhost:8080/api/v1/anomalies
 */
import { requestAPI } from '@/utils/http/request'

export interface AnomalyEvent {
  rowId: number
  anomalyId: string
  name: string
  type: string
  assetType?: string
  count?: number
  deviationScore?: number
  deviation?: number | string
  deviationConf?: number | string
  confidence?: number
  threatScore?: number | string
  threatLevel?: string
  eventTime?: string
  location?: string
  relatedEntities?: string
  source?: string
  status?: 'POTENTIAL' | 'CONFIRMED' | 'REJECTED'
  /** 关联资产 ID：轨迹类 = sigint_latest.asset_id；article 类 = articles.id */
  assetId?: string
  agentResult?: string
  executionId?: string
  confirmedBy?: string
  confirmedAt?: string
  createdAt?: string
  updatedAt?: string
  duration?: string
  /** 关联数据快照：轨迹类 = 轨迹点数组；article 类 = 文章 JSON（字符串，需 JSON.parse） */
  assetData?: Record<string, any> | string
  evidenceJson?: Record<string, any>
  /** 详情接口联查 sigint_latest 得到的目标最新快照（列表接口不返回） */
  sigintData?: SigintData | null
}

export interface SigintData {
  assetId?: string
  assetType?: string
  lat?: number | null
  lng?: number | null
  alt?: number | null
  speed?: number | null
  heading?: number | null
  ts?: number | null
  callsign?: string
  icao24?: string
  isMilitary?: boolean | null
  /** sigint_latest.extra.aircraftType，目标机型 */
  aircraftType?: string
}

export async function getAnomalyList(
  status?: string,
  type?: string,
  limit = 100
): Promise<AnomalyEvent[]> {
  return requestAPI.get('/api/v1/anomalies', { status, type, limit })
}

export async function getAnomalyById(anomalyId: string): Promise<AnomalyEvent> {
  return requestAPI.get(`/api/v1/anomalies/${anomalyId}`)
}

export async function confirmAnomaly(
  anomalyId: string,
  threatLevel?: string
): Promise<AnomalyEvent> {
  return requestAPI.post(`/api/v1/anomalies/${anomalyId}/confirm`, { threatLevel })
}

export async function rejectAnomaly(anomalyId: string): Promise<AnomalyEvent> {
  return requestAPI.post(`/api/v1/anomalies/${anomalyId}/reject`)
}

export async function triggerDeviationCheck(): Promise<{ success: boolean; message: string }> {
  return requestAPI.post('/api/v1/anomalies/trigger')
}

export interface AnomalySearchParams {
  status?: string
  type?: string
  /** 按 anomaly_event.asset_type 过滤：article / aircraft / vessel / satellite */
  assetType?: string
  region?: string
  hours?: number
  minThreat?: number
  minConfidence?: number
  sort?: string
  limit?: number
}

export interface AnomalyStats {
  total: number
  status: Record<string, number>
  threatLevel: Record<string, number>
  assetType: Record<string, number>
}

export async function searchAnomalies(params: AnomalySearchParams = {}): Promise<AnomalyEvent[]> {
  return requestAPI.get('/api/v1/anomalies', params)
}

export async function getAnomalyStats(): Promise<AnomalyStats> {
  return requestAPI.get('/api/v1/anomalies/stats')
}
